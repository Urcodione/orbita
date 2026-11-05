const assert = require("node:assert/strict");
global.OrbitEngine = require("./engine.js");
for (const f of [
  "economy",
  "campaign",
  "campaign-events",
  "campaign-guidance",
  "tutorial",
  "storage",
  "voyage",
  "xenobiology",
  "ships",
  "civilizations",
  "civilization-activities",
  "aural-garden",
  "explorer-record",
])
  require("./" + f + ".js");
const E = OrbitEngine,
  H = require("./expedition-test-helper.cjs");
let s = E.create("aural-garden");
H.checkedAct(s, "guideSkip");
H.rejectUnchanged(s, "civPlant");
s.civilizations.people[0].step = 1;
s.resources.lumenfern = 2;
s.components.seal = 1;
H.checkedAct(s, "scan");
H.checkedAct(s, "dock");
H.checkedAct(s, "civVisit");
H.rejectUnchanged(s, "civPlant");
H.checkedAct(s, "civRestore");
const before = { ...s.resources };
H.checkedAct(s, "civPlant");
assert.equal(s.resources.credits, before.credits - 12);
assert.equal(s.resources.ore, before.ore - 2);
H.rejectUnchanged(s, "civPlant");
H.rejectUnchanged(s, "civHarvest");
const sites = E.currentPlanet(s).sites.map((x) => x.id);
function supply() {
  const v = E.stats(s);
  s.resources.fuel = v.maxFuel;
  s.resources.oxygen = v.maxOxygen;
  s.resources.hull = v.maxHull;
}
function collect(site, abort = false) {
  supply();
  H.start(s, site);
  const cell = H.revealedBoard(s).find(
    (c) =>
      ["ore", "crystals"].includes(c.kind) && !c.collected && H.route(s, c),
  );
  assert(cell);
  H.walk(s, cell);
  H.checkedAct(s, "expeditionCollect");
  if (abort) return H.checkedAct(s, "expeditionAbort");
  H.walk(s, E.expeditionView(s).base);
  return H.checkedAct(s, "expeditionExtract");
}
collect(sites[0], true);
assert.equal(E.auralGardenView(s).progress, 0);
collect(sites[0]);
assert.equal(E.auralGardenView(s).progress, 1);
s = E.restore(E.snapshot(s));
assert(s);
assert.equal(E.auralGardenView(s).progress, 1);
collect(sites[0]);
assert.equal(
  E.auralGardenView(s).progress,
  1,
  "same site cannot advance twice",
);
collect(sites[1]);
assert(E.auralGardenView(s).ready);
const old = E.snapshot(s);
delete old.civilizations.people[0].activity.garden;
assert.equal(E.auralGardenView(E.restore(old)).harvests, 0);
assert(E.auralGardenView(E.restore(old)).unlocked);
const bad = E.snapshot(s);
bad.civilizations.people[0].activity.garden.batch.sites.push(sites[1]);
assert.equal(E.restore(bad), null);
const free = E.storageView(s).free;
s.resources.ore += free;
H.rejectUnchanged(s, "civHarvest");
assert(E.auralGardenView(s).ready);
s.resources.ore -= 3;
const plants = s.resources.lumenfern;
H.checkedAct(s, "civHarvest");
assert.equal(s.resources.lumenfern, plants + 3);
assert.equal(E.auralGardenView(s).harvests, 1);
H.rejectUnchanged(s, "civHarvest");
assert(E.restore(E.snapshot(s)));
H.checkedAct(s, "launch");
s.resources.oxygen = Math.max(0, E.stats(s).maxOxygen - 12);
const oxygen = s.resources.oxygen,
  ferns = s.resources.lumenfern;
H.checkedAct(s, "refillOxygen");
assert.equal(s.resources.oxygen, oxygen + 12);
assert.equal(s.resources.lumenfern, ferns - 1);
console.log(
  "PASS Aural restoration, paid planting, distinct successful collection sorties, abort/revisit protection, save migration, full hold, single harvest and oxygen conversion.",
);
