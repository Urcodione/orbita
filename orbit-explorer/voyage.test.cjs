const assert=require('node:assert/strict');global.OrbitEngine=require('./engine.js');for(const f of ['economy','campaign','campaign-events','campaign-guidance','storage','voyage'])require('./'+f+'.js');const E=OrbitEngine;
const s=E.create('voyage');s.guide=undefined;assert(E.dispatch(s,'stationDock').ok);const cs=E.contracts(s);assert.equal(cs.length,2);const c=cs[0];s.resources[c.resource]=c.quantity;const credits=s.resources.credits;assert(E.dispatch(s,'contractDeliver',{contractId:c.id}).ok);assert.equal(s.resources.credits,credits+c.reward);assert.equal(s.resources[c.resource],0);assert(!E.dispatch(s,'contractDeliver',{contractId:c.id}).ok);let restored=E.restore(E.snapshot(s));assert(restored);assert(E.contracts(restored)[0].paid);assert.equal(E.cosmeticHonors(s).filter(x=>x.earned).length,0);s.campaign.crafted=1;assert(E.cosmeticHonors(s)[0].earned);s.campaign.crafted=0;
assert(E.dispatch(s,'stationLeave').ok);
const p=E.voyagePlan(s,s.galaxy.planets[1].id);assert.equal(p.afterFuel,s.resources.fuel-p.fuel);
const H=require('./expedition-test-helper.cjs');
for(const kind of ['relay','observe','sample']){
 const q=E.create('task-'+kind);q.guide=undefined;H.start(q);const ex=E.expeditionView(q),core=H.revealedBoard(q).find(x=>x.kind==='core');H.walk(q,core);assert(E.dispatch(q,'expeditionInteract').ok);q.expedition.fieldTask={kind,target:kind==='relay'?[2,2,2]:[2,0,1],values:[4,1,1],step:0};assert(!E.preview(q,'expeditionRecover').allowed);assert(!E.dispatch(q,'expeditionTask',{index:9}).ok);
 if(kind==='relay')for(const index of [0,0,1])assert(E.dispatch(q,'expeditionTask',{index}).ok);else{assert(E.dispatch(q,'expeditionTask',{index:0}).ok);assert.equal(q.expedition.fieldTask.step,0);for(const index of [2,0,1])assert(E.dispatch(q,'expeditionTask',{index}).ok);}
 assert(E.fieldTaskView(q).done);assert(E.restore(E.snapshot(q)));assert(E.dispatch(q,'expeditionRecover').ok);assert(!E.dispatch(q,'expeditionTask',{index:0}).ok);
}
console.log('PASS contracts consume stock, pay once, survive restore; three operations, invalid choices, recovery gate, progress persistence; honors and travel summary.');
