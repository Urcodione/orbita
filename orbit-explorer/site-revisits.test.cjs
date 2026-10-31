const assert=require('node:assert/strict'),E=require('./engine.js'),H=require('./expedition-test-helper.cjs'),id='g0-p0-s0';
const act=H.checkedAct;
const s=E.create('finite-return');H.start(s,id);
H.walk(s,{x:1,y:4});act(s,'expeditionCollect');H.walk(s,{x:2,y:5});act(s,'expeditionExtract');
assert.equal(E.siteStatus(s,id).remaining,3);assert.equal(s.progress.explorations,0);
const fuel=s.resources.fuel;H.start(s,id);assert(s.resources.fuel<fuel);assert.equal(s.expedition.collected.length,1);
H.finish(s);assert.equal(E.siteStatus(s,id).coreSecured,true);assert.equal(s.progress.explorations,1);
let saved=E.restore(E.snapshot(s));assert(saved);const modules=saved.inventory.length;
assert(E.siteOperation(saved,id).triggered);act(saved,'stabilizeSite',{siteId:id});
for(let n=0;n<3;n++){
 saved.resources.fuel=E.stats(saved).maxFuel;saved.resources.oxygen=E.stats(saved).maxOxygen;
 H.start(saved,id);assert.equal(saved.expedition.coreSecured,true);assert.equal(E.expeditionView(saved).core,null);assert(E.restore(E.snapshot(saved)));
 const board=H.revealedBoard(saved),target=board.find(c=>['ore','crystal','data'].includes(c.kind)&&!c.collected);
 H.walk(saved,target);act(saved,'expeditionCollect');H.walk(saved,{x:2,y:5});act(saved,'expeditionExtract');assert.equal(saved.progress.explorations,1);assert.equal(saved.inventory.length,modules);
}
assert.equal(E.siteStatus(saved,id).percent,100);assert.equal(E.preview(saved,'explore',{siteId:id}).allowed,false);
const forged=E.restore(E.snapshot(s));act(forged,'refillOxygen');H.start(forged,id);forged.expedition.coreSecured=false;assert.equal(E.restore(E.snapshot(forged)),null);
const aborted=E.create('return-abort');H.start(aborted,id);H.walk(aborted,{x:1,y:4});act(aborted,'expeditionCollect');act(aborted,'expeditionAbort');assert.equal(E.siteStatus(aborted,id).remaining,4);assert.equal(aborted.progress.explorations,0);
console.log('PASS partial extraction, paid reentry, technology once, resource-only return, save restoration, finite depletion, forged state rejected, evacuation loses cargo.');
