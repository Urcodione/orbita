const assert = require("node:assert/strict");
global.OrbitEngine = require("./engine");
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
  "civilization-services",
  "explorer-record",
])
  require("./" + f);
const E = OrbitEngine,
  H = require("./expedition-test-helper.cjs");
function fixture(f) {
  let s = E.create("services-" + f);
  H.checkedAct(s, "guideSkip");
  s.galaxyIndex = f;
  s.visitedGalaxies = f + 1;
  s.galaxy = E.generateGalaxy(s.seed, f, "frontier");
  s.location = { planetId: s.galaxy.planets[0].id, mode: "docked" };
  s.surveyArchive = {
    entries: [],
    earlier: [0, 0, 0, 0, 0, 0],
    unavailable: f,
  };
  delete s.campaign;
  s = E.restore(E.snapshot(s));
  assert(s);
  E.currentPlanet(s).scanned = true;
  s.resources.data = 50;
  s.resources.credits = 100;
  s.components.alloy = 5;
  s.civilizations.people[f].activity.restored = true;
  assert(E.validate(s));
  return s;
}
const v = fixture(1),
  id = v.galaxy.planets[1].id;
H.rejectUnchanged(v, "civSurvey", { planetId: "g99-p1" });
H.checkedAct(v, "civSurvey", { planetId: id });
assert.equal(v.resources.credits, 88);
assert.equal(v.resources.data, 44);
assert(!v.galaxy.planets[1].scanned);
assert(E.civilizationReport(v, id));
H.rejectUnchanged(v, "civSurvey", { planetId: id });
assert(E.restore(E.snapshot(v)));
v.location.mode = "orbit";
H.rejectUnchanged(v, "civSurvey", { planetId: v.galaxy.planets[2].id });
const t = fixture(2);
H.rejectUnchanged(t, "civReclaim", { componentId: "field-core" });
for (const id of ["prism", "circuit", "seal"])
  H.checkedAct(t, "civReclaim", { componentId: id });
assert.equal(t.components.alloy, 2);
assert.equal(t.resources.credits, 64);
H.rejectUnchanged(t, "civReclaim", { componentId: "prism" });
assert(E.restore(E.snapshot(t)));
const old = E.snapshot(t);
delete old.civilizations.services;
assert(E.restore(old));
const bad = E.snapshot(t);
bad.civilizations.services.jobs[2] = -1;
assert.equal(E.restore(bad), null);
const full = fixture(2);
full.resources.ore += E.storageView(full).free + 10;
H.rejectUnchanged(full, "civReclaim", { componentId: "prism" });
const poor = fixture(2);
poor.resources.credits = 0;
H.rejectUnchanged(poor, "civReclaim", { componentId: "prism" });
poor.resources.credits = 100;
poor.civilizations.people[2].activity.restored = false;
H.rejectUnchanged(poor, "civReclaim", { componentId: "prism" });
console.log(
  "PASS services: location, costs, duplicate reading, scan preservation, yields, limit, capacity, insufficient resources, migration and invalid saves",
);

const scanned = fixture(1);
H.rejectUnchanged(scanned, "civSurvey", {
  planetId: scanned.location.planetId,
});
