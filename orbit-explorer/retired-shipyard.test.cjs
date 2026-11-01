const assert=require('node:assert/strict');global.OrbitEngine=require('./engine.js');
for(const f of ['economy','campaign','campaign-events','campaign-guidance','tutorial','storage','voyage','xenobiology'])require('./'+f+'.js');
const E=global.OrbitEngine,H=require('./expedition-test-helper.cjs');
const s=E.create('retired-yard');H.checkedAct(s,'guideSkip');
const credits=s.resources.credits,snap=E.snapshot(s);
// A save from the shipyard era: parts in the hangar and mounted on the hull.
const legacy=JSON.parse(JSON.stringify(snap));legacy.yard={v:1,owned:{'tanque-externo':2,'baia-drones':1,laser:3,'placas-casco':-4},layout:[{p:'tanque-externo',c:10}]};
const r=E.restore(legacy);assert.ok(r,'shipyard-era saves still load');
assert.equal(r.yard,undefined,'the shipyard state is dropped');
assert.equal(r.resources.credits,credits+2*140+420,'owned parts are refunded at their price; unknown ids and bad counts are ignored');
assert.match(r.log[0].text,/estaleiro estelar foi desativado.*\+700 Lumes/);
assert.ok(E.validate(r));
// Nothing bought: no refund and no message.
const empty=JSON.parse(JSON.stringify(snap));empty.yard={v:1,owned:{},layout:[]};
const e=E.restore(empty);assert.equal(e.resources.credits,credits);assert.equal(e.yard,undefined);assert.doesNotMatch(e.log[0]?.text||'',/estaleiro/);
// Current saves are untouched.
assert.equal(E.restore(snap).resources.credits,credits);
console.log('PASS retired shipyard: old saves load, parts refunded in Lumes with a log entry, no yard state left.');
