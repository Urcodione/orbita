const assert=require('node:assert/strict');global.OrbitEngine=require('./engine.js');
for(const f of ['economy','campaign','campaign-events','campaign-guidance','tutorial','storage','voyage','xenobiology','shipyard'])require('./'+f+'.js');
const E=global.OrbitEngine,H=require('./expedition-test-helper.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const s=E.create('yard-1');H.checkedAct(s,'guideSkip');s.resources.credits=5000;
const view=()=>E.yardView(s);
assert.equal(view().parts.length,12);assert.equal(view().allowed.length,27,'rocket-shaped hull grid');

// Parts are sold at stations, by the galaxy's faction only.
H.rejectUnchanged(s,'yardBuy',{partId:'tanque-externo'});
H.checkedAct(s,'stationDock');
assert.equal(view().faction,'Coletivo Aural');
H.rejectUnchanged(s,'yardBuy',{partId:'antena-longa'});
const credits=s.resources.credits;
H.checkedAct(s,'yardBuy',{partId:'tanque-externo'});assert.equal(s.resources.credits,credits-140);
for(const id of ['placas-casco','placas-casco','vela-solar','reservatorio-o2'])H.checkedAct(s,'yardBuy',{partId:id});

// Mounting: inside the silhouette, no overlap, owned units only; effects reach the ship's stats.
const fuel=E.stats(s).maxFuel;
H.rejectUnchanged(s,'yardPlace',{partId:'tanque-externo',cell:0});        // outside the hull (nose row is one cell wide)
H.checkedAct(s,'yardPlace',{partId:'tanque-externo',cell:10});           // column 0, rows 2-3
assert.equal(E.stats(s).maxFuel,fuel+20);
H.rejectUnchanged(s,'yardPlace',{partId:'tanque-externo',cell:20});      // only one owned
H.rejectUnchanged(s,'yardPlace',{partId:'placas-casco',cell:15});        // overlaps the tank
H.checkedAct(s,'yardPlace',{partId:'placas-casco',cell:2});
H.checkedAct(s,'yardPlace',{partId:'placas-casco',cell:7});
H.checkedAct(s,'yardPlace',{partId:'vela-solar',cell:11});
assert.equal(view().mass,4+3+3+1);assert.equal(view().energySupply,12);
assert.ok(E.restore(E.snapshot(s)),'layout survives a reload');

// Mass limit: a heavy frame is refused, and weight above 18 costs flight efficiency.
const heavy=E.create('yard-heavy');H.checkedAct(heavy,'guideSkip');heavy.yard.owned={'conteiner-orbital':4,'placas-casco':3};
const eff=E.stats(heavy).fuelEfficiency;
heavy.yard.layout=[10,12,20,22].map(c=>({p:'conteiner-orbital',c})).concat([{p:'placas-casco',c:2},{p:'placas-casco',c:7}]);
assert.ok(E.validate(heavy),'mass 30 fits the frame');
assert.equal(E.stats(heavy).fuelEfficiency,Math.round((eff-.12)*100)/100,'every unit above 18 costs 1% of flight efficiency');
H.rejectUnchanged(heavy,'yardPlace',{partId:'placas-casco',cell:14});  // 33 > 30
heavy.yard.layout.push({p:'placas-casco',c:14});assert.equal(E.validate(heavy),false,'frame mass limit');

// Energy: drawing parts need reactor supply.
const power=E.create('yard-2');H.checkedAct(power,'guideSkip');power.yard.owned={'antena-longa':4};
for(const c of [11,12,13])assert.ok(E.dispatch(power,'yardPlace',{partId:'antena-longa',cell:c}).ok);
H.rejectUnchanged(power,'yardPlace',{partId:'antena-longa',cell:16});     // 4 × 3 energy > 10 supply

// Share code round trip; applying a model needs the parts in the hangar.
const code=view().code;assert.match(code,/^ORB1-[0-9a-z]+$/);
assert.deepEqual(E.yardCatalog.decode(code),s.yard.layout);
const other=E.create('yard-3');H.checkedAct(other,'guideSkip');
H.rejectUnchanged(other,'yardApply',{code});
other.yard.owned=clone(s.yard.owned);H.checkedAct(other,'yardApply',{code});assert.deepEqual(other.yard.layout,s.yard.layout);
H.rejectUnchanged(other,'yardApply',{code:'ORB1-zz'});

// Removing returns the part to the hangar; resources are kept within the new maxima.
H.checkedAct(s,'stationLeave');s.resources.fuel=E.stats(s).maxFuel;
H.checkedAct(s,'yardRemove',{cell:15});assert.ok(s.resources.fuel<=E.stats(s).maxFuel);
H.rejectUnchanged(s,'yardRemove',{cell:15});
H.checkedAct(s,'yardClear');assert.equal(s.yard.layout.length,0);

// Forged saves.
const forged=edit=>{const x=clone(E.snapshot(other));edit(x);return E.restore(x);};
assert.equal(forged(x=>{x.yard.layout.push({p:'tanque-externo',c:10});}),null,'overlap / more than owned');
assert.equal(forged(x=>{x.yard.layout=[{p:'quilha',c:0}];}),null,'outside the hull');
assert.equal(forged(x=>{x.yard.owned['laser']=1;}),null,'unknown part');
assert.equal(forged(x=>{x.yard.owned['quilha']=99;}),null,'stock above six');
const legacy=clone(E.snapshot(other));delete legacy.yard;assert.ok(E.restore(legacy).yard,'older saves gain an empty yard');
console.log('PASS star shipyard: faction stations, rocket-shaped grid, owned units, mass and energy limits, mass penalty, stats, share code apply, removal clamps, forged saves rejected.');
