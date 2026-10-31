'use strict';
const {chromium}=require('./node_modules/playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const report=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../android/dist/build-report.json')));
const apk=path.resolve(__dirname,'../android/dist',report.apk);
const html=execFileSync('python3',['-c','import sys,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read("assets/index.html"))',apk],{maxBuffer:32e6}).toString();
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const [width,height] of [[360,740],[412,915]]){
  const context=await b.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>route.request().isNavigationRequest()?route.fulfill({status:200,contentType:'text/html',body:html}):route.abort());
  await p.goto('https://appassets.androidplatform.net/');await p.waitForFunction(()=>window.orbitApp);
  const fresh=await p.evaluate(()=>{const s=orbitApp.getState();return {chapter:s.campaign.chapter,sites:s.campaign.sites,found:s.campaign.found,crafted:s.campaign.crafted,introSeen:s.campaign.introSeen,galaxy:s.galaxyIndex,scans:s.progress.scans,save:localStorage.getItem('orbita-explorador-v1')};});
  assert.deepEqual(fresh,{chapter:0,sites:[],found:0,crafted:0,introSeen:false,galaxy:0,scans:0,save:null});
  await p.locator('.og-story-clip').waitFor({state:'visible'});
  await p.screenshot({path:path.resolve(__dirname,'../android/dist/intro-'+width+'.png')});
  await p.locator('[data-story-action=next]').click();await p.locator('[data-story-action=next]').click();
  await p.getByRole('button',{name:'Iniciar jornada',exact:true}).click();
  assert.equal(await p.locator('.og-story-clip').count(),0);
  await p.locator('[data-guide-skip]').click();
  await p.locator('[data-action=scan]').click();
  assert.equal(await p.evaluate(()=>orbitApp.getState().progress.scans),1);
  const snapshot=await p.evaluate(()=>JSON.parse(localStorage.getItem('orbita-explorador-v1')));
  assert.equal(snapshot.state.campaign.introSeen,true);
  await p.reload();await p.waitForFunction(()=>window.orbitApp);
  assert.equal(await p.locator('.og-story-clip').count(),0);
  assert.equal(await p.evaluate(()=>orbitApp.getState().progress.scans),1);
  assert.deepEqual(errors,[]);
  await context.close();
 }
 await b.close();console.log('PASS actual APK assets: clean first launch, 3-scene intro, Start, gameplay and saved reload, no network assets, two phone sizes.');
})().catch(e=>{console.error(e);process.exit(1)});
