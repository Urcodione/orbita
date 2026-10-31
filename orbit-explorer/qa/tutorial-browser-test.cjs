const {chromium}=require('./node_modules/playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const [width,height] of [[360,740],[320,568]]){
const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:8765/');await p.waitForFunction(()=>window.orbitApp);await p.locator('[data-story-action=skip]').click();await p.locator('[data-guide-start]').click();
let clicks=0,extracted=false;while(await p.evaluate(()=>orbitApp.getState().guide.active)){
 await p.waitForTimeout(120);const target=p.locator('.og-guide-target:visible');if(!await target.count()){console.log(await p.evaluate(()=>orbitApp.getView()));await p.screenshot({path:__dirname+'/campaign-artifacts/tutorial-stalled.png'});}assert.equal(await target.count(),1,'highlight missing: '+await p.locator('#og-guide').innerText());
 const action=await target.getAttribute('data-action');if(action==='scan'||action==='expeditionCollect'||action==='expeditionRecover')await p.screenshot({path:__dirname+'/campaign-artifacts/tutorial-'+width+'-'+action+'.png'});
 await target.click({timeout:4000});clicks++;assert(clicks<180,'tutorial stalled');
 if(action==='expeditionExtract'){extracted=true;assert.equal(await p.evaluate(()=>orbitApp.getView().tab),'explore');if(width===320){await p.reload();await p.waitForFunction(()=>window.orbitApp);}}
 if(clicks===8){await p.reload();await p.waitForFunction(()=>window.orbitApp);}
}
assert(extracted);assert.equal(await p.evaluate(()=>orbitApp.getState().guide.completed),true);assert.deepEqual(errors,[]);await p.close();console.log('PASS full guided touch flow and mid-route reload at '+width+'px in '+clicks+' taps');
}
await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
