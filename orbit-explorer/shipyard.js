(function(root){
'use strict';
// Star shipyard: hull parts mounted on a grid shaped like the Andorinha. Each part takes cells, adds mass, draws
// reactor energy and grants a small effect; limits on mass and energy force choices, so ships diverge. Parts are
// sold by each galaxy's faction, and a layout can be shared as a short code.
const E=root.OrbitEngine;if(!E||E.yardView)return;
const base={create:E.create,dispatch:E.dispatch,preview:E.preview,validate:E.validate,restore:E.restore};
const fail=(reason,cost={})=>({allowed:false,reason,cost});
const COLS=5,ROWS=7;
// Rocket silhouette: nose, shoulders, four full rows of body, engine skirt.
const MASK=[[2],[1,2,3],[0,1,2,3,4],[0,1,2,3,4],[0,1,2,3,4],[0,1,2,3,4],[1,2,3]];
const ALLOWED=new Set(MASK.flatMap((cols,y)=>cols.map(x=>y*COLS+x)));
const FACTIONS=['Coletivo Aural','Nômades Veyra','Liga Thar'];
const PARTS=[
 {id:'tanque-externo',name:'Tanque externo',faction:0,w:1,h:2,mass:4,energy:0,price:140,effects:{maxFuel:20},text:'+20 de tanque de combustível'},
 {id:'reservatorio-o2',name:'Reservatório de O₂',faction:0,w:1,h:1,mass:2,energy:0,price:120,effects:{maxOxygen:15},text:'+15 de reserva de oxigênio'},
 {id:'placas-casco',name:'Placas de casco',faction:0,w:1,h:1,mass:3,energy:0,price:110,effects:{maxHull:10},text:'+10 de resistência do casco'},
 {id:'vela-solar',name:'Vela solar',faction:0,w:2,h:1,mass:1,energy:-2,price:260,effects:{oxygenEfficiency:.05},text:'+5% de eficiência do ar · gera 2 de energia'},
 {id:'quilha',name:'Quilha estabilizadora',faction:1,w:1,h:2,mass:3,energy:1,price:180,effects:{fuelEfficiency:.06},text:'+6% de eficiência de voo'},
 {id:'nacela',name:'Nacela auxiliar',faction:1,w:1,h:2,mass:4,energy:2,price:300,effects:{fuelEfficiency:.1,warpEfficiency:.05},text:'+10% de voo · +5% de dobra'},
 {id:'baia-drones',name:'Baia de drones',faction:1,w:2,h:2,mass:5,energy:3,price:420,effects:{collectionBonus:.1,expeditionCapacity:1},text:'+10% de coleta · +1 de carga na expedição'},
 {id:'reator-compacto',name:'Reator compacto',faction:1,w:1,h:1,mass:3,energy:-4,price:240,effects:{},text:'Gera 4 de energia para outras peças'},
 {id:'antena-longa',name:'Antena de longo alcance',faction:2,w:1,h:1,mass:1,energy:3,price:320,effects:{scanRadius:1},text:'+1 setor de alcance do scanner'},
 {id:'matriz-sensores',name:'Matriz de sensores',faction:2,w:2,h:1,mass:2,energy:2,price:220,effects:{scanBonus:.1},text:'+10% de bônus de pesquisa'},
 {id:'defletor',name:'Defletor de campo',faction:2,w:2,h:1,mass:2,energy:2,price:260,effects:{expeditionIntegrity:1},text:'+1 de integridade nas expedições'},
 {id:'conteiner-orbital',name:'Contêiner orbital',faction:2,w:2,h:2,mass:6,energy:0,price:380,effects:{cargoCapacity:2},text:'+2 espaços no armazém de módulos'}
];
const BY_ID=Object.fromEntries(PARTS.map(p=>[p.id,p]));
const FRAME_MASS=30,REACTOR=10,LIGHT_MASS=18;
function fresh(){return {v:1,owned:{},layout:[]};}
function ensure(s){if(!s.yard)s.yard=fresh();return s.yard;}
function cellsOf(part,cell){const x=cell%COLS,y=Math.floor(cell/COLS),out=[];for(let dy=0;dy<part.h;dy++)for(let dx=0;dx<part.w;dx++){const nx=x+dx,ny=y+dy;if(nx>=COLS||ny>=ROWS)return null;out.push(ny*COLS+nx);}return out;}
function occupancy(layout){const map=new Map();for(const [i,item]of layout.entries()){const part=BY_ID[item.p],cells=part&&cellsOf(part,item.c);if(!cells)return null;for(const c of cells){if(map.has(c)||!ALLOWED.has(c))return null;map.set(c,i);}}return map;}
function totals(layout){let mass=0,draw=0,supply=REACTOR;const effects={};for(const item of layout){const part=BY_ID[item.p];mass+=part.mass;if(part.energy>0)draw+=part.energy;else supply-=part.energy;for(const [k,v]of Object.entries(part.effects))effects[k]=Math.round(((effects[k]||0)+v)*100)/100;}
 // A heavier ship flies less efficiently: every unit of mass above 18 costs 1% of flight efficiency.
 const penalty=Math.max(0,mass-LIGHT_MASS)*.01;if(penalty)effects.fuelEfficiency=Math.round(((effects.fuelEfficiency||0)-penalty)*100)/100;
 return {mass,draw,supply,effects,penalty};}
E.yardEffects=s=>s.yard?.layout?.length?totals(s.yard.layout).effects:{};
function placed(y,id){return y.layout.filter(item=>item.p===id).length;}
function stationFaction(s){return s.location.stationId?FACTIONS[(s.campaign?.atHome?0:s.galaxyIndex)%3]:null;}
// Share code: "ORB1-" + two base-36 characters per part (part index, cell).
function encode(layout){return 'ORB1-'+layout.map(item=>PARTS.findIndex(p=>p.id===item.p).toString(36)+item.c.toString(36)).join('');}
function decode(code){const m=/^ORB1-([0-9a-z]*)$/i.exec(String(code||'').trim());if(!m||m[1].length%2||m[1].length>2*ALLOWED.size)return null;const out=[];for(let i=0;i<m[1].length;i+=2){const p=PARTS[parseInt(m[1][i],36)],c=parseInt(m[1][i+1],36);if(!p||!Number.isInteger(c))return null;out.push({p:p.id,c});}return occupancy(out)?out:null;}
function capacityOk(s,layout){const t=totals(layout);return t.mass<=FRAME_MASS&&t.draw<=t.supply;}
function limitsReason(layout){const t=totals(layout);if(t.mass>FRAME_MASS)return 'A estrutura suporta '+FRAME_MASS+' de massa; esta montagem teria '+t.mass+'.';if(t.draw>t.supply)return 'O reator fornece '+t.supply+' de energia; as peças pediriam '+t.draw+'. Monte um reator ou uma vela solar.';return '';}
function storageOk(s,layout){const next={...s,yard:{...s.yard,layout}};return s.inventory.length<=E.stats(next).cargoCapacity;}
function plan(s,a,p={}){
 const y=ensure(s);
 if(!['yardBuy','yardPlace','yardRemove','yardClear','yardApply'].includes(a))return null;
 if(s.expedition)return fail('Retorne à nave e extraia a carga antes de usar o estaleiro.');
 if(a==='yardBuy'){const part=BY_ID[p.partId];if(!part)return fail('Escolha uma peça do catálogo.');const faction=stationFaction(s);if(!faction)return fail('Peças de casco são vendidas nos entrepostos.');if(FACTIONS[part.faction]!==faction)return fail('Esta peça é vendida pelo '+FACTIONS[part.faction]+'.');if((y.owned[part.id]||0)>=6)return fail('Seu hangar já guarda seis desta peça.');if(s.resources.credits<part.price)return fail('Faltam '+(part.price-s.resources.credits)+' Lumes.',{credits:part.price});return {allowed:true,reason:'',cost:{credits:part.price}};}
 if(a==='yardPlace'){const part=BY_ID[p.partId];if(!part)return fail('Escolha uma peça do hangar.');if(placed(y,part.id)>=(y.owned[part.id]||0))return fail('Todas as unidades desta peça já estão montadas.');if(!Number.isInteger(p.cell))return fail('Escolha um encaixe do casco.');const layout=[...y.layout,{p:part.id,c:p.cell}];if(!occupancy(layout))return fail('A peça não cabe aqui: precisa de '+part.w+'×'+part.h+' encaixes livres dentro do casco.');const why=limitsReason(layout);if(why)return fail(why);return {allowed:true,reason:'',cost:{}};}
 if(a==='yardRemove'){const map=occupancy(y.layout),i=map?.get(p.cell);if(i===undefined)return fail('Não há peça neste encaixe.');const layout=y.layout.filter((_,k)=>k!==i);const why=limitsReason(layout);if(why)return fail('Remover esta peça deixaria a nave fora dos limites: '+why);if(!storageOk(s,layout))return fail('Sem esta peça o armazém não comportaria seus módulos. Libere espaço antes.');return {allowed:true,reason:'',cost:{}};}
 if(a==='yardClear'){if(!y.layout.length)return fail('O casco já está sem peças.');if(!storageOk(s,[]))return fail('Sem as peças o armazém não comportaria seus módulos. Libere espaço antes.');return {allowed:true,reason:'',cost:{}};}
 if(a==='yardApply'){const layout=decode(p.code);if(!layout)return fail('Código de nave inválido.');const need={};for(const item of layout)need[item.p]=(need[item.p]||0)+1;const missing=Object.entries(need).filter(([id,n])=>(y.owned[id]||0)<n);if(missing.length)return fail('Faltam peças: '+missing.map(([id,n])=>(n-(y.owned[id]||0))+'× '+BY_ID[id].name).join(', ')+'.');const why=limitsReason(layout);if(why)return fail(why);if(!storageOk(s,layout))return fail('Com este modelo o armazém não comportaria seus módulos.');return {allowed:true,reason:'',cost:{},info:{layout}};}
}
function clamp(s){const c=E.stats(s);for(const [k,m]of [['fuel','maxFuel'],['oxygen','maxOxygen'],['hull','maxHull']])if(s.resources[k]>c[m])s.resources[k]=c[m];}
E.preview=(s,a,p)=>plan(s,a,p||{})||base.preview(s,a,p);
E.dispatch=(s,a,p={})=>{
 const own=plan(s,a,p||{});if(!own){const result=base.dispatch(s,a,p);ensure(s);return result;}if(!own.allowed)return {ok:false,message:own.reason};
 const y=ensure(s);let message='';
 if(a==='yardBuy'){s.resources.credits-=own.cost.credits;y.owned={...y.owned,[p.partId]:(y.owned[p.partId]||0)+1};message=BY_ID[p.partId].name+' guardada no hangar.';}
 if(a==='yardPlace'){y.layout=[...y.layout,{p:p.partId,c:p.cell}];message=BY_ID[p.partId].name+' montada.';}
 if(a==='yardRemove'){const i=occupancy(y.layout).get(p.cell),name=BY_ID[y.layout[i].p].name;y.layout=y.layout.filter((_,k)=>k!==i);message=name+' removida e guardada no hangar.';}
 if(a==='yardClear'){y.layout=[];message='Casco limpo: todas as peças voltaram ao hangar.';}
 if(a==='yardApply'){y.layout=own.info.layout;message='Modelo aplicado com peças do seu hangar.';}
 clamp(s);s.turn++;return {ok:true,message,reward:{},event:a,cost:own.cost};
};
E.yardView=s=>{const y=ensure(s),t=totals(y.layout),map=occupancy(y.layout)||new Map(),faction=stationFaction(s);
 return {cols:COLS,rows:ROWS,allowed:[...ALLOWED],layout:y.layout.map((item,i)=>({...item,part:BY_ID[item.p],cells:cellsOf(BY_ID[item.p],item.c),index:i})),occupied:[...map.keys()],
  mass:t.mass,frameMass:FRAME_MASS,lightMass:LIGHT_MASS,energyDraw:t.draw,energySupply:t.supply,penalty:t.penalty,effects:t.effects,code:encode(y.layout),
  faction,factions:FACTIONS,
  parts:PARTS.map(part=>({...part,factionName:FACTIONS[part.faction],owned:y.owned[part.id]||0,placed:placed(y,part.id),forSale:faction===FACTIONS[part.faction],buy:E.preview(s,'yardBuy',{partId:part.id})}))};};
E.yardCatalog={PARTS,COLS,ROWS,MASK,FACTIONS,decode,encode};
function valid(s){const y=s.yard;if(y===undefined)return true;
 if(!y||y.v!==1||!y.owned||typeof y.owned!=='object'||Array.isArray(y.owned)||!Array.isArray(y.layout)||y.layout.length>ALLOWED.size)return false;
 if(Object.entries(y.owned).some(([id,n])=>!Object.hasOwn(BY_ID,id)||!Number.isInteger(n)||n<0||n>6))return false;
 if(y.layout.some(item=>!item||!Object.hasOwn(BY_ID,item.p)||!Number.isInteger(item.c)))return false;
 if(!occupancy(y.layout)||!capacityOk(s,y.layout))return false;
 return PARTS.every(part=>placed(y,part.id)<=(y.owned[part.id]||0));}
E.validate=s=>base.validate(s)&&valid(s);
E.create=(...args)=>{const s=base.create(...args);s.yard=fresh();return s;};
E.restore=saved=>{const s=base.restore(saved);if(!s)return null;if(s.yard===undefined)s.yard=fresh();return valid(s)&&base.validate(s)?s:null;};
})(typeof window==='object'?window:globalThis);
