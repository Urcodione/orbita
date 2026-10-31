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
async function delay() { await page.waitForTimeout(150); }
(async () => {
 browser = await chromium.launch({executablePath:'/usr/bin/google-chrome', headless:true, args:['--no-sandbox','--disable-dev-shm-usage']});
 const context = await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 page = await context.newPage();
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
 await test('Help is accessible and closes with Escape',async()=>{
   await page.getByRole('button',{name:'Como jogar',exact:true}).click();
   assert.ok(await page.getByRole('dialog').isVisible());
   assert.ok((await page.getByRole('dialog').innerText()).length>100);
   await page.keyboard.press('Escape');
   assert.equal(await page.getByRole('dialog').count(),0);
 });
 // A failing help-close should not block the play-through.
 if(await page.locator('#og-dialog:not([hidden])').count()) await page.evaluate(()=>document.getElementById('og-dialog').hidden=true);
 await test('Scan reveals planet analysis',async()=>{
   const before=await state();
   await action('scan').click(); await delay();
   const after=await state(),planet=after.galaxy.planets.find(p=>p.id===after.location.planetId);
   assert.equal(planet.scanned,true);assert.equal(after.progress.scans,before.progress.scans+1);
   const panel=await page.locator('#og-sidebar').innerText();
   assert.ok(panel.includes(planet.atmosphere));
   assert.ok(panel.includes(String(planet.temperature)));
   assert.ok(panel.includes(String(planet.radiation)));
 });
 await test('Dock exposes explorable sites',async()=>{
   await action('dock').click(); await delay();
   assert.equal((await state()).location.mode,'docked');
   assert.ok(await page.locator('[data-action="explore"]:visible').count()>0);
 });
 let recovered;
 await test('Explore awards resources and recovered module',async()=>{
   const before=await state(); await action('explore').click();await delay();
   const after=await state();
   assert.equal(after.progress.explorations,before.progress.explorations+1);
   assert.ok(after.inventory.length>before.inventory.length);
   recovered=after.inventory.find(m=>!before.inventory.some(n=>n.id===m.id));
   assert.ok(recovered);assert.equal(recovered.rarity,'rare');
   assert.ok(after.galaxy.planets.find(p=>p.id===after.location.planetId).sites.some(s=>s.explored));
   return {recovered:recovered.name,rarity:recovered.rarity};
 });
 await test('Ship inventory equips recovered module',async()=>{
   await tab('ship');
   const target=page.locator(`[data-action="equip"][data-module="${recovered.id}"]`);
   assert.ok(await target.isVisible());await target.click();await delay();
   const after=await state();assert.equal(after.equipped[recovered.type].id,recovered.id);
   assert.ok(after.progress.modulesEquipped>=1);
   assert.ok(await page.locator('#og-lower').innerText());
 });
 await test('Paint changes ship appearance state',async()=>{
   const before=await state();
   const paints=await page.locator('[data-action="paint"]').evaluateAll(es=>es.map(e=>e.dataset.color));
   const next=paints.find(c=>c.toLowerCase()!==before.ship.color.toLowerCase());
   assert.ok(next);await page.locator(`[data-action="paint"][data-color="${next}"]`).click();await delay();
   assert.equal((await state()).ship.color,next.toLowerCase());
   await page.screenshot({path:path.join(out,'desktop-ship.png'),fullPage:true});
   return {color:next};
 });
 await test('Refine converts crystals into warp fuel',async()=>{
   const before=await state();assert.ok(before.resources.crystals>=6);
   await action('refine').click();await action('refine').click();await delay();
   const after=await state();assert.equal(after.resources.warpFuel,before.resources.warpFuel+2);
   assert.equal(after.resources.crystals,before.resources.crystals-6);
 });
 await test('Launch returns ship to orbit',async()=>{
   await tab('explore');await action('launch').click();await delay();assert.equal((await state()).location.mode,'orbit');
 });
 await test('Travel changes planet and consumes normal fuel',async()=>{
   await tab('galaxy');const before=await state();
   const target=before.galaxy.planets.find(p=>p.id!==before.location.planetId);
   const travel=page.locator(`[data-action="travel"][data-planet="${target.id}"]`).first();
   if(await travel.count()) await travel.click(); else {
     const select=page.locator(`[data-select="${target.id}"]:visible`).first();await select.click();await action('travel').click();
   }
   await delay();const after=await state();assert.equal(after.location.planetId,target.id);assert.ok(after.resources.fuel<before.resources.fuel);
 });
 await test('Warp generates a distinct galaxy',async()=>{
   await tab('galaxy');const before=await state();await action('warp').click();await delay();const after=await state();
   assert.equal(after.galaxyIndex,before.galaxyIndex+1);assert.notEqual(after.galaxy.id,before.galaxy.id);
   assert.equal(after.galaxy.planets.length,6);assert.ok(after.resources.warpFuel<before.resources.warpFuel);
   assert.equal(after.mission.stage,5);return {galaxy:after.galaxy.name};
 });
 await test('Rescue recovers resources and returns safe orbit',async()=>{
   await tab('ship');const before=await state();await action('rescue-dialog').click();await delay();
   // Support an optional in-app confirmation while avoiding unrelated buttons.
   const confirm=page.locator('[data-action="confirm-rescue"]');if(await confirm.count())await confirm.click();
   const after=await state();assert.equal(after.location.mode,'orbit');
   assert.equal(after.galaxy.planets.find(p=>p.id===after.location.planetId).biome,'forest');
   assert.ok(after.resources.fuel>=before.resources.fuel);assert.ok(after.resources.oxygen>=before.resources.oxygen);
   assert.ok(after.resources.credits<before.resources.credits);
 });
 await test('All desktop tabs expose content without errors',async()=>{
   for(const name of ['ship','explore','galaxy','log']){await tab(name);assert.ok((await page.locator('#og-sidebar').innerText()).length>20);assert.equal(await page.locator(`.og-tabs [data-tab="${name}"]`).getAttribute('aria-pressed'),'true');}
 });
 await test('Reload preserves expedition, equipment and paint',async()=>{
   const before=await state();await page.reload();await page.waitForFunction(()=>!!window.orbitApp);const after=await state();
   assert.deepEqual(after,before);
 });
 await test('Mobile 360px layout has no horizontal overflow in all tabs',async()=>{
   await page.setViewportSize({width:360,height:900});
   const widths=[];
   for(const name of ['explore','ship','galaxy','log']){
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
