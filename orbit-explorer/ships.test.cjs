const assert=require('node:assert/strict');global.OrbitEngine=require('./engine.js');
for(const f of ['economy','campaign','campaign-events','campaign-guidance','tutorial','storage','voyage','xenobiology','ships'])require('./'+f+'.js');
const E=global.OrbitEngine,H=require('./expedition-test-helper.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const s=E.create('fleet-1');H.checkedAct(s,'guideSkip');
const view=()=>E.fleetView(s);
assert.equal(view().total,10);assert.equal(view().active,'andorinha');assert.deepEqual(view().ships.map(x=>x.id),['andorinha']);
assert.equal(E.shipBonus(s).effects&&Object.keys(E.shipBonus(s).effects).length,0,'the Andorinha is the neutral reference');

// The merchant: rolled once per galaxy stay. The first station visit after the tutorial always has a ship, and
// leaving and docking again shows the same ship (no reroll by docking).
H.rejectUnchanged(s,'fleetBuy',{shipId:'coruja'});
const refill=()=>{const c=E.stats(s);s.resources.fuel=c.maxFuel;s.resources.oxygen=c.maxOxygen;};
H.checkedAct(s,'stationDock');
const offer=view().offer;assert.ok(offer,'first visit meets the merchant');assert.notEqual(offer.id,'andorinha');
refill();H.checkedAct(s,'stationLeave');assert.equal(view().offer,null,'only visible while docked');
for(let i=0;i<5;i++){refill();H.checkedAct(s,'stationDock');assert.equal(view().offer?.id,offer.id,'same merchant all stay long');refill();H.checkedAct(s,'stationLeave');}
// A new galaxy stay rolls again (75%): over many stays, offers are frequent but not certain, and never an owned ship.
let offers=0;for(let i=0;i<80;i++){s.visitedGalaxies+=1;refill();H.checkedAct(s,'stationDock');const o=view().offer;if(o){offers++;assert.ok(!s.fleet.owned.includes(o.id));}refill();H.checkedAct(s,'stationLeave');}
assert.ok(offers>45&&offers<75,'offers in '+offers+'/80 stays');

// Buying: only the offered ship, docked, with enough Lumes.
s.visitedGalaxies+=1;refill();H.checkedAct(s,'stationDock');s.fleet.offer={ship:'pelicano',stay:s.fleet.rolled};
s.resources.credits=100;H.rejectUnchanged(s,'fleetBuy',{shipId:'pelicano'});
H.rejectUnchanged(s,'fleetBuy',{shipId:'coruja'});
s.resources.credits=5000;H.checkedAct(s,'fleetBuy',{shipId:'pelicano'});
assert.equal(s.resources.credits,5000-E.fleetCatalog.SHIPS.find(x=>x.id==='pelicano').price);assert.deepEqual(s.fleet.owned,['andorinha','pelicano']);assert.equal(view().offer,null);
refill();H.checkedAct(s,'stationLeave');refill();H.checkedAct(s,'stationDock');assert.equal(view().offer,null,'one merchant per galaxy stay');
assert.equal(view().active,'andorinha','a bought ship waits in the hangar');

// Switching: stats follow the ship; modules stay.
const before=E.stats(s),modules=clone(s.equipped);
assert.equal(s.ship.name,'Andorinha');H.checkedAct(s,'fleetSwitch',{shipId:'pelicano'});
assert.equal(s.ship.name,'Pelicano','an unchanged name follows the model');
const after=E.stats(s);assert.equal(after.cargoCapacity,before.cargoCapacity+3);assert.equal(after.expeditionCapacity,before.expeditionCapacity+1);
assert.equal(after.maxHull,before.maxHull+20);assert.equal(after.fuelEfficiency,Math.round((before.fuelEfficiency-.15)*100)/100);
assert.deepEqual(s.equipped,modules,'modules, runes and paint stay with the player');
H.rejectUnchanged(s,'fleetSwitch',{shipId:'pelicano'});
// A smaller hold refuses the switch until there is room.
while(s.inventory.length<after.cargoCapacity)s.inventory.push({...clone(s.inventory[0]||Object.values(s.equipped)[0]),id:'extra-'+s.inventory.length});
assert.ok(E.validate(s));H.rejectUnchanged(s,'fleetSwitch',{shipId:'andorinha'});
s.inventory.length=0;s.resources.hull=after.maxHull;
s.ship.name='Estrela do Sul';H.checkedAct(s,'fleetSwitch',{shipId:'andorinha'});assert.equal(s.ship.name,'Estrela do Sul','a chosen name is kept');assert.ok(s.resources.hull<=E.stats(s).maxHull,'resources clamp to the new maxima');
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
const legacy=clone(E.snapshot(s));delete legacy.fleet;assert.deepEqual(E.restore(legacy).fleet,{v:1,owned:['andorinha'],active:'andorinha',rolled:null,offer:null});
const forged=edit=>{const x=clone(E.snapshot(s));edit(x);return E.restore(x);};
assert.equal(forged(x=>{x.fleet.owned.push('nave-x');}),null,'unknown ship');
assert.equal(forged(x=>{x.fleet.active='fenix';}),null,'active ship not owned');
assert.equal(forged(x=>{x.fleet.owned=['pelicano'];x.fleet.active='pelicano';}),null,'the Andorinha is never lost');
assert.equal(forged(x=>{x.fleet.offer={ship:'fenix',stay:'9:99'};}),null,'an offer belongs to the current roll');
console.log('PASS fleet: one merchant roll per galaxy stay (no reroll by docking), buy and switch at stations, stats and protection follow the ship, hold check, clamp, saves validated.');
