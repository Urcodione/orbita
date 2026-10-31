const assert=require('node:assert/strict');global.OrbitEngine=require('./engine.js');require('./economy.js');require('./campaign.js');require('./tutorial.js');const E=OrbitEngine,H=require('./expedition-test-helper.cjs');
for(const biome of Object.keys(E.biomes)){
 const s=E.create('weather-paths');E.dispatch(s,'guideSkip');H.start(s);const p=E.currentPlanet(s);p.biome=biome;p.weather=50;const e=s.expedition;e.revealed=Array.from({length:36},(_,i)=>i);e.reserve=e.maxReserve=48;e.integrity=e.maxIntegrity=32;
 let v=E.expeditionView(s),tile=v.cells.find(c=>c.kind==='hazard'&&v.cells.some(n=>n.kind!=='wall'&&Math.abs(n.x-c.x)+Math.abs(n.y-c.y)===1));assert(tile,biome+' hazard');const adjacent=v.cells.find(n=>n.kind!=='wall'&&Math.abs(n.x-tile.x)+Math.abs(n.y-tile.y)===1);e.x=adjacent.x;e.y=adjacent.y;e.visited=[...new Set([...e.visited,e.y*6+e.x])];e.turns=0;
 const calm=E.preview(s,'expeditionMove',tile);assert(calm.allowed,calm.reason);assert.equal(calm.cost.reserve,2);assert(calm.cost.integrity>0);
 e.turns=3;assert(E.fieldWeather(s).warning);e.turns=5;assert(E.fieldWeather(s).active);
 const storm=E.preview(s,'expeditionMove',tile);assert(storm.allowed,storm.reason);assert.equal(storm.cost.reserve,calm.cost.reserve+1);assert.equal(storm.cost.integrity,calm.cost.integrity);
 const shown=E.expeditionView(s).cells.find(c=>c.x===tile.x&&c.y===tile.y);assert.deepEqual(shown.traversalCost,storm.cost);
 const before=e.reserve,hull=e.integrity;const result=E.dispatch(s,'expeditionMove',{x:tile.x,y:tile.y});assert(result.ok,JSON.stringify(result));assert.equal(s.expedition.reserve,before-storm.cost.reserve);assert.equal(s.expedition.integrity,hull-storm.cost.integrity);
 s.expedition.turns=8;assert(!E.fieldWeather(s).active);assert.equal(E.preview(s,'expeditionMove',{x:adjacent.x,y:adjacent.y}).cost.reserve,adjacent.kind==='hazard'?2:1);
}
console.log('PASS every biome: warning, storm, hazard costs displayed and charged, calm restored.');
