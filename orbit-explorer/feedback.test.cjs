'use strict';
const assert=require('node:assert/strict');
global.OrbitEngine=require('./engine.js');require('./economy.js');require('./campaign.js');require('./campaign-guidance.js');
const E=OrbitEngine,H=require('./expedition-test-helper.cjs'),act=H.checkedAct;
let s=E.create(1234);act(s,'campaignIntro');H.start(s,'g0-p0-s0');
const cost=E.explorationCost(s,'g0-p0-s0');assert(cost.fuel>0);
for(let i=0;i<5;i++){
 const fuel=s.resources.fuel;act(s,'expeditionAbort');assert.equal(s.resources.fuel,fuel,'evacuation never refunds launch cost');
 act(s,'refillOxygen');assert.equal(s.resources.fuel,fuel,'free breathing-world oxygen does not replenish fuel');
 s=E.restore(JSON.stringify(E.snapshot(s)));assert(s);
 act(s,'explore',{siteId:'g0-p0-s0'});assert.equal(s.resources.fuel,fuel-cost.fuel,'every re-entry pays even after reload');
}
act(s,'expeditionAbort');s.resources.fuel=cost.fuel-1;const before=JSON.stringify(s);assert(!E.dispatch(s,'explore',{siteId:'g0-p0-s0'}).ok);assert.equal(JSON.stringify(s),before,'insufficient-fuel departure is atomic');
// Partial gas sorties must not grant the core completion bonus on every cache run.
s=E.create(1234);for(const m of Object.values(s.equipped)){m.power=4;m.capabilities={heat:10000,cold:10000,radiation:10000,pressure:10000,toxicity:100,gas:true,liquid:true};m.effects={expeditionReserve:10,expeditionIntegrity:6};}
const gas=s.galaxy.planets.find(p=>p.biome==='gas');assert(gas);s.location={planetId:gas.id,mode:'orbit'};Object.assign(s.resources,{fuel:80,oxygen:E.stats(s).maxOxygen,hull:E.stats(s).maxHull});
H.start(s,gas.sites[0].id);const fuel=s.resources.fuel;H.walk(s,H.revealedBoard(s).find(c=>c.kind==='ore'&&H.route(s,c)));act(s,'expeditionCollect');H.walk(s,E.expeditionView(s).base);let reward=act(s,'expeditionExtract');assert(!reward.reward.fuel);assert.equal(s.resources.fuel,fuel);
act(s,'explore',{siteId:gas.sites[0].id});reward=H.finish(s);assert(reward.reward.fuel>0,'completed atmospheric core still rewards fuel');act(s,'explore',{siteId:gas.sites[0].id});assert.equal(E.expeditionView(s).core,null);H.walk(s,H.revealedBoard(s).find(c=>['ore','data','crystal'].includes(c.kind)&&!c.collected&&H.route(s,c)));act(s,'expeditionCollect');H.walk(s,{x:2,y:5});const revisitFuel=s.resources.fuel;reward=act(s,'expeditionExtract');assert(!reward.reward.fuel,'resource-only revisit cannot mint fuel again');assert.equal(s.resources.fuel,revisitFuel);
// The guide points only inside the current galaxy and never modifies progress.
s=E.create(1234);const snapshot=JSON.stringify(s),lead=E.campaignLead(s);assert.equal(JSON.stringify(s),snapshot);assert(s.galaxy.planets.some(p=>p.id===lead.planetId));assert(lead.unlock);assert.equal(lead.completed,0);
const initial=E.campaignView(s);H.start(s,'g0-p0-s0');H.walk(s,{x:1,y:4});act(s,'expeditionCollect');H.walk(s,{x:2,y:5});reward=act(s,'expeditionExtract');assert.equal(E.campaignDebrief(initial,s,reward.reward).advanced,false);
H.start(s,'g0-p0-s0');reward=H.finish(s);let story=E.campaignDebrief(initial,s,reward.reward);assert(story.advanced);assert.equal(story.sites,1);assert.match(story.message,/Íris|Aurora/);assert.equal(E.campaignView(s).active.sitesDone,1);
const resumed=E.restore(E.snapshot(s));assert.deepEqual(E.campaignLead(resumed),E.campaignLead(s),'progress and next lead survive restart');
s.campaign.start=1;s.campaign.sites=[];s.campaign.target=null;const distant=E.campaignLead(s);assert.equal(distant.planetId,null);assert.equal(distant.action,'campaign-route');assert.match(distant.detail,/outra galáxia/);
console.log('PASS paid repeat/abort/reload, atomic fuel block, no partial-gas completion bonus, unique gas reward, saved campaign leads and real narrative progress.');
// A completed core quota must not send the player to irrelevant, easier repeats.
{
 const game=E.create(1234),view=E.campaignView(game),target=game.galaxy.planets.flatMap(p=>p.sites.map(t=>({p,t}))).find(x=>x.t.id===view.active.targetSiteId);
 const originalView=E.campaignView,originalAssess=E.assess;
 let evaluations=0;
 try {
  E.campaignView=()=>({...view,active:{...view.active,sitesDone:view.active.sitesRequired,itemOwned:false}});
  E.assess=(state,pid,sid)=>{evaluations++;return {allowed:sid!==target.t.id,missing:sid===target.t.id?[{label:'Blindagem térmica'}]:[]};};
  const lead=E.campaignLead(game);
  assert.equal(lead.siteId,target.t.id,'the unique signal remains the destination when more ordinary cores are unnecessary');
  assert.match(lead.detail,/Blindagem térmica/);
  assert.equal(evaluations,1,'each destination assessment is reused within the same guidance calculation');
 } finally {E.campaignView=originalView;E.assess=originalAssess;}
}
console.log('PASS blocked unique milestone stays actionable and assessments are reused.');
{
 const game=E.create(1234),view=E.campaignView(game),first=game.galaxy.planets[0];
 game.campaign.sites=[first.sites[0].id];
 const originalView=E.campaignView,originalAssess=E.assess;
 try {
  E.campaignView=()=>({...view,active:{...view.active,sitesDone:view.active.sitesRequired,itemOwned:true,systemsRequired:2}});
  E.assess=(state,pid)=>({allowed:game.galaxy.planets.find(p=>p.id===pid).systemId===first.systemId,missing:[{label:'Proteção radioativa'}]});
  const lead=E.campaignLead(game),destination=game.galaxy.planets.find(p=>p.id===lead.planetId);
  assert.notEqual(destination.systemId,first.systemId,'missing system quota must point beyond the already documented system');
  assert.match(lead.detail,/Proteção radioativa/);
 } finally {E.campaignView=originalView;E.assess=originalAssess;}
}
console.log('PASS missing system milestone cannot be replaced by redundant local cores.');
