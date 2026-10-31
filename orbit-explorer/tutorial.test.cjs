'use strict';
const assert=require('node:assert/strict');
global.OrbitEngine=require('./engine.js');require('./economy.js');require('./campaign.js');require('./tutorial.js');
const E=global.OrbitEngine,H=require('./expedition-test-helper.cjs');
function roundTrip(state,label){
 const saved=E.snapshot(state);
 for(const input of [saved,JSON.stringify(saved)]){
  const restored=E.restore(input);assert(restored,label+' restores');
  assert.deepEqual(restored.guide,state.guide,label+' keeps tutorial progress');
  assert.deepEqual(restored.expedition,state.expedition,label+' keeps the expedition');
  assert.deepEqual(restored.resources,state.resources,label+' keeps resources');
  assert.deepEqual(restored.inventory,state.inventory,label+' keeps recovered modules');
  assert.notEqual(restored.guide,state.guide,label+' does not alias the live tutorial');
 }
 return E.restore(JSON.stringify(saved));
}
for(const seed of [7,123,9001]){
 let s=E.create(seed);s.guide.v=1;assert(s.guide.active);assert(!E.dispatch(s,'warp').ok);s=roundTrip(s,'fresh tutorial');H.checkedAct(s,'guideStart');s=roundTrip(s,'started tutorial');H.start(s,'g0-p0-s0');assert.equal(s.expedition.reserve,48);
 H.walk(s,{x:1,y:4});H.checkedAct(s,'expeditionCollect');H.walk(s,{x:4,y:1});H.checkedAct(s,'expeditionCollect');
 s=roundTrip(s,'collected training resources');assert(s.guide.active,'training progress persists');
 H.walk(s,{x:3,y:0});H.solve(s);H.checkedAct(s,'expeditionRecover');H.walk(s,{x:2,y:5});assert(s.expedition.reserve>0);
 s=roundTrip(s,'pending training module');
 const result=H.checkedAct(s,'expeditionExtract');assert(result.reward.module);assert(result.reward.ore>0&&result.reward.crystals>0);assert(s.guide.extracted);
 s=roundTrip(s,'extracted training module');assert.equal(s.guide.moduleId,result.reward.module.id);
 H.checkedAct(s,'equip',{moduleId:result.reward.module.id});assert(!s.guide.active);roundTrip(s,'finished tutorial');
}
const s=E.create(55);H.checkedAct(s,'guideSkip');assert(!s.guide.active);roundTrip(s,'skipped tutorial');
for(const invalidGuide of [null,false,0,{}, {...s.guide,active:'false'},{...s.guide,moduleId:5}]){
 const saved={...E.snapshot(s),guide:invalidGuide};
 for(const input of [saved,JSON.stringify(saved)])assert.equal(E.restore(input),null,'malformed tutorial is rejected');
}
for(const scanned of [false,true]){
 const legacy=E.create(88);if(scanned)H.checkedAct(legacy,'scan');
 const saved=E.snapshot(legacy);delete saved.guide;
 for(const input of [saved,JSON.stringify(saved)]){
  const restored=E.restore(input);assert(restored,'legacy save restores');
  assert.equal(restored.guide.active,!scanned,'only a fresh legacy save starts guidance');
 }
}
assert.equal(E.restore('{bad json'),null);
console.log('PASS guided ore/crystal/module/return route across three seeds; object/JSON save restoration at every milestone, skipped/completed guide, legacy migration and malformed-guide rejection.');
