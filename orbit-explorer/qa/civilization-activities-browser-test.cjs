const { chromium } = require("./node_modules/playwright");
const assert = require("node:assert/strict");
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
    await p.evaluate(() => {
      const s = orbitApp.getState();
      s.civilizations.people[0].step = 1;
      s.resources.cryorchid = 1;
      s.resources.lumenfern = 3;
      s.components.seal = 2;
      localStorage.setItem(
        "orbita-explorador-v1",
        JSON.stringify({ state: s, tab: "explore" }),
      );
    });
    await p.reload();
    await p.waitForFunction(() => window.orbitApp);
    await p.evaluate(() => orbitApp.act("scan"));
    await p.locator("[data-action=close-sheet]").click();
    await p.evaluate(() => orbitApp.act("dock"));
    await p.locator("[data-action=close-sheet]").click();
    await p.locator("[data-action=alien-post]").click();
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
    await fit("contact");
    await p.locator("[data-action=civVisit]").click();
    await p.locator("[data-civ-tab=Restore]").click();
    await fit("restore");
    await p.locator("[data-action=civRestore]").click();
    assert(await p.locator("[data-action=civRestore]").isDisabled());
    await fit("restored");
    await p.locator("[data-civ-tab=Exchange]").click();
    await fit("trade");
    await p.screenshot({ path: "/tmp/civ-post-" + width + ".png" });
    await p.locator("[data-action=civExchange]").click();
    assert(await p.locator("[data-action=civExchange]").isDisabled());
    await fit("traded");
    assert(
      await p.evaluate(
        () => orbitApp.getState().civilizations.people[0].activity.exchanged,
      ),
    );
    assert.deepEqual(errors, []);
    await p.close();
    console.log("PASS post cards", width);
  }
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
