const { chromium } = require('./node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Save = require('./save-slot.cjs');
const out = path.join(__dirname, 'ship-cards-artifacts');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1024, height: 950 } });
  const page = await context.newPage();
  const errors = [], results = [];
  const capture = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', e => { if (e.type() === 'error') errors.push(e.text()); }); };
  capture(page);
  const gameURL = 'file://' + path.resolve(__dirname, '../index.html');
  const state = () => page.evaluate(() => orbitApp.getState());
  const view = () => page.evaluate(() => orbitApp.getView());
  const click = action => page.locator(`[data-action="${action}"]:visible`).first().click();
  const settle = () => page.waitForTimeout(950);
  const screenshot = async name => { await settle(); await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true }); };
  async function test(name, fn) {
    try { await fn(); results.push({ name, pass: true }); console.log('PASS', name); }
    catch (error) { results.push({ name, pass: false, error: error.message }); console.log('FAIL', name, error.message); await page.screenshot({ path: path.join(out, `failure-${results.length}.png`), fullPage: true }).catch(() => {}); }
  }
  // A new game opens with the story intro and the guided first expedition: skip both.
  async function skipIntro(p, touch = false) {
    for (const selector of ['[data-story-action=skip]', '[data-guide-skip]']) { const target = p.locator(selector); if (touch) await target.tap(); else await target.click(); }
  }
  // The exterior no longer has an "Abrir nave" button: tapping the rocket drawing opens the hull.
  async function openHull(p, touch = false) {
    const canvas = p.locator('#og-canvas'); if (touch) await canvas.tap(); else await canvas.click();
    await p.waitForFunction(() => orbitApp.getView().shipDetail.mode === 'interior');
  }
  // Tapping a module drawing opens its card straight over the open ship: there is no close-up of the module.
  async function openCard(p, type, touch = false) {
    const hotspot = p.locator(`[data-module-focus="${type}"]:visible`).first(); if (touch) await hotspot.tap(); else await hotspot.click();
    await p.waitForFunction(type => orbitApp.getView().sheet === 'system-module' && orbitApp.getView().systemType === type, type);
  }
  // Cards can be paginated: page forward (then back) until the control is on the visible page.
  async function reveal(selector) {
    for (const dir of ['1', '-1']) for (let n = 0; n < 6 && !await page.locator(selector + ':visible').count(); n++) {
      const step = page.locator(`[data-sheet-page="${dir}"]:visible:not(:disabled)`); if (!await step.count()) break; await step.click();
    }
  }
  // The cargo shortcuts live on the Depósito card.
  async function cargoCard() {
    if ((await view()).sheet !== 'system-module') await openCard(page, 'cargo');
    assert.equal((await view()).sheet, 'system-module'); assert.equal((await view()).systemType, 'cargo');
  }
  async function assertQuantity(resource, quantity) {
    const dialog = page.getByRole('dialog');
    assert.equal((await view()).sheet, 'cargo-content');
    assert.ok(await dialog.count());
    const marker = dialog.locator('.og-cargo-amount strong');
    if (await marker.count()) assert.equal((await marker.first().innerText()).trim(), String(quantity));
    else assert.match(await dialog.innerText(), new RegExp(`(^|\\D)${quantity}(\\D|$)`), `Cargo sheet must show current ${resource} amount`);
  }
  await page.goto(gameURL); await page.waitForFunction(() => window.orbitApp); await skipIntro(page);
  // Scanning now opens the exploration-points panel over the tabs; close it before going to the ship.
  await click('scan'); await page.waitForFunction(() => orbitApp.getState().progress.scans === 1); if ((await view()).sheet) await click('close-sheet');
  await page.locator('.og-tabs [data-tab="ship"]').click(); await openHull(page);
  await test('A module tapped in the open ship opens its card over the open ship, and closing returns there', async () => {
    const resources = (await state()).resources;
    await openCard(page, 'engine');
    assert.equal((await view()).shipDetail.mode, 'interior', 'no close-up behind the card');
    await screenshot('engine-card');
    await click('close-sheet');
    assert.equal((await view()).sheet, null); assert.equal((await view()).shipDetail.mode, 'interior');
    assert.deepEqual((await state()).resources, resources);
  });
  await test('A finger opens a module card from the open ship in mobile emulation', async () => {
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
    const p = await touchContext.newPage(); capture(p); await p.goto(gameURL); await p.waitForFunction(() => window.orbitApp); await skipIntro(p, true);
    await p.locator('.og-tabs [data-tab="ship"]').tap(); await openHull(p, true);
    await openCard(p, 'scanner', true); assert.equal(await p.evaluate(() => orbitApp.getView().shipDetail.mode), 'interior');
    await p.screenshot({ path: path.join(out, 'touch-scanner.png'), fullPage: true }); await touchContext.close();
  });
  await test('A save left on the retired module close-up resumes on the open ship', async () => {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } }); capture(p);
    await p.goto(gameURL); await p.waitForFunction(() => window.orbitApp);
    const snapshot = await p.evaluate(() => { const s = OrbitEngine.create('qa-close-up'); for (const a of ['campaignIntro', 'guideSkip']) OrbitEngine.dispatch(s, a); return OrbitEngine.snapshot(s); });
    await Save.load(p, { state: snapshot, tab: 'ship', shipDetail: { mode: 'module', selectedModule: 'engine', expanded: true } });
    assert.deepEqual((await p.evaluate(() => orbitApp.getView())).shipDetail, { mode: 'interior' });
    await p.close();
  });
  await test('Cargo shortcuts show actual contents and apply exactly the advertised resource transactions', async () => {
    // The starting supplies no longer pay for all three services (a warp cell now costs 24 ore + 3 crystals, and air in
    // orbit costs one Samambaia-lume), so stock exactly one operation of each: afterwards each one must become unavailable.
    await page.evaluate(() => Object.assign(orbitApp.getState().resources, { fuel: 88, ore: 27, crystals: 3, oxygen: 88, lumenfern: 1 }));
    for (const [resource, action, output] of [['ore', 'refuel', 'fuel'], ['crystals', 'refine', 'warpFuel'], ['oxygen', 'refillOxygen', 'oxygen']]) {
      await cargoCard(); await reveal(`[data-cargo="${resource}"]`);
      await page.locator(`[data-cargo="${resource}"]:visible`).first().click();
      const before = (await state()).resources;
      await assertQuantity(resource, before[resource]);
      const preview = await page.evaluate(action => OrbitEngine.preview(orbitApp.getState(), action), action);
      assert.equal(preview.allowed, true, `Stocked supplies should allow ${action}`);
      const button = page.locator(`[data-action="${action}"]:visible`); assert.equal(await button.isEnabled(), true);
      await button.click();
      const after = (await state()).resources;
      for (const key of Object.keys(before)) {
        const expected = before[key] - (preview.cost[key] || 0) + (key === output ? preview.amount : 0);
        assert.equal(after[key], expected, `${action} must charge and grant the shown quantities for ${key}`);
      }
      await assertQuantity(resource, after[resource]);
      assert.equal(await page.locator(`[data-action="${action}"]:visible`).isDisabled(), true, 'Action becomes unavailable when supplies are depleted or destination is full');
      await click('close-sheet');
    }
  });
  await test('Cargo actions and controls remain usable at a 320px phone width', async () => {
    await page.setViewportSize({ width: 320, height: 900 }); await settle(); await cargoCard(); await reveal('[data-cargo]');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth); assert.equal(overflow, false);
    const clipped = await page.locator('[data-cargo]:visible').evaluateAll(es => es.filter(e => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).map(e => e.textContent)); assert.deepEqual(clipped, []);
    await page.locator('[data-cargo="oxygen"]:visible').click(); await assertQuantity('oxygen', (await state()).resources.oxygen);
    // Esc now steps back through the places the panel came from (first the Depósito card) until the game is shown again.
    await screenshot('cargo-phone320'); await page.keyboard.press('Escape'); assert.equal((await view()).sheet, 'system-module');
    for (let n = 0; n < 3 && await page.getByRole('dialog').count(); n++) await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
  });
  await test('Cargo changes survive reload without browser errors', async () => {
    const before = await state(), beforeView = await view(); await page.reload(); await page.waitForFunction(() => window.orbitApp);
    assert.deepEqual(await state(), before); assert.deepEqual((await view()).shipDetail, beforeView.shipDetail); assert.deepEqual(errors, []);
  });
  const report = { results, errors, passed: results.every(r => r.pass) }; fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
