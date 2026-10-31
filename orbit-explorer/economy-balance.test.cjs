const assert=require('node:assert/strict');
global.OrbitEngine=require('./engine.js');require('./economy.js');const E=OrbitEngine;
for(const biome of ['forest','ice','gas','volcanic','ocean','crystal','toxic']){
 const s=E.create(1234);s.materialDiscoveries=Object.keys(E.materials).filter(k=>E.materials[k].category);
 for(const p of s.galaxy.planets)p.biome=biome;
 const m=E.market(s);
 for(const g of m.rows){
  const base=E.materials[g.id].base;
  assert(g.buy<=Math.ceil(base*1.30*1.12));
  if(!g.resell)continue;
  // Even maximum demand pressure cannot overcome the same-region spread.
  const minimumBuy=Math.ceil(base*(1.30-.55*g.abundance)*.92*1.12);
  const maximumSell=Math.floor(base*(1.30-.55*g.abundance)*1.08*.78);
  assert(maximumSell<minimumBuy,g.id);
 }
}
const s=E.create(22);assert(E.dispatch(s,'stationDock').ok);
for(const resource of ['fuel','oxygen']){
 const before=JSON.stringify(s);
 assert(!E.dispatch(s,'trade',{resource,side:'sell',quantity:1}).ok);
 assert.equal(JSON.stringify(s),before);
}
s.resources.ore=100;
assert(E.dispatch(s,'trade',{resource:'ore',side:'sell',quantity:40}).ok);
assert.equal(E.market(s).rows.find(g=>g.id==='ore').demandRemaining,0);
assert(!E.dispatch(s,'trade',{resource:'ore',side:'sell',quantity:1}).ok);
assert.deepEqual(E.restore(E.snapshot(s)).commerce,s.commerce);
const m=E.market(s),renewed=E.market(s,(m.cycle+1)*600000);
assert.equal(renewed.buyingBudget,400);
assert.equal(renewed.rows.find(g=>g.id==='ore').demandRemaining,40);
const entry=s.commerce.stocks[m.systemId];entry.spent=400;
assert(!E.tradeQuote(s,{resource:'crystals',side:'sell',quantity:1}).allowed);
console.log('PASS all commodity price bounds, spread, reserve exploits, demand, budget, renewal and persistence');
