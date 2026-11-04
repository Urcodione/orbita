const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const out = path.join(__dirname, 'artifacts');
fs.mkdirSync(out, {recursive:true});
const url = process.argv[2] || 'file://' + path.resolve(__dirname, '../index.html');
const results = [], runtimeErrors = [], consoleErrors = [];
let browser, page;
const state = () => page.evaluate(() => window.orbitApp.getState());
const action = name => page.locator(`[data-action="${name}"]:visible`).first();
async function test(name, fn) {
  try { const details = await fn(); results.push({name, passed:true, ...(details ? {details}: {})}); console.log('PASS',name); }
  catch(error) { results.push({name,passed:false,error:error.message}); console.error('FAIL', name, error.message); }
}
async function tab(name) {await page.locator(`.og-tabs [data-tab="${name}"]`).click();}
// Fixed-screen panels paginate: a control may sit on a later page of the open sheet.
async function sheetControl(selector) {
  const live=()=>page.locator(selector+':visible:not([inert] *)').first();
  for(let i=0;i<20;i++){if(await live().count()){await live().click();await page.waitForTimeout(120);return;}const next=page.locator('[data-sheet-page="1"]:visible');if(!await next.count()||await next.isDisabled())break;await next.click();await page.waitForTimeout(80);}
  throw new Error('Control unreachable: '+selector);
}
// The closed hull has no "open" button any more: tapping the painted ship opens it.
async function openInterior() {
  if(await page.getByRole('dialog').count()) await sheetControl('[data-action="close-sheet"]');
  await tab('ship');const mode=()=>page.evaluate(()=>orbitApp.getView().shipDetail.mode);
  if(await mode()==='module') await action('ship-back').click();
  if(await mode()==='exterior'){await page.locator('#og-canvas').click();await page.waitForFunction(()=>orbitApp.getView().shipDetail.mode==='interior');}
}
function solveRotors(dials,target){for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){const counts=[a,b,c],next=dials.slice();for(let i=0;i<3;i++){next[i]=(next[i]+counts[i])%4;next[(i+1)%3]=(next[(i+1)%3]+counts[i])%4;}if(next.every((v,i)=>v===target[i]))return counts;}throw new Error('Rotor puzzle has no solution');}
// The first expedition follows its protected trail: two beacons triangulate the core, then the cargo is extracted at base.
async function playFirstExpedition() {
  const move=async(x,y)=>{await page.locator(`[data-expedition-x="${x}"][data-expedition-y="${y}"]:visible`).click();await page.waitForTimeout(80);};
  const beacon=async()=>{if(await action('expeditionBeacon').count())await action('expeditionBeacon').click();};
  const ex=(await state()).expedition;assert.ok(ex?.firstExpedition,'Descending launches the first expedition');assert.deepEqual([ex.x,ex.y],[2,5]);
  await beacon();for(let y=4;y>=0;--y){await move(2,y);await beacon();}await move(3,0);assert.equal((await state()).expedition.beacons.length,2,'Both beacons active');
  await action('expeditionInteract').click();const puzzle=(await state()).expedition.puzzle,counts=solveRotors(puzzle.dials,puzzle.target);
  for(let i=0;i<3;i++)for(let n=0;n<counts[i];n++)await sheetControl(`[data-action="expeditionTune"][data-index="${i}"]`);
  await sheetControl('[data-action="expeditionRecover"]');if(await page.evaluate(()=>orbitApp.getView().sheet)==='expedition-risk-confirm')await sheetControl('[data-action="confirm-field-action"]');
  assert.ok((await state()).expedition.coreRecovered);if(await page.getByRole('dialog').count())await sheetControl('[data-action="close-sheet"]');
  if(!(await page.evaluate(()=>OrbitEngine.expeditionReturnRoute(orbitApp.getState()).canReturn))){await action('expedition-return').click();await sheetControl('[data-action="overdrive-menu"]');await sheetControl('[data-action="expeditionOverdrive"]');if(await page.getByRole('dialog').count())await sheetControl('[data-action="close-sheet"]');}
  await move(2,0);for(let y=1;y<=5;y++)await move(2,y);await action('expeditionExtract').click();await page.waitForTimeout(150);assert.equal((await state()).expedition,null);
  if(await page.getByRole('dialog').count())await sheetControl('[data-action="close-sheet"]');
}
async function delay() { await page.waitForTimeout(150); }
(async () => {
 browser = await chromium.launch({executablePath:'/usr/bin/google-chrome', headless:true, args:['--no-sandbox','--disable-dev-shm-usage']});
 const context = await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 page = await context.newPage(); page.setDefaultTimeout(10000);
 page.on('pageerror', e=>runtimeErrors.push(e.message));
 page.on('console', e=>{if(e.type()==='error') consoleErrors.push(e.text());});
 await page.goto(url); await page.waitForFunction(()=>!!window.orbitApp); await delay();
 await test('Standalone local file loads and canvas renders',async()=>{
   assert.equal(await page.locator('#orbit-game').count(),1);
   const dimensions=await page.locator('#og-canvas').evaluate(e=>({w:e.width,h:e.height}));
   assert.ok(dimensions.w>0&&dimensions.h>0);
   assert.equal((await state()).location.mode,'orbit');
   await page.screenshot({path:path.join(out,'desktop-initial.png'),fullPage:true});
   return {url,canvas:dimensions};
 });
 // A new game opens on the illustrated story and the guided Prisma training; this play-through covers the free game.
 await page.locator('[data-story-action="skip"]').click(); await page.locator('[data-guide-skip]').click(); await delay();
 await test('Help is accessible and closes with Escape',async()=>{
   // Help now lives in the game menu; Escape steps back through the panel hierarchy (help → menu → game).
   await action('menu').click(); await action('help').click();
   assert.ok(await page.getByRole('dialog').isVisible());
   assert.ok((await page.getByRole('dialog').innerText()).length>100);
   await page.keyboard.press('Escape'); assert.equal((await page.evaluate(()=>orbitApp.getView().sheet)),'menu');
   await page.keyboard.press('Escape');
   assert.equal(await page.getByRole('dialog').count(),0);
 });
 // A failing help-close should not block the play-through.
 if(await page.getByRole('dialog').count()) await sheetControl('[data-action="close-sheet"]');
 await test('Scan reveals planet analysis',async()=>{
   const before=await state();
   await action('scan').click(); await delay();
   const after=await state(),planet=after.galaxy.planets.find(p=>p.id===after.location.planetId);
   assert.equal(planet.scanned,true);assert.equal(after.progress.scans,before.progress.scans+1);
   // The scan now opens the landing-site panel, which compares the world's readings with the ship's protection.
   // (The atmosphere line moved to the full planet analysis, offered once every site is explored.)
   assert.equal(await page.evaluate(()=>orbitApp.getView().sheet),'sites');
   const panel=await page.getByRole('dialog').innerText();
   assert.ok(panel.includes(planet.temperature+' °C'),'temperature shown');
   assert.ok(panel.includes(planet.radiation+' rad'),'radiation shown');
 });
 await test('Site panel exposes explorable sites',async()=>{
   const planet=await page.evaluate(()=>OrbitEngine.currentPlanet(orbitApp.getState()));
   assert.equal(await page.locator('[data-pick-site]:visible').count(),planet.sites.length);
   for(const site of planet.sites) assert.ok((await page.getByRole('dialog').innerText()).includes(site.name));
   assert.ok(await page.locator('#og-sheet-backdrop [data-action="explore"]:visible').isEnabled());
 });
 let recovered;
 await test('Explore awards resources and recovered module',async()=>{
   // Descending launches the surface vehicle; the reward is only banked when the cargo is extracted at base.
   const before=await state(); await page.locator('#og-sheet-backdrop [data-action="explore"]').first().click(); await delay();
   assert.equal((await state()).location.mode,'docked');
   await playFirstExpedition();
   const after=await state();
   assert.equal(after.progress.explorations,before.progress.explorations+1);
   assert.ok(after.inventory.length>before.inventory.length);
   recovered=after.inventory.find(m=>!before.inventory.some(n=>n.id===m.id));
   assert.ok(recovered);assert.equal(recovered.rarity,'rare');
   assert.ok(['ore','crystals','data'].some(k=>after.resources[k]>before.resources[k]),'Extraction banks resources');
   assert.ok(after.galaxy.planets.find(p=>p.id===after.location.planetId).sites.some(s=>s.explored));
   return {recovered:recovered.name,rarity:recovered.rarity};
 });
 await test('Ship inventory equips recovered module',async()=>{
   // Installing goes through the open ship's storage: the module card → Compare → Install.
   await openInterior(); await sheetControl('[data-action="modules"]');
   await sheetControl(`[data-action="stored-module"][data-module="${recovered.id}"]`);
   await sheetControl('[data-action="compare-module"]'); await sheetControl(`[data-action="equip"][data-module="${recovered.id}"]`);
   const after=await state();assert.equal(after.equipped[recovered.type].id,recovered.id);
   assert.ok(after.progress.modulesEquipped>=1);
   if(await page.getByRole('dialog').count()) await sheetControl('[data-action="close-sheet"]');
   assert.ok(await page.locator('#og-stage').innerText());
 });
 await test('Paint changes ship appearance state',async()=>{
   const before=await state();
   await openInterior(); await sheetControl('[data-action="customize"]');
   const paints=await page.locator('[data-action="paint"]').evaluateAll(es=>es.map(e=>e.dataset.color));
   const next=paints.find(c=>c.toLowerCase()!==before.ship.color.toLowerCase());
   assert.ok(next);await page.locator(`[data-action="paint"][data-color="${next}"]`).click();await delay();
   assert.equal((await state()).ship.color,next.toLowerCase());
   await page.screenshot({path:path.join(out,'desktop-ship.png'),fullPage:true});
   await sheetControl('[data-action="close-sheet"]');
   return {color:next};
 });
 await test('Refine converts crystals into warp fuel',async()=>{
   // Refining now costs 24 ore + 3 crystals per cell; a first expedition's haul does not cover two cells, so the
   // reserves are topped up (as a station purchase would) before using the workshop's maintenance service.
   await page.evaluate(()=>{const r=orbitApp.getState().resources;r.ore=Math.max(r.ore,48);r.crystals=Math.max(r.crystals,6);});
   const before=await state();assert.ok(before.resources.crystals>=6);
   await openInterior(); await sheetControl('[data-action="workshop"]'); await sheetControl('[data-action="maintenance"]'); await sheetControl('[data-maintenance="refine"]');
   await sheetControl('[data-action="refine"]'); await sheetControl('[data-action="refine"]'); await delay();
   const after=await state();assert.equal(after.resources.warpFuel,before.resources.warpFuel+2);
   assert.equal(after.resources.crystals,before.resources.crystals-6);assert.equal(after.resources.ore,before.resources.ore-48);
   await sheetControl('[data-action="close-sheet"]');
 });
 await test('Launch returns ship to orbit',async()=>{
   await tab('explore');await action('launch').click();await delay();assert.equal((await state()).location.mode,'orbit');
 });
 await test('Travel changes planet and consumes normal fuel',async()=>{
   await tab('galaxy');const before=await state();
   const here=before.galaxy.planets.find(p=>p.id===before.location.planetId);
   const target=before.galaxy.planets.find(p=>p.id!==here.id&&p.systemId===here.systemId);
   await page.locator('[data-map-level="system"]:visible').first().click();
   await page.locator(`[data-select="${target.id}"]:visible`).click();await action('route-info').click();await sheetControl(`[data-action="travel"][data-planet="${target.id}"]`);
   await delay();const after=await state();assert.equal(after.location.planetId,target.id);assert.ok(after.resources.fuel<before.resources.fuel);
   if(await page.getByRole('dialog').count()) await sheetControl('[data-action="close-sheet"]');
 });
 await test('Warp generates a distinct galaxy',async()=>{
   await tab('galaxy');await page.locator('[data-map-level="universe"]:visible').first().click();const held=await state();
   // In the campaign each chapter holds the next jump until its module is built: the jump panel says so and spends nothing.
   await action('warp-menu').click();assert.match(await page.getByRole('dialog').innerText(),/construir o módulo deste capítulo/i);
   assert.equal(await page.locator('#og-sheet-backdrop [data-action="warp"]').isDisabled(),true);assert.deepEqual(await state(),held);
   await sheetControl('[data-action="close-sheet"]');
   // Defer the campaign to a far galaxy (a valid state) so the ordinary jump itself can be exercised.
   await page.evaluate(()=>{const c=orbitApp.getState().campaign;c.start=64;c.target=null;c.sites=[];c.samples=0;});
   const before=await state();await action('warp-menu').click();await sheetControl('[data-action="warp"]');await delay();const after=await state();
   assert.equal(after.galaxyIndex,before.galaxyIndex+1);assert.notEqual(after.galaxy.id,before.galaxy.id);assert.notEqual(after.galaxy.name,before.galaxy.name);
   assert.ok(after.galaxy.systems.length>=3&&after.galaxy.planets.length>=after.galaxy.systems.length);assert.ok(after.resources.warpFuel<before.resources.warpFuel);
   if(await page.getByRole('dialog').count()) await sheetControl('[data-action="close-sheet"]');
   return {galaxy:after.galaxy.name};
 });
 await test('Rescue recovers resources and returns safe orbit',async()=>{
   // Rescue is an emergency service now: refused while the ship can continue, offered once it is stranded.
   await openInterior();await sheetControl('[data-action="workshop"]');
   assert.equal(await page.locator('[data-action="rescue-menu"]:visible').isDisabled(),true);
   await sheetControl('[data-action="close-sheet"]');
   await page.evaluate(()=>{orbitApp.getState().resources.oxygen=2;});
   const before=await state();await openInterior();await sheetControl('[data-action="workshop"]');await sheetControl('[data-action="rescue-menu"]');await sheetControl('[data-action="rescue"]');await delay();
   const after=await state();assert.equal(after.location.mode,'orbit');
   assert.equal(after.galaxy.planets.find(p=>p.id===after.location.planetId).biome,'forest');
   assert.ok(after.resources.fuel>=before.resources.fuel);assert.ok(after.resources.oxygen>=before.resources.oxygen);
   assert.ok(after.resources.credits<before.resources.credits);
   if(await page.getByRole('dialog').count()) await sheetControl('[data-action="close-sheet"]');
 });
 await test('All desktop tabs expose content without errors',async()=>{
   for(const name of ['ship','explore','galaxy','expedition']){await tab(name);assert.ok((await page.locator('#og-stage').innerText()).length>20);assert.equal(await page.locator(`.og-tabs [data-tab="${name}"]`).getAttribute('aria-pressed'),'true');}
 });
 await test('Reload preserves expedition, equipment and paint',async()=>{
   const before=await state();await page.reload();await page.waitForFunction(()=>!!window.orbitApp);const after=await state();
   assert.deepEqual(after,before);
 });
 await test('Mobile 360px layout has no horizontal overflow in all tabs',async()=>{
   await page.setViewportSize({width:360,height:900});
   const widths=[];
   for(const name of ['explore','ship','galaxy','expedition']){
     await tab(name);await delay();const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,game:document.getElementById('orbit-game').scrollWidth}));
     widths.push({tab:name,...size});assert.ok(size.document<=size.viewport,JSON.stringify(size));assert.ok(size.game<=size.viewport,JSON.stringify(size));
     await page.screenshot({path:path.join(out,`mobile-${name}.png`),fullPage:true});
   }return widths;
 });
 await test('No browser runtime or console errors',async()=>{assert.deepEqual(runtimeErrors,[]);assert.deepEqual(consoleErrors,[]);});
 await browser.close();
 const report={url,results,runtimeErrors,consoleErrors,passed:results.every(r=>r.passed)};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:report.passed,checks:results.length,failed:results.filter(r=>!r.passed).map(r=>r.name),report:path.join(out,'report.json')}));
 process.exitCode=report.passed?0:1;
})().catch(async error=>{console.error(error);fs.writeFileSync(path.join(out,'fatal.json'),JSON.stringify({error:error.stack,results,runtimeErrors,consoleErrors},null,2));if(browser)await browser.close();process.exitCode=1;});
