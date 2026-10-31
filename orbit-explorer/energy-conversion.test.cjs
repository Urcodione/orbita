const assert=require('node:assert/strict');global.OrbitEngine=require('./engine.js');require('./economy.js');const E=OrbitEngine,s=E.create('bioreactor');s.resources.oxygen=10;
const before=JSON.stringify(s);assert.equal(E.preview(s,'refillOxygen',{payment:'ore'}).allowed,false);assert.equal(E.dispatch(s,'refillOxygen',{payment:'credits'}).ok,false);assert.equal(JSON.stringify(s),before);
s.resources.lumenfern=2;const ore=s.resources.ore,credits=s.resources.credits;assert(E.dispatch(s,'refillOxygen').ok);assert.equal(s.resources.oxygen,22);assert.equal(s.resources.lumenfern,1);assert.equal(s.resources.ore,ore);assert.equal(s.resources.credits,credits);assert(E.restore(E.snapshot(s)));
s.resources.oxygen=99;assert(E.dispatch(s,'refillOxygen').ok);assert.equal(s.resources.oxygen,100);assert.equal(s.resources.lumenfern,0);
s.resources.fuel=0;s.resources.ore=3;assert(E.dispatch(s,'refuel',{payment:'credits'}).ok);assert.equal(s.resources.fuel,12);assert.equal(s.resources.ore,0);assert.equal(s.resources.credits,credits);
s.resources.fuel=98;s.resources.ore=1;assert(E.dispatch(s,'refuel').ok);assert.equal(s.resources.fuel,100);assert.equal(s.resources.ore,0);
s.resources.ore=47;s.resources.crystals=6;assert.equal(E.preview(s,'refine',{amount:2}).allowed,false);s.resources.ore=48;assert(E.dispatch(s,'refine',{amount:2}).ok);assert.equal(s.resources.ore,0);assert.equal(s.resources.crystals,0);assert.equal(s.resources.warpFuel,3);
s.resources.oxygen=5;assert(E.dispatch(s,'scan').ok);assert(E.dispatch(s,'dock').ok);assert(E.dispatch(s,'refillOxygen').ok);assert.equal(s.resources.oxygen,100);
console.log('PASS biological oxygen, missing plant rejection, no credit/mineral bypass, partial tank costs, expensive warp batches, breathable haven, save compatibility.');
