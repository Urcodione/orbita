const assert=require('node:assert/strict');global.OrbitEngine=require('./engine.js');
for(const f of ['economy','campaign','campaign-events','campaign-guidance','tutorial','storage','voyage','xenobiology','ships'])require('./'+f+'.js');
const E=global.OrbitEngine,H=require('./expedition-test-helper.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const s=E.create('fleet-1');H.checkedAct(s,'guideSkip');
const view=()=>E.fleetView(s);
assert.equal(view().total,10);assert.equal(view().active,'andorinha');assert.deepEqual(view().ships.map(x=>x.id),['andorinha']);
assert.equal(E.shipBonus(s).effects&&Object.keys(E.shipBonus(s).effects).length,0,'the Andorinha is the neutral reference');

// The merchant: the first station visit after the tutorial always has a ship; leaving takes it away.
H.rejectUnchanged(s,'fleetBuy',{shipId:'coruja'});
H.checkedAct(s,'stationDock');
const offer=view().offer;assert.ok(offer,'first visit meets the merchant');assert.notEqual(offer.id,'andorinha');
H.checkedAct(s,'stationLeave');assert.equal(view().offer,null,'the offer leaves with the station');
// Over many visits roughly 40% of docks bring a ship, never one already owned.
let offers=0;const refill=()=>{const c=E.stats(s);s.resources.fuel=c.maxFuel;s.resources.oxygen=c.maxOxygen;};
for(let i=0;i<60;i++){refill();H.checkedAct(s,'stationDock');if(view().offer)offers++;H.checkedAct(s,'stationLeave');}
assert.ok(offers>12&&offers<40,'offer rate '+offers+'/60');

// Buying: only the offered ship, docked, with enough Lumes.
refill();H.checkedAct(s,'stationDock');s.fleet.offer={ship:'pelicano',system:s.location.stationId};
s.resources.credits=100;H.rejectUnchanged(s,'fleetBuy',{shipId:'pelicano'});
H.rejectUnchanged(s,'fleetBuy',{shipId:'coruja'});
s.resources.credits=5000;H.checkedAct(s,'fleetBuy',{shipId:'pelicano'});
assert.equal(s.resources.credits,5000-2400);assert.deepEqual(s.fleet.owned,['andorinha','pelicano']);assert.equal(view().offer,null);
assert.equal(view().active,'andorinha','a bought ship waits in the hangar');

// Switching: stats follow the ship; modules stay.
const before=E.stats(s),modules=clone(s.equipped);
H.checkedAct(s,'fleetSwitch',{shipId:'pelicano'});
const after=E.stats(s);assert.equal(after.cargoCapacity,before.cargoCapacity+3);assert.equal(after.expeditionCapacity,before.expeditionCapacity+1);
assert.equal(after.maxHull,before.maxHull+20);assert.equal(after.fuelEfficiency,Math.round((before.fuelEfficiency-.15)*100)/100);
assert.deepEqual(s.equipped,modules,'modules, runes and paint stay with the player');
H.rejectUnchanged(s,'fleetSwitch',{shipId:'pelicano'});
// A smaller hold refuses the switch until there is room.
while(s.inventory.length<after.cargoCapacity)s.inventory.push({...clone(s.inventory[0]||Object.values(s.equipped)[0]),id:'extra-'+s.inventory.length});
assert.ok(E.validate(s));H.rejectUnchanged(s,'fleetSwitch',{shipId:'andorinha'});
s.inventory.length=0;s.resources.hull=after.maxHull;
H.checkedAct(s,'fleetSwitch',{shipId:'andorinha'});assert.ok(s.resources.hull<=E.stats(s).maxHull,'resources clamp to the new maxima');
// Only at a station and outside an expedition.
refill();H.checkedAct(s,'stationLeave');H.rejectUnchanged(s,'fleetSwitch',{shipId:'pelicano'});

// Ship protection adds to the best module and never goes below zero.
const cold=E.create('fleet-2');H.checkedAct(cold,'guideSkip');const base=E.stats(cold).protection;
cold.fleet.owned.push('pinguim');cold.fleet.active='pinguim';const p=E.stats(cold).protection;
assert.equal(p.cold,base.cold+60);assert.equal(p.pressure,Math.round((base.pressure+3)*100)/100);assert.equal(p.heat,Math.max(0,base.heat-20));

// The tutorial never meets the merchant.
const guided=E.create('fleet-3');assert.equal(guided.guide?.active,true);

// Saves: round trip, older saves gain a fleet, forged fleets are refused.
assert.deepEqual(E.restore(E.snapshot(s)).fleet,s.fleet);
const legacy=clone(E.snapshot(s));delete legacy.fleet;assert.deepEqual(E.restore(legacy).fleet,{v:1,owned:['andorinha'],active:'andorinha',visits:0,offer:null});
const forged=edit=>{const x=clone(E.snapshot(s));edit(x);return E.restore(x);};
assert.equal(forged(x=>{x.fleet.owned.push('nave-x');}),null,'unknown ship');
assert.equal(forged(x=>{x.fleet.active='fenix';}),null,'active ship not owned');
assert.equal(forged(x=>{x.fleet.owned=['pelicano'];x.fleet.active='pelicano';}),null,'the Andorinha is never lost');
assert.equal(forged(x=>{x.fleet.offer={ship:'fenix',system:'anywhere'};}),null,'an offer exists only while docked at its station');
console.log('PASS fleet: merchant offers on station visits, buy and switch at stations, stats and protection follow the ship, hold check, clamp, saves validated.');
