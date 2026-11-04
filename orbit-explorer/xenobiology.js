(function(root){
'use strict';
// Xenobiology: one-of-a-kind specimens (a single exemplar each), captured on a specific world, studied with data and
// Lumes, then turned into a rune. A rune is engraved on one module (one rune per module, any rarity), can be moved
// between modules, and keeps that module from being recycled while engraved.
const E=root.OrbitEngine;if(!E||E.xenoView)return;
const base={create:E.create,dispatch:E.dispatch,preview:E.preview,validate:E.validate,restore:E.restore,expeditionView:E.expeditionView};
const fail=(reason,cost={})=>({allowed:false,reason,cost});
const hash=v=>[...String(v)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261);
// art: index in the biology atlas (2×3) and a hue shift, so each exemplar reads as a distinct creature until it has its own painting.
const TOOLS={
 garra:{name:'Garra de contenção',price:160,description:'Braço articulado que alcança presas velozes antes que fujam.'},
 rede:{name:'Rede de plasma',price:140,description:'Malha que revela e envolve organismos camuflados.'},
 casulo:{name:'Casulo selado',price:180,description:'Cápsula estanque para organismos que liberam toxinas.'},
 laco:{name:'Laço gravitacional',price:220,description:'Ancora criaturas que flutuam nas correntes de vento.'},
 crio:{name:'Cápsula criogênica',price:200,description:'Mantém a temperatura de flora que só vive no gelo.'},
 termico:{name:'Coletor térmico',price:200,description:'Isola plantas que irradiam calor ao serem tocadas.'}
};
const BEHAVIORS={
 foge:{label:'Foge ao ser avistado',tool:'garra',cost:{reserve:3},hint:'Ágil: a perseguição custa 3 de energia.'},
 camufla:{label:'Camufla-se no terreno',tool:'rede',cost:{reserve:2},needsScan:true,hint:'Só aparece depois de um escaneamento nesta saída.'},
 veneno:{label:'Libera toxina',tool:'casulo',cost:{reserve:2,integrity:2},hint:'A toxina custa 2 de integridade do traje.'},
 voa:{label:'Flutua nas correntes',tool:'laco',cost:{reserve:3},hint:'Ancorar no vento custa 3 de energia.'},
 congela:{label:'Congela ao toque',tool:'crio',cost:{reserve:2},hint:'Exige transporte criogênico.'},
 irradia:{label:'Irradia calor',tool:'termico',cost:{reserve:2,integrity:1},hint:'O calor custa 1 de integridade do traje.'}
};
const SPECIMENS=[
 {id:'raposa-aurora',name:'Raposa-aurora',kind:'fauna',biomes:['forest'],behavior:'foge',tier:1,art:[3,250],lore:'A última de uma linhagem que seguia as auroras de Íris. Seus olhos guardam o caminho das trilhas mais curtas.',rune:{name:'Runa do Faro',effects:{expeditionReserve:3},text:'+3 de energia em cada expedição'}},
 {id:'salamandra-brasa',name:'Salamandra de brasa',kind:'fauna',biomes:['volcanic','magma'],behavior:'foge',tier:2,art:[3,150],lore:'Corre sobre a lava sem queimar as patas. Sua pele troca calor com o ar em silêncio.',rune:{name:'Runa da Brasa',capabilities:{heat:40},text:'+40 °C de proteção térmica no módulo gravado'}},
 {id:'urso-geada',name:'Urso-geada',kind:'fauna',biomes:['ice'],behavior:'foge',tier:2,art:[3,180],lore:'Um gigante solitário das geleiras. Hiberna dentro de bolhas de ar que nunca congelam.',rune:{name:'Runa da Geada',capabilities:{cold:40},text:'+40 °C de isolamento criogênico no módulo gravado'}},
 {id:'mariposa-cristal',name:'Mariposa de cristal',kind:'fauna',biomes:['crystal'],behavior:'camufla',tier:2,art:[5,300],lore:'Suas asas refratam a luz até desaparecer entre os prismas. Enxerga ecos que nenhum scanner capta.',rune:{name:'Runa do Prisma',effects:{scanRadius:1},text:'+1 setor de alcance do scanner'}},
 {id:'escaravelho-ferro',name:'Escaravelho-ferro',kind:'fauna',biomes:['desert','rogue'],behavior:'camufla',tier:1,art:[3,40],lore:'Enterra-se sob as dunas com uma carapaça mais dura que o casco de muitas naves.',rune:{name:'Runa da Carapaça',effects:{maxHull:25},text:'+25 de resistência do casco'}},
 {id:'leviata-vidro',name:'Leviatã de vidro',kind:'fauna',biomes:['ocean'],behavior:'veneno',tier:3,art:[4,200],lore:'Uma medusa do tamanho de um entreposto. Seus filamentos dissolvem metal, mas ela canta antes de atacar.',rune:{name:'Runa das Profundezas',capabilities:{pressure:3},text:'+3 atm de resistência à pressão no módulo gravado'}},
 {id:'lesma-acida',name:'Lesma ácida',kind:'fauna',biomes:['toxic'],behavior:'veneno',tier:1,art:[4,80],lore:'Deixa trilhas que neutralizam as nuvens corrosivas do próprio mundo.',rune:{name:'Runa do Filtro',capabilities:{toxicity:20},text:'+20% de filtragem tóxica no módulo gravado'}},
 {id:'arraia-tempestade',name:'Arraia-tempestade',kind:'fauna',biomes:['gas'],behavior:'voa',tier:3,art:[5,0],lore:'Plana dentro de furacões sem bater as asas. Conhece cada corrente do gigante gasoso.',rune:{name:'Runa do Vento',effects:{fuelEfficiency:0.15},text:'+15% de eficiência de voo'}},
 {id:'samambaia-mae',name:'Samambaia-mãe',kind:'flora',biomes:['forest'],behavior:'veneno',tier:1,art:[0,300],lore:'A planta de onde todas as samambaias-lume nasceram. Seus esporos ardem na pele.',rune:{name:'Runa do Fôlego',effects:{maxOxygen:30},text:'+30 de reserva de oxigênio'}},
 {id:'orquidea-eterna',name:'Orquídea eterna',kind:'flora',biomes:['ice'],behavior:'congela',tier:2,art:[1,0],lore:'Floresce há mil invernos sem murchar. Morre em segundos fora do frio.',rune:{name:'Runa da Constância',effects:{expeditionIntegrity:2},text:'+2 de integridade nas expedições'}},
 {id:'flor-vazio',name:'Flor do vazio',kind:'flora',biomes:['rogue','crystal'],behavior:'congela',tier:3,art:[1,220],lore:'Cresce em planetas sem estrela. Suas pétalas dobram a luz como uma pequena dobra espacial.',rune:{name:'Runa da Dobra',effects:{warpEfficiency:0.3},text:'+30% de eficiência de dobra'}},
 {id:'lirio-solar',name:'Lírio solar',kind:'flora',biomes:['desert'],behavior:'irradia',tier:1,art:[2,40],lore:'Acumula a luz do dia e a devolve à noite. Respira por toda a planta.',rune:{name:'Runa do Sol',effects:{oxygenEfficiency:0.15},text:'+15% de eficiência do ar'}},
 {id:'cacto-magma',name:'Cacto de magma',kind:'flora',biomes:['magma','volcanic'],behavior:'irradia',tier:2,art:[2,0],lore:'Bebe rocha derretida. Quem o toca sente o pulso do planeta.',rune:{name:'Runa da Colheita',effects:{collectionBonus:0.15},text:'+15% de rendimento de coleta'}},
 {id:'alga-nebular',name:'Alga nebular',kind:'flora',biomes:['gas','ocean'],behavior:'voa',tier:2,art:[0,160],lore:'Uma floresta que flutua entre nuvens, presa por nada.',rune:{name:'Runa da Leveza',effects:{expeditionCapacity:1},text:'+1 espaço de carga na expedição'}},
 {id:'coral-cantor',name:'Coral cantor',kind:'flora',biomes:['ocean'],behavior:'camufla',tier:2,art:[1,120],lore:'Imita a cor do fundo do mar e canta em frequências que guiam cardumes.',rune:{name:'Runa do Eco',effects:{scanBonus:0.15},text:'+15% de bônus de pesquisa'}},
 {id:'trepadeira-prisma',name:'Trepadeira prisma',kind:'flora',biomes:['crystal','toxic'],behavior:'veneno',tier:3,art:[0,250],lore:'Envolve cristais inteiros e os faz crescer. Seus espinhos guardam um veneno lento.',rune:{name:'Runa do Abrigo',effects:{cargoCapacity:2},text:'+2 espaços no armazém de módulos'}}
];
const BY_ID=Object.fromEntries(SPECIMENS.map(s=>[s.id,s]));
const FAUNA=SPECIMENS.filter(s=>s.kind==='fauna'),FLORA=SPECIMENS.filter(s=>s.kind==='flora');
const runeId=specimenId=>'rune-'+specimenId;
const costs=s=>({study:{data:80*s.tier,credits:120*s.tier},rune:{credits:150*s.tier,ore:10*s.tier,crystals:3*s.tier},engrave:{credits:40}});
E.runeBonus=id=>{const s=BY_ID[String(id).replace(/^rune-/,'')];return s?{effects:{...(s.rune.effects||{})},capabilities:{...(s.rune.capabilities||{})}}:null;};
function fresh(){return {v:1,tools:[],captured:[],studied:[],runes:[],pending:null};}
function ensure(s){if(!s.xeno)s.xeno=fresh();return s.xeno;}
// Each campaign galaxy (0-7) hides one fauna and one flora exemplar; the order is shuffled per game seed.
function order(list,seed,salt){return [...list].sort((a,b)=>hash(seed+salt+a.id)-hash(seed+salt+b.id));}
function galaxyIndex(s){return s.campaign?.atHome?0:s.galaxyIndex;}
function placements(s){
 if(s.guide?.active)return [];const gi=galaxyIndex(s);if(!Number.isInteger(gi)||gi<0||gi>7)return [];
 const out=[];
 for(const specimen of [order(FAUNA,s.seed,':fauna')[gi],order(FLORA,s.seed,':flora')[gi]]){
  const planets=s.galaxy.planets.filter(p=>p.sites?.length&&!p.trainingPrisma),matching=planets.filter(p=>specimen.biomes.includes(p.biome)),pool=matching.length?matching:planets;
  if(!pool.length)continue;
  const planet=pool[hash(s.seed+':'+specimen.id+':planet')%pool.length],site=planet.sites[hash(s.seed+':'+specimen.id+':site')%planet.sites.length];
  out.push({specimen,planetId:planet.id,siteId:site.id,native:matching.length>0});
 }
 return out;
}
// The exemplar stands on a reachable open cell (never the base, core, a beacon or a cache), stable across revisits.
function cellFor(expedition,specimen){
 const board=E.expeditionBoard({...expedition,coreSecured:false,adventure:true,beacons:[]});
 const dist=new Array(36).fill(-1),queue=[32];dist[32]=0;
 while(queue.length){const i=queue.shift(),x=i%6,y=Math.floor(i/6);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>5||ny>5)continue;const j=ny*6+nx;if(dist[j]>=0||board[j].kind==='wall')continue;dist[j]=dist[i]+1;queue.push(j);}}
 let candidates=board.map((c,i)=>i).filter(i=>board[i].kind==='empty'&&dist[i]>=3);
 if(!candidates.length)candidates=board.map((c,i)=>i).filter(i=>board[i].kind==='empty'&&dist[i]>=1);
 if(!candidates.length)return null;
 const index=candidates[hash(expedition.seed+':'+specimen.id)%candidates.length];return {x:index%6,y:Math.floor(index/6),index};
}
function fieldSpecimen(s){
 const e=s.expedition;if(!e||s.guide?.active)return null;const x=ensure(s);
 const place=placements(s).find(p=>p.siteId===e.siteId);if(!place)return null;
 const specimen=place.specimen;if(x.captured.includes(specimen.id))return null;
 const cell=cellFor(e,specimen);if(!cell)return null;
 // The Coruja's lenses (ships.js trait 'sight') show the exemplar from the landing, even camouflaged.
 const sight=E.shipTrait?.(s)==='sight',behavior=BEHAVIORS[specimen.behavior],revealed=e.revealed.includes(cell.index),visible=(revealed||sight)&&(!behavior.needsScan||e.scans>0||sight);
 return {specimen,cell,behavior,visible,revealed,pending:x.pending===specimen.id,here:e.x===cell.x&&e.y===cell.y};
}
function summary(specimen){const b=BEHAVIORS[specimen.behavior];return {id:specimen.id,name:specimen.name,kind:specimen.kind,biomes:specimen.biomes,behavior:specimen.behavior,behaviorLabel:b.label,hint:b.hint,tool:b.tool,toolName:TOOLS[b.tool].name,tier:specimen.tier,art:specimen.art,lore:specimen.lore,rune:{id:runeId(specimen.id),...specimen.rune}};}
function allModules(s){return [...Object.values(s.equipped),...s.inventory];}
function engravedOn(s,id){return allModules(s).find(m=>m.rune===id)||null;}
function plan(s,a,p={}){
 const x=ensure(s);
 if(a==='xenoCapture'){
  const f=fieldSpecimen(s);if(!f||!f.visible||!f.here)return fail('Alcance o espécime único neste terreno.');
  if(f.pending)return fail('O espécime já está na carga. Extraia-o na nave.');
  if(!x.tools.includes(f.behavior.tool))return fail('Requer '+TOOLS[f.behavior.tool].name+'. Compre a ferramenta em um entreposto.');
  const cost=f.behavior.cost,e=s.expedition;
  if(e.reserve<cost.reserve)return fail('Faltam '+(cost.reserve-e.reserve)+' de energia para a captura.',cost);
  if(cost.integrity&&e.integrity<=cost.integrity)return fail('O traje precisa de mais de '+cost.integrity+' de integridade para a captura.',cost);
  const after={...s,expedition:{...e,reserve:e.reserve-cost.reserve,integrity:e.integrity-(cost.integrity||0),turns:e.turns+1}},route=E.expeditionReturnRoute(after);
  if(route&&!route.canReturn)return fail('Capturar agora deixaria você sem volta: '+route.reason.charAt(0).toLowerCase()+route.reason.slice(1),cost);
  return {allowed:true,reason:'',cost,info:{specimen:f.specimen.id}};
 }
 if(s.expedition&&['xenoBuyTool','xenoStudy','xenoRune','runeEngrave','runeRemove'].includes(a))return fail('Retorne à nave e extraia a carga antes de usar o laboratório.');
 if(a==='xenoBuyTool'){
  const tool=TOOLS[p.toolId];if(!tool)return fail('Escolha uma ferramenta de captura.');
  if(!s.location.stationId)return fail('Ferramentas de captura são vendidas nos entrepostos.');
  if(x.tools.includes(p.toolId))return fail('Você já possui esta ferramenta.');
  if(s.resources.credits<tool.price)return fail('Faltam '+(tool.price-s.resources.credits)+' Lumes.',{credits:tool.price});
  return {allowed:true,reason:'',cost:{credits:tool.price}};
 }
 if(a==='xenoStudy'||a==='xenoRune'){
  const specimen=BY_ID[p.specimenId];if(!specimen||!x.captured.includes(specimen.id))return fail('Capture o espécime antes de estudá-lo.');
  if(a==='xenoStudy'&&x.studied.includes(specimen.id))return fail('Este espécime já foi estudado.');
  if(a==='xenoRune'&&!x.studied.includes(specimen.id))return fail('Estude o espécime para descobrir a runa.');
  if(a==='xenoRune'&&x.runes.includes(runeId(specimen.id)))return fail('A runa deste espécime já existe.');
  const cost=costs(specimen)[a==='xenoStudy'?'study':'rune'],missing=Object.entries(cost).filter(([k,n])=>(s.resources[k]||0)<n);
  if(missing.length)return fail('Faltam '+missing.map(([k,n])=>(n-(s.resources[k]||0))+' '+({credits:'Lumes',data:'dados',ore:'minério',crystals:'cristais'}[k]||k)).join(', ')+'.',cost);
  return {allowed:true,reason:'',cost};
 }
 if(a==='runeEngrave'){
  if(!x.runes.includes(p.runeId))return fail('Escolha uma runa criada.');
  const module=allModules(s).find(m=>m.id===p.moduleId);if(!module)return fail('Escolha um módulo da nave ou do armazém.');
  if(module.rune)return fail('Este módulo já tem uma runa. Remova-a antes.');
  if(engravedOn(s,p.runeId))return fail('Esta runa está gravada em outro módulo. Remova-a de lá primeiro.');
  const cost=costs(BY_ID[p.runeId.replace(/^rune-/,'')]).engrave;if(s.resources.credits<cost.credits)return fail('A gravação custa '+cost.credits+' Lumes.',cost);
  return {allowed:true,reason:'',cost};
 }
 if(a==='runeRemove'){
  const module=allModules(s).find(m=>m.id===p.moduleId);if(!module?.rune)return fail('Este módulo não tem runa gravada.');
  const without=JSON.parse(JSON.stringify(s)),target=allModules(without).find(m=>m.id===module.id);delete target.rune;
  if(without.inventory.length>E.stats(without).cargoCapacity)return fail('Sem esta runa o armazém não comportaria seus módulos. Libere espaço antes.');
  return {allowed:true,reason:'',cost:{}};
 }
 if(a==='salvage'){const id=typeof p==='string'?p:p.moduleId,module=s.inventory.find(m=>m.id===id);if(module?.rune)return fail('Remova a '+(BY_ID[module.rune.replace(/^rune-/,'')]?.rune.name||'runa')+' antes de reciclar: runas são únicas.');}
 return null;
}
// Keep resources within the (possibly lower) maxima after a rune changes the ship's stats.
function clamp(s){const c=E.stats(s);for(const [k,m]of [['fuel','maxFuel'],['oxygen','maxOxygen'],['hull','maxHull']])if(s.resources[k]>c[m])s.resources[k]=c[m];}
const OWN=['xenoCapture','xenoBuyTool','xenoStudy','xenoRune','runeEngrave','runeRemove'];
E.preview=(s,a,p)=>{const own=plan(s,a,p||{});if(own)return own;return base.preview(s,a,p);};
E.dispatch=(s,a,p={})=>{
 const own=plan(s,a,p||{});
 if(own&&!own.allowed)return {ok:false,message:own.reason};
 if(OWN.includes(a)){
  const x=ensure(s),r=s.resources;
  for(const [k,n]of Object.entries(own.cost||{}))if(k!=='reserve'&&k!=='integrity')r[k]-=n;
  let message='';
  if(a==='xenoCapture'){const e=s.expedition,c=own.cost;e.reserve-=c.reserve;e.integrity-=c.integrity||0;e.turns++;x.pending=own.info.specimen;E.checkpointSite(s);message=BY_ID[x.pending].name+' contido. Extraia a carga na nave para levá-lo ao laboratório; evacuar o devolve ao terreno.';}
  if(a==='xenoBuyTool'){x.tools=[...x.tools,p.toolId];message=TOOLS[p.toolId].name+' adquirida.';}
  if(a==='xenoStudy'){x.studied=[...x.studied,p.specimenId];message='Estudo concluído: '+BY_ID[p.specimenId].name+' revelou a '+BY_ID[p.specimenId].rune.name+'.';}
  if(a==='xenoRune'){x.runes=[...x.runes,runeId(p.specimenId)];message=BY_ID[p.specimenId].rune.name+' criada. Grave-a em um módulo da nave.';}
  if(a==='runeEngrave'){allModules(s).find(m=>m.id===p.moduleId).rune=p.runeId;clamp(s);message=BY_ID[p.runeId.replace(/^rune-/,'')].rune.name+' gravada.';}
  if(a==='runeRemove'){const m=allModules(s).find(m=>m.id===p.moduleId),name=BY_ID[m.rune.replace(/^rune-/,'')]?.rune.name||'Runa';delete m.rune;clamp(s);message=name+' removida e guardada.';}
  s.turn++;return {ok:true,message,reward:{},event:a,cost:own.cost};
 }
 // The pending exemplar is held aside while inner modules validate their working copies (an extraction ends the
 // expedition, and a pending capture without an expedition is otherwise invalid); it is restored if the field goes on.
 const pending=ensure(s).pending;ensure(s).pending=null;let result;
 try{result=base.dispatch(s,a,p);}
 finally{const x=ensure(s);if(pending){if(s.expedition)x.pending=pending;else if(result?.ok&&a==='expeditionExtract'){x.captured=[...x.captured,pending];result.reward={...(result.reward||{}),specimen:pending};result.message+=' '+BY_ID[pending].name+' chegou ao laboratório de bordo.';}}}
 return result;
};
E.expeditionView=s=>{const view=base.expeditionView(s);if(!view)return view;const f=fieldSpecimen(s);
 if(f&&f.visible&&!f.pending){view.specimen={...summary(f.specimen),x:f.cell.x,y:f.cell.y,here:f.here,owned:ensure(s).tools.includes(f.behavior.tool),cost:f.behavior.cost};const cell=view.cells.find(c=>c.x===f.cell.x&&c.y===f.cell.y);if(cell)cell.specimen=view.specimen.id;}
 else if(f?.pending)view.specimenPending=summary(f.specimen);
 return view;};
E.xenoView=s=>{const x=ensure(s),here=placements(s);
 return {specimens:SPECIMENS.map(sp=>{const sum=summary(sp),captured=x.captured.includes(sp.id),studied=x.studied.includes(sp.id),hasRune=x.runes.includes(runeId(sp.id)),place=here.find(p=>p.specimen.id===sp.id);
   return {...sum,captured,studied,hasRune,pending:x.pending===sp.id,engraved:hasRune?engravedOn(s,runeId(sp.id))?.id||null:null,
    hint:place&&!captured?{planetId:place.planetId,planetName:s.galaxy.planets.find(p=>p.id===place.planetId)?.name}:null,
    costs:costs(sp),studyPreview:E.preview(s,'xenoStudy',{specimenId:sp.id}),runePreview:E.preview(s,'xenoRune',{specimenId:sp.id})};}),
  tools:Object.entries(TOOLS).map(([id,t])=>({id,...t,owned:x.tools.includes(id),preview:E.preview(s,'xenoBuyTool',{toolId:id})})),
  runes:x.runes.map(id=>{const sp=BY_ID[id.replace(/^rune-/,'')];return {id,specimenId:sp.id,name:sp.rune.name,text:sp.rune.text,art:sp.art,module:engravedOn(s,id)};}),
  captured:x.captured.length,total:SPECIMENS.length};};
E.xenoCatalog={SPECIMENS,TOOLS,BEHAVIORS};
function valid(s){
 const x=s.xeno;if(x===undefined)return true;
 const list=(v,ok)=>Array.isArray(v)&&v.length<=64&&new Set(v).size===v.length&&v.every(ok);
 if(!x||x.v!==1||!list(x.tools,t=>Object.hasOwn(TOOLS,t))||!list(x.captured,id=>Object.hasOwn(BY_ID,id))||!list(x.studied,id=>x.captured.includes(id))||!list(x.runes,id=>typeof id==='string'&&x.studied.includes(id.replace(/^rune-/,''))&&id===runeId(id.replace(/^rune-/,''))))return false;
 if(x.pending!==null&&(!Object.hasOwn(BY_ID,x.pending)||x.captured.includes(x.pending)||!s.expedition))return false;
 const engraved=allModules(s).filter(m=>m.rune!==undefined);
 if(engraved.some(m=>typeof m.rune!=='string'||!x.runes.includes(m.rune))||new Set(engraved.map(m=>m.rune)).size!==engraved.length)return false;
 return true;
}
E.validate=s=>base.validate(s)&&valid(s);
E.create=(...args)=>{const s=base.create(...args);s.xeno=fresh();return s;};
E.restore=saved=>{const s=base.restore(saved);if(!s)return null;if(s.xeno===undefined)s.xeno=fresh();return valid(s)&&base.validate(s)?s:null;};
})(typeof window==='object'?window:globalThis);
