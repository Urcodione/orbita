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
  "explorer-record",
])
  require("./" + f + ".js");
const E = OrbitEngine,
  H = require("./expedition-test-helper.cjs");
function fieldAct(s, a, p) {
  const result = H.checkedAct(s, a, p);
  if (
    a === "expeditionInteract" &&
    E.fieldTaskView(s) &&
    !E.fieldTaskView(s).done
  ) {
    const t = E.fieldTaskView(s);
    for (const index of t.kind === "relay" ? [0, 0, 1] : t.target)
      H.checkedAct(s, "expeditionTask", { index });
  }
  return result;
}
function fixture(f) {
  const s = E.create("activities-" + f);
  H.checkedAct(s, "guideSkip");
  if (f) {
    s.galaxyIndex = f;
    s.visitedGalaxies = f + 1;
    s.galaxy = E.generateGalaxy(s.seed, f, "frontier");
    s.location = { planetId: s.galaxy.planets[0].id, mode: "orbit" };
    s.surveyArchive = {
      entries: [],
      earlier: [0, 0, 0, 0, 0, 0],
      unavailable: f,
    };
    delete s.campaign;
  }
  const restored = E.restore(E.snapshot(s));
  assert(restored);
  return restored;
}
for (let f = 0; f < 3; f++) {
  const s = fixture(f),
    person = s.civilizations.people[f];
  const legacy = E.snapshot(s);
  delete legacy.civilizations.people[f].activity;
  assert(E.restore(legacy).civilizations.people[f].activity);
  const completed = E.snapshot(s);
  completed.civilizations.people[f].step = 3;
  delete completed.civilizations.people[f].activity;
  assert.equal(E.restore(completed).civilizations.people[f].step, 3);
  H.rejectUnchanged(s, "civRestore");
  H.rejectUnchanged(s, "civExchange");
  H.checkedAct(s, "stationDock");
  H.checkedAct(s, "civMission");
  H.rejectUnchanged(s, "civMission");
  Object.assign(s.resources, {
    fuel: 200,
    oxygen: 200,
    ore: 100,
    crystals: 20,
    data: 500,
    credits: 5000,
    lumenfern: 8,
    cryorchid: 1,
    ferronita: 6,
    prismalita: 3,
    glassjelly: 1,
  });
  for (const m of Object.values(s.equipped)) {
    m.power = 4;
    m.capabilities = {
      heat: 10000,
      cold: 10000,
      radiation: 10000,
      pressure: 10000,
      toxicity: 100,
      gas: true,
      liquid: true,
    };
    m.effects = { expeditionReserve: 10, expeditionIntegrity: 6 };
  }
  function supply() {
    const v = E.stats(s);
    s.resources.fuel = v.maxFuel;
    s.resources.oxygen = v.maxOxygen;
    s.resources.hull = v.maxHull;
  }
  supply();
  H.checkedAct(s, "stationLeave");
  H.checkedAct(s, "scan");
  H.checkedAct(s, "dock");
  H.checkedAct(s, "civVisit");
  H.rejectUnchanged(s, "civRestore");
  Object.assign(s.components, { seal: 2, alloy: 3, circuit: 3, prism: 3 });
  H.checkedAct(s, "civRestore");
  H.rejectUnchanged(s, "civRestore");
  const recipe = E.civilizationView(s).exchangeRecipe.id;
  H.rejectUnchanged(s, "fabricate", { recipeId: recipe });
  H.checkedAct(s, "civExchange");
  H.rejectUnchanged(s, "civExchange");
  for (const id of ["seal", "battery", "circuit", "alloy", "prism"])
    s.components[id] = 5;
  assert(
    E.preview(s, "fabricate", { recipeId: recipe }).allowed,
    JSON.stringify(E.preview(s, "fabricate", { recipeId: recipe })),
  );
  H.checkedAct(s, "fabricate", { recipeId: recipe });
  assert(s.inventory.some((m) => m.recipeId === recipe));
  function visit(p) {
    supply();
    if (s.location.mode === "docked") H.checkedAct(s, "launch");
    if (s.location.planetId !== p.id)
      H.checkedAct(s, "travel", { planetId: p.id });
    if (!E.currentPlanet(s).scanned) H.checkedAct(s, "scan");
    H.checkedAct(s, "dock");
  }
  function extract(p) {
    visit(p);
    H.start(s, E.currentPlanet(s).sites.find((t) => !t.explored).id);
    if (f === 0) {
      const c = H.revealedBoard(s).find(
        (c) =>
          ["ore", "crystals"].includes(c.kind) && !c.collected && H.route(s, c),
      );
      assert(c);
      H.walk(s, c);
      H.checkedAct(s, "expeditionCollect");
    }
    H.finish(s, fieldAct);
  }
  if (f === 0) {
    extract(s.galaxy.planets.find((p) => p.biome === "forest"));
    extract(
      s.galaxy.planets.find((p) =>
        E.deposits(p).some(
          (id) => id !== "lumenfern" && E.materials[id].category === "Flora",
        ),
      ),
    );
    assert.equal(s.civilizations.people[f].activity.flora.length, 2);
  }
  if (f === 1) {
    const p = s.galaxy.planets.find((p) => p.biome === "volcanic");
    visit(p);
    H.start(s, E.currentPlanet(s).sites[0].id);
    for (const beacon of H.revealedBoard(s).filter((c) => c.kind === "beacon"))
      H.walk(s, beacon);
    H.checkedAct(s, "expeditionAbort");
    assert.equal(
      s.civilizations.people[f].activity.beacons.length,
      0,
      "evacuation cannot certify a route",
    );
    extract(p);
    extract(p);
    assert.equal(s.civilizations.people[f].activity.beacons.length, 2);
  }
  if (f === 2) {
    visit(s.galaxy.planets.find((p) => p.biome === "desert"));
    visit(s.galaxy.planets.find((p) => p.biome === "ice"));
    assert.equal(s.civilizations.people[f].activity.biomes.length, 3);
    extract(s.galaxy.planets[0]);
    extract(
      s.galaxy.planets.find((p) => p.systemId !== s.galaxy.planets[0].systemId),
    );
    assert.equal(s.civilizations.people[f].activity.systems.length, 2);
  }
  supply();
  H.checkedAct(s, "launch");
  H.checkedAct(s, "stationDock");
  H.checkedAct(s, "civMission");
  H.checkedAct(s, "civMission");
  H.rejectUnchanged(s, "civMission");
  assert.equal(E.civilizationView(s).step, 3);
  assert(E.restore(E.snapshot(s)));
  const corrupt = E.snapshot(s);
  corrupt.civilizations.people[f].activity.exchanged = "yes";
  assert.equal(E.restore(corrupt), null);
  console.log(
    "PASS distinct faction chain, extraction objectives, restoration, unique trade and blueprint",
    f,
  );
}
