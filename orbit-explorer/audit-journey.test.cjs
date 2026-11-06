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
for (const seed of [7, 123, 1234, 2026, 9001]) {
  const s = E.create(seed);
  H.checkedAct(s, "guideSkip");
  const before = { ...s.resources };
  H.start(s);
  const target = H.revealedBoard(s).find(
    (c) => ["ore", "crystals"].includes(c.kind) && H.route(s, c),
  );
  assert(target);
  H.walk(s, target);
  H.checkedAct(s, "expeditionCollect");
  H.walk(s, E.expeditionView(s).base);
  const result = H.checkedAct(s, "expeditionExtract");
  assert(Object.keys(result.reward).length);
  assert(s.resources.fuel < before.fuel);
  assert(s.resources.oxygen < before.oxygen);
  assert(E.restore(E.snapshot(s)));
  assert.equal(s.location.mode, "docked");
}
console.log(
  "PASS five clean starts with full rules: paid sortie, collected cargo, safe extraction and save reload; no resource grants",
);
