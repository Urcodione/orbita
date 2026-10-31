const {chromium}=require('./node_modules/playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{const d=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...args){for(const [k,v]of Object.entries(window.OrbitArt?.images||{}))if(im===v){window.artCalls??={};window.artCalls[k]=(window.artCalls[k]||0)+1;}return d.call(this,im,...args);};});await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForFunction(()=>window.OrbitArt&&Object.keys(OrbitArt.images).every(OrbitArt.ready));
const before=await p.evaluate(()=>JSON.stringify(orbitApp.getState()));await p.locator('.og-tabs [data-tab=ship]').click();await p.locator('[data-action=open-interior]').click();await p.waitForFunction(()=>window.artCalls?.interior>0&&window.artCalls?.modules>0);
assert.equal(await p.locator('.og-module-hotspot:visible').count(),8);
await p.screenshot({path:path.join(__dirname,'cartoon-artifacts/painted-interior.png')});
await p.locator('[data-module-focus=engine]').click();assert.ok(await p.locator('.og-module-code.og-painted-module').count());
for(let n=0;n<10&&!await p.locator('[data-action=inspect-module]:visible:not([inert] *)').count();n++)await p.locator('[data-sheet-page="1"]').click();await p.locator('[data-action=inspect-module]:visible').click();await p.waitForTimeout(250);await p.screenshot({path:path.join(__dirname,'cartoon-artifacts/painted-engine.png')});
assert.equal(await p.evaluate(()=>JSON.stringify(orbitApp.getState())),before,'Art navigation preserves all resources and equipment');
for(const resource of ['ore','crystals','oxygen']){
 if((await p.evaluate(()=>orbitApp.getView())).shipDetail.mode==='module')await p.locator('[data-action=ship-back]').click();
 await p.locator('[data-module-focus=cargo]:visible').click();
 for(let n=0;n<10&&!await p.locator('[data-action=inspect-module]:visible:not([inert] *)').count();n++)await p.locator('[data-sheet-page="1"]').click();
 await p.locator('[data-action=inspect-module]:visible').click();await p.waitForTimeout(100);
 const item=await p.evaluate(resource=>orbitApp.getInspection().contents.find(i=>i.resource===resource),resource);
 await p.locator('#og-canvas').click({position:{x:item.x,y:item.y}});
 assert.equal(await p.evaluate(()=>orbitApp.getView().sheet),'cargo-content');assert.equal(await p.evaluate(()=>orbitApp.getView().cargoResource),resource);
 await p.locator('[data-action=close-sheet]:visible').first().click();
}
assert.equal(await p.evaluate(()=>JSON.stringify(orbitApp.getState())),before,'Cargo illustration only opens the selected resource');
await p.locator('.og-tabs [data-tab=galaxy]').click();await p.locator('[data-map-level=galaxy]').click();await p.waitForFunction(()=>window.artCalls?.galaxies>0&&window.artCalls?.stars>0);await p.screenshot({path:path.join(__dirname,'cartoon-artifacts/painted-current-galaxy.png')});await p.locator('[data-map-level=universe]').click();await p.waitForFunction(()=>window.artCalls?.phenomena>0);await p.screenshot({path:path.join(__dirname,'cartoon-artifacts/painted-galaxies.png')});
const stock=await p.evaluate(()=>JSON.stringify(orbitApp.getState()));await p.locator('[data-action=catalog]').click();assert.equal(await p.evaluate(()=>JSON.stringify(orbitApp.getState())),stock);
// Each generated biome remains visually distinguishable, rendered with a stable seed.
const hashes=await p.evaluate(()=>['forest','volcanic','ice','desert','ocean','crystal','gas','magma','toxic','rogue'].map(biome=>{const c=document.createElement('canvas');c.width=c.height=160;const ctx=c.getContext('2d');OrbitArt.world(ctx,{biome,id:biome},80,80,79);return c.toDataURL();}));assert.equal(new Set(hashes).size,10);
const stars=await p.evaluate(()=>['yellow','red-dwarf','blue-giant','pulsar'].map(kind=>{const c=document.createElement('canvas');c.width=c.height=160;OrbitArt.star(c.getContext('2d'),kind,80,80,45);return c.toDataURL();}));assert.equal(new Set(stars).size,4);assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'cartoon-artifacts/art-family-report.json'),JSON.stringify({interior:true,modules:8,worlds:10,galaxies:true,cargoPicking:true,resourcesPreserved:true,errors},null,2));await b.close();console.log('PASS illustrated interior, module detail, ten distinct biomes, galaxy map and unchanged game progress');})().catch(e=>{console.error(e);process.exit(1)});
