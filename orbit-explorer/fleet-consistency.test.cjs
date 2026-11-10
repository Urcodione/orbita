const assert=require('node:assert/strict');
global.OrbitEngine=require('./engine');
for(const f of ['economy','campaign','campaign-events','campaign-guidance','tutorial','storage','voyage','xenobiology','ships','civilizations','civilization-activities','aural-garden','civilization-services','explorer-record'])require('./'+f);
const E=OrbitEngine,H=require('./expedition-test-helper.cjs');
for(const ship of E.fleetCatalog.SHIPS){
 const s=E.create('audit-hop');H.checkedAct(s,'guideSkip');s.fleet.owned=E.fleetCatalog.SHIPS.map(x=>x.id);s.fleet.active=ship.id;
 s.resources.fuel=E.stats(s).maxFuel;s.resources.oxygen=E.stats(s).maxOxygen;
 for(const p of s.galaxy.planets.filter(p=>p.id!==s.location.planetId)){
  const q=E.preview(s,'travel',{planetId:p.id});if(!q.allowed)continue;
  const v=E.voyagePlan(s,p.id);assert.equal(v.fuel,q.cost.fuel||0);assert.equal(v.oxygen,q.cost.oxygen||0);
 }
 if(ship.id==='beija-flor'){s.resources.fuel=0;assert(s.galaxy.planets.some(p=>p.id!==s.location.planetId&&E.preview(s,'travel',{planetId:p.id}).allowed));H.rejectUnchanged(s,'rescue');}
}
for(const ship of ['pelicano','andorinha'])for(const native of [false,true]){
 let s=E.create('audit-salvage');H.checkedAct(s,'guideSkip');s.fleet.owned=['andorinha','pelicano'];s.fleet.active=ship;H.start(s);
 const cell=H.revealedBoard(s).find(c=>['ore','data','crystal'].includes(c.kind)&&!!E.materials[E.collectionResource(s,c)]?.category===native&&H.route(s,c));assert(cell);
 H.walk(s,cell);H.checkedAct(s,'expeditionCollect');const pending={...s.expedition.pending},site=s.expedition.siteId,index=cell.y*6+cell.x,before={...s.resources};
 const result=H.checkedAct(s,'expeditionAbort');
 for(const [key,n]of Object.entries(pending)){const expected=ship==='pelicano'?Math.floor(n/2):0;assert.equal(result.reward[key]||0,expected);assert.equal((s.resources[key]||0)-(before[key]||0),expected);}
 assert.equal(!!s.siteCaches[site]?.includes(index),ship==='pelicano');
 s=E.restore(E.snapshot(s));assert(s);s.resources.fuel=E.stats(s).maxFuel;s.resources.oxygen=E.stats(s).maxOxygen;H.start(s,site);
 assert.equal(s.expedition.collected.includes(index),ship==='pelicano');
}
// Return via the actual campaign action: the merchant must stay in the old galaxy.
const s=E.restore(require('./qa/campaign-complete-fixture.json'));assert(s);const f=s.campaign.frontier;
s.galaxy=E.generateGalaxy(s.seed,s.galaxyIndex,f.kind);
for(const [i,scan,bits]of f.survey){const p=s.galaxy.planets[i];p.scanned=!!scan;p.sites.forEach((t,k)=>t.explored=!!(bits&1<<k));}
s.siteCaches=f.caches;s.siteOperations=f.operations;s.campaign.atHome=false;delete s.campaign.frontier;s.location={mode:'orbit',planetId:s.galaxy.planets[0].id};
for(const id of Object.keys(s.resources))if(E.materials[id]?.category||['ore','crystals'].includes(id))s.resources[id]=0;s.components={};
s.resources.fuel=E.stats(s).maxFuel;s.resources.oxygen=E.stats(s).maxOxygen;assert(E.validate(s));
H.checkedAct(s,'stationDock');const prior=s.fleet.rolled;H.checkedAct(s,'campaignReturnHome');assert.equal(s.fleet.offer,null);
H.checkedAct(s,'stationDock');assert.notEqual(s.fleet.rolled,prior);assert(s.fleet.rolled.startsWith('0:'));
const offer=JSON.stringify(s.fleet.offer);H.checkedAct(s,'stationLeave');H.checkedAct(s,'stationDock');assert.equal(JSON.stringify(s.fleet.offer),offer);assert(E.restore(E.snapshot(s)));
console.log('PASS all fleet travel estimates, Beija-flor rescue, native/base salvage, persistent depleted deposits, ordinary evacuation, campaign merchant return');
