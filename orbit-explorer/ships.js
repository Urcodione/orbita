(function(root){
'use strict';
// Fleet: ready-made ships. A travelling merchant sometimes waits at a station with one ship for sale; bought ships wait
// in the hangar and the active one is switched at a station. Modules, runes, paint and trail stay with the player, so a
// ship only adds its own personality: two strengths and one weakness, as stat effects and protection capabilities.
const E=root.OrbitEngine;if(!E||E.fleetView)return;
const base={create:E.create,dispatch:E.dispatch,preview:E.preview,validate:E.validate,restore:E.restore};
const fail=(reason,cost={})=>({allowed:false,reason,cost});
const hash=v=>[...String(v)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261);
// Same names as the station peoples in economy.js; a merchant favours ships of the galaxy's own people.
const PEOPLES=['Consórcio Aural','Nômades Veyra','Liga Thar'];
const RARITY={inicial:{label:'Inicial',weight:0},comum:{label:'Comum',weight:6},rara:{label:'Rara',weight:4},lendaria:{label:'Lendária',weight:.6}};
// nozzles: exhaust points in the exterior painting, in % of the 2:3 frame (assets/src/ships/naves.json).
const SHIPS=[
 {id:'andorinha',name:'Andorinha',role:'Exploradora equilibrada',people:null,rarity:'inicial',price:0,effects:{},capabilities:{},plus:['Equilibrada em tudo'],minus:[],
  lore:'A nave com que tudo começou. Não se destaca em nada e não falha em nada.',nozzles:[[21,84,0],[50,95.5,1],[79,84,0]]},
 {id:'beija-flor',name:'Beija-flor',role:'Batedora',people:1,rarity:'comum',price:2200,effects:{fuelEfficiency:.25,warpEfficiency:.1,maxHull:-20,expeditionCapacity:-1},capabilities:{},
  plus:['+25% de eficiência de voo','+10% de eficiência de dobra'],minus:['−20 de casco','−1 de carga na expedição'],
  lore:'Esguia como uma agulha. Chega primeiro e gasta pouco, mas não aguenta muita pancada.',nozzles:[[52.2,95.2,1],[28.3,75.7,0],[71.6,80.7,0]]},
 {id:'albatroz',name:'Albatroz',role:'Longo curso',people:0,rarity:'comum',price:2600,effects:{maxFuel:40,oxygenEfficiency:.15,collectionBonus:-.1},capabilities:{},
  plus:['+40 de tanque de combustível','+15% de eficiência do ar'],minus:['−10% de rendimento de coleta'],
  lore:'Asas solares longas e tanques fundos. Feita para travessias que outras naves não terminam.',nozzles:[[50.0,94.5,1],[29.6,81.4,0],[69.2,81.4,0]]},
 {id:'pelicano',name:'Pelicano',role:'Cargueira',people:0,rarity:'comum',price:2400,effects:{cargoCapacity:3,expeditionCapacity:1,maxHull:20,fuelEfficiency:-.15},capabilities:{},
  plus:['+3 espaços no armazém','+1 de carga na expedição e +20 de casco'],minus:['−15% de eficiência de voo'],
  lore:'Bojuda e confiável. O porão da frente leva o que os outros deixam para trás.',nozzles:[[33.5,92.5,1],[50.0,93.5,1],[68.0,93.5,1],[21.6,86.1,0],[78.5,87.6,0]]},
 {id:'coruja',name:'Coruja',role:'Observatório',people:2,rarity:'rara',price:3600,effects:{scanRadius:1,scanBonus:.15,maxFuel:-15},capabilities:{},
  plus:['+1 setor de alcance do scanner','+15% de bônus de pesquisa'],minus:['−15 de combustível'],
  lore:'Duas lentes enormes e uma cúpula silenciosa. Vê setores que nenhuma outra nave alcança.',nozzles:[[49.0,93.7,1],[33.6,92.0,0],[66.7,92.0,0]]},
 {id:'martim-pescador',name:'Martim-pescador',role:'Mineradora',people:1,rarity:'rara',price:3400,effects:{collectionBonus:.15,expeditionReserve:3,oxygenEfficiency:-.1},capabilities:{},
  plus:['+15% de rendimento de coleta','+3 de energia em cada expedição'],minus:['−10% de eficiência do ar'],
  lore:'Uma broca na proa e braços de coleta dobrados. Mergulha no terreno e volta carregada.',nozzles:[[48.5,93.7,1],[29.5,84.1,0],[69.7,85.2,0]]},
 {id:'pinguim',name:'Pinguim',role:'Gelo e profundezas',people:0,rarity:'rara',price:3200,effects:{fuelEfficiency:-.1},capabilities:{cold:60,pressure:3,heat:-20},
  plus:['+60 °C de isolamento contra o frio','+3 atm de resistência à pressão'],minus:['−10% de eficiência de voo','−20 °C de proteção contra o calor'],
  lore:'Casco grosso e acolchoado. Atravessa geleiras e oceanos profundos sem reclamar.',nozzles:[[50.8,94.9,1],[28.9,86.9,0],[71.2,87.2,0]]},
 {id:'carcara',name:'Carcará',role:'Mundos ardentes',people:1,rarity:'rara',price:3400,effects:{warpEfficiency:-.1},capabilities:{heat:60,radiation:60},
  plus:['+60 °C de proteção contra o calor','+60 rad de blindagem contra radiação'],minus:['−10% de eficiência de dobra'],
  lore:'Escudos térmicos chamuscados nas asas. Pousa onde a rocha ainda está derretendo.',nozzles:[[51.8,92.8,1],[32.1,79.4,0],[70.1,79.4,0]]},
 {id:'garca',name:'Garça',role:'Pântanos e gás',people:2,rarity:'rara',price:3000,effects:{expeditionIntegrity:2,cargoCapacity:-1},capabilities:{toxicity:25},
  plus:['+25% de filtragem tóxica','+2 de integridade nas expedições'],minus:['−1 espaço no armazém'],
  lore:'Alta e elegante, com filtros por todo o casco. Respira onde o ar é veneno.',nozzles:[[51.2,86.8,1],[26.0,95.1,0],[74.1,95.1,0]]},
 {id:'fenix',name:'Fênix',role:'Dobra lendária',people:null,rarity:'lendaria',price:7500,effects:{warpEfficiency:.4,expeditionIntegrity:2,expeditionReserve:3},capabilities:{},
  plus:['+40% de eficiência de dobra','+2 de integridade e +3 de energia nas expedições'],minus:['Rara de encontrar e cara'],
  lore:'Ninguém sabe quem a construiu. Aparece pouco, e atravessa galáxias quase sem gastar.',nozzles:[[50.0,91.7,1]]},
];
const BY=Object.fromEntries(SHIPS.map(s=>[s.id,s]));
const START='andorinha',OFFER_CHANCE=40;

function fresh(){return {v:1,owned:[START],active:START,visits:0,offer:null};}
function ensure(s){if(!s.fleet)s.fleet=fresh();return s.fleet;}
const docked=s=>!!s.location?.stationId&&!s.expedition;
const peopleOf=s=>PEOPLES[s.galaxyIndex%3];
function rollOffer(s){
 const f=ensure(s);f.visits+=1;f.offer=null;
 if(s.guide?.active)return;
 const seed=hash(s.seed+':'+s.galaxyIndex+':'+f.visits);
 // The first visit after the tutorial always meets the merchant, so the hangar is introduced early.
 if(f.visits>1&&seed%100>=OFFER_CHANCE)return;
 const people=peopleOf(s),pool=SHIPS.filter(x=>x.rarity!=='inicial'&&!f.owned.includes(x.id)).map(x=>({x,w:RARITY[x.rarity].weight*(PEOPLES[x.people]===people?2:1)}));
 const total=pool.reduce((n,p)=>n+p.w,0);if(!total)return;
 let pick=(hash(seed+'ship')%10000)/10000*total;
 for(const p of pool){pick-=p.w;if(pick<0){f.offer={ship:p.x.id,system:s.location.stationId};return;}}
 f.offer={ship:pool[pool.length-1].x.id,system:s.location.stationId};
}
function withActive(s,id){const copy=JSON.parse(JSON.stringify(s));ensure(copy).active=id;return copy;}
function plan(s,a,p={}){
 if(a!=='fleetBuy'&&a!=='fleetSwitch')return null;
 const f=ensure(s),ship=BY[p.shipId];if(!ship)return fail('Escolha uma nave.');
 if(s.expedition)return fail('Termine a expedição e volte à nave antes.');
 if(!s.location?.stationId)return fail(a==='fleetBuy'?'O viajante só negocia atracado no entreposto.':'A troca de nave é feita atracado num entreposto.');
 if(a==='fleetBuy'){
  if(f.owned.includes(ship.id))return fail('Esta nave já está no seu hangar.');
  if(f.offer?.ship!==ship.id)return fail('O viajante não está vendendo esta nave.');
  if(s.resources.credits<ship.price)return fail('Faltam '+(ship.price-s.resources.credits)+' Lumes.',{credits:ship.price});
  return {allowed:true,reason:'',cost:{credits:ship.price}};
 }
 if(!f.owned.includes(ship.id))return fail('Esta nave não está no seu hangar.');
 if(f.active===ship.id)return fail('Você já pilota a '+ship.name+'.');
 const capacity=E.stats(withActive(s,ship.id)).cargoCapacity;
 if(s.inventory.length>capacity)return fail('O armazém da '+ship.name+' tem '+capacity+' espaços. Libere '+(s.inventory.length-capacity)+' antes de trocar.');
 return {allowed:true,reason:'',cost:{}};
}
// Keep resources within the (possibly lower) maxima of the new ship.
function clamp(s){const c=E.stats(s);for(const [k,m]of [['fuel','maxFuel'],['oxygen','maxOxygen'],['hull','maxHull']])if(s.resources[k]>c[m])s.resources[k]=c[m];}

E.shipBonus=s=>{const ship=BY[s?.fleet?.active];return ship?{effects:ship.effects,capabilities:ship.capabilities}:null;};
E.preview=(s,a,p)=>plan(s,a,p||{})||base.preview(s,a,p);
E.dispatch=(s,a,p={})=>{
 const own=plan(s,a,p||{});
 if(own){
  if(!own.allowed)return {ok:false,message:own.reason};
  const f=ensure(s),ship=BY[p.shipId];let message;
  if(a==='fleetBuy'){s.resources.credits-=ship.price;f.owned=[...f.owned,ship.id];f.offer=null;message=ship.name+' comprada. Ela espera no hangar: troque de nave quando quiser, atracado num entreposto.';}
  else{f.active=ship.id;clamp(s);message='Agora você pilota a '+ship.name+'. Módulos, runas, pintura e rastro vieram junto.';}
  s.turn++;return {ok:true,message,reward:{},event:a,cost:own.cost};
 }
 // An offer belongs to the docked station; it is taken aside before leaving (the engine validates the undocked state)
 // and put back if the departure fails.
 const held=a==='stationLeave'&&s.fleet?.offer||null;if(held)s.fleet.offer=null;
 const result=base.dispatch(s,a,p);
 if(held&&!result?.ok)ensure(s).offer=held;
 ensure(s);  // the tutorial replaces the whole state when it is skipped or finished
 if(result?.ok&&a==='stationDock')rollOffer(s);
 return result;
};
const card=(ship,s)=>({...ship,rarityLabel:RARITY[ship.rarity].label,peopleName:ship.people===null?'Origem desconhecida':PEOPLES[ship.people]});
E.fleetView=s=>{const f=ensure(s),offer=f.offer&&BY[f.offer.ship];
 return {active:f.active,docked:docked(s),
  ships:f.owned.map(id=>({...card(BY[id],s),active:id===f.active,preview:E.preview(s,'fleetSwitch',{shipId:id})})),
  offer:offer?{...card(offer,s),preview:E.preview(s,'fleetBuy',{shipId:offer.id})}:null,
  total:SHIPS.length};};
E.fleetCatalog={SHIPS,RARITY,PEOPLES};
function valid(s){
 const f=s.fleet;if(f===undefined)return true;
 if(!f||f.v!==1||!Array.isArray(f.owned)||f.owned.length>SHIPS.length||new Set(f.owned).size!==f.owned.length||!f.owned.every(id=>Object.hasOwn(BY,id))||!f.owned.includes(START))return false;
 if(!f.owned.includes(f.active)||!Number.isInteger(f.visits)||f.visits<0||f.visits>1e6)return false;
 if(f.offer!==null&&(!f.offer||!Object.hasOwn(BY,f.offer.ship)||f.offer.ship===START||f.owned.includes(f.offer.ship)||f.offer.system!==s.location?.stationId))return false;
 return s.inventory.length<=E.stats(s).cargoCapacity;
}
E.validate=s=>base.validate(s)&&valid(s);
E.create=(...args)=>{const s=base.create(...args);s.fleet=fresh();return s;};
E.restore=saved=>{const s=base.restore(saved);if(!s)return null;if(s.fleet===undefined)s.fleet=fresh();return valid(s)&&base.validate(s)?s:null;};
})(typeof window==='object'?window:globalThis);
