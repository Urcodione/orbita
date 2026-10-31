'use strict';
const assert=require('node:assert/strict');
global.OrbitEngine=require('./engine.js');require('./economy.js');require('./campaign.js');require('./campaign-events.js');
const E=OrbitEngine,H=require('./expedition-test-helper.cjs'),C=require('./component-test-helper.cjs');
const results=[];
for(const seed of [7,123,1234,2026,9001]){
 const s=E.create(seed),act=H.checkedAct;
 function space(){while(s.inventory.length>=E.stats(s).cargoCapacity){const m=s.inventory.find(m=>!m.mission&&!m.favorite&&(!m.recipeId||!['thermal-shield','cryo-suit','atmospheric-probe'].includes(m.recipeId)));assert(m);act(s,'salvage',{moduleId:m.id});}}
 function supply(){if(s.resources.oxygen<50&&s.location.mode==='docked'&&E.currentPlanet(s).breathable)act(s,'refillOxygen');if(s.resources.hull<50)act(s,'repair');if(s.resources.fuel<60)act(s,'refuel');}
 function finishMining(){const target=H.revealedBoard(s).find(c=>c.kind==='ore'&&!c.collected&&H.route(s,c));if(target){H.walk(s,target);act(s,'expeditionCollect');}return H.finish(s,act);}
 function assemble(id){space();C.prepareRecipe(s,id);const r=act(s,'fabricate',{recipeId:id});act(s,'equip',{moduleId:r.reward.module.id});}
 function visit(p){if(s.location.mode==='docked')act(s,'launch');supply();if(s.location.planetId!==p.id)act(s,'travel',{planetId:p.id});if(!p.scanned)act(s,'scan');act(s,'dock');}
 const home=E.currentPlanet(s);visit(home);for(const site of home.sites){supply();H.start(s,site.id);const reward=finishMining();if(reward.reward.module?.type==='engine')act(s,'equip',{moduleId:reward.reward.module.id});}
 assemble('thermal-shield');const dunes=s.galaxy.planets.find(p=>p.biome==='desert');visit(dunes);for(const site of dunes.sites){if(E.campaignView(s).active.ready)break;supply();H.start(s,site.id);finishMining();}
 const candidates=s.galaxy.planets.filter(p=>['desert','volcanic','gas','ice','rogue'].includes(p.biome)&&E.assess(s,p.id).allowed&&E.assessSystem(s,p.systemId).allowed);
 candidates.sort((a,b)=>(a.biome==='desert'?-1:b.biome==='desert'?1:a.systemId!==home.systemId?-1:1));
 for(const p of candidates){if(E.campaignView(s).active.ready)break;visit(p);for(const site of p.sites){if(site.explored)continue;if(E.campaignView(s).active.ready)break;if(!E.assess(s,p.id,site.id).allowed)continue;supply();H.start(s,site.id);finishMining();}}
 assert.equal(s.progress.explorations,4,'first technology needs only four successful cores');assert(E.campaignView(s).active.ready,'chapter1 requirements reachable from earned resources seed'+seed);act(s,'campaignClaim');space();C.prepareRecipe(s,'chorus-scanner');const crafted=act(s,'fabricate',{recipeId:'chorus-scanner'});act(s,'equip',{moduleId:crafted.reward.module.id});assert.equal(E.campaignView(s).resistance,12.5);if(s.location.mode==='docked')act(s,'launch');const cost=E.warpCost(s);while(s.resources.warpFuel<cost){if(s.resources.ore<24)act(s,'trade',{side:'buy',resource:'ore',quantity:24-s.resources.ore});act(s,'refine');}supply();act(s,'warp');assert.equal(E.campaignView(s).chapter,2);results.push({seed,sites:s.progress.explorations,credits:s.resources.credits,ore:s.resources.ore,actions:s.turn});
}
console.log('PASS first chapter and next galaxy reached from untouched starting resources across five seeds. Mining plus station purchases; no grants, time waits or rescue.');console.log(JSON.stringify(results));
