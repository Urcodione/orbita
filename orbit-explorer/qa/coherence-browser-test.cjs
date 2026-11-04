'use strict';
const {chromium}=require('./node_modules/playwright'),assert=require('node:assert/strict');
const Save = require('./save-slot.cjs');
global.OrbitEngine=require('../engine.js');require('../economy.js');require('../campaign.js');
const E=global.OrbitEngine,s=E.create(123);s.campaign.introSeen=true;
for(const f of E.beaconView(s).fragments)s.discovery.fragments[f.id]=true;
// A save without a guide record and without scans is migrated into the Prisma tutorial; mark it as already past it.
const snap={...E.snapshot(s),guide:{v:2,active:false,started:false,extracted:false,moduleId:null,region:0,visited:[],installed:false,oxygenMade:false,fuelMade:false,crafted:null,loan:false,completed:false}};
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const [width,height] of [[320,568],[390,844]]){
 const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await Save.seed(p,{state:snap});
 await p.goto('http://localhost:8765/');await p.waitForFunction(()=>window.orbitApp);
 await p.locator('.og-campaign-access').click();await p.locator('[data-campaign-select]').selectOption('beacon');
 for(let i=0;i<12&&!await p.locator('[data-action=claimBeacon]:visible').count();i++)await p.locator('[data-sheet-page="1"]:visible:not(:disabled)').click();
 const b=p.locator('[data-action=claimBeacon]:visible');await b.waitFor();const r=await b.boundingBox();assert(r.y>=0&&r.y+r.height<=height);
 await p.screenshot({path:__dirname+'/campaign-artifacts/farol-'+width+'.png'});
 await b.click();assert(await p.evaluate(()=>OrbitEngine.beaconView(orbitApp.getState()).claimed));
 assert.deepEqual(errors,[]);await p.close();
}await browser.close();console.log('PASS Farol reward reachable and claimable on both mobile sizes.');})().catch(e=>{console.error(e);process.exit(1)});
