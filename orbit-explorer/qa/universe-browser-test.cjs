const {chromium}=require('./node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const Save = require('./save-slot.cjs');
const out=path.join(__dirname,'universe-artifacts');fs.mkdirSync(out,{recursive:true});
const url='file://'+path.resolve(__dirname,'../index.html');
const fixture=JSON.parse(fs.readFileSync(path.join(out,'v1-save-fixture.json'),'utf8'));
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1024,height:950}}),page=await context.newPage();page.setDefaultTimeout(10000);
 const errors=[],results=[],coveredNodes=[];
 const listen=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error')errors.push(e.text());});};listen(page);
 const state=()=>page.evaluate(()=>orbitApp.getState()),view=()=>page.evaluate(()=>orbitApp.getView());
 const settle=()=>page.waitForTimeout(800),beat=()=>page.waitForTimeout(120);
 // Fixed-screen panels paginate: a control may sit on a later page of the open sheet.
 async function clickSelector(selector){
  const live=()=>page.locator(selector+':visible:not([inert] *)').first();
  if(await live().count()){await live().click();await beat();return;}
  const previous=page.locator('[data-sheet-page="-1"]:visible');
  for(let i=0;i<20&&await previous.count()&&!await previous.isDisabled();i++){await previous.click();await beat();}
  for(let i=0;i<20;i++){if(await live().count()){await live().click();await beat();return;}const next=page.locator('[data-sheet-page="1"]:visible');if(!await next.count()||await next.isDisabled())break;await next.click();await beat();}
  throw new Error('Control unreachable: '+selector);
 }
 const click=action=>clickSelector(`[data-action="${action}"]`);
 const tab=name=>page.locator(`.og-tabs [data-tab="${name}"]`).click();
 const level=name=>page.locator(`[data-map-level="${name}"]:visible`).first().click();
 const snap=async name=>{await settle();await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});};
 async function test(name,fn){try{await fn();results.push({name,pass:true});console.log('PASS',name);}catch(error){results.push({name,pass:false,error:error.message});console.log('FAIL',name,error.message);await page.screenshot({path:path.join(out,'failure-'+results.length+'.png'),fullPage:true}).catch(()=>{});}}
 // Landing is blocked when the scan's site panel disables the descent and the world asks for protection instead.
 async function assertLandingBlocked(){
  if((await view()).sheet==='sites'){assert.equal(await page.locator('#og-sheet-backdrop [data-action="explore"]').first().isDisabled(),true);assert.match(await page.locator('#og-descent-blocker').innerText(),/exige|proteção|blindagem/i);await closeSheet();}
  const dock=page.locator('[data-action="dock"]:visible');if(await dock.count())assert.equal(await dock.isDisabled(),true);else assert.equal(await page.locator('#og-context [data-action="environment"]:visible').count(),1);
 }
 async function closeSheet(){if(await page.getByRole('dialog').count())await click('close-sheet');}
 // A planet node must own the centre of its tap target. When another map control covers it (a layout defect reported
 // at the end of the run), the node is activated directly so the remaining checks still run.
 async function pickNode(selector){const node=page.locator(selector+':visible');const cover=await node.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e.contains(hit)?null:(hit?.closest('button')||hit)?.outerHTML.slice(0,120);});if(cover){coveredNodes.push(`${await page.evaluate(()=>innerWidth)}px ${selector} covered by ${cover}`);await node.dispatchEvent('click');}else await node.click();await beat();}
 async function selectPlanet(id){await closeSheet();await tab('galaxy');const p=(await state()).galaxy.planets.find(x=>x.id===id);await level('galaxy');await pickNode(`[data-system="${p.systemId}"]`);await level('system');await pickNode(`[data-select="${id}"]`);}
 async function inspectEnvironment(id){await selectPlanet(id);await click('environment');return page.getByRole('dialog').innerText();}
 // The closed hull has no "open" button any more: tapping the painted ship opens it.
 async function openInterior(){await closeSheet();await tab('ship');if((await view()).shipDetail.mode==='exterior'){await page.locator('#og-canvas').click();await page.waitForFunction(()=>orbitApp.getView().shipDetail.mode==='interior');}}
 async function openFabricator(){await openInterior();await click('workshop');await click('fabricator');}
 // Installing goes through the module card: the slot's carousel reaches the stored candidate, then Compare → Install.
 async function equipShield(id){await openInterior();await page.locator('[data-module-focus="shield"]:visible').click();await beat();
  for(let i=0;i<12&&(await view()).selectedCandidateId!==id&&(await state()).equipped.shield.id!==id;i++)await clickSelector('[data-action="module-slide"][data-step="1"]');
  if((await state()).equipped.shield.id===id){await closeSheet();return;}
  assert.equal((await view()).selectedCandidateId,id,'Shield carousel reaches the stored module');await click('compare-module');await clickSelector(`[data-action="equip"][data-module="${id}"]`);await closeSheet();}
 function solveRotors(dials,target){for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){const counts=[a,b,c],next=dials.slice();for(let i=0;i<3;i++){next[i]=(next[i]+counts[i])%4;next[(i+1)%3]=(next[(i+1)%3]+counts[i])%4;}if(next.every((v,i)=>v===target[i]))return counts;}throw new Error('Rotor puzzle has no solution');}
 // The first expedition follows its protected trail: two beacons triangulate the core, then the cargo is extracted at base.
 async function playFirstExpedition(){
  const move=async(x,y)=>{await page.locator(`[data-expedition-x="${x}"][data-expedition-y="${y}"]:visible`).click();await beat();};
  const beacon=async()=>{if(await page.locator('[data-action="expeditionBeacon"]:visible').count())await click('expeditionBeacon');};
  const ex=(await state()).expedition;assert.ok(ex?.firstExpedition,'Descending launches the first expedition');assert.deepEqual([ex.x,ex.y],[2,5]);
  await beacon();for(let y=4;y>=0;--y){await move(2,y);await beacon();}await move(3,0);assert.equal((await state()).expedition.beacons.length,2,'Both beacons active');
  await click('expeditionInteract');const puzzle=(await state()).expedition.puzzle,counts=solveRotors(puzzle.dials,puzzle.target);
  for(let i=0;i<3;i++)for(let n=0;n<counts[i];n++)await clickSelector(`[data-action="expeditionTune"][data-index="${i}"]`);
  await click('expeditionRecover');if((await view()).sheet==='expedition-risk-confirm')await click('confirm-field-action');
  assert.ok((await state()).expedition.coreRecovered);await closeSheet();
  if(!(await page.evaluate(()=>OrbitEngine.expeditionReturnRoute(orbitApp.getState()).canReturn))){await click('expedition-return');await click('overdrive-menu');await click('expeditionOverdrive');await closeSheet();}
  await move(2,0);for(let y=1;y<=5;y++)await move(2,y);await click('expeditionExtract');assert.equal((await state()).expedition,null);await closeSheet();
 }
 await page.goto(url);await page.waitForFunction(()=>window.orbitApp&&window.OrbitEngine?.assess);
 // A new game opens on the illustrated intro and the guided Prisma training; leave both, then inject the free-game fixture.
 await page.locator('[data-story-action=skip]').click();await page.locator('[data-guide-skip]').click();
 await Save.load(page,await page.evaluate(()=>{const s=OrbitEngine.create('qa-hostile-universe');const skipped=OrbitEngine.dispatch(s,'guideSkip');if(!skipped.ok)throw Error(skipped.message);return {state:s,tab:'explore',selected:s.location.planetId,shipDetail:{mode:'exterior'}};}));
 let initial,volcanic,gas,ocean,oldShield,thermal,resourcesBeforeInspection;
 await test('System, galaxy and universe maps present distinct hierarchical destinations',async()=>{
  initial=await state();assert.equal(initial.version,2);assert.ok(initial.galaxy.planets.length>=12);assert.ok(initial.galaxy.systems.length>=3);
  volcanic=initial.galaxy.planets.find(p=>p.biome==='volcanic');gas=initial.galaxy.planets.find(p=>p.biome==='gas');ocean=initial.galaxy.planets.find(p=>p.biome==='ocean');assert.ok(volcanic&&gas&&ocean);
  resourcesBeforeInspection=initial.resources;
  await tab('galaxy');await level('system');const planets=await page.locator('[data-select]:visible').count();assert.ok(planets>=3&&planets<initial.galaxy.planets.length);await snap('system-map');
  await level('galaxy');assert.equal(await page.locator('[data-system]:visible').count(),initial.galaxy.systems.length);assert.equal(await page.locator('[data-select]:visible').count(),0);await snap('galaxy-map');
  const hostile=initial.galaxy.systems.find(s=>['blue-giant','pulsar'].includes(s.kind));assert.ok(hostile);
  // The galaxy map flags the hostile star; its worlds then explain the missing protection before any travel.
  const node=page.locator(`[data-system="${hostile.id}"]:visible`);assert.match(await node.getAttribute('aria-label'),/preparo/i);await node.click();
  await page.locator('#og-context [data-map-level="system"]').click();assert.match(await page.locator('#og-context').innerText(),/inacessível|hostil|preparo/i);
  await click('route-info');assert.match(await page.getByRole('dialog').innerText(),/FALTA|proteção|escudo/i);await closeSheet();
  await level('galaxy');await page.locator(`[data-system="${initial.galaxy.systems[0].id}"]:visible`).click();
  await level('universe');const destinations=await page.evaluate(()=>OrbitEngine.destinations(orbitApp.getState()).length);assert.equal(await page.locator('[data-destination]:visible').count(),destinations);assert.ok(destinations>=3);assert.equal(await page.locator('[data-system]:visible').count(),0);await snap('universe-map');
  const routes=await page.evaluate(()=>OrbitEngine.destinations(orbitApp.getState()));
  for(const route of routes){await page.locator(`[data-destination="${route.id}"]:visible`).click();assert.ok((await page.locator('#og-context').innerText()).includes(route.name));}
  await click('warp-menu');assert.ok((await page.getByRole('dialog').innerText()).includes(routes.at(-1).name));await closeSheet();
  assert.deepEqual((await state()).resources,resourcesBeforeInspection);
 });
 await test('Heat, liquid worlds and gas giants show the missing protection before spending travel resources',async()=>{
  for(const [planet,words]of [[volcanic,/térmic|calor|temperatura/i],[ocean,/líquid|pressão|imers|submers/i],[gas,/gás|gasos|atmosfér|sonda/i]]){
   const text=await inspectEnvironment(planet.id);assert.match(text,words);assert.match(text,/bloque|impede|falta|necessári|requer|precisa/i);assert.match(text,/módulo|proteção|escudo|sonda|kit/i);
   await snap('environment-'+planet.biome);await closeSheet();
  }
  assert.deepEqual((await state()).resources,resourcesBeforeInspection);
 });
 await test('A normal starting expedition earns the resources needed for a protection module',async()=>{
  // Scanning opens the landing sites; descending launches the surface vehicle (no separate dock step any more).
  await closeSheet();await tab('explore');await click('scan');assert.equal((await view()).sheet,'sites');await page.locator('#og-sheet-backdrop [data-action="explore"]').first().click();await beat();
  await playFirstExpedition();
  const s=await state(),module=s.inventory.find(m=>m.origin==='recovered');assert.ok(module,'Extraction banks the recovered module');assert.ok(s.progress.explorations>=1);
  await openInterior();await click('modules');await clickSelector(`[data-action="stored-module"][data-module="${module.id}"]`);await click('compare-module');await clickSelector(`[data-action="equip"][data-module="${module.id}"]`);await closeSheet();
  assert.equal((await state()).equipped[module.type].id,module.id);
  // Modules are now assembled from workshop components, so the earned materials must cover the parts and the module.
  const plan=await page.evaluate(()=>{const E=OrbitEngine,branch=E.restore(E.snapshot(orbitApp.getState())),recipe=E.recipes.find(r=>r.id==='thermal-shield');
   for(const [id,n]of Object.entries(recipe.components)){const missing=n-(branch.components[id]||0);if(missing>0){const r=E.dispatch(branch,'craftComponent',{componentId:id,amount:missing});if(!r.ok)return {allowed:false,reason:id+': '+r.message};}}
   return E.preview(branch,'fabricate',{recipeId:'thermal-shield'});});
  assert.equal(plan.allowed,true,plan.reason);
 });
 await test('An analyzed hot planet prevents landing and explains the hardware requirement',async()=>{
  await selectPlanet(volcanic.id);await click('route-info');
  // After an expedition the ship is still anchored: the route panel offers the take-off first.
  if((await state()).location.mode!=='orbit'){await click('launch');assert.equal((await state()).location.mode,'orbit');if(!await page.locator('[data-action="travel"]:visible').count()){await closeSheet();await selectPlanet(volcanic.id);await click('route-info');}}
  await click('travel');await closeSheet();assert.equal((await state()).location.planetId,volcanic.id);await tab('explore');await click('scan');
  const p=await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock'));assert.equal(p.allowed,false);assert.match(p.reason,/térmic|calor|temperatura|escudo/i);
  await assertLandingBlocked();assert.match(await page.locator('#og-context').innerText(),/térmic|calor|temperatura|escudo/i);await snap('hot-world-locked');
 });
 await test('Fabrication charges the shown materials but access only changes after installation',async()=>{
  oldShield=(await state()).equipped.shield;
  await openFabricator();await clickSelector('[data-lab-type="shield"]');await clickSelector('[data-lab-recipe="thermal-shield"]');
  // Each missing ingredient is assembled from its card; its named parent returns to the recipe.
  for(const [id,n]of Object.entries(await page.evaluate(()=>OrbitEngine.recipes.find(r=>r.id==='thermal-shield').components))){if(((await state()).components[id]||0)>=n)continue;await clickSelector(`[data-lab-component="${id}"]`);await clickSelector(`[data-action="craftComponent"][data-component="${id}"]`);assert.ok(((await state()).components[id]||0)>=n,'Ingredient ready: '+id);await clickSelector('.og-place-exit[data-action="nav-back"]');assert.equal((await view()).lab.recipeId,'thermal-shield');}
  const before=await state();const preview=await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'fabricate',{recipeId:'thermal-shield'}));assert.equal(preview.allowed,true,preview.reason);
  const craft=page.locator('[data-action="fabricate"][data-recipe="thermal-shield"]:visible');assert.equal(await craft.isEnabled(),true);await snap('fabricator');await craft.click();await beat();
  const after=await state();thermal=after.inventory.find(m=>!before.inventory.some(x=>x.id===m.id)&&m.type==='shield');assert.ok(thermal,'Fabricated shield is stored before installation');assert.equal(after.equipped.shield.id,oldShield.id);
  for(const key of Object.keys(before.resources))assert.equal(after.resources[key],before.resources[key]-(preview.cost[key]||0),`Fabrication cost ${key}`);
  for(const [key,n]of Object.entries(preview.components||{}))assert.equal(after.components[key]||0,(before.components[key]||0)-n,`Fabrication component ${key}`);
  assert.equal(await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock').allowed),false);
  await equipShield(thermal.id);assert.equal((await state()).equipped.shield.id,thermal.id);assert.ok((await state()).inventory.some(m=>m.id===oldShield.id));assert.equal(await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock').allowed),true);
  // The descent is now offered from the site panel; it unlocks (without descending, which would lock the hangar).
  await closeSheet();await tab('explore');await click('sites');const descend=page.locator('#og-sheet-backdrop [data-action="explore"]').first();assert.equal(await descend.isEnabled(),true);if(await page.locator('#og-descent-blocker').count())assert.doesNotMatch(await page.locator('#og-descent-blocker').innerText(),/exige|Fabrique/i);await snap('hot-world-equipped');await closeSheet();
 });
 await test('Swapping the protective shield back removes its environmental capability',async()=>{
  const before=(await state()).resources;await equipShield(oldShield.id);assert.equal(await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock').allowed),false);
  await tab('explore');await assertLandingBlocked();await equipShield(thermal.id);assert.equal(await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock').allowed),true);assert.deepEqual((await state()).resources,before);
 });
 await test('All three maps and environmental panels fit 320, 390 and 736px widths',async()=>{
  for(const width of [320,390,736]){await page.setViewportSize({width,height:950});await closeSheet();await tab('galaxy');for(const name of ['system','galaxy','universe']){await level(name);await settle();const geometry=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,box:document.getElementById('orbit-game').clientWidth,game:document.getElementById('orbit-game').scrollWidth}));assert.ok(geometry.doc<=geometry.width,JSON.stringify({width,name,geometry}));assert.ok(geometry.game<=geometry.box,JSON.stringify({width,name,geometry}));const clipped=await page.locator('#og-map button:visible').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect(),g=document.getElementById('orbit-game').getBoundingClientRect();return r.left<g.left||r.right>g.right||r.top<g.top||r.bottom>g.bottom;}).map(e=>e.textContent));assert.deepEqual(clipped,[],`Nodes clipped: ${name} at ${width}px`);}await inspectEnvironment(gas.id);const controls=await page.getByRole('dialog').locator('button').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth;}).map(e=>e.textContent));assert.deepEqual(controls,[]);await closeSheet();if(width===320)await snap('universe-phone320');}
 });
 await test('The hosted save stays below 16KiB and preserves crafted equipment on reload',async()=>{
  const saved=await Save.last(page);assert.ok(saved);const bytes=Buffer.byteLength(JSON.stringify(saved),'utf8');assert.ok(bytes<16384,`Save ${bytes} bytes`);const before=await state();await page.reload();await page.waitForFunction(()=>window.orbitApp);assert.deepEqual(await state(),before);assert.equal((await state()).equipped.shield.id,thermal.id);
  fs.writeFileSync(path.join(out,'save-size.json'),JSON.stringify({bytes,limit:16384},null,2));
 });
 await test('A real version-1 save migrates while retaining ship, modules, resources and explored progress',async()=>{
  const c=await browser.newContext({viewport:{width:390,height:900}}),p=await c.newPage();listen(p);await Save.seed(p,fixture);await p.goto(url);await p.waitForFunction(()=>window.orbitApp);const s=await p.evaluate(()=>orbitApp.getState());assert.equal(s.version,2);assert.equal(s.ship.name,fixture.state.ship.name);assert.deepEqual(s.resources,fixture.state.resources);for(const [key,value]of Object.entries(fixture.state.progress))assert.equal(s.progress[key],value,`Migrated progress ${key}`);assert.deepEqual(Object.fromEntries(Object.entries(s.equipped).map(([k,m])=>[k,m.id])),Object.fromEntries(Object.entries(fixture.state.equipped).map(([k,m])=>[k,m.id])));assert.ok(s.galaxy.systems.length>=3);assert.equal(s.galaxy.planets.find(x=>x.id===fixture.state.location.planetId).sites.filter(x=>x.explored).length,1);await p.screenshot({path:path.join(out,'migrated-v1.png'),fullPage:true});await c.close();
 });
 await test('Planet nodes own their tap targets on every map width',async()=>assert.deepEqual(coveredNodes,[],'Another map control covers a planet node: '+coveredNodes.join(' | ')));
 await test('No browser runtime errors',async()=>assert.deepEqual(errors,[]));
 const report={results,errors,passed:results.every(r=>r.pass)};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();process.exitCode=report.passed?0:1;
})().catch(error=>{console.error(error);process.exitCode=1;});
