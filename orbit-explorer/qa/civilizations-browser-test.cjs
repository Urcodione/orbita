"use strict";
const { chromium } = require("./node_modules/playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  for (const [width, height] of [
    [320, 568],
    [390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    const p = await context.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    const click = async (selector) => {
      for (let n = 0; n < 10; n++) {
        const target = p.locator(selector + ":visible").first();
        if (await target.count()) {
          await target.click();
          return;
        }
        await p.locator('[data-sheet-page="1"]:visible:not(:disabled)').click();
      }
      throw Error("Missing " + selector);
    };
    const fit = async () => {
      const box = await p
        .locator(".og-sheet-content")
        .evaluate((e) => ({ h: e.clientHeight, s: e.scrollHeight }));
      assert(box.s <= box.h + 2, JSON.stringify({ width, ...box }));
    };
    await p.goto("http://localhost:8765");
    await p.waitForFunction(() => window.orbitApp);
    await p.locator("[data-story-action=skip]").waitFor();
    await click("[data-story-action=skip]");
    await p.locator("[data-guide-skip]").waitFor();
    await click("[data-guide-skip]");
    // The ordinary station journey starts the skippable arrival scene.
    await p.locator(".og-tabs [data-tab=galaxy]").click();
    await p.locator("[data-map-level=galaxy]").first().click();
    await click(".og-station-node");
    await click("[data-action=stationDock]");
    await p.locator(".og-arrival").waitFor();
    await p.locator(".og-arrival button").click();
    await fit();
    await click("[data-action=civilizations]");
    await fit();
    assert.match(await p.locator(".og-civ-header").innerText(), /0\/100/);
    await click("[data-action=civMission]");
    assert.match(await p.locator(".og-civ-header").innerText(), /20\/100/);
    await fit();
    await click("[data-action=nav-back]");
    assert.equal(await p.evaluate(() => orbitApp.getView().sheet), "station");
    await click("[data-action=stationLeave]");
    // Visit the real planetary outpost after scanning and landing, then return to the planet.
    await p.evaluate(() => {
      orbitApp.act("scan");
    });
    await click("[data-action=close-sheet]");
    await p.evaluate(() => orbitApp.act("dock"));
    await click("[data-action=close-sheet]");
    await p.locator(".og-tabs [data-tab=explore]").click();
    await click("[data-action=alien-post]");
    await fit();
    await click("[data-action=civVisit]");
    assert.equal(await p.locator("[data-action=civVisit]").isDisabled(), true);
    await fit();
    await click("[data-action=nav-back]");
    assert.equal(await p.evaluate(() => orbitApp.getView().sheet), null);
    // All flora cinematics fit, use the correct landscape and can be dismissed.
    for (const biome of ["forest", "ice", "volcanic", "gas"]) {
      await p.evaluate((biome) => {
        const s = orbitApp.getState();
        OrbitEngine.currentPlanet(s).biome = biome;
        OrbitArrivalCinema.show(
          document.querySelector("#orbit-game"),
          "harvest",
          s,
        );
      }, biome);
      await p.locator(".og-arrival button").click();
    }
    await p.reload();
    await p.waitForFunction(() => window.orbitApp);
    assert.equal(
      await p.evaluate(
        () => OrbitEngine.civilizationView(orbitApp.getState()).rep,
      ),
      30,
    );
    await p.screenshot({ path: "/tmp/civilizations-final-" + width + ".png" });
    assert.deepEqual(errors, []);
    await context.close();
  }
  await browser.close();
  console.log(
    "PASS civilizations mobile 320/390, station, mission, outpost, return, persistent reputation and skippable biome cinematics.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
