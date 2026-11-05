const { chromium } = require("./node_modules/playwright"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  for (const [width, height] of [
    [320, 568],
    [390, 844],
  ]) {
    const p = await b.newPage({ viewport: { width, height } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://localhost:8765");
    await p.waitForFunction(() => window.orbitApp);
    await p.locator("[data-story-action=skip]").click();
    await p.locator("[data-guide-skip]").click();
    async function load(change) {
      await p.evaluate(change);
      await p.reload();
      await p.waitForFunction(() => window.orbitApp);
      await p.locator("[data-action=alien-post]").click();
      await p.locator("[data-civ-tab=Restore]").click();
    }
    await load(() => {
      const s = orbitApp.getState();
      s.civilizations.people[0].step = 1;
      s.resources.lumenfern = 3;
      s.components.seal = 1;
      OrbitEngine.currentPlanet(s).scanned = true;
      s.location.mode = "docked";
      s.civilizations.people[0].visits = [s.location.planetId];
      localStorage.setItem(
        "orbita-explorador-v1",
        JSON.stringify({ state: s, tab: "explore" }),
      );
    });
    async function fit(label) {
      const r = await p
        .locator(".og-sheet-content")
        .evaluate((e) => ({
          h: e.clientHeight,
          s: e.scrollHeight,
          text: e.innerText,
        }));
      assert(r.s <= r.h + 2, JSON.stringify({ width, label, ...r }));
      assert(!r.text.includes("undefined"));
    }
    await fit("dormant");
    const dormant = await p.locator(".og-garden-card img").getAttribute("src");
    await p.locator("[data-action=civRestore]").click();
    await fit("restored");
    assert.notEqual(
      await p.locator(".og-garden-card img").getAttribute("src"),
      dormant,
    );
    await p.screenshot({ path: "/tmp/garden-restored-" + width + ".png" });
    await p.locator("[data-action=civPlant]").click();
    await fit("growing");
    assert(await p.locator("[data-action=civHarvest]").isDisabled());
    await load(() => {
      const s = orbitApp.getState();
      s.civilizations.people[0].activity.garden.batch.sites =
        OrbitEngine.currentPlanet(s)
          .sites.slice(0, 2)
          .map((x) => x.id);
      s.resources.ore += OrbitEngine.storageView(s).free;
      localStorage.setItem(
        "orbita-explorador-v1",
        JSON.stringify({ state: s, tab: "explore" }),
      );
    });
    await fit("full hold");
    assert(await p.locator("[data-action=civHarvest]").isDisabled());
    assert.match(await p.locator(".og-garden-card").innerText(), /Reserve 3/);
    await load(() => {
      const s = orbitApp.getState();
      s.resources.ore -= 3;
      localStorage.setItem(
        "orbita-explorador-v1",
        JSON.stringify({ state: s, tab: "explore" }),
      );
    });
    await fit("ready");
    const plants = await p.evaluate(
      () => orbitApp.getState().resources.lumenfern,
    );
    await p.locator("[data-action=civHarvest]").click();
    await fit("harvested");
    assert.equal(
      await p.evaluate(() => orbitApp.getState().resources.lumenfern),
      plants + 3,
    );
    await load(() => {
      const s = orbitApp.getState();
      s.resources.credits = 0;
      localStorage.setItem(
        "orbita-explorador-v1",
        JSON.stringify({ state: s, tab: "explore" }),
      );
    });
    await fit("insufficient resources");
    assert(await p.locator("[data-action=civPlant]").isDisabled());
    assert.deepEqual(errors, []);
    await p.close();
    console.log("PASS garden visual states and cultivation cards", width);
  }
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
