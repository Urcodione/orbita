const {chromium}=require('playwright');
// Rotor counts that align a coupled-rotor puzzle (turning one rotor also turns the next).
function solveCounts(dials,target){for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){const counts=[a,b,c],next=dials.slice();for(let i=0;i<3;i++){next[i]=(next[i]+counts[i])%4;next[(i+1)%3]=(next[(i+1)%3]+counts[i])%4;}if(next.every((v,i)=>v===target[i]))return counts;}throw new Error('Generated rotor puzzle has no solution');}
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path');
const out=path.join(__dirname,'mobile-artifacts');fs.mkdirSync(out,{recursive:true});
const url='file://'+path.resolve(__dirname,'../index.html');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1024,height:950}});const page=await context.newPage();
 const errors=[],results=[];const listen=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error')errors.push(e.text());});};listen(page);
 const state=(p=page)=>p.evaluate(()=>window.orbitApp.getState());
 const sheet=(p=page)=>p.evaluate(()=>window.orbitApp.getView().sheet);
 const click=(action,p=page)=>p.locator(`[data-action="${action}"]:visible`).first().click();
 const tab=(name,p=page)=>p.locator(`.og-tabs [data-tab="${name}"]`).click();
 const wait=()=>page.waitForTimeout(180);
 async function test(name,fn){try{await fn();results.push({name,pass:true});console.log('PASS',name);}catch(e){results.push({name,pass:false,error:e.message});console.log('FAIL',name,e.message);await page.screenshot({path:path.join(out,'failure-'+results.length+'.png')}).catch(()=>{});}}
 // The ship's actions (parts, workshop, paint) live in the open hull: tapping the ship painting opens it.
 async function openHull(p=page){await tab('ship',p);if((await p.evaluate(()=>orbitApp.getView().shipDetail.mode))!=='interior'){await p.locator('#og-canvas').click();await p.waitForFunction(()=>orbitApp.getView().shipDetail.mode==='interior');}}
 // Drives the first expedition only through the board: the planner reads a revealed copy of the map, the played state keeps its fog.
 async function routeTo(target){return page.evaluate(target=>{const s=orbitApp.getState(),probe=OrbitEngine.restore(OrbitEngine.snapshot(s));probe.expedition.revealed=Array.from({length:36},(_,i)=>i);const v=OrbitEngine.expeditionView(probe),w=v.width,start=s.expedition.y*w+s.expedition.x,end=target.y*w+target.x,queue=[[start]],seen=new Set([start]);
  while(queue.length){const route=queue.shift(),i=route.at(-1);if(i===end)return route.slice(1).map(i=>({x:i%w,y:Math.floor(i/w)}));for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i%w+dx,y=Math.floor(i/w)+dy,n=y*w+x;if(x<0||y<0||x>=w||y>=v.height||seen.has(n)||['wall','hazard'].includes(v.cells[n].kind))continue;seen.add(n);queue.push([...route,n]);}}return null;},target);}
 async function drive(target){const route=await routeTo(target);assert.ok(route,'A safe trail reaches '+JSON.stringify(target));for(const c of route){await page.locator(`[data-expedition-x="${c.x}"][data-expedition-y="${c.y}"]:visible`).click();if(await page.locator('[data-action=expeditionBeacon]:visible').count())await click('expeditionBeacon');}}
 async function playFirstExpedition(){
  const before=await state();assert.ok(before.expedition?.firstExpedition,'first expedition');
  const plan=await page.evaluate(()=>{const s=orbitApp.getState(),probe=OrbitEngine.restore(OrbitEngine.snapshot(s));probe.expedition.revealed=Array.from({length:36},(_,i)=>i);const v=OrbitEngine.expeditionView(probe);return {beacons:v.cells.filter(c=>c.kind==='beacon'&&!c.collected).sort((a,b)=>b.y-a.y).map(c=>({x:c.x,y:c.y})),core:v.core,base:v.base};});
  for(const beacon of plan.beacons)await drive(beacon);
  await drive(plan.core);await click('expeditionInteract');
  const puzzle=(await state()).expedition.puzzle,counts=solveCounts(puzzle.dials,puzzle.target);
  for(let i=0;i<3;i++)for(let n=0;n<counts[i];n++)await page.locator(`[data-action="expeditionTune"][data-index="${i}"]:visible`).click();
  await click('expeditionRecover');const recovered=await state();assert.ok(recovered.expedition.coreRecovered);assert.deepEqual(recovered.inventory,before.inventory,'Recovered gear is pending until extraction');
  await drive(plan.base);await click('expeditionExtract');
  const after=await state();assert.equal(after.expedition,null);assert.equal(after.progress.explorations,before.progress.explorations+1);
  return after.inventory.find(m=>m.id===recovered.expedition.pending.module.id);
 }
 // A saved game prepared by the engine (intro seen, guide off), for checks that need a particular economy.
 // chapterBuilt: the first chapter's relic is taken as claimed and its Coro module is then built with the real
 // craftComponent/fabricate actions (materials topped up to each quoted cost), because warp stays locked until then.
 async function seededPage(seed,resources,chapterBuilt=false){const p=await (await browser.newContext({viewport:{width:1024,height:950}})).newPage();listen(p);await p.goto(url);await p.waitForFunction(()=>window.orbitApp);
  const valid=await p.evaluate(([seed,resources,chapterBuilt])=>{const E=OrbitEngine,s=E.create(seed);s.guide=undefined;E.dispatch(s,'campaignIntro');
   if(chapterBuilt){const act=(a,payload)=>{const q=E.preview(s,a,payload);for(const [k,v] of Object.entries(q.cost||{}))if((s.resources[k]||0)<v)s.resources[k]=v;const r=E.dispatch(s,a,payload);if(!r.ok)throw Error(a+': '+r.message);};
    const prepare=req=>{for(const [id,n] of Object.entries(req||{})){const missing=Math.max(0,n-(s.components[id]||0));if(!missing)continue;prepare(Object.fromEntries(Object.entries(E.componentRecipes.find(x=>x.id===id).components||{}).map(([k,c])=>[k,c*missing])));act('craftComponent',{componentId:id,amount:missing});}};
    Object.assign(s.campaign,{claimed:1,found:1});const recipe=E.recipes.find(r=>r.id==='chorus-scanner');prepare(recipe.components);act('fabricate',{recipeId:recipe.id});if(s.campaign.chapter!==1)throw Error('chapter module not built');}
   Object.assign(s.resources,resources);localStorage.setItem('orbita-explorador-v1',JSON.stringify({state:E.snapshot(s),tab:'explore'}));return E.validate(s);},[seed,resources,chapterBuilt]);
  assert.equal(valid,true,'prepared save is a valid game state');await p.reload();await p.waitForFunction(()=>window.orbitApp);return p;}
 await page.goto(url);await page.waitForFunction(()=>window.orbitApp);await wait();
 await test('New game: story intro and guided tutorial can be skipped',async()=>{await page.locator('[data-story-action=skip]').click();await page.locator('[data-guide-skip]').click();assert.equal((await state()).guide?.active,false);assert.equal(await page.locator('[data-story-action]').count(),0);});
 await test('Portrait phone preview and single primary action',async()=>{assert.equal(await page.locator('#og-context .primary').count(),1);const b=await page.locator('#orbit-game').boundingBox();assert.equal(b.width,390);assert.equal(b.height,812);await page.screenshot({path:path.join(out,'phone-initial.png'),fullPage:true});});
 await test('Analyze opens the exploration sites with one descent action',async()=>{await click('scan');assert.equal((await state()).galaxy.planets[0].scanned,true);assert.equal(await sheet(),'sites');assert.equal(await page.locator('[data-pick-site]').count(),3);assert.equal(await page.locator('#og-sheet-backdrop [data-action=explore]').count(),1);});
 let module;
 await test('Explore terrain, recover and extract: the module arrives in storage',async()=>{const before=await state();await page.locator('#og-sheet-backdrop [data-action=explore]').click();assert.equal((await state()).location.mode,'docked','descending anchors the ship');module=await playFirstExpedition();assert.ok(module);assert.ok((await page.getByRole('dialog').innerText()).includes(module.name));await page.screenshot({path:path.join(out,'phone-discovery.png'),fullPage:true});assert.deepEqual((await state()).equipped,before.equipped,'nothing is installed automatically');await page.locator('[role=dialog] [data-action=close-sheet]:visible').last().click();assert.equal(await page.getByRole('dialog').count(),0);});
 await test('Module drawer tabs and inventory swap',async()=>{await openHull();await click('modules');await page.locator('[data-inventory=equipped]').click();assert.equal(await page.locator('#og-sheet-backdrop .og-module-tile[data-module-focus]').count(),8);await page.locator('[data-inventory=inventory]').click();const old=(await state()).equipped[module.type];await page.locator(`[data-action=stored-module][data-module="${module.id}"]`).click();await click('compare-module');await click('equip');const s=await state();assert.equal(s.equipped[module.type].id,module.id);assert.ok(s.inventory.some(m=>m.id===old.id),'the replaced module returns to storage');assert.equal(await sheet(),'modules');assert.ok(await page.locator('#og-delta[role=status]:visible').count(),'installation reports what changed');await click('close-sheet');});
 await test('Paint and rename in custom panel',async()=>{await click('customize');await page.locator('[data-color="#71bdc4"]').click();await page.locator('#og-name').fill('Vento Solar');await page.locator('#og-name-form button').click();const s=await state();assert.equal(s.ship.color,'#71bdc4');assert.equal(s.ship.name,'Vento Solar');await click('close-sheet');await page.screenshot({path:path.join(out,'phone-ship.png'),fullPage:true});});
 await test('Workshop available without crowding ship screen',async()=>{assert.equal(await page.locator('[data-action=refuel]').count(),0);await click('workshop');await click('maintenance');const fuel=(await state()).resources.fuel;await click('refuel');assert.ok((await state()).resources.fuel>fuel);await click('close-sheet');});
 await test('Planet environment in optional sheet',async()=>{await tab('explore');await click('environment');assert.ok((await page.getByRole('dialog').innerText()).includes('Temperatura'));await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);await click('launch');assert.equal((await state()).location.mode,'orbit');});
 await test('Map selects and travels',async()=>{await tab('galaxy');const s=await state(),dest=s.galaxy.planets[1];await page.locator(`[data-select="${dest.id}"]`).click();await page.screenshot({path:path.join(out,'phone-map.png'),fullPage:true});await click('route-info');await click('travel');assert.equal((await state()).location.planetId,dest.id);});
 await test('Refine and warp in focused drawer',async()=>{const p=await seededPage('mobile-warp',{ore:60,crystals:10,warpFuel:1},true);try{
  await click('status',p);await click('workshop',p);await click('maintenance',p);await p.locator('[data-maintenance=refine]').click();await click('refine',p);await click('refine',p);assert.equal((await state(p)).resources.warpFuel,3);await click('close-sheet',p);
  await tab('galaxy',p);await p.locator('#og-map-levels [data-map-level=universe]').click();await click('warp-menu',p);const old=(await state(p)).galaxyIndex;await click('warp',p);assert.equal((await state(p)).galaxyIndex,old+1);assert.equal(await p.getByRole('dialog').count(),0);}finally{await p.context().close();}});
 await test('Rescue is reachable through resource panel',async()=>{const p=await seededPage('mobile-rescue',{fuel:0,oxygen:4,ore:0,credits:0});try{
  await click('status',p);await click('workshop',p);await click('rescue-menu',p);await click('rescue',p);assert.equal((await state(p)).location.mode,'orbit');assert.ok((await state(p)).resources.oxygen>=80);}finally{await p.context().close();}});
 await test('Save survives reload including customization',async()=>{const before=await state();await page.reload();await page.waitForFunction(()=>window.orbitApp);assert.deepEqual(await state(),before);});
 await test('All phone tabs and sheets fit 320,390,736,1024',async()=>{for(const width of [320,390,736,1024]){await page.setViewportSize({width,height:950});for(const name of ['explore','ship','galaxy','expedition']){await tab(name);const sizes=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,w:innerWidth,game:document.getElementById('orbit-game').scrollWidth,box:document.getElementById('orbit-game').clientWidth}));assert.ok(sizes.doc<=sizes.w,JSON.stringify({width,name,sizes}));assert.ok(sizes.game<=sizes.box,JSON.stringify({width,name,sizes}));}await click('menu');await click('help');const bad=await page.locator('[role=dialog] button').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth}).map(e=>e.textContent));assert.deepEqual(bad,[]);await click('close-sheet');}await page.setViewportSize({width:390,height:900});await tab('explore');await page.screenshot({path:path.join(out,'mobile390.png'),fullPage:true});});
 await test('Help traps focus and restores focus',async()=>{await click('menu');await click('help');
  // Focus wraps inside the panel: Shift+Tab from its first control reaches its last one (the topic picker) and Tab returns.
  const ends=await page.locator('#og-sheet-backdrop').evaluate(d=>{const f=[...d.querySelectorAll('button:not(:disabled),select,input,[tabindex]:not([tabindex="-1"])')].filter(e=>e.getClientRects().length);f.at(-1).dataset.qaLast='1';f[0].dataset.qaFirst='1';return f.length;});assert.ok(ends>=2);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.qaFirst),'1','panel opens with focus on its first control');
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.qaLast),'1','Shift+Tab wraps to the last control');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.qaFirst),'1','Tab wraps to the first control');
  // Escape walks the panel route back (Help → Menu → game) and focus returns to the menu button.
  await page.keyboard.press('Escape');assert.equal(await sheet(),'menu');await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'menu');});
 await test('No browser errors',async()=>assert.deepEqual(errors,[]));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({results,errors,passed:results.every(r=>r.pass)},null,2));await browser.close();process.exitCode=results.every(r=>r.pass)?0:1;
})().catch(e=>{console.error(e);process.exitCode=1;});
