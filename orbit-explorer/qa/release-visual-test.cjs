'use strict';
const {chromium}=require('./node_modules/playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const [width,height] of [[320,568],[390,844]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:width===320?1:2,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:8765/');await page.waitForFunction(()=>window.orbitApp);
 const assets=await page.evaluate(async()=>Promise.all(Object.entries(OrbitIllustrations).map(async([key,src])=>{const im=new Image();im.src=src;await im.decode();return {key,w:im.naturalWidth,h:im.naturalHeight};})));
 assert.equal(assets.length,13);assert(assets.every(a=>a.w>0&&a.h>0));
 await page.locator('[data-story-action=skip]').click();await page.locator('[data-guide-skip]').click();
 await page.waitForTimeout(400);
 const canvas=page.locator('#og-canvas'),rendered=await canvas.evaluate(c=>({w:c.width,css:c.clientWidth,frame:c.toDataURL()}));
 assert(Math.abs(rendered.w-rendered.css*(width===320?1:2))<=1,'canvas retains device resolution');
 await page.waitForTimeout(150);assert.equal(await canvas.evaluate(c=>c.toDataURL()),rendered.frame,'reduced motion has no ambient animation');
 assert.equal(await page.locator('[data-action=scan] .og-control-symbol').count(),1);
 await page.getByRole('button',{name:'Analisar planeta',exact:true}).click();
 assert.equal(await page.locator('[data-action=dock] .og-control-symbol').count(),1);
 await page.getByRole('button',{name:'Ancorar no planeta',exact:true}).click();
 assert.equal(await page.locator('[data-action=sites] .og-control-symbol').count(),1);
 assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
 const geometry=await page.evaluate(()=>{const fake=Object.create(OrbitScene.prototype),s=orbitApp.getState();fake.state={modules:s.equipped,resources:{...s.resources},shipColor:s.ship.color};fake.update();const a=fake.ship;fake.update({resources:{...s.resources,fuel:1,credits:987}});const same=fake.ship===a;fake.update({resources:{...s.resources,oxygen:s.resources.oxygen+1}});return {same,changed:fake.ship!==a};});assert.deepEqual(geometry,{same:true,changed:true});
 fs.mkdirSync(__dirname+'/release-artifacts',{recursive:true});await page.screenshot({path:__dirname+'/release-artifacts/controls-'+width+'.png',animations:'disabled'});assert.deepEqual(errors,[]);await context.close();
}
await browser.close();console.log('PASS 13 artwork assets decode; pictorial controls accessible/clickable; fixed mobile layout; ship geometry reused only when safe.');})().catch(e=>{console.error(e);process.exit(1)});
