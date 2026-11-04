(function(){
'use strict';
const E=window.OrbitEngine,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=['Minerais','Líquidos','Gases','Flora','Fauna'],icons={Minerais:'ore',Líquidos:'fuel',Gases:'oxygen',Flora:'lumenfern',Fauna:'mossfox'};
const categoryOf=(id,g)=>g.category||({ore:'Minerais',crystals:'Minerais',fuel:'Líquidos',oxygen:'Gases'})[id];
const art=(kind,id='')=>`<canvas class="og-atlas-art" width="160" height="130" data-atlas-kind="${kind}" data-atlas-id="${esc(id)}" aria-hidden="true"></canvas>`;
const meter=r=>`<div class="og-atlas-progress"><strong>${r.percent||0}%</strong><progress value="${r.percent||0}" max="100"></progress><small>${r.completedSites}/${r.totalSites} locais</small></div>`;
function selector(list,index,field,label){return `<label class="og-atlas-picker">${label}<select data-atlas-select="${field}">${list.map((x,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(x.name||'Mundo desconhecido')}</option>`).join('')}</select></label>`;}
const num=n=>Number(n).toLocaleString('pt-BR');
// Explorer's record (explorer-record.js): the journey in numbers, actions per campaign chapter, achievements.
function record(state){
 const r=E.explorerRecord(state),m=r.metrics;
 const stats=[['Ações',num(m.actions)],['Galáxias visitadas',m.galaxies],['Mundos catalogados',m.worlds],['Mundos completos',m.worldsDone],['Locais explorados',m.sites],['Pousos',m.landings],['Cargas extraídas',m.extractions],['Evacuações',m.evacuations],['Saltos de dobra',m.warps],['Coleções',m.materials+'/'+m.materialsTotal],['Únicos',m.uniques+'/'+m.uniquesTotal],['Runas gravadas',m.runes],['Naves no hangar',m.ships+'/'+m.shipsTotal],['Módulos instalados',m.modules]];
 const chapters=r.chapters.length?r.chapters.map(c=>`<div class="og-record-row"><strong>${c.chapter===8?'Travessia':'Capítulo '+(c.chapter+1)}</strong><span>${num(c.actions)} ${c.actions===1?'ação':'ações'}</span><small>concluído na ação ${num(c.turn)}</small></div>`).join(''):'<p class="og-record-empty">Cada capítulo do Coro concluído aparece aqui, com quantas ações levou.</p>';
 const achievements=r.achievements.map(a=>`<div class="og-record-achievement ${a.earned?'is-earned':''}"><b aria-hidden="true">${a.earned?'✦':''}</b><span><strong>${esc(a.title)}</strong><small>${esc(a.text)}</small>${a.earned?`<small class="og-record-when">${a.turn===null?'Conquistada antes do registro':'Conquistada na ação '+num(a.turn)}</small>`:`<progress value="${a.value}" max="${a.goal}" aria-label="${a.value} de ${a.goal}"></progress>`}</span></div>`);
 return `<div class="og-record-list"><section><h3 class="og-record-title">A jornada</h3><div class="og-record-stats">${stats.filter((_,i)=>i%2===0).map((_,i)=>`<div class="og-record-pair">${stats.slice(i*2,i*2+2).map(([label,value])=>`<div><small>${label}</small><strong>${value}</strong></div>`).join('')}</div>`).join('')}</div></section>`+
  // A heading travels with what follows it, so a page never ends on a lone title.
  `<section><h3 class="og-record-title">Capítulos</h3>${chapters}</section><section><h3 class="og-record-title">Conquistas · ${r.earned}/${r.total}</h3>${achievements[0]}</section>${achievements.slice(1).join('')}</div>`;
}
function render(state,v={}){
const survey=E.discoveryCatalog(state),g=survey.current;
const tab=v.page==='galaxies'?'galaxies':v.page==='record'?'record':v.page?.startsWith('materials')?'materials':'systems';
const tabs=`<div class="og-atlas-tabs">${[['systems','Mundos','world'],['galaxies','Galáxias','galaxy'],['materials','Coleções','specimen'],['record','Registro','record']].map(([id,label,kind])=>`<button data-catalog-page="${id}" aria-pressed="${tab===id}">${kind==='specimen'?window.OrbitCommerce.art('lumenfern'):kind==='record'?window.OrbitCommerce.art('data'):art(kind)}<span>${label}</span></button>`).join('')}</div>`;
const base={singleCard:true,title:'Catálogo estelar',header:tabs};
if(tab==='materials'){
 const category=v.page.split('-')[1];
 // Unique exemplars: one collection of 16 shadows that fill in as they are captured.
 const xeno=E.xenoView?.(state);
 if(xeno&&category==='Únicos'){const tiles=xeno.specimens.map(sp=>sp.captured?`<button class="og-atlas-tile" data-xeno-sheet="xeno-specimen" data-xeno-specimen="${esc(sp.id)}">${window.OrbitXenoUI.art(sp)}<strong>${esc(sp.name)}</strong><small>${sp.kind==='fauna'?'Fauna':'Flora'} única · ${esc(sp.engraved?'runa gravada':sp.hasRune?'runa pronta':sp.studied?'estudado':'no laboratório')}</small></button>`:`<article class="og-atlas-tile is-unknown" aria-label="Exemplar único não descoberto"><div class="og-silhouette">${window.OrbitXenoUI.art(sp,{unknown:true})}<b>?</b></div><strong>${sp.hint?'Sinal vivo neste setor':'Não descoberto'}</strong><small>${sp.kind==='fauna'?'Fauna':'Flora'} única · existe uma vez</small></article>`);
  // Rows of two inside a paginated collection: 16 tiles do not fit one phone screen.
  return {...base,singleCard:false,title:'Exemplares únicos',html:`<div class="og-xeno-collection">${[0,2,4,6,8,10,12,14].map(i=>`<div class="og-atlas-grid">${tiles.slice(i,i+2).join('')}</div>`).join('')}</div>`};}
 const uniquesTile=xeno?`<button data-catalog-page="materials-Únicos" class="og-atlas-tile">${window.OrbitXenoUI.art(xeno.specimens[0],{unknown:!xeno.specimens[0].captured})}<strong>Únicos</strong><small>${xeno.captured}/${xeno.total} capturados</small><progress value="${xeno.captured}" max="${xeno.total}"></progress></button>`:'';
 if(!categories.includes(category))return {...base,html:`<div class="og-atlas-grid">${uniquesTile}${categories.map(cat=>{const all=Object.entries(E.materials).filter(([id,m])=>categoryOf(id,m)===cat),found=all.filter(([id])=>E.materialKnown(state,id)).length;return `<button data-catalog-page="materials-${cat}" class="og-atlas-tile">${window.OrbitCommerce.art(icons[cat])}<strong>${cat}</strong><small>${found}/${all.length} descobertos</small><progress value="${found}" max="${all.length}"></progress></button>`;}).join('')}</div>`};
 const entries=Object.entries(E.materials).filter(([id,m])=>categoryOf(id,m)===category),entry=entries.find(([id])=>id===v.materialId&&E.materialKnown(state,id));
 if(entry){const [id,m]=entry,sources=state.galaxy.planets.filter(p=>p.scanned&&(m.category?E.deposits(p).includes(id):m.biomes.includes(p.biome)));
 return {...base,title:m.name,html:`<article class="og-atlas-detail">${window.OrbitCommerce.art(id)}<strong>${esc(m.name)}</strong><small>${esc(m.rarity||'Descoberto')} · ${state.resources[id]||0} a bordo</small><p>${esc(m.description||'Recurso utilizado na nave e negociado nos entrepostos.')}</p><p>Referência comercial: ${m.base} Lumes/un.</p>${sources.length?`<label class="og-atlas-picker">Fontes analisadas<select data-atlas-source>${sources.map(p=>`<option value="${esc(p.id)}" ${p.id===v.sourceId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><button class="og-atlas-route" data-catalog-planet="${esc(sources.find(p=>p.id===v.sourceId)?.id||sources[0].id)}">${window.OrbitArt.icon('warp')}<small>Ver no mapa</small></button>`:'<p>Nenhuma fonte analisada nesta galáxia.</p>'}</article>`};}
 return {...base,title:category,html:`<div class="og-atlas-grid">${entries.map(([id,m])=>E.materialKnown(state,id)?`<button class="og-atlas-tile" data-catalog-material="${id}">${window.OrbitCommerce.art(id)}<strong>${esc(m.name)}</strong><small>${esc(m.rarity||'Descoberto')}</small></button>`:`<article class="og-atlas-tile is-unknown" aria-label="Item não descoberto"><div class="og-silhouette">${window.OrbitCommerce.art(id)}<b>?</b></div><strong>Não descoberto</strong><small>Explore para revelar</small></article>`).join('')}</div>`};
}
if(tab==='record')return {...base,singleCard:false,title:'Registro do explorador',html:record(state)};
if(tab==='galaxies'){
 const records=[g,...survey.archives],i=Math.max(0,Math.min(records.length-1,v.recordIndex||0)),record=records[i];
 return {...base,html:selector(records,i,'recordIndex','Galáxias visitadas')+`<article class="og-atlas-detail">${art('galaxy',record.kind)}<strong>${esc(record.name)}</strong><small>${i===0?'Local atual':'Viagem registrada'} · ${record.discovered}/${record.totalPlanets} mundos</small>${meter(record)}<p>Outras galáxias permanecem um mistério até sua chegada.</p>${survey.earlier?.totalGalaxies?`<small>${survey.earlier.totalGalaxies} viagens anteriores preservadas no total.</small>`:''}</article>`};
}
const system=v.page==='system'&&g.systems.find(x=>x.id===v.systemId);
if(system){
 const planets=system.planets,i=Math.max(0,Math.min(planets.length-1,v.recordIndex||0)),p=planets[i];
 return {...base,title:system.name,html:selector(planets,i,'recordIndex','Mundos do sistema')+`<article class="og-atlas-detail ${p.scanned?'':'is-unknown'}">${p.scanned?art('world',p.id):'<div class="og-atlas-unknown">?</div>'}<strong>${esc(p.name||'Mundo desconhecido')}</strong><small>${p.scanned?(p.complete?'Exploração completa':'Mundo analisado'):'Analise em órbita para catalogar'}</small>${meter(p)}<button class="og-atlas-route" data-catalog-planet="${esc(p.id)}">${window.OrbitArt.icon('warp')}<small>${p.current?'Ver mundo atual':'Ver no mapa'}</small></button></article>`};
}
return {...base,html:`<div class="og-atlas-summary"><strong>${esc(g.name)}</strong><small>${g.discovered}/${g.totalPlanets} mundos · ${g.percent}% explorado</small></div><div class="og-atlas-grid">${g.systems.map(s=>`<button class="og-atlas-tile" data-catalog-system="${esc(s.id)}">${art('star',s.id)}<strong>${esc(s.name)}</strong><small>${s.discovered}/${s.totalPlanets} descobertos · ${s.percent}%</small></button>`).join('')}</div>`};
}
function paint(container,state){for(const canvas of container.querySelectorAll('canvas[data-atlas-kind]')){const c=canvas.getContext('2d'),kind=canvas.dataset.atlasKind,id=canvas.dataset.atlasId,A=window.OrbitArt;c.clearRect(0,0,160,130);if(kind==='galaxy')A.galaxy(c,{kind:id||state.galaxy.kind},80,65,38);else if(kind==='star'){const sys=state.galaxy.systems.find(s=>s.id===id);A.star(c,sys?.kind||'yellow',80,65,32);}else{const p=state.galaxy.planets.find(p=>p.id===id)||{biome:'forest',id:'icon'};A.world(c,p,80,65,48);}}}
window.OrbitDiscoveryCatalog={render,paint};
})();
