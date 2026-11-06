const assert=require('node:assert/strict');global.OrbitEngine=require('./engine');require('./economy');const E=OrbitEngine,H=require('./expedition-test-helper.cjs');
for(const biome of Object.keys(E.biomes))for(const native of [false,true]){
 const s=E.create(42);E.currentPlanet(s).biome=biome;H.start(s);
 const cell=H.revealedBoard(s).find(c=>['ore','crystal','data'].includes(c.kind)&&!!E.materials[E.collectionResource(s,c)]?.category===native&&H.route(s,c));
 if(!cell){assert(!E.deposits(E.currentPlanet(s)).length);continue;}
 H.walk(s,cell);const collected=H.checkedAct(s,'expeditionCollect');const pending={...s.expedition.pending};
 assert.equal(Object.keys(collected.reward).filter(k=>E.materials[k]?.category).length,native?1:0);
 const restored=E.restore(E.snapshot(s));assert(restored);assert.deepEqual(restored.expedition.pending,pending);
 H.walk(s,E.expeditionView(s).base);const before={...s.resources};const result=H.checkedAct(s,'expeditionExtract');
 for(const [id,m] of Object.entries(E.materials))if(m.category){assert.equal(result.reward[id]||0,pending[id]||0,biome+' invented '+id);assert.equal((s.resources[id]||0)-(before[id]||0),pending[id]||0);}
}
console.log('PASS all biomes: base-resource extraction invents no native cargo; native cargo must be collected; pending survives save and matches delivery');
