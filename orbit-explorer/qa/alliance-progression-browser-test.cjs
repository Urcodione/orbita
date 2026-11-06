const { chromium } = require("./node_modules/playwright"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  for (const width of [320, 390])
    for (const f of [0, 1, 2]) {
      const p = await b.newPage({
        viewport: { width, height: width === 320 ? 568 : 844 },
      });
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto("http://localhost:8765");
      await p.waitForFunction(() => window.orbitApp);
      await p.locator("[data-story-action=skip]").click();
      await p.locator("[data-guide-skip]").click();
      for (const step of [0, 1, 2, 3]) {
        await p.evaluate(
          ({ f, step }) => {
            let s = orbitApp.getState();
            s.galaxyIndex = f;
            s.visitedGalaxies = f + 1;
            s.galaxy = OrbitEngine.generateGalaxy(s.seed, f, "frontier");
            s.location = {
              planetId: s.galaxy.planets[0].id,
              mode: "orbit",
              stationId: s.galaxy.systems[0].id,
            };
            s.surveyArchive = {
              entries: [],
              earlier: [0, 0, 0, 0, 0, 0],
              unavailable: f,
            };
            delete s.campaign;
            s = OrbitEngine.restore(OrbitEngine.snapshot(s));
            s.civilizations.people[f].step = step;
            localStorage.setItem(
              "orbita-explorador-v1",
              JSON.stringify({ state: s, tab: "explore" }),
            );
          },
          { f, step },
        );
        await p.reload();
        await p.waitForFunction(() => window.orbitApp);
        if (await p.locator("[data-story-action=skip]").isVisible())
          await p.locator("[data-story-action=skip]").click();
        await p.evaluate(() => {
          document
            .querySelector("#orbit-game")
            .insertAdjacentHTML(
              "beforeend",
              '<button data-action="civilizations" id="test-open">Aliança</button>',
            );
        });
        await p.locator("#test-open").click();
        async function fit() {
          const x = await p
            .locator(".og-sheet-content")
            .evaluate((e) => ({
              h: e.clientHeight,
              s: e.scrollHeight,
              text: e.innerText,
            }));
          assert(x.s <= x.h + 2, JSON.stringify({ width, f, step, ...x }));
        }
        for (const tab of ["Jornada", "Recompensas", "Apoio"]) {
          await p.locator('[data-alliance-tab="' + tab + '"]').click();
          await fit();
          if (tab === "Recompensas")
            for (const i of [0, 1, 2]) {
              await p.locator('[data-alliance-reward="' + i + '"]').click();
              await fit();
            }
        }
      }
      assert.deepEqual(errors, []);
      await p.close();
      console.log("PASS alliance stages and rewards", width, f);
    }
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
