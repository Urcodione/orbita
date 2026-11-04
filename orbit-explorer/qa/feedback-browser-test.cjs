'use strict';
const {solveCounts}=require('./expedition-helpers.cjs');
// Like expedition-helpers' completeTutorialExpedition, but adventure sites now require triangulating the signal at both
// terrain beacons (on the tutorial column at rows 4 and 2) before the core circuit opens. Drives visible controls only.
async function completeTutorialExpedition(page){
 const click=action=>page.locator(`[data-action="${action}"]:visible`).first().click();
 const move=(x,y)=>page.locator(`[data-expedition-x="${x}"][data-expedition-y="${y}"]:visible`).click();
 const before=await page.evaluate(()=>orbitApp.getState());assert.ok(before.expedition?.firstExpedition,'first expedition only');assert.equal(before.expedition.x,2);assert.equal(before.expedition.y,5);
 for(let y=4;y>=0;--y){await move(2,y);if(y===4||y===2)await click('expeditionBeacon');}
 assert.equal(await page.evaluate(()=>orbitApp.getState().expedition.beacons.length),2,'both beacons triangulated');
 await move(3,0);await click('expeditionInteract');
 const puzzle=await page.evaluate(()=>orbitApp.getState().expedition.puzzle),counts=solveCounts(puzzle.dials,puzzle.target);
 for(let i=0;i<3;i++)for(let n=0;n<counts[i];n++)await page.locator(`[data-action="expeditionTune"][data-index="${i}"]:visible`).click();
 await click('expeditionRecover');assert.ok(await page.evaluate(()=>orbitApp.getState().expedition.coreRecovered));
 await move(2,0);for(let y=1;y<=5;y++)await move(2,y);await click('expeditionExtract');
 const after=await page.evaluate(()=>orbitApp.getState());assert.equal(after.expedition,null);assert.equal(after.progress.explorations,before.progress.explorations+1);
}
const {chromium}=require('./node_modules/playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});fs.mkdirSync(__dirname+'/feedback-artifacts',{recursive:true});
 for(const [width,height] of [[320,568],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const click=async selector=>{for(let i=0;i<15;i++){const el=p.locator(selector+':visible').first();if(await el.count()){await el.click();return;}const next=p.locator('[data-sheet-page="1"]:visible:not(:disabled)');assert(await next.count(),'missing '+selector);await next.click();}throw Error(selector);};
  await p.goto('http://localhost:8765/');await p.waitForFunction(()=>window.orbitApp);await p.locator('[data-story-action=skip]').waitFor();await click('[data-story-action=skip]');await p.locator('[data-guide-skip]').waitFor();await click('[data-guide-skip]');
  assert.equal(await p.locator('.og-resource .og-gauge-icon').count(),3);assert(await p.getByRole('button',{name:/Combustível:.*Ver recursos/}).count());assert(await p.locator('.og-journey-track').isVisible());
  const bounds=await p.evaluate(()=>{const h=document.querySelector('#og-heading').getBoundingClientRect(),c=document.querySelector('#og-context').getBoundingClientRect();return {heading:h.bottom,context:c.top,scroll:document.documentElement.scrollHeight,height:innerHeight};});assert(bounds.heading<bounds.context,'goal must not overlap planet controls');assert(bounds.scroll<=bounds.height,'no outer scroll');
  await p.screenshot({animations:'disabled',path:__dirname+'/feedback-artifacts/explore-'+width+'.png'});
  const initial=await p.evaluate(()=>JSON.stringify(orbitApp.getState()));await click('[data-action=journey]');assert(await p.locator('.og-journey-banner').count());await click('.og-journey-banner');assert.equal(await p.evaluate(()=>orbitApp.getView().sheet),'campaign');await click('.og-place-exit');assert.equal(await p.evaluate(()=>orbitApp.getView().sheet),'journey');await p.screenshot({animations:'disabled',path:__dirname+'/feedback-artifacts/goal-'+width+'.png'});await click('[data-action=campaign-route]');assert.equal(await p.evaluate(()=>orbitApp.getView().tab),'galaxy');assert.equal(await p.evaluate(()=>JSON.stringify(orbitApp.getState())),initial,'route preview must not spend or grant anything');
  // Scanning now opens the descent sheet directly; descending (explore) anchors the ship, and the departure cost is a text summary.
  await click('.og-tabs [data-tab=explore]');await click('[data-action=scan]');assert.equal(await p.evaluate(()=>orbitApp.getView().sheet),'sites');await click('[data-pick-site="g0-p0-s0"]');assert.equal(await p.locator('[data-pick-site="g0-p0-s0"]').getAttribute('aria-pressed'),'true');
  const fuel=await p.evaluate(()=>orbitApp.getState().resources.fuel),descent=await p.locator('.og-descent-note').allInnerTexts().then(t=>t.join('\n')),exitFuel=Number(descent.match(/saída:[^\n]*?(\d+) comb/)?.[1]),afterFuel=Number(descent.match(/Após descer: (\d+) combustível/)?.[1]);assert(exitFuel>0,'departure fuel cost shown: '+descent);assert.equal(afterFuel,fuel-exitFuel,'remaining fuel preview');await p.screenshot({animations:'disabled',path:__dirname+'/feedback-artifacts/departure-'+width+'.png'});
  await click('[data-action=explore][data-site="g0-p0-s0"]');assert.equal(await p.evaluate(()=>orbitApp.getState().resources.fuel),fuel-exitFuel,'paid departure matches preview');
  await p.evaluate(()=>{orbitApp.act('expeditionMove',{x:2,y:4});orbitApp.act('expeditionMove',{x:1,y:4});orbitApp.act('expeditionCollect');orbitApp.act('expeditionMove',{x:2,y:4});orbitApp.act('expeditionMove',{x:2,y:5});orbitApp.act('expeditionExtract');});assert.equal(await p.evaluate(()=>orbitApp.getView().sheet),'reward');assert.equal(await p.evaluate(()=>OrbitEngine.campaignView(orbitApp.getState()).active.sitesDone),0,'resources-only extraction confirms no signal');
  // The story receipt was replaced by the 'Carga entregue' delivery receipt: items + what changed, no unique discovery.
  assert(await p.locator('.og-delivery-item').count());assert.equal(await p.locator('.og-delivery-special').count(),0);assert.match(await p.locator('.og-delivery-progress').innerText(),/Montagem de .*componentes a bordo|Carga armazenada/);assert.equal(await p.evaluate(()=>orbitApp.getView().tab),'explore');await p.screenshot({animations:'disabled',path:__dirname+'/feedback-artifacts/return-'+width+'.png'});
  await click('[data-action=close-sheet]');const spent=await p.evaluate(()=>orbitApp.getState().resources.fuel);await p.reload();await p.waitForFunction(()=>window.orbitApp);await click('[data-action=sites]');await click('[data-action=explore][data-site="g0-p0-s0"]');assert((await p.evaluate(()=>orbitApp.getState().resources.fuel))<spent);
  await completeTutorialExpedition(p);assert.equal(await p.evaluate(()=>orbitApp.getView().tab),'explore');assert.equal(await p.evaluate(()=>orbitApp.getView().sheet),'reward');assert.equal(await p.evaluate(()=>OrbitEngine.campaignView(orbitApp.getState()).active.sitesDone),1,'core extraction confirms the first signal');assert(await p.locator('.og-delivery-special').count(),'recovered module shown');assert((await p.locator('.og-delivery-progress').innerText()).length>10,'consequence explained');await p.screenshot({animations:'disabled',path:__dirname+'/feedback-artifacts/progress-'+width+'.png'});await click('[data-action=close-sheet]');assert.match(await p.locator('.og-journey-local').innerText(),/1\/4/);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS pictograms, goal/map preview, paid departure/re-entry, no-progress debrief and fixed layout '+width+'x'+height);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
