'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
global.OrbitEngine=require('./engine.js');require('./economy.js');require('./campaign.js');
const E=global.OrbitEngine,H=require('./expedition-test-helper.cjs');
const s=E.create('chorus-full-campaign');
const act=H.checkedAct;
assert(E.validate(s));assert.equal(E.campaignView(s).active.sitesRequired,4);
H.rejectUnchanged(s,'campaignClaim');H.rejectUnchanged(s,'campaignCraft',{recipeId:'chorus-scanner'});H.rejectUnchanged(s,'warp');H.rejectUnchanged(s,'campaignCross');
act(s,'campaignIntro');assert(E.restore(E.snapshot(s)).campaign.introSeen);
// A mission joins an existing voyage without replacing its ship or resource inventory.
const old=E.create('legacy-campaign');delete old.campaign;const restored=E.restore(E.snapshot(old));assert(restored);assert.deepEqual(restored.equipped,old.equipped);assert.deepEqual(restored.resources,old.resources);
for(const p of old.galaxy.planets)for(const t of p.sites)t.explored=true;
assert.equal(E.restore(E.snapshot(old)).campaign.start,1);
// Broad equipment and supplies are a test fixture: route/puzzle/extraction actions remain real.
for(const m of Object.values(s.equipped)){m.power=4;m.capabilities={heat:10000,cold:10000,radiation:10000,pressure:10000,toxicity:100,gas:true,liquid:true};m.effects={expeditionReserve:10,expeditionIntegrity:6};}
function provision(){Object.assign(s.resources,{fuel:E.stats(s).maxFuel,oxygen:E.stats(s).maxOxygen,hull:E.stats(s).maxHull,ore:900,crystals:900,data:9000,credits:9000,warpFuel:12});}
provision();H.start(s);act(s,'expeditionAbort');assert.equal(E.campaignView(s).active.sitesDone,0);
H.start(s);const ore=H.revealedBoard(s).find(c=>c.kind==='ore'&&H.route(s,c));H.walk(s,ore);act(s,'expeditionCollect');H.walk(s,E.expeditionView(s).base);act(s,'expeditionExtract');assert.equal(E.campaignView(s).active.sitesDone,0,'resource-only extraction cannot advance mission');
let extractions=0,maxSnapshot=0;
for(let chapter=0;chapter<8;chapter++){
 let v=E.campaignView(s);assert.equal(v.chapter,chapter+1);assert(v.active.targetPlanetId,'target must exist');
 const target=s.galaxy.planets.find(p=>p.id===v.active.targetPlanetId);
 const planets=[target,...s.galaxy.planets.filter(p=>p!==target)];
 const selected=[];for(let round=0;selected.length<v.active.sitesRequired;round++)for(const p of planets){const t=p.sites.filter(t=>!t.explored)[round];if(t&&selected.length<v.active.sitesRequired)selected.push([p.id,t.id]);}
 for(const [pid,siteId]of selected){
  provision();if(s.location.mode==='docked')act(s,'launch');if(s.location.planetId!==pid)act(s,'travel',{planetId:pid});H.start(s,siteId);H.finish(s,act);extractions++;maxSnapshot=Math.max(maxSnapshot,Buffer.byteLength(JSON.stringify(E.snapshot(s))));assert(E.restore(E.snapshot(s)),'mid-quest snapshot must restore');
 }
 v=E.campaignView(s);assert.equal(v.active.sitesDone,v.active.sitesRequired);assert(v.active.worldsDone>=v.active.worldsRequired);assert(v.active.systemsDone>=v.active.systemsRequired);
 if(chapter===5){provision();if(s.location.mode==='docked')act(s,'launch');if(s.location.planetId!==target.id)act(s,'travel',{planetId:target.id});act(s,'stationDock');const credits=s.resources.credits;act(s,'campaignBuyRelic');assert.equal(s.resources.credits,credits-480);H.rejectUnchanged(s,'campaignBuyRelic');H.rejectUnchanged(s,'trade',{resource:'aural-escapement',side:'sell',quantity:1});act(s,'stationLeave');}
 assert(E.campaignView(s).active.ready);act(s,'campaignClaim');H.rejectUnchanged(s,'campaignClaim');
 const recipe=E.campaignRecipes[chapter];
 // Craft nested components through their public actions, never a mission-module fixture.
 function prepare(id,amount){const r=E.componentRecipes.find(r=>r.id===id);for(const [k,n]of Object.entries(r.components||{}))prepare(k,n*amount);act(s,'craftComponent',{componentId:id,amount});}
 provision();for(const [id,n]of Object.entries(recipe.components))prepare(id,n);
 while(s.inventory.length>=E.stats(s).cargoCapacity){const m=s.inventory.find(m=>!m.mission&&!m.favorite);assert(m,'a protected quest set must leave a disposable inventory slot');act(s,'salvage',{moduleId:m.id});}
 const made=act(s,'fabricate',{recipeId:recipe.id});assert.equal(made.reward.module.origin,'campaign');H.rejectUnchanged(s,'fabricate',{recipeId:recipe.id});H.rejectUnchanged(s,'salvage',{moduleId:made.reward.module.id});H.rejectUnchanged(s,'favoriteModule',{moduleId:made.reward.module.id});
 act(s,'equip',{moduleId:made.reward.module.id});assert.equal(E.campaignView(s).resistance,(chapter+1)*12.5);assert(E.moduleDetails(s,made.reward.module.id).metrics.some(m=>m.key==='dimensionalResistance'));
 if(chapter<7){provision();if(s.location.mode==='docked')act(s,'launch');act(s,'warp',{destinationId:E.destinations(s)[chapter%3].id});assert.equal(E.campaignView(s).active.eligible,true);}
}
assert.equal(extractions,70);assert.equal(E.campaignView(s).resistance,100);
if(s.location.mode==='docked')act(s,'launch');act(s,'campaignReturnHome');assert.equal(s.galaxy.id,'galaxy-0');assert.equal(s.galaxyIndex,7);assert(E.campaignView(s).canCross);assert(E.restore(E.snapshot(s)),'home snapshot restores initial coordinates and frontier ledger');
const fullSize=Buffer.byteLength(JSON.stringify(E.snapshot(s)));assert(fullSize<16384,'Full campaign should fit inline persistence budget: '+fullSize);
fs.writeFileSync(__dirname+'/qa/campaign-complete-fixture.json',JSON.stringify(E.snapshot(s)));
// Removing even one correct mission module prevents the crossing.
const spare=s.inventory.find(m=>m.type==='scanner');assert(spare);act(s,'equip',{moduleId:spare.id});assert.equal(E.campaignView(s).resistance,87.5);H.rejectUnchanged(s,'campaignCross');act(s,'equip',{moduleId:'chorus-scanner'});
act(s,'campaignCross');H.rejectUnchanged(s,'campaignCross');assert(E.campaignView(s).finished);provision();if(!E.currentPlanet(s).scanned)act(s,'scan');act(s,'dock');H.rejectUnchanged(s,'warp');act(s,'launch');act(s,'warp');assert.equal(s.galaxyIndex,8);assert(!s.campaign.atHome);assert(E.restore(E.snapshot(s)),'post-finale free exploration persists');
const tamper=E.snapshot(s);tamper.equipped.arm.favorite=false;assert.equal(E.restore(tamper),null,'mission protection cannot be removed by saved data');
// All route families retain a mission target, including an ice-less generated forge.
let replacements=0;for(let seed=0;seed<40;seed++)for(const route of ['verdant','forge','abyss']){const x=E.create(seed);x.galaxyIndex=3;x.visitedGalaxies=4;x.galaxy=E.generateGalaxy(seed,3,route);x.location.planetId=x.galaxy.planets[0].id;x.surveyArchive={entries:[],earlier:[0,0,0,0,0,0],unavailable:3};x.campaign={...x.campaign,start:0,chapter:3,crafted:7,claimed:7,found:7,sites:[],target:null};for(let i=0;i<3;i++){const r=E.campaignRecipes[i];x.equipped[r.type]={...r,id:'chorus-'+r.type,recipeId:r.id,origin:'campaign',favorite:true};}const y=E.restore(E.snapshot(x));assert(y,route+' seed'+seed);assert(E.campaignView(y).active.targetPlanetId);if(y.campaign.worldOverride){replacements++;assert(E.restore(E.snapshot(y)));if(replacements===1){const r=E.campaignRecipes[3];y.campaign.chapter=4;y.campaign.crafted=15;y.campaign.claimed=15;y.campaign.found=15;y.campaign.target=null;y.equipped.cargo={...r,id:'chorus-cargo',recipeId:r.id,origin:'campaign',favorite:true};const z=E.restore(E.snapshot(y));assert(z);assert.equal(z.galaxy.planets.find(p=>p.id===z.campaign.worldOverride).biome,'ice','completed chapter retains override before departure');z.resources.warpFuel=12;act(z,'warp');assert.equal(z.campaign.worldOverride,undefined);assert(E.restore(E.snapshot(z)));}}}
console.log('PASS 70 real core expeditions, 8 sequential recipes/galaxies, exclusive relic, protected modules, 100% gate, home return, finale continuation, old-save migration and deterministic targets.');
console.log(JSON.stringify({extractions,maxSnapshot,finalSnapshot:fullSize,guaranteedIceOverrides:replacements}));
