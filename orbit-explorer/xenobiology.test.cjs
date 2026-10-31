const assert=require('node:assert/strict');global.OrbitEngine=require('./engine.js');
for(const f of ['economy','campaign','campaign-events','campaign-guidance','tutorial','storage','voyage','xenobiology'])require('./'+f+'.js');
const E=global.OrbitEngine,H=require('./expedition-test-helper.cjs');
const clone=v=>JSON.parse(JSON.stringify(v));

// 16 unique exemplars, two hidden in each campaign galaxy, each with one tool and one rune.
const fresh=E.create('xeno-catalog');E.dispatch(fresh,'guideSkip');
const catalog=E.xenoView(fresh);
assert.equal(catalog.total,16);assert.equal(catalog.specimens.filter(s=>s.kind==='fauna').length,8);
assert.equal(catalog.specimens.filter(s=>s.hint).length,2,'galaxy 0 hides one fauna and one flora exemplar');
assert.equal(new Set(catalog.specimens.map(s=>s.rune.id)).size,16);

// Find a game where the exemplar's site is reachable with the starting gear, then play it through public actions.
let played=null;
for(let n=0;n<200&&!played;n++){
 const s=E.create('xeno-'+n);E.dispatch(s,'guideSkip');
 for(const sp of E.xenoView(s).specimens.filter(x=>x.hint)){
  const trial=E.restore(E.snapshot(s));trial.location={planetId:sp.hint.planetId,mode:'orbit'};
  if(!E.validate(trial))continue;
  const planet=E.currentPlanet(trial);
  for(const site of planet.sites){
   const t=E.restore(E.snapshot(trial));if(!t)continue;
   try{H.start(t,site.id);}catch{continue;}
   const probe=E.restore(E.snapshot(t));probe.expedition.revealed=Array.from({length:36},(_,i)=>i);probe.expedition.scans=1;
   const at=E.expeditionView(probe).specimen;if(!at||at.id!==sp.id)continue;
   played={state:t,specimen:sp,at};break;
  }
  if(played)break;
 }
}
assert.ok(played,'an exemplar site is playable with the starting gear');
const {state:s,specimen,at}=played;

// Walk to the exemplar (scanning first if it hides) and try to capture it without the tool.
if(specimen.behavior==='camufla')H.checkedAct(s,'expeditionScan');
H.walk(s,at,H.checkedAct,true);
const field=E.expeditionView(s).specimen;assert.ok(field&&field.here,'the exemplar is visible on its cell');
H.rejectUnchanged(s,'xenoCapture');
s.xeno.tools.push(specimen.tool);
s.expedition.reserve=s.expedition.maxReserve;s.expedition.integrity=s.expedition.maxIntegrity;
const reserve=s.expedition.reserve;
H.checkedAct(s,'xenoCapture');
assert.equal(s.xeno.pending,specimen.id);assert.equal(s.expedition.reserve,reserve-field.cost.reserve);
assert.ok(!E.expeditionView(s).specimen,'a contained exemplar leaves the board');
assert.ok(E.restore(E.snapshot(s)),'a pending capture survives a reload');

// Evacuating returns it to the terrain: nothing is captured and it can be found again.
const evac=E.restore(E.snapshot(s));H.checkedAct(evac,'expeditionAbort');
assert.equal(evac.xeno.pending,null);assert.equal(evac.xeno.captured.length,0);
assert.ok(E.xenoView(evac).specimens.find(x=>x.id===specimen.id).hint,'still waiting on its world');

// Extract with something in the hold: the exemplar reaches the lab.
const board=H.revealedBoard(s),cache=board.find(c=>['ore','data','crystal'].includes(c.kind)&&!c.collected);
s.expedition.reserve=s.expedition.maxReserve;H.walk(s,cache,H.checkedAct,true);H.checkedAct(s,'expeditionCollect');
s.expedition.reserve=s.expedition.maxReserve;H.walk(s,{x:2,y:5},H.checkedAct,true);
const extracted=H.checkedAct(s,'expeditionExtract');
assert.deepEqual(s.xeno.captured,[specimen.id]);assert.equal(s.xeno.pending,null);assert.equal(extracted.reward.specimen,specimen.id);
assert.ok(!E.xenoView(s).specimens.find(x=>x.id===specimen.id).hint,'a unique exemplar never appears again');

// Study (data + Lumes), then the rune (Lumes + materials). Costs are charged exactly once.
H.rejectUnchanged(s,'xenoRune',{specimenId:specimen.id});
Object.assign(s.resources,{data:999,credits:5000,ore:200,crystals:60});
const before=clone(s.resources),study=E.preview(s,'xenoStudy',{specimenId:specimen.id});
H.checkedAct(s,'xenoStudy',{specimenId:specimen.id});
for(const [k,n]of Object.entries(study.cost))assert.equal(s.resources[k],before[k]-n);
H.rejectUnchanged(s,'xenoStudy',{specimenId:specimen.id});
H.checkedAct(s,'xenoRune',{specimenId:specimen.id});
const rune='rune-'+specimen.id;assert.deepEqual(s.xeno.runes,[rune]);
H.rejectUnchanged(s,'xenoRune',{specimenId:specimen.id});

// Engrave on an installed module: the rune's attribute shows up in the ship's stats.
const target=Object.values(s.equipped).find(m=>m.type==='shield');
const statsBefore=E.shipMetrics(s);
H.checkedAct(s,'runeEngrave',{runeId:rune,moduleId:target.id});
assert.equal(target.rune,rune);
const changed=E.shipMetrics(s).filter(m=>JSON.stringify(m.value)!==JSON.stringify(statsBefore.find(b=>b.key===m.key).value));
assert.ok(changed.length>=1,'the rune changes at least one ship attribute');
H.rejectUnchanged(s,'runeEngrave',{runeId:rune,moduleId:Object.values(s.equipped).find(m=>m.type==='engine').id});

// One rune per module; an engraved module cannot be recycled until the rune is removed.
const stored=s.inventory[0];assert.ok(stored,'a stored module exercises the recycling guard');
if(stored){
 H.checkedAct(s,'runeRemove',{moduleId:target.id});assert.equal(target.rune,undefined);
 H.checkedAct(s,'runeEngrave',{runeId:rune,moduleId:stored.id});
 assert.equal(E.preview(s,'salvage',{moduleId:stored.id}).allowed,false);
 H.rejectUnchanged(s,'salvage',{moduleId:stored.id});
 H.checkedAct(s,'runeRemove',{moduleId:stored.id});
 assert.equal(E.preview(s,'salvage',{moduleId:stored.id}).allowed,true);
 H.checkedAct(s,'runeEngrave',{runeId:rune,moduleId:target.id});
}
assert.ok(E.restore(E.snapshot(s)),'runes survive a reload');

// Forged saves are rejected.
const forged=(edit)=>{const x=clone(E.snapshot(s));edit(x);return E.restore(x);};
assert.equal(forged(x=>{Object.values(x.equipped).find(m=>m.type==='engine').rune=rune;}),null,'one rune on two modules');
assert.equal(forged(x=>{Object.values(x.equipped).find(m=>m.type==='engine').rune='rune-urso-geada';}),null,'unknown rune');
assert.equal(forged(x=>{x.xeno.runes.push('rune-raposa-aurora');}),null,'rune without study');
assert.equal(forged(x=>{x.xeno.pending='lesma-acida';}),null,'pending capture outside an expedition');
assert.equal(forged(x=>{x.xeno.tools.push('laser');}),null,'unknown tool');
const legacy=clone(E.snapshot(fresh));delete legacy.xeno;assert.ok(E.restore(legacy).xeno,'older saves gain an empty lab');

// Tools are sold at stations, once.
const shop=E.create('xeno-shop');E.dispatch(shop,'guideSkip');shop.resources.credits=1000;
H.rejectUnchanged(shop,'xenoBuyTool',{toolId:'garra'});
H.checkedAct(shop,'stationDock');const credits=shop.resources.credits;
H.checkedAct(shop,'xenoBuyTool',{toolId:'garra'});assert.equal(shop.resources.credits,credits-160);
H.rejectUnchanged(shop,'xenoBuyTool',{toolId:'garra'});

console.log('PASS 16 unique exemplars, tool-gated capture held until extraction, evacuation returns it, study and rune costs, engrave/remove, one rune per module, recycling blocked, forged saves rejected, station tools.');
