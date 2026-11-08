(function(root){
'use strict';
const E=root.OrbitEngine,base={preview:E.preview,dispatch:E.dispatch,validate:E.validate,restore:E.restore,safety:E.expeditionSafety};
const fail=reason=>({allowed:false,reason,cost:{}}),hash=s=>[...s].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);
function contracts(s){
 const system=E.currentSystem(s),local=s.galaxy.planets.filter(p=>p.systemId===system.id),biomes=new Set(s.galaxy.planets.map(p=>p.biome));
 const available=(id,p)=>E.materials[id].category?E.deposits(p).includes(id):['ore','crystals'].includes(id);
 const all=Object.entries(E.materials).filter(([id])=>!['fuel','oxygen'].includes(id));
 // Preserve completed slots and valid existing orders; replace only impossible unpaid requests.
 let legacy=all.filter(([id,m])=>m.biomes?.some(b=>biomes.has(b))&&!m.biomes.some(b=>local.some(p=>p.biome===b)));
 if(legacy.length<2)legacy=all.filter(([id,m])=>m.biomes?.some(b=>biomes.has(b)));
 const viable=all.filter(([id])=>s.galaxy.planets.some(p=>available(id,p))),imports=viable.filter(([id])=>!local.some(p=>available(id,p))),pool=imports.length>=2?imports:viable;
 const start=hash(system.id)%legacy.length,chosen=[0,1].map(i=>legacy[(start+i)%legacy.length]);
 const ids=[0,1].map(i=>(s.campaign?.atHome?0:s.galaxyIndex)+':'+system.id+':'+i);
 for(let i=0;i<2;i++)if(!(s.charters||[]).includes(ids[i])&&!s.galaxy.planets.some(p=>available(chosen[i][0],p))){const options=pool.filter(([id])=>id!==chosen[1-i][0]);chosen[i]=options[hash(ids[i])%options.length];}
 return chosen.map(([resource,m],i)=>{const quantity=m.rarity==='Rara'?1:3,id=ids[i],paid=(s.charters||[]).includes(id),reward=Math.round(m.base*quantity*.9)+24;
 const sources=s.galaxy.planets.filter(p=>available(resource,p));
 return {id,resource,name:m.name,quantity,reward,paid,owned:s.resources[resource]||0,source:[...new Set(sources.map(p=>p.biome))].join(', ')||m.biomes.join(', '),progress:Math.min(quantity,s.resources[resource]||0),title:i?'Amostras para pesquisa':'Abastecimento regional'};});
}
function taskView(s){const e=s.expedition,t=e?.fieldTask;if(!t)return null;return {...t,done:t.kind==='relay'?t.values.every((v,i)=>v===t.target[i]):t.step===3,title:t.kind==='relay'?'Estabilizar a instalação':t.kind==='observe'?'Observar sem capturar':'Preservar a amostra'};}
function taskPlan(s,a,p={}){const e=s.expedition,t=taskView(s),atCore=E.expeditionCellKind(s)==='core';if(!t||!e.puzzle||!atCore||e.coreRecovered||t.done)return fail('Alcance o sinal e abra a operação.');if(!Number.isInteger(p.index)||p.index<0||p.index>2)return fail('Escolha uma operação válida.');if(e.turns>=9999)return fail('Extraia ou retorne à nave para encerrar esta saída.');if(t.kind==='relay'&&(t.values[p.index]===0||t.values[(p.index+1)%3]===4))return fail('Não há volume disponível para esta transferência.');return {allowed:true,cost:{},wrong:t.kind!=='relay'&&p.index!==t.target[t.step]};}
E.contracts=contracts;E.fieldTaskView=taskView;
E.campaignBenefit=s=>['Scanner com maior alcance e mais pesquisa por sinal.','Mais autonomia de oxigênio e filtragem para ambientes tóxicos.','Coleta mais eficiente e suporte à operação atmosférica.','Mais capacidade de carga e equipamento para submersão.','Proteção para calor e radiação extremos.','Mais alcance com o mesmo combustível.','Reserva extra de energia e integridade nas expedições.','Dobra mais eficiente e a oitava assinatura dimensional.'][Math.min(s.campaign?.chapter||0,7)];
E.cosmeticHonors=s=>[{name:'Ultravioleta / Coro cósmico',earned:!!(s.campaign?.crafted&1),why:'Construir Olho do Antes'},{name:'Boreal / Véu boreal',earned:!!(s.campaign?.crafted&2),why:'Construir Jardim da Véspera'},{name:'Nova rosa / Nova',earned:!!(s.campaign?.crafted&16),why:'Construir Manto do Sopro Violeta'}];
E.voyagePlan=(s,id)=>{const p=s.galaxy.planets.find(p=>p.id===id);if(!p)return null;const trip=E.preview(s,'travel',{planetId:id}),surface=E.assess(s,id),space=E.storageView(s),travelFuel=E.travelCost(s,id),travelOxygen=p.systemId===E.currentSystem(s).id?3:6,
  // Docked at a station the trip starts by undocking, which is charged too.
  leave=s.location.stationId?(E.preview(s,'stationLeave').cost||{}):{},fuel=travelFuel+(leave.fuel||0),oxygen=travelOxygen+(leave.oxygen||0);return {trip,surface,space,fuel,oxygen,afterFuel:s.resources.fuel-fuel,afterOxygen:s.resources.oxygen-oxygen,returnFuelEstimate:travelFuel,returnOxygenEstimate:travelOxygen};};
E.preview=(s,a,p={})=>{
 if(a==='contractDeliver'){if(s.expedition||s.location.mode!=='orbit'||s.location.stationId!==E.currentSystem(s).id)return fail('Atraque no entreposto para entregar a encomenda.');const q=contracts(s).find(c=>c.id===p.contractId);if(!q||q.paid)return fail('Contrato inexistente ou já entregue.');if((s.charters||[]).length>=4096)return fail('Registro de contratos completo.');if(q.owned<q.quantity)return fail('Faltam '+(q.quantity-q.owned)+' unidades de '+q.name+'.');if(s.resources.credits+q.reward>99999)return fail('Saldo máximo atingido.');return {allowed:true,cost:{[q.resource]:q.quantity},contract:q};}
 if(a==='expeditionTask')return taskPlan(s,a,p);
 if(taskView(s)&&['expeditionTune','expeditionRecover'].includes(a)){if(a==='expeditionTune'||!taskView(s).done)return fail('Conclua a operação deste local antes de recuperar o núcleo.');}
 return base.preview(s,a,p);
};
E.dispatch=(s,a,p={})=>{
 const q=E.preview(s,a,p);if(!q.allowed)return {ok:false,message:q.reason};
 if(a==='contractDeliver'){const c=q.contract;s.resources[c.resource]-=c.quantity;s.resources.credits+=c.reward;s.charters=[...(s.charters||[]),c.id];s.turn++;return {ok:true,message:c.name+' entregue · +'+c.reward+' Lumes. Este contrato foi concluído.',reward:{credits:c.reward}};}
 if(a==='expeditionTask'){const t=s.expedition.fieldTask;if(t.kind==='relay'){const other=(p.index+1)%3;if(t.values[p.index]>0&&t.values[other]<4){t.values[p.index]--;t.values[other]++;}}else if(q.wrong)t.step=0;else t.step++;if(taskView(s).done)s.expedition.puzzle.dials=[...s.expedition.puzzle.target];s.expedition.turns++;s.turn++;E.checkpointSite(s);return {ok:true,message:taskView(s).done?'Operação concluída. Recupere o núcleo e extraia a carga.':q.wrong?'O sinal se dispersou. Observe a sequência e tente novamente.':'Resposta registrada.',reward:{}};}
 const honorsBefore=E.cosmeticHonors(s).filter(h=>h.earned).map(h=>h.name);const result=base.dispatch(s,a,p);if(result.ok&&a==='campaignCraft'){result.reward=result.reward||{};result.reward.cosmeticHonors=E.cosmeticHonors(s).filter(h=>h.earned&&!honorsBefore.includes(h.name)).map(h=>h.name);}
 if(result.ok&&a==='explore'&&!s.expedition.fieldTask&&!s.expedition.coreSecured&&!s.guide?.active&&!s.expedition.firstExpedition&&!E.encounterView(s)){
  const e=s.expedition,biome=E.currentPlanet(s).biome,kind=['forest','ocean'].includes(biome)?'observe':['ice','gas','toxic'].includes(biome)?'sample':'relay';
  if(e.seed%3!==0){const target=kind==='relay'?[2,2,2]:[e.seed%3,(e.seed>>>3)%3,(e.seed>>>5)%3];e.fieldTask={kind,target,step:0,values:[4,1,1]};}
 }
 if(result.ok)E.checkpointSite(s);
 return result;
};
E.validate=s=>base.validate(s)&&(!s.charters||(Array.isArray(s.charters)&&s.charters.length<=4096&&new Set(s.charters).size===s.charters.length&&s.charters.every(x=>typeof x==='string'&&x.length<100)))&&(!s.expedition?.fieldTask||(()=>{const t=s.expedition.fieldTask;return ['relay','observe','sample'].includes(t.kind)&&Number.isInteger(t.step)&&t.step>=0&&t.step<=3&&['target','values'].every(k=>Array.isArray(t[k])&&t[k].length===3&&t[k].every(n=>Number.isInteger(n)&&n>=0&&n<=4))&&(t.kind==='relay'?t.target.every(n=>n===2)&&t.values.reduce((a,b)=>a+b,0)===6:t.target.every(n=>n<=2));})());
E.restore=saved=>{const s=base.restore(saved);return s&&E.validate(s)?s:null;};
})(typeof window==='object'?window:globalThis);
