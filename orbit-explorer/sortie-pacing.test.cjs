const assert=require('node:assert/strict'),E=require('./engine.js'),H=require('./expedition-test-helper.cjs');
const s=E.create(42),planet=E.currentPlanet(s),initial={...s.resources};
assert(!E.preview(s,'explore',{siteId:planet.sites[0].id}).allowed,'analysis still required');
H.checkedAct(s,'scan');for(const site of planet.sites.slice(0,2)){assert(E.preview(s,'explore',{siteId:site.id}).allowed);H.checkedAct(s,'explore',{siteId:site.id});assert.equal(s.location.mode,'docked');H.finish(s);}
assert.equal(initial.fuel-s.resources.fuel,24);assert(s.resources.oxygen<35);const before=E.serialize(s);assert(!E.dispatch(s,'explore',{siteId:planet.sites[2].id}).ok);assert.equal(E.serialize(s),before);
H.checkedAct(s,'refillOxygen');assert(E.preview(s,'explore',{siteId:planet.sites[2].id}).allowed);
const station=E.create(42);H.checkedAct(station,'scan');H.checkedAct(station,'stationDock');assert(!E.preview(station,'explore').allowed);
console.log('PASS orbital deployment, two sorties require resupply before third, failed departure atomic, station gate');
const normal=E.create('collection-choice');H.start(normal);H.walk(normal,{x:1,y:4});const deep=E.restore(E.snapshot(normal));const a=E.preview(normal,'expeditionCollect'),b=E.preview(deep,'expeditionCollect',{intensive:true});assert.equal(b.cost.reserve,a.cost.reserve+3);const integrity=deep.expedition.integrity;H.checkedAct(normal,'expeditionCollect');H.checkedAct(deep,'expeditionCollect',{intensive:true});assert(deep.expedition.pending.ore>normal.expedition.pending.ore);assert.equal(deep.expedition.integrity,integrity-1);assert(E.restore(E.snapshot(deep)));H.rejectUnchanged(deep,'expeditionCollect',{intensive:true});console.log('PASS intensive extraction pays energy/integrity, yields more, persists, cannot repeat');
