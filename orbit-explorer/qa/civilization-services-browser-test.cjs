const { chromium } = require("./node_modules/playwright"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  for (const width of [320, 390])
    for (const faction of [1, 2]) {
      const p = await b.newPage({
          viewport: { width, height: width === 320 ? 568 : 844 },
        }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto("http://localhost:8765");
      await p.waitForFunction(() => window.orbitApp);
      await p.locator("[data-story-action=skip]").click();
      await p.locator("[data-guide-skip]").click();
      await p.evaluate((f) => {
        let s = orbitApp.getState();
        s.galaxyIndex = f;
        s.visitedGalaxies = f + 1;
        s.galaxy = OrbitEngine.generateGalaxy(s.seed, f, "frontier");
        s.location = { planetId: s.galaxy.planets[0].id, mode: "docked" };
        s.surveyArchive = {
          entries: [],
          earlier: [0, 0, 0, 0, 0, 0],
          unavailable: f,
        };
        delete s.campaign;
        s = OrbitEngine.restore(OrbitEngine.snapshot(s));
        OrbitEngine.currentPlanet(s).scanned = true;
        s.resources.credits = 100;
        s.resources.data = 50;
        s.components.alloy = 5;
        s.civilizations.people[f].activity.restored = true;
        localStorage.setItem(
          "orbita-explorador-v1",
          JSON.stringify({ state: s, tab: "explore" }),
        );
      }, faction);
      await p.reload();
      await p.waitForFunction(() => window.orbitApp);
      if (await p.locator("[data-story-action=skip]").isVisible())
        await p.locator("[data-story-action=skip]").click();
      await p.locator("[data-action=alien-post]").click();
      await p.locator("[data-civ-tab=Service]").click();
      async function fit() {
        const box = await p
          .locator(".og-sheet-content")
          .evaluate((e) => ({
            height: e.clientHeight,
            scroll: e.scrollHeight,
            text: e.innerText,
          }));
        assert(
          box.scroll <= box.height + 2,
          JSON.stringify({ width, faction, ...box }),
        );
      }
      await fit();
      if (faction === 1) {
        assert(await p.locator("[data-action=civSurvey]").isDisabled());
        await p.locator('[data-service-step="1"]').click();
        await p.locator("[data-action=civSurvey]").click();
        assert(await p.locator(".og-service-report").isVisible());
        await fit();
        await p.locator('[data-service-step="1"]').click();
        assert(await p.locator("[data-action=civSurvey]").isEnabled());
      } else {
        for (let i = 0; i < 3; i++)
          await p.locator("[data-action=civReclaim]").first().click();
        await fit();
        assert(
          await p.locator("[data-action=civReclaim]").first().isDisabled(),
        );
      }
      await p.screenshot({
        path: "/tmp/services-" + faction + "-" + width + ".png",
      });
      assert.deepEqual(errors, []);
      await p.close();
      console.log("PASS service cards", faction, width);
    }
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
