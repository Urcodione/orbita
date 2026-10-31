(function(root){
'use strict';
const E=root.OrbitEngine,baseDispatch=E.dispatch,basePreview=E.preview,baseRestore=E.restore;
const goods={ore:{name:'Minério',base:8,biomes:['volcanic','magma','desert','rogue']},crystals:{name:'Cristais',base:24,biomes:['crystal','ice']},oxygen:{name:'Oxigênio',base:4,biomes:['gas','forest']},fuel:{name:'Combustível',base:5,biomes:['ocean','toxic','gas']}};
Object.assign(goods,{
 ferronita:{name:'Ferronita',base:38,biomes:['volcanic'],category:'Minerais',art:'ore',hue:25,description:'Liga natural dos veios vulcânicos. Carga comercial para metalurgia orbital.'},
 prismalita:{name:'Prismalita',base:62,biomes:['crystal'],category:'Minerais',art:'crystals',hue:65,description:'Cristal óptico raro, procurado por fabricantes de sensores.'},
 salmoura:{name:'Salmoura iridescente',base:30,biomes:['ocean'],category:'Líquidos',art:'fuel',hue:130,description:'Solução mineral de oceanos profundos, usada pela indústria química.'},
 criogel:{name:'Criogel',base:48,biomes:['ice'],category:'Líquidos',art:'fuel',hue:180,description:'Fluido refrigerante extraído de bolsões sob o gelo.'},
 heliox:{name:'Héliox',base:42,biomes:['gas'],category:'Gases',art:'oxygen',hue:40,description:'Mistura atmosférica valorizada por estações industriais.'},
 xenon:{name:'Xenônio âmbar',base:56,biomes:['toxic'],category:'Gases',art:'oxygen',hue:210,description:'Gás nobre isolado em atmosferas corrosivas. Exige coleta protegida.'}
});
Object.assign(goods,{
 lumenfern:{name:'Samambaia-lume',base:26,biomes:['forest'],category:'Flora',bio:0,rarity:'Comum',description:'Vegetação de clima úmido e ameno. Cultivo fotossintético do suporte de vida: 1 unidade alimenta a produção de até 12 de oxigênio.'},
 cryorchid:{name:'Orquídea de geada',base:95,biomes:['ice'],category:'Flora',bio:1,rarity:'Rara',description:'Floresce em poucos bolsões glaciais. Transportada em cápsulas térmicas.'},
 emberbloom:{name:'Flor de brasa',base:58,biomes:['desert','volcanic'],category:'Flora',bio:2,rarity:'Exótica',description:'Suculenta de regiões áridas e quentes. Armazena calor em pétalas alaranjadas.'},
 mossfox:{name:'Raposa-musgo',base:40,biomes:['forest'],category:'Fauna',bio:3,rarity:'Comum',description:'Pequeno animal de florestas úmidas. Viaja em um habitat selado para viveiros orbitais.'},
 glassjelly:{name:'Medusa de vidro',base:78,biomes:['ocean'],category:'Fauna',bio:4,rarity:'Exótica',description:'Organismo translúcido de mares profundos. Requer o equipamento de exploração oceânica.'},
 skyray:{name:'Arraia celeste',base:125,biomes:['gas'],category:'Fauna',bio:5,rarity:'Rara',description:'Flutua nas correntes de alguns gigantes gasosos. Recuperada por sondas atmosféricas.'}
});
// Values are anchored to the starting 120 Lumes and 15–30 Lume module assembly fees.
const balancedValues={ore:3,crystals:10,oxygen:1,fuel:1,ferronita:14,prismalita:30,salmoura:12,criogel:22,heliox:16,xenon:26,lumenfern:10,mossfox:14,emberbloom:24,glassjelly:32,cryorchid:55,skyray:70};
for(const [id,base]of Object.entries(balancedValues))goods[id].base=base;
function prices(g,abundance,delta,target){
 const local=g.base*(1.30-.55*abundance);
 const pressure=Math.max(.92,Math.min(1.08,1-delta/(Math.max(8,target)*3)));
 return {buy:Math.max(1,Math.ceil(local*pressure*1.12)),sell:Math.max(1,Math.floor(local*pressure*.78))};
}
function occurs(planet,id){const g=goods[id];if(!g.biomes.includes(planet.biome))return false;if(!g.rarity||g.rarity==='Comum')return true;const seed=String(planet.seed)+':'+id;let h=0;for(const ch of seed)h=(h*31+ch.charCodeAt(0))>>>0;return h%(g.rarity==='Rara'?3:2)===0;}
const specialty=Object.keys(goods).filter(id=>goods[id].category);
function deposits(planet){return specialty.filter(id=>occurs(planet,id));}
function known(state,id){return !specialty.includes(id)||state.materialDiscoveries?.includes(id)||(state.resources[id]||0)>0||state.galaxy.planets.some(p=>p.scanned&&deposits(p).includes(id));}
E.materials=goods;E.deposits=deposits;E.materialKnown=known;
const interval=600000;
function market(state,now=Date.now()){
 const system=E.currentSystem(state),worlds=state.galaxy.planets.filter(p=>p.systemId===system.id),cycle=Math.floor(now/interval),saved=state.commerce?.galaxy===state.galaxyIndex?state.commerce.stocks?.[system.id]:null;
 const stats=E.stats(state),rows=Object.entries(goods).map(([id,g])=>{
  const abundance=worlds.filter(p=>occurs(p,id)).length/worlds.length;
  const target=specialty.includes(id)?Math.round(abundance*(g.bio!==undefined?9:24)):Math.round(12+abundance*64),delta=saved?.cycle===cycle?(saved.delta[id]||0):0,stock=Math.max(0,target+delta);
  const {buy,sell}=prices(g,abundance,delta,target);
  const demand=g.rarity==='Rara'?3:g.rarity==='Exótica'?8:g.bio!==undefined?15:specialty.includes(id)?20:40;
  const sold=saved?.cycle===cycle?(saved.sold?.[id]||0):0;
  const cap=id==='oxygen'?stats.maxOxygen:id==='fuel'?stats.maxFuel:999;
  return {id,name:g.name,abundance,stock,target,buy,sell,resell:!['fuel','oxygen'].includes(id),demandRemaining:Math.max(0,demand-sold),owned:state.resources[id]||0,cap,label:abundance>=.4?'Oferta abundante':abundance>=.2?'Oferta equilibrada':'Recurso escasso'};
 }).filter(g=>known(state,g.id));
 return {systemId:system.id,systemName:system.name,name:'Entreposto '+system.name,people:['Consórcio Aural','Nômades Veyra','Liga Thar'][state.galaxyIndex%3],cycle,refreshSeconds:Math.ceil(((cycle+1)*interval-now)/1000),buyingBudget:Math.max(0,400-(saved?.cycle===cycle?(saved.spent||0):0)),rows};
}
function quote(state,payload={},now=Date.now()){
 const m=market(state,now),g=m.rows.find(g=>g.id===payload.resource),quantity=Number(payload.quantity),side=payload.side;
 const fail=reason=>({allowed:false,reason,cost:{}});
 if(state.expedition||state.location.mode!=='orbit'||state.location.stationId!==E.currentSystem(state).id)return fail('Viaje até o entreposto e atraque para negociar.');
 if(!g||!['buy','sell'].includes(side)||!Number.isSafeInteger(quantity)||quantity<1||quantity>50)return fail('Escolha um recurso e uma quantidade entre 1 e 50.');
 // Price the whole batch unit by unit: splitting orders never creates an arbitrage exploit.
 let total=0;
 for(let i=0;i<quantity;i++){
  const delta=(g.stock-g.target)+(side==='buy'?-i:i);
  total+=prices(goods[g.id],g.abundance,delta,g.target)[side];
 }
 if(payload.expectedTotal!==undefined&&payload.expectedTotal!==total)return fail('A cotação mudou. Confira o novo total antes de confirmar.');
 if(side==='buy'&&quantity>g.stock)return fail('O entreposto não tem essa quantidade.');
 if(side==='buy'&&quantity+g.owned>g.cap)return fail('Não há espaço disponível na nave.');
 if(side==='buy'&&total>state.resources.credits)return fail('Lumes insuficientes.');
 if(side==='sell'&&!g.resell)return fail('Reserva operacional: não é revendida. Comercialize os gases e líquidos coletados.');
 if(side==='sell'&&quantity>g.demandRemaining)return fail('Demanda atendida: o entreposto compra mais '+g.demandRemaining+' unidade(s) neste ciclo.');
 if(side==='sell'&&total>m.buyingBudget)return fail('O entreposto dispõe de '+m.buyingBudget+' Lumes para compras neste ciclo.');
 if(side==='sell'&&quantity>g.owned)return fail('Você não possui essa quantidade.');
 if(side==='sell'&&g.stock+quantity>999)return fail('O entreposto atingiu seu limite de estoque.');
 if(side==='sell'&&state.resources.credits+total>99999)return fail('Saldo máximo atingido.');
 return {allowed:true,reason:'',cost:side==='buy'?{credits:total}:{[g.id]:quantity},total,quantity,side,resource:g.id,market:m};
}
E.market=market;E.tradeQuote=quote;
E.preview=(state,action,payload)=>action==='trade'?quote(state,payload):basePreview(state,action,payload);
E.dispatch=(state,action,payload)=>{
 if(action!=='trade'){
  const registered=specialty.filter(id=>known(state,id)),planet=E.currentPlanet(state),samples=action==='expeditionExtract'?Math.min(3,state.expedition?.harvested?.length||0):0;
  const result=baseDispatch(state,action,payload);
  if(result.ok){
   if(action==='scan')state.materialDiscoveries=[...new Set([...(state.materialDiscoveries||[]),...deposits(planet)])];
   if(action==='expeditionExtract'&&samples){for(const id of deposits(planet)){const amount=Math.min(goods[id].rarity==='Rara'?1:goods[id].rarity==='Exótica'?Math.min(2,samples):samples,999-(state.resources[id]||0));state.resources[id]=(state.resources[id]||0)+amount;result.reward[id]=amount;result.message+=' +'+amount+' '+goods[id].name+'.';}state.materialDiscoveries=[...new Set([...(state.materialDiscoveries||[]),...deposits(planet)])];}
   if(action==='warp'){state.materialDiscoveries=[...new Set([...(state.materialDiscoveries||[]),...registered])];delete state.commerce;}
  }
  return result;
 }
 const q=quote(state,payload);if(!q.allowed)return {ok:false,message:q.reason};
 const next=JSON.parse(JSON.stringify(state));
 if(next.commerce?.galaxy!==next.galaxyIndex)next.commerce={galaxy:next.galaxyIndex,stocks:{}};
 const old=next.commerce.stocks[q.market.systemId],entry=old?.cycle===q.market.cycle?old:{cycle:q.market.cycle,delta:{}};
 if(q.side==='sell'){entry.sold=entry.sold||{};entry.sold[q.resource]=(entry.sold[q.resource]||0)+q.quantity;entry.spent=(entry.spent||0)+q.total;}
 entry.delta[q.resource]=(entry.delta[q.resource]||0)+(q.side==='buy'?-q.quantity:q.quantity);next.commerce.stocks[q.market.systemId]=entry;
 next.resources[q.resource]=(next.resources[q.resource]||0)+(q.side==='buy'?q.quantity:-q.quantity);next.resources.credits+=q.side==='buy'?-q.total:q.total;next.turn++;
 if(!E.validate(next))return {ok:false,message:'A transação excede os limites da nave.'};
 Object.assign(state,next);return {ok:true,message:(q.side==='buy'?'Compra':'Venda')+' concluída · '+q.total+' Lumes.',reward:{}};
};
E.restore=saved=>{try{const state=baseRestore(saved);if(!state)return null;if(specialty.some(id=>state.resources[id]!==undefined&&(!Number.isInteger(state.resources[id])||state.resources[id]<0||state.resources[id]>999)))return null;if(state.materialDiscoveries!==undefined&&(!Array.isArray(state.materialDiscoveries)||state.materialDiscoveries.length>specialty.length||state.materialDiscoveries.some(id=>!specialty.includes(id))))return null;const c=state.commerce;if(c){if(c.galaxy!==state.galaxyIndex||!c.stocks||Object.keys(c.stocks).length>4)return null;for(const [id,e]of Object.entries(c.stocks)){if(e.spent!==undefined&&(!Number.isInteger(e.spent)||e.spent<0||e.spent>400))return null;if(e.sold!==undefined&&(!e.sold||Object.entries(e.sold).some(([k,v])=>!goods[k]||!Number.isInteger(v)||v<0||v>40)))return null;if(!state.galaxy.systems.some(s=>s.id===id)||!Number.isSafeInteger(e.cycle)||!e.delta||Object.entries(e.delta).some(([k,v])=>!goods[k]||!Number.isInteger(v)||Math.abs(v)>999))return null;}}return state;}catch(_){return null;}};
})(typeof window==='object'?window:globalThis);
