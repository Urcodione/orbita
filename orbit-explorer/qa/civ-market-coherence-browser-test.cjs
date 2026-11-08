const { chromium } = require("./node_modules/playwright"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  for (const width of [320, 390]) {
    const p = await b.newPage({
        viewport: { width, height: width === 320 ? 568 : 844 },
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://localhost:8765");
    await p.waitForFunction(() => window.orbitApp);
    await p.locator("[data-story-action=skip]").click();
    await p.locator("[data-guide-skip]").click();
    await p.locator(".og-tabs [data-tab=galaxy]").click();
    await p.locator("[data-map-level=galaxy]").click();
    await p.locator(".og-station-node").click();
    await p.locator("[data-action=stationDock]").click();
    await p.locator("[data-action=market]").click();
    await p.locator('[data-market-group="Minerais"]').click();
    await p.locator("[data-action=market-item][data-resource=ore]").click();
    await p.locator("[data-trade-side=sell]").click();
    for (const dir of [1, 1, -1]) {
      await p.locator('[data-resource-step="' + dir + '"]').click();
      assert.equal(
        await p.locator("[data-trade-side=sell]").getAttribute("aria-pressed"),
        "true",
      );
      const title = await p.locator("#og-sheet-title").innerText();
      assert(["Minério", "Cristais"].includes(title), title);
    }
    await p.locator("[data-trade-side=buy]").click();
    await p.locator('[data-resource-step="1"]').click();
    assert.equal(
      await p.locator("[data-trade-side=buy]").getAttribute("aria-pressed"),
      "true",
    );
    const box = await p
      .locator(".og-sheet-content")
      .evaluate((e) => ({ h: e.clientHeight, s: e.scrollHeight }));
    assert(box.s <= box.h + 2);
    await p.screenshot({ path: "/tmp/market-context-" + width + ".png" });
    assert.deepEqual(errors, []);
    await p.close();
    console.log("PASS category and buy/sell context", width);
  }
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
