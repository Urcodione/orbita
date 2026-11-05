const assert=require('node:assert/strict');global.OrbitEngine=require('./engine.js');
for(const f of ['economy','campaign','campaign-events','campaign-guidance','tutorial','storage','voyage','xenobiology','ships'])require('./'+f+'.js');
// Stand-in for a chapter closing (the real one needs a whole chapter of play; the campaign bot covers it end to end).
const E=global.OrbitEngine,inner=E.dispatch;
E.dispatch=(s,a,p)=>{if(a!=='qaCloseChapter')return inner(s,a,p);s.campaign.chapter++;s.turn++;return {ok:true,message:'',reward:{}};};
require('./explorer-record.js');
const clone=v=>JSON.parse(JSON.stringify(v));
const s=E.create('record-1');
assert.deepEqual(s.journal,{v:1,chapters:[],earned:{}});assert.ok(E.validate(s));
assert.ok(E.dispatch(s,'guideSkip').ok);assert.ok(s.journal&&E.validate(s),'the journey after the tutorial starts its own record');
const view=()=>E.explorerRecord(s);
assert.equal(view().total,E.explorerAchievements.length);assert.equal(view().earned,0);

// An achievement is earned once, at the action that reached it, and reported by that action only.
assert.ok(E.dispatch(s,'scan').ok);
const landed=E.dispatch(s,'dock');assert.ok(landed.ok,landed.message);
assert.deepEqual(landed.achievements.map(a=>a.id),['first-landing']);assert.equal(s.journal.earned['first-landing'],s.turn);
const again=E.dispatch(s,'launch');assert.equal(again.achievements,undefined);
const first=view().achievements.find(a=>a.id==='first-landing');assert.equal(first.earned,true);assert.equal(first.value,1);
const locked=view().achievements.find(a=>a.id==='dust');assert.equal(locked.earned,false);assert.equal(locked.goal,10);
// A refused action earns nothing.
assert.equal(E.dispatch(s,'fleetBuy',{shipId:'fenix'}).ok,false);

// Chapters: the action at which each closed, and how many actions it took.
const t0=s.turn;
assert.ok(E.dispatch(s,'qaCloseChapter').ok);
s.turn+=40;assert.ok(E.dispatch(s,'qaCloseChapter').ok);
assert.deepEqual(s.journal.chapters,[{chapter:0,turn:t0+1},{chapter:1,turn:t0+42}]);
assert.deepEqual(view().chapters.map(c=>c.actions),[t0+1,41]);
assert.equal(view().metrics.chapter,2);
s.campaign.chapter=0;  // the stand-in skipped the campaign's own bookkeeping: put it back before saving

// Saves: round trip, older saves gain a record (what they had already done, moment unknown), forged records refused.
assert.deepEqual(E.restore(E.snapshot(s)).journal,s.journal);
const legacy=clone(E.snapshot(s));delete legacy.journal;const old=E.restore(legacy);
assert.deepEqual(old.journal.chapters,[]);assert.equal(old.journal.earned['first-landing'],null);
assert.equal(E.explorerRecord(old).achievements.find(a=>a.id==='first-landing').turn,null);
const forged=edit=>{const x=clone(E.snapshot(s));edit(x.journal);return E.restore(x);};
assert.equal(forged(j=>{j.earned.unknown=1;}),null,'unknown achievement');
assert.equal(forged(j=>{j.earned.dust=s.turn+1;}),null,'earned in the future');
assert.equal(forged(j=>{j.chapters.reverse();}),null,'chapters out of order');
assert.equal(forged(j=>{j.v=2;}),null,'unknown version');
console.log('PASS explorer record: achievements earned once with their action, chapters with their length, older saves gain a record, forged records refused.');
