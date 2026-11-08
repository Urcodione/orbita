(function(root){
'use strict';
const E=root.OrbitEngine,basePreview=E.preview,baseDispatch=E.dispatch,baseQuote=E.tradeQuote;
const excluded=new Set(['credits','data','fuel','oxygen','hull','warpFuel']);
const physical=id=>!excluded.has(id)&&(id==='ore'||id==='crystals'||!!E.materials?.[id]);
function componentVolume(id,seen=new Set()){
 if(seen.has(id))throw Error('Receita circular');
 const r=E.componentRecipes.find(r=>r.id===id);if(!r)return 0;
 const next=new Set(seen);next.add(id);
 return Math.max(1,Object.entries(r.cost||{}).reduce((n,[k,v])=>n+(physical(k)?v:0),0)+Object.entries(r.components||{}).reduce((n,[k,v])=>n+v*componentVolume(k,next),0));
}
function moduleVolume(m){
 const r=[...(E.recipes||[]),...(E.campaignRecipes||[])].find(r=>r.id===m.recipeId);
 return Math.max(8,r?Object.entries(r.cost||{}).reduce((n,[k,v])=>n+(physical(k)?v:0),0)+Object.entries(r.components||{}).reduce((n,[k,v])=>n+v*componentVolume(k),0):8);
}
function view(s){
 const raw=Object.entries(s.resources).reduce((n,[k,v])=>n+(physical(k)?v:0),0);
 const parts=Object.entries(s.components||{}).reduce((n,[k,v])=>n+v*componentVolume(k),0);
 const modules=s.inventory.reduce((n,m)=>n+moduleVolume(m),0);
 const capacity=E.stats(s).cargoCapacity*25,used=raw+parts+modules;
 return {raw,parts,modules,used,capacity,free:Math.max(0,capacity-used),excess:Math.max(0,used-capacity)};
}
const deny=reason=>({allowed:false,reason,cost:{}});
function quote(s,p={},now){
 const q=baseQuote(s,p,now);if(!q.allowed||p.side!=='buy'||!physical(p.resource))return q;
 const v=view(s);return p.quantity>v.free?deny('Depósito sem espaço: '+v.free+' livres; compra ocupa '+p.quantity+'.'):q;
}
function check(s,a,p={}){
 if(a==='discardCargo'){
  const valid=p.kind==='component'?E.componentRecipes.some(r=>r.id===p.id):p.kind==='resource'&&physical(p.id);
  const owned=(p.kind==='component'?s.components?.[p.id]:s.resources[p.id])||0;
  if(s.expedition)return deny('Extraia a carga antes de organizar o depósito.');
  if(!valid||!Number.isInteger(p.amount)||p.amount<1||p.amount>owned)return deny('Escolha uma quantidade disponível para descartar.');
  return {allowed:true,cost:{}};
 }
 if(a==='trade')return quote(s,p);
 const result=basePreview(s,a,p);if(!result.allowed)return result;
 if(!['craftComponent','fabricate','campaignCraft','explore','travel','warp','campaignCross','campaignReturnHome','equip'].includes(a))return result;
 const v=view(s);
 if(['craftComponent','fabricate','campaignCraft'].includes(a)){
  const r=(a==='craftComponent'?E.componentRecipes:E.recipes).find(r=>r.id===(p.componentId||p.recipeId));
  if(r){
   const amount=a==='craftComponent'?(p.amount||1):1;
   const consumed=Object.entries(r.cost||{}).reduce((n,[k,q])=>n+(physical(k)?q:0),0)+Object.entries(r.components||{}).reduce((n,[k,q])=>n+q*componentVolume(k),0);
   const produced=a==='craftComponent'?componentVolume(r.id):moduleVolume({recipeId:r.id});
   if((produced-consumed)*amount>v.free)return deny('A montagem precisa de mais '+((produced-consumed)*amount)+' unidades livres no depósito.');
  }
 }
 if(a==='explore'&&!v.free)return deny('Depósito cheio. Libere espaço antes de iniciar outra expedição.');

 if(['explore','travel','warp','campaignCross','campaignReturnHome'].includes(a)&&v.excess)return deny('Depósito sobrecarregado em '+v.excess+' unidades. Venda, use ou descarte carga, ou instale um depósito maior.');
 if(a==='equip'){
  const m=s.inventory.find(m=>m.id===p.moduleId);
  if(m){
   const next={...s,equipped:{...s.equipped,[m.type]:m},inventory:[...s.inventory.filter(x=>x.id!==m.id),s.equipped[m.type]]},after=view(next);
   if(after.excess>v.excess)return deny('A troca deixaria '+after.excess+' unidades excedentes no depósito. Libere carga para guardar o módulo retirado.');
  }
 }
 return result;
}
E.storageView=view;E.componentVolume=componentVolume;E.moduleVolume=moduleVolume;
const compare=E.compareModule;
E.compareModule=(s,id,planet)=>{
 const c=compare(s,id,planet),m=s.inventory.find(m=>m.id===id);
 if(m?.type==='cargo'){
  c.rows.push({key:'storageVolume',label:'Volume do depósito',unit:'',before:view(s).capacity,after:view({...s,equipped:{...s.equipped,cargo:m}}).capacity,better:E.stats({...s,equipped:{...s.equipped,cargo:m}}).cargoCapacity>E.stats(s).cargoCapacity?'up':E.stats({...s,equipped:{...s.equipped,cargo:m}}).cargoCapacity<E.stats(s).cargoCapacity?'down':'neutral'});
 }
 if(m){const p=check(s,'equip',{moduleId:id});c.allowed=p.allowed;c.reason=p.reason;}
 return c;
};
E.tradeQuote=quote;E.preview=check;
E.dispatch=(s,a,p={})=>{
 const c=check(s,a,p);if(!c.allowed)return {ok:false,message:c.reason};
 if(a==='discardCargo'){
  const target=p.kind==='component'?s.components:s.resources;target[p.id]-=p.amount;s.turn++;
  return {ok:true,message:'Carga descartada: '+p.amount+' unidade(s).',reward:{}};
 }
 const result=baseDispatch(s,a,p);
 if(result.ok){const excess=view(s).excess;if(excess)result.message+=' Depósito sobrecarregado: '+excess+' unidades. Libere espaço antes de viajar.';}
 return result;
};
})(typeof window==='object'?window:globalThis);
