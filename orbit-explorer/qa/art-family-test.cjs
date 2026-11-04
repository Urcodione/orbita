const {chromium}=require('./node_modules/playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{const d=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...args){for(const [k,v]of Object.entries(window.OrbitArt?.images||{}))if(im===v){window.artCalls??={};window.artCalls[k]=(window.artCalls[k]||0)+1;}return d.call(this,im,...args);};});await p.goto('file://'+path.resolve(__dirname,'../index.html'));await p.waitForFunction(()=>window.OrbitArt&&Object.keys(OrbitArt.images).every(OrbitArt.ready));
// A new game opens with the story intro and the guided first expedition; skip both to reach the free ship view.
await p.locator('[data-story-action=skip]').click();await p.locator('[data-guide-skip]').click();
const before=await p.evaluate(()=>JSON.stringify(orbitApp.getState()));await p.locator('.og-tabs [data-tab=ship]').click();/* The exterior no longer shows an "Abrir nave" button: tapping the rocket drawing opens the hull. */await p.locator('#og-canvas').click();await p.waitForFunction(()=>orbitApp.getView().shipDetail.mode==='interior');await p.waitForFunction(()=>window.artCalls?.interior>0&&window.artCalls?.modules>0);
assert.equal(await p.locator('.og-module-hotspot:visible').count(),8);
await p.screenshot({path:path.join(__dirname,'cartoon-artifacts/painted-interior.png')});
// Tapping a module drawing opens its card over the open ship (no close-up); the card shows the painted module, and the
// Depósito card opens each stock.
await p.locator('[data-module-focus=engine]:visible').click();await p.waitForFunction(()=>orbitApp.getView().sheet==='system-module'&&orbitApp.getView().systemType==='engine');
assert.ok(await p.locator('.og-module-code.og-painted-module').count(),'Module card shows the painted module');assert.equal(await p.evaluate(()=>orbitApp.getView().shipDetail.mode),'interior');
await p.screenshot({path:path.join(__dirname,'cartoon-artifacts/painted-engine.png')});await p.locator('[data-action=close-sheet]:visible').first().click();
for(const resource of ['ore','crystals','oxygen']){
 await p.locator('[data-module-focus=cargo]:visible').click();await p.waitForFunction(()=>orbitApp.getView().systemType==='cargo');
 for(let n=0;n<6&&!await p.locator(`[data-cargo=${resource}]:visible`).count();n++)await p.locator('[data-sheet-page="1"]:visible:not(:disabled)').click();
 await p.locator(`[data-cargo=${resource}]:visible`).click();
 assert.equal(await p.evaluate(()=>orbitApp.getView().sheet),'cargo-content');assert.equal(await p.evaluate(()=>orbitApp.getView().cargoResource),resource);
 for(let n=0;n<3&&await p.getByRole('dialog').count();n++)await p.keyboard.press('Escape');
}
assert.deepEqual(JSON.parse(await p.evaluate(()=>JSON.stringify(orbitApp.getState()))),JSON.parse(before),'Module and cargo cards change no resources or equipment');
await p.locator('.og-tabs [data-tab=galaxy]').click();await p.locator('[data-map-level=galaxy]').click();await p.waitForFunction(()=>window.artCalls?.galaxies>0&&window.artCalls?.stars>0);await p.screenshot({path:path.join(__dirname,'cartoon-artifacts/painted-current-galaxy.png')});await p.locator('[data-map-level=universe]').click();await p.waitForFunction(()=>window.artCalls?.phenomena>0);await p.screenshot({path:path.join(__dirname,'cartoon-artifacts/painted-galaxies.png')});
const stock=await p.evaluate(()=>JSON.stringify(orbitApp.getState()));await p.locator('[data-action=catalog]').click();assert.equal(await p.evaluate(()=>JSON.stringify(orbitApp.getState())),stock);
// Each generated biome remains visually distinguishable, rendered with a stable seed.
const hashes=await p.evaluate(()=>['forest','volcanic','ice','desert','ocean','crystal','gas','magma','toxic','rogue'].map(biome=>{const c=document.createElement('canvas');c.width=c.height=160;const ctx=c.getContext('2d');OrbitArt.world(ctx,{biome,id:biome},80,80,79);return c.toDataURL();}));assert.equal(new Set(hashes).size,10);
const stars=await p.evaluate(()=>['yellow','red-dwarf','blue-giant','pulsar'].map(kind=>{const c=document.createElement('canvas');c.width=c.height=160;OrbitArt.star(c.getContext('2d'),kind,80,80,45);return c.toDataURL();}));assert.equal(new Set(stars).size,4);assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'cartoon-artifacts/art-family-report.json'),JSON.stringify({interior:true,modules:8,worlds:10,galaxies:true,cargoCards:true,resourcesPreserved:true,errors},null,2));await b.close();console.log('PASS illustrated interior, module detail, ten distinct biomes, galaxy map and unchanged game progress');})().catch(e=>{console.error(e);process.exit(1)});
