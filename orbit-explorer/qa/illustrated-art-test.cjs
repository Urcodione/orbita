const {chromium}=require('./node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const results=[],errors=[];
 for(const dpr of [1,2]){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr,reducedMotion:'reduce'});
  const page=await context.newPage();await page.addInitScript(()=>{const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image instanceof HTMLImageElement&&/^(data:image\/webp|blob:)/.test(image.src))window.illustrationDraws=(window.illustrationDraws||0)+1;return draw.call(this,image,...args);};});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve(__dirname,'../index.html'));await page.waitForFunction(()=>window.orbitApp);
  // The scene is paused behind the introduction; start from the first playable screen.
  await page.locator('[data-story-action=skip]').click();await page.locator('[data-guide-skip]').click();await page.waitForTimeout(400);
  await page.waitForFunction(()=>window.illustrationDraws>1);
  const art=await page.locator('#og-canvas').evaluate(c=>({width:c.width,cssWidth:c.clientWidth,frame:c.toDataURL()}));
  assert.ok(Math.abs(art.width-art.cssWidth*dpr)<=1);
  await page.waitForTimeout(400);assert.equal(await page.locator('#og-canvas').evaluate(c=>c.toDataURL()),art.frame,'Reduced motion keeps the illustration and weather stable');
  await page.locator('.og-tabs [data-tab=ship]').click();await page.locator('[data-action=open-interior]').click();
  await page.locator('[data-module-focus=engine]:visible').first().click();
  for(let n=0;n<10 && !await page.locator('[data-action=inspect-module]:visible:not([inert] *)').count();n++) await page.locator('[data-sheet-page="1"]').click();
  await page.locator('[data-action=inspect-module]:visible').click();await page.waitForTimeout(400);
  const resources=await page.evaluate(()=>JSON.stringify(orbitApp.getState().resources));
  for(const extract of [true,false]){
   const part=await page.evaluate(()=>orbitApp.getInspection()),box=await page.locator('#og-canvas').boundingBox();
   const x=box.x+part.bounds.x+part.bounds.width/2,y=box.y+part.bounds.y+part.bounds.height/2;
   const end=extract?{x:x+part.expansionVector.x*1.12,y:y+part.expansionVector.y*1.12}:{x:box.x+part.socket.x,y:box.y+part.socket.y};
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:14});await page.mouse.up();
   await page.waitForFunction(expected=>orbitApp.getView().shipDetail.expanded===expected,extract);await page.waitForTimeout(100);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(orbitApp.getState().resources)),resources);
  await page.locator('.og-tabs [data-tab=explore]').click();
  await page.locator('[data-action=scan]').click();assert.equal(await page.evaluate(()=>orbitApp.getState().progress.scans),1);
  await page.locator('[data-action=dock]').click();await page.locator('[data-action=sites]').click();
  const selector='[data-action=explore]';await page.locator(selector).first().click();await page.waitForTimeout(400);
  assert.ok(await page.evaluate(()=>!!orbitApp.getState().expedition));
  const field=await page.locator('#og-field-canvas').evaluate(c=>({w:c.width,css:c.clientWidth}));assert.ok(Math.abs(field.w-field.css*dpr)<=1);
  const before=await page.evaluate(()=>orbitApp.getState().expedition.reserve);
  // Actual canvas pointer conversion must remain in CSS coordinates after reducing backing resolution.
  const target=await page.evaluate(()=>{const s=orbitApp.getState(),v=OrbitEngine.expeditionView(s),cell=v.cells.find(c=>c.adjacent&&c.moveAllowed),box=document.querySelector('#og-field-canvas').getBoundingClientRect(),size=Math.min((box.width-8)/v.width,(box.height-8)/v.height);return {x:box.x+(box.width-size*v.width)/2+(cell.x+.5)*size,y:box.y+(box.height-size*v.height)/2+(cell.y+.5)*size};});
  await page.mouse.click(target.x,target.y);await page.waitForTimeout(200);
  assert.ok(await page.evaluate(()=>orbitApp.getState().expedition.reserve)<before,'Pixel terrain pointer advances the expedition');
  results.push({dpr,backingWidth:art.width,illustration:true,reducedMotion:true,moduleDrag:true,expeditionPointer:true});await context.close();
 }
 assert.deepEqual(errors,[]);await browser.close();fs.writeFileSync(path.join(__dirname,'cartoon-artifacts/illustrated-report.json'),JSON.stringify({results,errors},null,2));console.log('PASS illustrated artwork rendering, full-resolution canvas, module drag, reduced motion, real scan and expedition touch at DPR 1 and 2');
})().catch(e=>{console.error(e);process.exit(1)});
