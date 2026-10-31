'use strict';
const assert=require('node:assert/strict');
global.OrbitEngine=require('./engine.js');require('./economy.js');require('./campaign.js');require('./tutorial.js');
const E=global.OrbitEngine,H=require('./expedition-test-helper.cjs');

// Seed 0's forge lacks an ice world; chapter four converts a gas world deterministically.
const fixture=E.create(0);H.checkedAct(fixture,'guideSkip');
fixture.galaxyIndex=3;fixture.visitedGalaxies=4;
fixture.galaxy=E.generateGalaxy(fixture.seed,3,'forge');
fixture.location.planetId=fixture.galaxy.planets[0].id;
fixture.surveyArchive={entries:[],earlier:[0,0,0,0,0,0],unavailable:3};
fixture.campaign={...fixture.campaign,start:0,chapter:3,crafted:7,claimed:7,found:7,sites:[],target:null};
for(const m of Object.values(fixture.equipped)){
  m.power=4;m.capabilities={heat:10000,cold:10000,radiation:10000,pressure:10000,toxicity:100,gas:true,liquid:true};
  m.effects={expeditionReserve:10,expeditionIntegrity:6};
}
for(const recipe of E.campaignRecipes.slice(0,3))fixture.equipped[recipe.type]={...recipe,id:'chorus-'+recipe.type,recipeId:recipe.id,origin:'campaign',favorite:true};
let state=E.restore(E.snapshot(fixture));assert(state);assert(state.campaign.worldOverride);
const original=E.generateGalaxy(state.seed,3,'forge').planets.find(p=>p.id===state.campaign.worldOverride);
assert.equal(original.biome,'gas');
Object.assign(state.resources,{fuel:E.stats(state).maxFuel,oxygen:E.stats(state).maxOxygen,hull:E.stats(state).maxHull,ore:900,crystals:900,data:9000,credits:9000,warpFuel:12});
const target=E.campaignView(state).active;
H.checkedAct(state,'travel',{planetId:target.targetPlanetId});H.start(state,target.targetSiteId);
state=E.restore(E.snapshot(state));assert(state,'pending ice expedition restores before recovering core');
assert.equal(E.currentPlanet(state).biome,'ice');
H.walk(state,E.expeditionView(state).core);H.solve(state);H.checkedAct(state,'expeditionRecover');
assert.equal(state.expedition.pending.fragment,'origin');
const before=JSON.stringify(state),saved=E.snapshot(state);
const restored=E.restore(saved);assert(restored,'pending ice core restores before extraction');
const restoredJSON=E.restore(JSON.stringify(saved));assert(restoredJSON,'pending ice core restores from serialized save');
assert.deepEqual(restoredJSON.expedition,state.expedition,'serialized pending cargo and route survive restart');
assert.equal(restoredJSON.guide.active,false,'serialized campaign does not restart skipped guidance');
assert.equal(JSON.stringify(state),before,'restore does not change the live voyage');
assert.deepEqual(restored.expedition,state.expedition,'cargo, circuit, route and reserves survive restart');
assert.deepEqual(restored.resources,state.resources);
assert.equal(E.currentPlanet(restored).biome,'ice');
assert.equal(E.validate(restored),true);
const corrupt=structuredClone(saved);corrupt.expedition.pending.fragment='tide';
assert.equal(E.restore(corrupt),null,'a gas fragment is still rejected on the restored ice world');
const invalidOverride=structuredClone(saved);invalidOverride.campaign.worldOverride=12;
assert.equal(E.restore(invalidOverride),null,'invalid override cannot bypass expedition validation');
H.walk(restored,E.expeditionView(restored).base);H.checkedAct(restored,'expeditionExtract');
assert.equal(E.campaignView(restored).active.itemOwned,true);
assert.equal(E.campaignView(restored).active.sitesDone,1);
assert.equal(restored.expedition,null);
assert(E.restore(E.snapshot(restored)),'extracted mission reward persists');
H.start(restored,target.targetSiteId);assert.equal(E.expeditionView(restored).core,null,'completed core cannot be repeated');assert(E.restore(E.snapshot(restored)),'mission-site revisit persists');assert.equal(E.campaignView(restored).active.sitesDone,1);
console.log('PASS ice override expedition saves before/after core recovery, intact pending cargo, fragment validation, extraction and mission progress.');
