const {chromium}=require('./node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'universe-artifacts');fs.mkdirSync(out,{recursive:true});
const url='file://'+path.resolve(__dirname,'../index.html');
const fixture=JSON.parse(fs.readFileSync(path.join(out,'v1-save-fixture.json'),'utf8'));
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1024,height:950}}),page=await context.newPage();
 const errors=[],results=[];
 const listen=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error')errors.push(e.text());});};listen(page);
 const state=()=>page.evaluate(()=>orbitApp.getState()),view=()=>page.evaluate(()=>orbitApp.getView());
 const click=action=>page.locator(`[data-action="${action}"]:visible`).first().click();
 const tab=name=>page.locator(`.og-tabs [data-tab="${name}"]`).click();
 const level=name=>page.locator(`[data-map-level="${name}"]:visible`).first().click();
 const settle=()=>page.waitForTimeout(800);
 const snap=async name=>{await settle();await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});};
 async function test(name,fn){try{await fn();results.push({name,pass:true});console.log('PASS',name);}catch(error){results.push({name,pass:false,error:error.message});console.log('FAIL',name,error.message);await page.screenshot({path:path.join(out,'failure-'+results.length+'.png'),fullPage:true}).catch(()=>{});}}
 async function assertLandingBlocked(){const dock=page.locator('[data-action="dock"]:visible');if(await dock.count())assert.equal(await dock.isDisabled(),true);else assert.equal(await page.locator('#og-context [data-action="environment"]:visible').count(),1);}
 async function closeSheet(){if(await page.getByRole('dialog').count())await click('close-sheet');}
 async function selectPlanet(id){await closeSheet();await tab('galaxy');await level('system');await page.locator(`[data-select="${id}"]:visible`).click();}
 async function inspectEnvironment(id){await selectPlanet(id);await click('environment');return page.getByRole('dialog').innerText();}
 async function openFabricator(){await closeSheet();if(await page.locator('[data-action="fabricator"]:visible').count())await click('fabricator');else{await tab('ship');await click('workshop');await click('fabricator');}}
 async function equipShield(id){await closeSheet();await tab('ship');const d=(await view()).shipDetail;if(d.mode==='module')await click('ship-back');if((await view()).shipDetail.mode==='exterior')await click('open-interior');await page.locator('[data-module-focus="shield"]:visible').click();await click('replace-module');await page.locator(`[data-action="equip"][data-module="${id}"]:visible`).click();}
 await page.goto(url);await page.waitForFunction(()=>window.orbitApp&&window.OrbitEngine?.assess);
 await page.evaluate(()=>{const s=OrbitEngine.create('qa-hostile-universe');window.__qaSaved=[];window.openai={setWidgetState:value=>{window.__qaSaved.push(JSON.parse(JSON.stringify(value)));return Promise.resolve();}};window.dispatchEvent(new CustomEvent('openai:set_globals',{detail:{globals:{widgetState:{privateContent:{state:s,tab:'explore',selected:s.location.planetId,shipDetail:{mode:'exterior',selectedModule:null,expanded:false}}}}}}));});
 let initial,volcanic,gas,ocean,oldShield,thermal,resourcesBeforeInspection;
 await test('System, galaxy and universe maps present distinct hierarchical destinations',async()=>{
  initial=await state();assert.equal(initial.version,2);assert.ok(initial.galaxy.planets.length>=12);assert.ok(initial.galaxy.systems.length>=3);
  volcanic=initial.galaxy.planets.find(p=>p.biome==='volcanic');gas=initial.galaxy.planets.find(p=>p.biome==='gas');ocean=initial.galaxy.planets.find(p=>p.biome==='ocean');assert.ok(volcanic&&gas&&ocean);
  resourcesBeforeInspection=initial.resources;
  await tab('galaxy');await level('system');const planets=await page.locator('[data-select]:visible').count();assert.ok(planets>=3&&planets<initial.galaxy.planets.length);await snap('system-map');
  await level('galaxy');assert.equal(await page.locator('[data-system]:visible').count(),initial.galaxy.systems.length);assert.equal(await page.locator('[data-select]:visible').count(),0);await snap('galaxy-map');
  const hostile=initial.galaxy.systems.find(s=>['blue-giant','pulsar'].includes(s.kind));assert.ok(hostile);
  await page.locator(`[data-system="${hostile.id}"]:visible`).click();assert.match(await page.locator('#og-context').innerText(),/inacessível|hostil|preparo/i);await click('route-info');assert.match(await page.getByRole('dialog').innerText(),/FALTA|proteção|escudo/i);await closeSheet();await page.locator(`[data-system="${initial.galaxy.systems[0].id}"]:visible`).click();
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
  await tab('explore');await click('scan');await click('dock');await click('sites');await click('explore');const s=await state(),module=s.inventory.find(m=>m.origin==='recovered');assert.ok(module);
  await page.locator(`[data-action="equip"][data-module="${module.id}"]:visible`).click();assert.equal((await state()).equipped[module.type].id,module.id);assert.ok((await state()).progress.explorations>=1);
  const p=await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'fabricate',{recipeId:'thermal-shield'}));assert.equal(p.allowed,true,p.reason);
  await click('launch');
 });
 await test('An analyzed hot planet prevents landing and explains the hardware requirement',async()=>{
  await selectPlanet(volcanic.id);await click('travel');assert.equal((await state()).location.planetId,volcanic.id);await click('scan');
  const p=await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock'));assert.equal(p.allowed,false);assert.match(p.reason,/térmic|calor|temperatura|escudo/i);
  await assertLandingBlocked();assert.match(await page.locator('#og-context').innerText(),/térmic|calor|temperatura|escudo/i);await snap('hot-world-locked');
 });
 await test('Fabrication charges the shown materials but access only changes after installation',async()=>{
  oldShield=(await state()).equipped.shield;const before=await state();const preview=await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'fabricate',{recipeId:'thermal-shield'}));assert.equal(preview.allowed,true,preview.reason);
  await openFabricator();const craft=page.locator('[data-action="fabricate"][data-recipe="thermal-shield"]');assert.equal(await craft.isEnabled(),true);await snap('fabricator');await craft.click();
  const after=await state();thermal=after.inventory.find(m=>!before.inventory.some(x=>x.id===m.id)&&m.type==='shield');assert.ok(thermal,'Fabricated shield is stored before installation');assert.equal(after.equipped.shield.id,oldShield.id);
  for(const key of Object.keys(before.resources))assert.equal(after.resources[key],before.resources[key]-(preview.cost[key]||0),`Fabrication cost ${key}`);
  assert.equal(await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock').allowed),false);
  await equipShield(thermal.id);assert.equal((await state()).equipped.shield.id,thermal.id);assert.ok((await state()).inventory.some(m=>m.id===oldShield.id));assert.equal(await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock').allowed),true);
  await tab('explore');assert.equal(await page.locator('[data-action="dock"]:visible').isEnabled(),true);await snap('hot-world-equipped');await click('dock');assert.equal((await state()).location.mode,'docked');await click('launch');
 });
 await test('Swapping the protective shield back removes its environmental capability',async()=>{
  const before=(await state()).resources;await equipShield(oldShield.id);assert.equal(await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock').allowed),false);
  await tab('explore');await assertLandingBlocked();await equipShield(thermal.id);assert.equal(await page.evaluate(()=>OrbitEngine.preview(orbitApp.getState(),'dock').allowed),true);assert.deepEqual((await state()).resources,before);
 });
 await test('The existing physical rocket inspection and drag-to-socket loop remain available',async()=>{
  await tab('ship');if((await view()).shipDetail.mode==='module')await click('ship-back');if((await view()).shipDetail.mode==='exterior')await click('open-interior');await page.locator('[data-module-focus="engine"]:visible').click();await settle();
  const resources=(await state()).resources;
  for(const expanded of [true,false]){const p=await page.evaluate(()=>orbitApp.getInspection()),b=await page.locator('#og-canvas').boundingBox();const x=b.x+p.bounds.x+p.bounds.width/2,y=b.y+p.bounds.y+p.bounds.height/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(expanded?x+p.expansionVector.x*1.1:b.x+p.socket.x,expanded?y+p.expansionVector.y*1.1:b.y+p.socket.y,{steps:12});await page.mouse.up();await page.waitForFunction(value=>orbitApp.getView().shipDetail.expanded===value,expanded);await settle();}
  assert.deepEqual((await state()).resources,resources);
 });
 await test('All three maps and environmental panels fit 320, 390 and 736px widths',async()=>{
  for(const width of [320,390,736]){await page.setViewportSize({width,height:950});await tab('galaxy');for(const name of ['system','galaxy','universe']){await level(name);await settle();const geometry=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,box:document.getElementById('orbit-game').clientWidth,game:document.getElementById('orbit-game').scrollWidth}));assert.ok(geometry.doc<=geometry.width,JSON.stringify({width,name,geometry}));assert.ok(geometry.game<=geometry.box,JSON.stringify({width,name,geometry}));const clipped=await page.locator('#og-map button:visible').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect(),g=document.getElementById('orbit-game').getBoundingClientRect();return r.left<g.left||r.right>g.right||r.top<g.top||r.bottom>g.bottom;}).map(e=>e.textContent));assert.deepEqual(clipped,[],`Nodes clipped: ${name} at ${width}px`);}await inspectEnvironment(gas.id);const controls=await page.getByRole('dialog').locator('button').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth;}).map(e=>e.textContent));assert.deepEqual(controls,[]);await closeSheet();if(width===320)await snap('universe-phone320');}
 });
 await test('The hosted save stays below 16KiB and preserves crafted equipment on reload',async()=>{
  const saved=await page.evaluate(()=>window.__qaSaved.at(-1));assert.ok(saved);const bytes=Buffer.byteLength(JSON.stringify(saved),'utf8');assert.ok(bytes<16384,`Host snapshot ${bytes} bytes`);const before=await state();await page.reload();await page.waitForFunction(()=>window.orbitApp);assert.deepEqual(await state(),before);assert.equal((await state()).equipped.shield.id,thermal.id);
  fs.writeFileSync(path.join(out,'save-size.json'),JSON.stringify({bytes,limit:16384},null,2));
 });
 await test('A real version-1 save migrates while retaining ship, modules, resources and explored progress',async()=>{
  const c=await browser.newContext({viewport:{width:390,height:900}}),p=await c.newPage();listen(p);await p.addInitScript(snapshot=>{window.openai={widgetState:{privateContent:snapshot}};},fixture);await p.goto(url);await p.waitForFunction(()=>window.orbitApp);const s=await p.evaluate(()=>orbitApp.getState());assert.equal(s.version,2);assert.equal(s.ship.name,fixture.state.ship.name);assert.deepEqual(s.resources,fixture.state.resources);for(const [key,value]of Object.entries(fixture.state.progress))assert.equal(s.progress[key],value,`Migrated progress ${key}`);assert.deepEqual(Object.fromEntries(Object.entries(s.equipped).map(([k,m])=>[k,m.id])),Object.fromEntries(Object.entries(fixture.state.equipped).map(([k,m])=>[k,m.id])));assert.ok(s.galaxy.systems.length>=3);assert.equal(s.galaxy.planets.find(x=>x.id===fixture.state.location.planetId).sites.filter(x=>x.explored).length,1);await p.screenshot({path:path.join(out,'migrated-v1.png'),fullPage:true});await c.close();
 });
 await test('No browser runtime errors',async()=>assert.deepEqual(errors,[]));
 const report={results,errors,passed:results.every(r=>r.pass)};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();process.exitCode=report.passed?0:1;
})().catch(error=>{console.error(error);process.exitCode=1;});
