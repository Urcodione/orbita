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
let orders = 0,
  readings = 0;
for (let seed = 0; seed < 60; seed++)
  for (let galaxy = 0; galaxy < 8; galaxy++) {
    const s = E.create(seed);
    E.dispatch(s, "guideSkip");
    s.galaxyIndex = galaxy;
    s.galaxy = E.generateGalaxy(seed, galaxy, "frontier");
    delete s.campaign;
    for (const sys of s.galaxy.systems) {
      s.location = {
        mode: "orbit",
        planetId: sys.planetIds[0],
        stationId: sys.id,
      };
      const contracts = E.contracts(s);
      assert.equal(contracts.length, 2);
      assert.notEqual(contracts[0].resource, contracts[1].resource);
      for (const c of contracts) {
        assert(
          ["ore", "crystals"].includes(c.resource) ||
            s.galaxy.planets.some((p) => E.deposits(p).includes(c.resource)),
          c.name + " has no source",
        );
        orders++;
      }
    }
    s.civilizations.services ||= { reports: [], jobs: {} };
    for (const p of s.galaxy.planets) {
      s.civilizations.services.reports.push(p.id);
      const report = E.civilizationReport(s, p.id);
      if (report.resourceId) {
        assert(E.deposits(p).includes(report.resourceId));
        const i = Number(report.siteId.split("-s")[1]),
          local = E.deposits(p);
        assert(
          [local[i % local.length], local[(i + 1) % local.length]].includes(
            report.resourceId,
          ),
        );
        readings++;
      }
    }
  }
// Previously completed impossible orders remain paid and cannot pay a second time.
let s = E.create(0);
E.dispatch(s, "guideSkip");
const sys = s.galaxy.systems[2];
s.location = { mode: "orbit", planetId: sys.planetIds[0], stationId: sys.id };
s.charters = ["0:" + sys.id + ":0"];
const paid = E.contracts(s)[0];
assert.equal(paid.resource, "glassjelly");
assert(paid.paid);
H.rejectUnchanged(s, "contractDeliver", { contractId: paid.id });
assert(E.restore(E.snapshot(s)));
for (const id of ["prism", "circuit", "seal"]) {
  const c = E.reclaimComparison(id);
  assert.deepEqual(c.fromRaw, { ore: 3, credits: 16 });
  assert.deepEqual(c.craft, E.componentRecipes.find((r) => r.id === id).cost);
  assert.deepEqual(c.recover, { alloy: 1, credits: 12 });
}
console.log(
  "PASS",
  orders,
  "orders with actual sources;",
  readings,
  "valid deposit locations; paid legacy order and Thar comparisons",
);
