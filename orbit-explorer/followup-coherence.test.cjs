const assert=require('node:assert/strict');
global.OrbitEngine=require('./engine');
for(const f of ['economy','campaign','campaign-events','storage','voyage'])require('./'+f);
const E=OrbitEngine;
// Removing a bulky installed module needs real hold volume, even for non-cargo slots.
const s=E.create(1234);
s.resources.credits=1000;s.resources.data=1000;s.components={alloy:3,seal:1};
assert(E.dispatch(s,'fabricate',{recipeId:'kinetic-shell'}).ok);
const shield=s.inventory.find(m=>m.recipeId==='kinetic-shell');
assert(E.dispatch(s,'equip',{moduleId:shield.id}).ok);
s.resources.ore+=E.storageView(s).free;
const old=s.inventory.find(m=>m.type==='shield'),before=E.serialize(s);
assert.equal(E.preview(s,'equip',{moduleId:old.id}).allowed,false);
assert.equal(E.compareModule(s,old.id).allowed,false);
assert.equal(E.dispatch(s,'equip',{moduleId:old.id}).ok,false);
assert.equal(E.serialize(s),before);
s.resources.ore-=3;
assert(E.dispatch(s,'equip',{moduleId:old.id}).ok);
assert.equal(E.storageView(s).excess,0);
assert(E.restore(E.snapshot(s)));
// Previously unregistered cargo remains discovered when its final unit is sold.
const t=E.create(22);t.resources.lumenfern=1;
assert(!t.materialDiscoveries?.includes('lumenfern'));
assert(E.dispatch(t,'stationDock').ok);
assert(E.dispatch(t,'trade',{resource:'lumenfern',side:'sell',quantity:1}).ok);
assert.equal(t.resources.lumenfern,0);
assert(E.materialKnown(t,'lumenfern'));
assert(t.materialDiscoveries.includes('lumenfern'));
assert(E.materialKnown(E.restore(E.snapshot(t)),'lumenfern'));
// Invalid receipt histories must be rejected, not throw during public validation.
const invalid=E.create(1);invalid.charterReceipts={x:{resource:'ore',quantity:3,reward:30}};invalid.charters={};
assert.equal(E.validate(invalid),false);
assert.equal(E.restore(E.snapshot(invalid)),null);
console.log('PASS non-cargo module volume, comparison/action consistency, persistent traded discoveries, malformed receipt history');
