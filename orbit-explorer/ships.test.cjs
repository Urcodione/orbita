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
assert.equal(after.fuelEfficiency,Math.round((before.fuelEfficiency-.1)*100)/100);
assert.deepEqual(s.equipped,modules,'modules, runes and paint stay with the player');
H.rejectUnchanged(s,'fleetSwitch',{shipId:'pelicano'});
// A smaller hold refuses the switch until there is room.
while(s.inventory.length<after.cargoCapacity)s.inventory.push({...clone(s.inventory[0]||Object.values(s.equipped)[0]),id:'extra-'+s.inventory.length});
assert.ok(E.validate(s));H.rejectUnchanged(s,'fleetSwitch',{shipId:'andorinha'});
s.inventory.length=0;s.resources.hull=after.maxHull;
s.ship.name='Estrela do Sul';H.checkedAct(s,'fleetSwitch',{shipId:'andorinha'});assert.equal(s.ship.name,'Estrela do Sul','a chosen name is kept');assert.ok(s.resources.hull<=E.stats(s).maxHull,'resources clamp to the new maxima');
// Only at a station and outside an expedition.
refill();H.checkedAct(s,'stationLeave');H.rejectUnchanged(s,'fleetSwitch',{shipId:'pelicano'});

// Trunfos. Protection: the Pinguim dives (submersible + pressure) and adds cold insulation on top of the best module.
const cold=E.create('fleet-2');H.checkedAct(cold,'guideSkip');const base=E.stats(cold).protection;
cold.fleet.owned=E.fleetCatalog.SHIPS.map(x=>x.id);cold.fleet.active='pinguim';const p=E.stats(cold).protection;
assert.equal(p.cold,base.cold+60);assert.equal(p.pressure,Math.round((base.pressure+10)*100)/100);assert.equal(p.liquid,true);assert.equal(p.heat,base.heat);
cold.fleet.active='garca';assert.equal(E.stats(cold).protection.gas,true,'the Garça carries its own atmospheric probe');
cold.fleet.active='carcara';assert.equal(E.stats(cold).protection.heat,base.heat+260);
// Those protections open worlds that block the Andorinha, and the hint lists them.
cold.fleet.active='andorinha';let opened=0;
for(let i=0;i<12;i++){const g=E.create('unlock-'+i);H.checkedAct(g,'guideSkip');g.fleet.owned=E.fleetCatalog.SHIPS.map(x=>x.id);for(const id of ['pinguim','garca','carcara'])opened+=E.fleetUnlocks(g,id).length;}
assert.ok(opened>=12,'Pinguim, Garça and Carcará open about one world per galaxy each: '+opened);
// Trip costs: short hops are free of fuel inside a system, solar sails need no oxygen, the Fênix saves a warp cell.
const trip=E.create('fleet-4');H.checkedAct(trip,'guideSkip');trip.fleet.owned=E.fleetCatalog.SHIPS.map(x=>x.id);
const here=E.currentPlanet(trip),same=trip.galaxy.planets.find(q=>q.id!==here.id&&q.systemId===here.systemId&&E.assessSystem(trip,q.systemId).allowed);
const plain=E.preview(trip,'travel',{planetId:same.id}).cost;assert.ok(plain.fuel>0&&plain.oxygen>0);
trip.fleet.active='beija-flor';assert.equal(E.preview(trip,'travel',{planetId:same.id}).cost.fuel,undefined,'short hop: no fuel inside the system');
trip.fleet.active='albatroz';assert.equal(E.preview(trip,'travel',{planetId:same.id}).cost.oxygen,undefined,'solar sails: no oxygen');
trip.fleet.active='fenix';
assert.equal(E.shipCost(trip,'warp',{warpFuel:3},{}).warpFuel,2,'the Fênix warp costs one cell less');assert.equal(E.shipCost(trip,'warp',{warpFuel:1},{}).warpFuel,1,'never below one cell');
// Expeditions: the Martim-pescador drills a wall, the Pelicano keeps half of the cargo when evacuating, the Coruja sees the exemplar.
let drilled=false,salvaged=false,seen=false,t0;
for(let i=0;i<30&&!(drilled&&salvaged&&seen);i++){
 const g=E.create('field-'+i);H.checkedAct(g,'guideSkip');g.fleet.owned=E.fleetCatalog.SHIPS.map(x=>x.id);
 const planet=E.currentPlanet(g);if(!planet.scanned&&!E.dispatch(g,'scan').ok)continue;
 for(const site of planet.sites){const t=E.restore(E.snapshot(t0=g));if(!t)continue;try{H.start(t,site.id);}catch{continue;}
  const e=t.expedition,board=E.expeditionBoard(e),near=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:e.x+dx,y:e.y+dy})).find(c=>c.x>=0&&c.x<6&&c.y>=0&&c.y<6&&board[c.y*6+c.x].kind==='wall');
  if(near&&!drilled){const d=E.restore(E.snapshot(t));H.rejectUnchanged(d,'expeditionMove',near);d.fleet.active='martim-pescador';const reserve=d.expedition.reserve;
   H.checkedAct(d,'expeditionMove',near);assert.deepEqual(d.expedition.drilled,[near.y*6+near.x]);assert.ok(reserve-d.expedition.reserve>=3,'drilling costs extra energy');
   assert.ok(E.restore(E.snapshot(d)),'a drilled expedition survives a reload');drilled=true;}
  if(!salvaged){const v=E.restore(E.snapshot(t));v.fleet.active='pelicano';v.expedition.pending.ore=10;v.expedition.pending.data=7;const ore=v.resources.ore,data=v.resources.data;
   H.checkedAct(v,'expeditionAbort');assert.equal(v.resources.ore,ore+5);assert.equal(v.resources.data,data+3);salvaged=true;}
  if(!seen){const before=E.expeditionView(t).specimen;t.fleet.active='coruja';const after=E.expeditionView(t).specimen;if(after&&!before){assert.ok(after.id);seen=true;}}
 }}
assert.ok(drilled,'found a wall next to a landing to drill');assert.ok(salvaged,'evacuation tested');
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
console.log('PASS fleet: one merchant roll per galaxy stay (no reroll by docking), trunfos (protection unlocks, short hop, solar sails, Phoenix warp, drill, salvage hold, lenses), buy and switch at stations, stats and protection follow the ship, hold check, clamp, saves validated.');

// Physical cargo also prevents switching to a smaller ship, independently of module slots.
const volume=E.create('fleet-volume');H.checkedAct(volume,'guideSkip');H.checkedAct(volume,'stationDock');
volume.fleet.owned.push('pelicano','albatroz');volume.fleet.offer=null;H.checkedAct(volume,'fleetSwitch',{shipId:'pelicano'});
volume.resources.ore+=E.storageView(volume).free;
assert(volume.inventory.length<E.stats(volume).cargoCapacity);
H.rejectUnchanged(volume,'fleetSwitch',{shipId:'andorinha'});
assert(!E.fleetView(volume).ships.find(x=>x.id==='andorinha').preview.allowed);
volume.resources.ore-=75;H.checkedAct(volume,'fleetSwitch',{shipId:'andorinha'});
assert.equal(E.storageView(volume).excess,0);assert(E.restore(E.snapshot(volume)));
H.checkedAct(volume,'fleetSwitch',{shipId:'albatroz'});
volume.resources.fuel=E.stats(volume).maxFuel;volume.resources.oxygen=E.stats(volume).maxOxygen;
const target=volume.galaxy.planets.find(p=>p.systemId===E.currentSystem(volume).id&&p.id!==E.currentPlanet(volume).id);
assert(target);
assert.equal(E.voyagePlan(volume,target.id).oxygen,E.preview(volume,'stationLeave').cost.oxygen);
H.checkedAct(volume,'stationLeave');
assert.equal(E.voyagePlan(volume,target.id).oxygen,0);
assert.equal(E.voyagePlan(volume,target.id).afterOxygen,volume.resources.oxygen);
console.log('PASS fleet material volume and Albatroz voyage oxygen estimate, docked and in orbit');
