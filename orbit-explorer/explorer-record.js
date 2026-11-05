(function(root){
'use strict';
// Explorer's record: the journey in numbers, how many actions each campaign chapter took, and achievements derived
// from what the game already counts. Only two things are stored (s.journal): the action at which each chapter closed
// and the action at which each achievement was earned. Everything else is read from the journey itself.
const E=root.OrbitEngine;if(!E||E.explorerRecord)return;
const base={create:E.create,dispatch:E.dispatch,validate:E.validate,restore:E.restore};
function metrics(s){
 const t=E.discoveryCatalog(s).totals,mats=Object.keys(E.materials||{}),x=s.xeno||{captured:[]},p=s.progress||{},d=s.discovery||{};
 const modules=[...Object.values(s.equipped||{}),...(s.inventory||[])];
 return {
  galaxies:s.visitedGalaxies||1,worlds:t.discovered,worldsDone:t.completed,sites:t.completedSites,
  landings:p.landings||0,warps:p.warps||0,modules:p.modulesEquipped||0,extractions:d.extractions||0,evacuations:d.evacuations||0,
  materials:mats.filter(id=>E.materialKnown(s,id)).length,materialsTotal:mats.length,
  uniques:x.captured.length,uniquesTotal:E.xenoView?E.xenoView(s).total:16,runes:modules.filter(m=>m.rune).length,
  ships:s.fleet?.owned.length||1,shipsTotal:E.fleetCatalog?.SHIPS.length||1,
  chapter:s.campaign?.chapter||0,finished:s.campaign?.finished?1:0,actions:s.turn||0};
}
// [id, title, what it asks, metric, goal]. A goal written as a metric name reads the total from that metric.
const ACHIEVEMENTS=[
 ['first-landing','Primeiro pouso','Pousar num planeta','landings',1],
 ['dust','Pés na poeira','Concluir 10 locais de exploração','sites',10],
 ['pathfinder','Desbravador','Concluir 40 locais de exploração','sites',40],
 ['whole-world','Mundo por inteiro','Concluir todos os locais de um planeta','worldsDone',1],
 ['cartographer','Cartógrafo','Catalogar 25 mundos','worlds',25],
 ['beyond','Além do Véu','Chegar a uma segunda galáxia','galaxies',2],
 ['wanderer','Andarilho das galáxias','Visitar 8 galáxias','galaxies',8],
 ['full-hold','Porão cheio','Extrair a carga de 10 expedições','extractions',10],
 ['naturalist','Naturalista','Descobrir todos os recursos e espécies das coleções','materials','materialsTotal'],
 ['first-unique','Primeiro exemplar','Capturar um exemplar único','uniques',1],
 ['keeper','Guardião dos únicos','Capturar todos os exemplares únicos','uniques','uniquesTotal'],
 ['engraver','Gravador de runas','Gravar uma runa num módulo','runes',1],
 ['second-ship','Segunda nave','Ter duas naves no hangar','ships',2],
 ['fleet','Frota completa','Ter todas as naves no hangar','ships','shipsTotal'],
 ['mechanic','Mecânico de bordo','Instalar 15 módulos','modules',15],
 ['halfway','Meio caminho','Concluir quatro capítulos do Coro','chapter',4],
 ['eight-voices','Oito vozes','Atravessar o Olho de Íris e restaurar Aurora','finished',1]
].map(([id,title,text,metric,goal])=>({id,title,text,metric,goal}));
const BY=Object.fromEntries(ACHIEVEMENTS.map(a=>[a.id,a]));
const goalOf=(a,m)=>typeof a.goal==='string'?m[a.goal]:a.goal;
const earnedNow=m=>ACHIEVEMENTS.filter(a=>m[a.metric]>=goalOf(a,m)).map(a=>a.id);
// A journey that predates the record (or a state the tutorial just replaced) keeps what it already achieved, with the
// moment unknown (null), and starts counting chapters from here.
function fresh(s,turn=null){const earned={};for(const id of earnedNow(metrics(s)))earned[id]=turn;return {v:1,chapters:[],earned};}
function ensure(s){if(!s.journal)s.journal=fresh(s);return s.journal;}
function update(s,before){
 const j=ensure(s),c=s.campaign,news=[];
 if(c){for(let ch=before??c.chapter;ch<c.chapter;ch++)if(!j.chapters.some(r=>r.chapter===ch))j.chapters.push({chapter:ch,turn:s.turn});
  if(c.finished&&c.chapter===8&&!j.chapters.some(r=>r.chapter===8))j.chapters.push({chapter:8,turn:s.turn});}
 for(const id of earnedNow(metrics(s)))if(!Object.hasOwn(j.earned,id)){j.earned[id]=s.turn;news.push(id);}
 return news;
}
E.dispatch=(s,a,p)=>{
 const before=s.campaign?.chapter;ensure(s);
 const result=base.dispatch(s,a,p);
 // The tutorial replaces the whole state when skipped or finished: that new journey starts its own record.
 if(!s.journal){s.journal=fresh(s,s.turn);return result;}
 if(result?.ok){const news=update(s,before);if(news.length)result.achievements=news.map(id=>({id,title:BY[id].title,text:BY[id].text}));}
 return result;
};
E.explorerRecord=s=>{
 const j=ensure(s),m=metrics(s);
 let previous=0;
 const chapters=[...j.chapters].sort((a,b)=>a.chapter-b.chapter).map(r=>{const row={chapter:r.chapter,turn:r.turn,actions:r.turn-previous};previous=r.turn;return row;});
 const achievements=ACHIEVEMENTS.map(a=>{const goal=goalOf(a,m),earned=Object.hasOwn(j.earned,a.id);return {id:a.id,title:a.title,text:a.text,goal,value:Math.min(goal,m[a.metric]),earned,turn:earned?j.earned[a.id]:null};});
 return {metrics:m,chapters,achievements,earned:achievements.filter(a=>a.earned).length,total:ACHIEVEMENTS.length};
};
E.explorerAchievements=ACHIEVEMENTS;
function valid(s){
 const j=s.journal;if(j===undefined)return true;
 if(!j||j.v!==1||!Array.isArray(j.chapters)||j.chapters.length>9||!j.earned||typeof j.earned!=='object'||Array.isArray(j.earned))return false;
 const turn=v=>Number.isSafeInteger(v)&&v>=0&&v<=s.turn;
 if(!j.chapters.every((r,i)=>r&&Number.isInteger(r.chapter)&&r.chapter>=0&&r.chapter<=8&&turn(r.turn)&&(i===0||r.chapter>j.chapters[i-1].chapter)))return false;
 return Object.entries(j.earned).every(([id,v])=>Object.hasOwn(BY,id)&&(v===null||turn(v)));
}
E.validate=s=>base.validate(s)&&valid(s);
E.create=(...args)=>{const s=base.create(...args);s.journal=fresh(s,0);return s;};
E.restore=saved=>{const s=base.restore(saved);if(!s)return null;if(s.journal===undefined)s.journal=fresh(s);return valid(s)?s:null;};
})(typeof window==='object'?window:globalThis);
