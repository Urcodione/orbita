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
  "explorer-record",
])
  require("./" + f + ".js");
const E = global.OrbitEngine,
  H = require("./expedition-test-helper.cjs");
const s = E.create("civilizations");
H.checkedAct(s, "guideSkip");
assert(E.validate(s));
H.rejectUnchanged(s, "civDonate");
const legacy = E.snapshot(s);
delete legacy.civilizations;
assert(E.restore(legacy).civilizations);
H.checkedAct(s, "scan");
H.checkedAct(s, "dock");
H.checkedAct(s, "civVisit");
H.rejectUnchanged(s, "civVisit");
H.checkedAct(s, "launch");
const dock = H.checkedAct(s, "stationDock");
assert.deepEqual(dock.cinema, { kind: "dock", seen: false });
s.resources.credits = 5000;
s.resources.data = 500;
s.resources.ore = 30;
s.resources.crystals = 20;
s.resources.lumenfern = 10;
H.checkedAct(s, "civMission");
H.checkedAct(s, "civMission");
H.checkedAct(s, "civMission");
H.rejectUnchanged(s, "civMission");
assert.equal(E.civilizationView(s).rep, 70);
H.checkedAct(s, "civDeliver");
assert.equal(E.civilizationView(s).rep, 85);
H.checkedAct(s, "civPaint");
H.rejectUnchanged(s, "civPaint");
H.checkedAct(s, "civShip");
assert(s.fleet.owned.includes("albatroz"));
H.rejectUnchanged(s, "civShip");
s.components.seal = 2;
s.components.circuit = 2;
H.checkedAct(s, "fabricate", { recipeId: "aural-life" });
assert(s.inventory.some((x) => x.recipeId === "aural-life"));
H.rejectUnchanged(s, "fabricate", { recipeId: "veyra-shield" });
assert.deepEqual(E.restore(E.snapshot(s)).civilizations, s.civilizations);
for (const change of [
  (c) => (c.people[0].step = 4),
  (c) => c.people[0].visits.push("g999-p0"),
  (c) => (c.people[0].donations = -1),
  (c) => c.seen.push("invalid"),
]) {
  const save = E.snapshot(s);
  change(save.civilizations);
  assert.equal(E.restore(save), null);
}
s.resources.fuel = E.stats(s).maxFuel;
s.resources.oxygen = E.stats(s).maxOxygen;
H.checkedAct(s, "stationLeave");
H.rejectUnchanged(s, "civDeliver");
s.resources.fuel = E.stats(s).maxFuel;
assert.equal(H.checkedAct(s, "stationDock").cinema.seen, true);
console.log(
  "PASS civilizations: migration, costs, chain, once-only witnesses, unlocks, crafting, hangar, docking, rejected actions and saves.",
);

// Every exclusive blueprint produces a valid, restorable module once its own people trust the player.
for (const [i, id] of [
  "aural-life",
  "veyra-shield",
  "thar-scanner",
].entries()) {
  s.civilizations.people[i].donations = 4;
  s.resources.data = 500;
  s.resources.credits = 5000;
  for (const part of ["seal", "circuit", "alloy", "prism"])
    s.components[part] = 10;
  while (s.inventory.length >= E.stats(s).cargoCapacity) s.inventory.pop();
  H.checkedAct(s, "fabricate", { recipeId: id });
  assert(E.restore(E.snapshot(s)));
}
