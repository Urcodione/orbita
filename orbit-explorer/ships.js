(function(root){
'use strict';
// Fleet: ready-made ships. In each galaxy a travelling merchant may wait at the station with one ship for sale (rolled
// once per galaxy stay, so docking again never rerolls it); bought ships wait in the hangar and the active one is
// switched at a station. Modules, runes, paint and trail stay with the player, so a
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
 {id:'andorinha',name:'Andorinha',role:'Exploradora equilibrada',people:null,rarity:'inicial',price:0,effects:{},capabilities:{},trait:null,plus:['Equilibrada em tudo'],minus:[],
  lore:'A nave com que tudo começou. Não se destaca em nada e não falha em nada.',nozzles:[[21,84,0],[50,95.5,1],[79,84,0]]},
 {id:'beija-flor',name:'Beija-flor',role:'Batedora',people:1,rarity:'comum',price:1300,effects:{fuelEfficiency:.15,maxHull:-20},capabilities:{},trait:{id:'shortHop',name:'Salto curto',text:'Viagens entre planetas do mesmo sistema não gastam combustível.'},
  plus:['+15% de eficiência de voo'],minus:['−20 de casco'],
  lore:'Esguia como uma agulha. Chega primeiro e gasta pouco, mas não aguenta muita pancada.',nozzles:[[52.2,95.2,1],[28.3,75.7,0],[71.6,80.7,0]]},
 {id:'albatroz',name:'Albatroz',role:'Longo curso',people:0,rarity:'comum',price:1500,effects:{maxFuel:30,collectionBonus:-.1},capabilities:{},trait:{id:'solar',name:'Velas solares',text:'Viagens entre planetas não gastam oxigênio.'},
  plus:['+30 de tanque de combustível'],minus:['−10% de rendimento de coleta'],
  lore:'Asas solares longas e tanques fundos. Feita para travessias que outras naves não terminam.',nozzles:[[50.0,94.5,1],[29.6,81.4,0],[69.2,81.4,0]]},
 {id:'pelicano',name:'Pelicano',role:'Cargueira',people:0,rarity:'comum',price:1400,effects:{cargoCapacity:3,expeditionCapacity:1,fuelEfficiency:-.1},capabilities:{},trait:{id:'salvage',name:'Porão de resgate',text:'Ao evacuar uma expedição, metade da carga de recursos volta com você.'},
  plus:['+3 espaços no armazém','+1 de carga na expedição'],minus:['−10% de eficiência de voo'],
  lore:'Bojuda e confiável. O porão da frente leva o que os outros deixam para trás.',nozzles:[[33.5,92.5,1],[50.0,93.5,1],[68.0,93.5,1],[21.6,86.1,0],[78.5,87.6,0]]},
 {id:'coruja',name:'Coruja',role:'Observatório',people:2,rarity:'rara',price:2900,effects:{scanRadius:1,scanBonus:.15,maxFuel:-15},capabilities:{},trait:{id:'sight',name:'Lentes da Coruja',text:'Na expedição, o exemplar único aparece no mapa desde o pouso, mesmo camuflado.'},
  plus:['+1 setor de alcance do scanner','+15% de bônus de pesquisa'],minus:['−15 de combustível'],
  lore:'Duas lentes enormes e uma cúpula silenciosa. Vê setores que nenhuma outra nave alcança.',nozzles:[[49.0,93.7,1],[33.6,92.0,0],[66.7,92.0,0]]},
 {id:'martim-pescador',name:'Martim-pescador',role:'Mineradora',people:1,rarity:'rara',price:2700,effects:{collectionBonus:.15,oxygenEfficiency:-.1},capabilities:{},trait:{id:'drill',name:'Broca de proa',text:'Na expedição, abre passagem por paredes de rocha gastando 3 de energia a mais.'},
  plus:['+15% de rendimento de coleta'],minus:['−10% de eficiência do ar'],
  lore:'Uma broca na proa e braços de coleta dobrados. Mergulha no terreno e volta carregada.',nozzles:[[40.8,92.6,1],[63.0,92.6,1]]},
 {id:'pinguim',name:'Pinguim',role:'Gelo e profundezas',people:0,rarity:'rara',price:2500,effects:{fuelEfficiency:-.1},capabilities:{liquid:true,pressure:10,cold:60},trait:{id:'dive',name:'Casco submersível',text:'Operação submersa e +10 atm: pousa na maioria dos oceanos sem o Módulo Mergulhador.'},
  plus:['+60 °C de isolamento contra o frio'],minus:['−10% de eficiência de voo'],
  lore:'Casco grosso e acolchoado. Atravessa geleiras e oceanos profundos sem reclamar.',nozzles:[[51.2,93.3,1]]},
 {id:'carcara',name:'Carcará',role:'Mundos ardentes',people:1,rarity:'rara',price:2600,effects:{warpEfficiency:-.1},capabilities:{heat:260,radiation:45},trait:{id:'furnace',name:'Escudos de forja',text:'+260 °C e +45 rad: pousa nos mundos vulcânicos típicos sem trocar o escudo.'},
  plus:[],minus:['−10% de eficiência de dobra'],
  lore:'Escudos térmicos chamuscados nas asas. Pousa onde a rocha ainda está derretendo.',nozzles:[[54.6,73.0,1],[46.7,72.6,0],[61.8,72.6,0]]},
 {id:'garca',name:'Garça',role:'Pântanos e gás',people:2,rarity:'rara',price:2400,effects:{expeditionIntegrity:2,cargoCapacity:-1},capabilities:{gas:true,pressure:5,toxicity:25},trait:{id:'probe',name:'Sonda atmosférica',text:'Sonda embutida e +5 atm: pousa nos gigantes gasosos típicos sem o Coletor de Tempestades.'},
  plus:['+25% de filtragem tóxica','+2 de integridade nas expedições'],minus:['−1 espaço no armazém'],
  lore:'Alta e elegante, com filtros por todo o casco. Respira onde o ar é veneno.',nozzles:[[50.0,73.2,1],[15.7,96.2,0],[83.8,96.2,0]]},
 {id:'fenix',name:'Fênix',role:'Dobra lendária',people:null,rarity:'lendaria',price:6000,effects:{warpEfficiency:.25,expeditionIntegrity:2,expeditionReserve:3},capabilities:{},trait:{id:'phoenix',name:'Dobra da Fênix',text:'Cada dobra entre galáxias custa 1 célula a menos (mínimo 1).'},
  plus:['+25% de eficiência de dobra','+2 de integridade e +3 de energia nas expedições'],minus:['Rara de encontrar e cara'],
  lore:'Ninguém sabe quem a construiu. Aparece pouco, e atravessa galáxias quase sem gastar.',nozzles:[[50.0,91.7,1]]},
];
const BY=Object.fromEntries(SHIPS.map(s=>[s.id,s]));
const START='andorinha',OFFER_CHANCE=75;

function fresh(){return {v:1,owned:[START],active:START,rolled:null,offer:null};}
function ensure(s){if(!s.fleet)s.fleet=fresh();return s.fleet;}
const docked=s=>!!s.location?.stationId&&!s.expedition;
const galaxyOf=s=>s.campaign?.atHome?0:s.galaxyIndex;
const peopleOf=s=>PEOPLES[galaxyOf(s)%3];
// One roll per galaxy stay: the galaxy and the count of galaxies visited so far (a return trip is a new stay).
const stayKey=s=>galaxyOf(s)+':'+s.visitedGalaxies;
function rollOffer(s){
 const f=ensure(s),key=stayKey(s);
 if(s.guide?.active||f.rolled===key)return;
 const first=f.rolled===null;f.rolled=key;f.offer=null;
 const seed=hash(s.seed+':'+key);
 // The first station visit after the tutorial always meets the merchant, so the hangar is introduced early.
 if(!first&&seed%100>=OFFER_CHANCE)return;
 const people=peopleOf(s),pool=SHIPS.filter(x=>x.rarity!=='inicial'&&!f.owned.includes(x.id)).map(x=>({x,w:RARITY[x.rarity].weight*(PEOPLES[x.people]===people?2:1)}));
 const total=pool.reduce((n,p)=>n+p.w,0);if(!total)return;
 let pick=(hash(seed+'ship')%10000)/10000*total;
 for(const p of pool){pick-=p.w;if(pick<0){f.offer={ship:p.x.id,stay:key};return;}}
 f.offer={ship:pool[pool.length-1].x.id,stay:key};
}
function withActive(s,id){const copy=JSON.parse(JSON.stringify(s));ensure(copy).active=id;return copy;}
function plan(s,a,p={}){
 if(a!=='fleetBuy'&&a!=='fleetSwitch')return null;
 const f=ensure(s),ship=BY[p.shipId];if(!ship)return fail('Escolha uma nave.');
 if(s.expedition)return fail('Termine a expedição e volte à nave antes.');
 if(!s.location?.stationId)return fail(a==='fleetBuy'?'O viajante só negocia atracado no entreposto.':'A troca de nave é feita atracado num entreposto.');
 if(a==='fleetBuy'){
  if(f.owned.includes(ship.id))return fail('Esta nave já está no seu hangar.');
  if(f.offer?.ship!==ship.id||f.offer.stay!==stayKey(s))return fail('O viajante não está vendendo esta nave.');
  if(s.resources.credits<ship.price)return fail('Faltam '+(ship.price-s.resources.credits)+' Lumes.',{credits:ship.price});
  return {allowed:true,reason:'',cost:{credits:ship.price}};
 }
 if(!f.owned.includes(ship.id))return fail('Esta nave não está no seu hangar.');
 if(f.active===ship.id)return fail('Você já pilota a '+ship.name+'.');
 const next=withActive(s,ship.id),capacity=E.stats(next).cargoCapacity;
 if(E.storageView){const before=E.storageView(s),after=E.storageView(next);if(after.excess>before.excess)return fail('O depósito da '+ship.name+' ficaria com '+after.excess+' unidades excedentes. Libere carga antes de trocar.');}
 if(s.inventory.length>capacity)return fail('O armazém da '+ship.name+' tem '+capacity+' espaços. Libere '+(s.inventory.length-capacity)+' antes de trocar.');
 return {allowed:true,reason:'',cost:{}};
}
// Keep resources within the (possibly lower) maxima of the new ship.
function clamp(s){const c=E.stats(s);for(const [k,m]of [['fuel','maxFuel'],['oxygen','maxOxygen'],['hull','maxHull']])if(s.resources[k]>c[m])s.resources[k]=c[m];}

E.shipBonus=s=>{const ship=BY[s?.fleet?.active];return ship?{effects:ship.effects,capabilities:ship.capabilities}:null;};
E.shipTrait=s=>BY[s?.fleet?.active]?.trait?.id||null;
// Trip costs changed by the active ship's trunfo: short hops, solar sails and the Phoenix warp.
E.shipCost=(s,action,cost,info)=>{const trait=E.shipTrait(s);
 if(action==='travel'&&info?.target){if(trait==='shortHop'&&info.target.systemId===E.currentPlanet(s)?.systemId)delete cost.fuel;if(trait==='solar')delete cost.oxygen;}
 if(action==='warp'&&trait==='phoenix'&&cost.warpFuel>1)cost.warpFuel-=1;
 return cost;};
// Worlds of this galaxy that a ship would open: blocked by protection now, open with that ship flying.
// The active ship is swapped in place for the check and always restored (no copy of the whole state per ship).
E.fleetUnlocks=(s,id)=>{const f=s.fleet;if(!BY[id]||!f||f.active===id)return [];
 const blocked=s.galaxy.planets.filter(p=>E.assess(s,p.id)?.missing?.length),was=f.active;
 try{f.active=id;return blocked.filter(p=>!E.assess(s,p.id)?.missing?.length).map(p=>({id:p.id,name:p.name}));}finally{f.active=was;}};
E.preview=(s,a,p)=>plan(s,a,p||{})||base.preview(s,a,p);
E.dispatch=(s,a,p={})=>{
 const own=plan(s,a,p||{});
 if(own){
  if(!own.allowed)return {ok:false,message:own.reason};
  const f=ensure(s),ship=BY[p.shipId];let message;
  if(a==='fleetBuy'){s.resources.credits-=ship.price;f.owned=[...f.owned,ship.id];f.offer=null;message=ship.name+' comprada. Ela espera no hangar: troque de nave quando quiser, atracado num entreposto.';}
  else{
   // A ship still carrying its model's name takes the new model's name; a name the player chose is kept.
   if(s.ship?.name===BY[f.active]?.name)s.ship.name=ship.name;
   f.active=ship.id;clamp(s);message='Agora você pilota a '+ship.name+'. Módulos, runas, pintura e rastro vieram junto.';}
  s.turn++;return {ok:true,message,reward:{},event:a,cost:own.cost};
 }
 const result=base.dispatch(s,a,p);
 const f=ensure(s);  // the tutorial replaces the whole state when it is skipped or finished
 if(f.offer&&f.offer.stay!==stayKey(s))f.offer=null;  // the merchant stays behind in the galaxy the ship left
 if(result?.ok&&a==='stationDock')rollOffer(s);
 return result;
};
const card=(ship,s)=>({...ship,rarityLabel:RARITY[ship.rarity].label,peopleName:ship.people===null?'Origem desconhecida':PEOPLES[ship.people],unlocks:E.fleetUnlocks(s,ship.id)});
E.fleetView=s=>{const f=ensure(s),offer=f.offer&&BY[f.offer.ship];
 return {active:f.active,docked:docked(s),
  ships:f.owned.map(id=>({...card(BY[id],s),active:id===f.active,preview:E.preview(s,'fleetSwitch',{shipId:id})})),
  offer:offer&&f.offer.stay===stayKey(s)&&docked(s)?{...card(offer,s),preview:E.preview(s,'fleetBuy',{shipId:offer.id})}:null,
  total:SHIPS.length};};
E.fleetCatalog={SHIPS,RARITY,PEOPLES};
function valid(s){
 const f=s.fleet;if(f===undefined)return true;
 if(!f||f.v!==1||!Array.isArray(f.owned)||f.owned.length>SHIPS.length||new Set(f.owned).size!==f.owned.length||!f.owned.every(id=>Object.hasOwn(BY,id))||!f.owned.includes(START))return false;
 if(!f.owned.includes(f.active)||(f.rolled!==null&&(typeof f.rolled!=='string'||f.rolled.length>24)))return false;
 if(f.offer!==null&&(!f.offer||!Object.hasOwn(BY,f.offer.ship)||f.offer.ship===START||f.owned.includes(f.offer.ship)||f.offer.stay!==f.rolled))return false;
 return s.inventory.length<=E.stats(s).cargoCapacity;
}
E.validate=s=>base.validate(s)&&valid(s);
E.create=(...args)=>{const s=base.create(...args);s.fleet=fresh();return s;};
E.restore=saved=>{const s=base.restore(saved);if(!s)return null;if(s.fleet===undefined)s.fleet=fresh();return valid(s)&&base.validate(s)?s:null;};
})(typeof window==='object'?window:globalThis);
