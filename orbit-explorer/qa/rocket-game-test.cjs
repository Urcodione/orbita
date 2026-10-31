const { chromium } = require('./node_modules/playwright');
const { completeTutorialExpedition } = require('./expedition-helpers.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'rocket-artifacts');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1024, height: 950 } });
  const page = await context.newPage();
  const errors = [], results = [];
  const captureErrors = p => {
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  };
  captureErrors(page);
  const state = () => page.evaluate(() => window.orbitApp.getState());
  const view = () => page.evaluate(() => window.orbitApp.getView());
  const click = action => page.locator(`[data-action="${action}"]:visible`).first().click();
  const tab = name => page.locator(`.og-tabs [data-tab="${name}"]`).click();
  const focusModule = type => page.locator(`[data-module-focus="${type}"]:visible`).first().click();
  const settle = () => page.waitForTimeout(850);
  const mode = async expected => {
    await page.waitForFunction(want => window.orbitApp.getView().shipDetail?.mode === want, expected);
  };
  const screenshot = async name => { await settle(); await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true }); };
  async function test(name, fn) {
    try { await fn(); results.push({ name, pass: true }); console.log('PASS', name); }
    catch (error) {
      results.push({ name, pass: false, error: error.message }); console.log('FAIL', name, error.message);
      await page.screenshot({ path: path.join(out, `failure-${results.length}.png`), fullPage: true }).catch(() => {});
    }
  }
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForFunction(() => window.orbitApp);

  let inspectionResources, oldScanner, newScanner;
  await test('Rocket exterior keeps a single primary action and opens its interior', async () => {
    await tab('ship'); await mode('exterior');
    assert.equal(await page.locator('#og-context .primary').count(), 1);
    inspectionResources = (await state()).resources;
    await screenshot('rocket-exterior');
    const canvas = page.locator('#og-canvas');
    const canvasBox = await canvas.boundingBox();
    await canvas.click({ position: { x: canvasBox.width * .5, y: canvasBox.height * .46 } });
    await mode('interior');
    await click('ship-back'); await mode('exterior');
    await click('open-interior'); await mode('interior'); await settle();
    const types = await page.locator('[data-module-focus]:visible').evaluateAll(es => [...new Set(es.map(e => e.dataset.moduleFocus))].sort());
    assert.deepEqual(types, Object.keys((await state()).equipped).sort());
    await screenshot('rocket-interior');
  });
  await test('Engine can be selected, expanded to show its socket, and returned', async () => {
    await focusModule('engine'); await mode('module');
    assert.equal((await view()).shipDetail.selectedModule, 'engine');
    const before = (await view()).shipDetail.expanded;
    await click('toggle-module');
    assert.equal((await view()).shipDetail.expanded, !before);
    await screenshot('engine-socket');
    await click('ship-back'); await mode('interior');
  });
  await test('Scanner replacement only offers compatible modules and swaps the actual equipment', async () => {
    const before = await state();
    oldScanner = before.equipped.scanner;
    newScanner = before.inventory.find(m => m.type === 'scanner' && m.power > oldScanner.power);
    assert.ok(newScanner, 'Initial inventory should contain a stronger scanner');
    await focusModule('scanner'); await mode('module');
    await click('replace-module');
    assert.equal(await page.getByRole('dialog').count(), 1);
    const equipIds = await page.locator('[data-action="equip"]:visible').evaluateAll(es => es.map(e => e.dataset.module));
    assert.ok(equipIds.includes(newScanner.id), 'Compatible scanner must be offered');
    assert.ok(equipIds.every(id => before.inventory.find(m => m.id === id)?.type === 'scanner'), 'Incompatible hardware must not be offered for this socket');
    await page.locator(`[data-action="equip"][data-module="${newScanner.id}"]:visible`).click();
    const after = await state();
    assert.equal(after.equipped.scanner.id, newScanner.id);
    assert.equal(after.equipped.scanner.power, newScanner.power);
    assert.ok(after.inventory.some(m => m.id === oldScanner.id), 'Previous scanner is retained in inventory');
    if (await page.getByRole('dialog').count()) await click('close-sheet');
    assert.equal((await view()).shipDetail.selectedModule, 'scanner');
    await click('ship-back'); await mode('interior');
  });
  await test('Cargo and all eight physical compartments can be inspected without using resources', async () => {
    for (const type of Object.keys((await state()).equipped)) {
      await focusModule(type); await mode('module');
      assert.equal((await view()).shipDetail.selectedModule, type);
      assert.ok((await page.locator('#og-context').innerText()).length > 15);
      if (type === 'cargo') await screenshot('cargo-interior');
      await click('ship-back'); await mode('interior');
    }
    assert.deepEqual((await state()).resources, inspectionResources);
  });
  await test('Back and Escape step through module, interior, exterior, and main exploration', async () => {
    await focusModule('life'); await mode('module');
    await page.keyboard.press('Escape'); await mode('interior');
    await click('ship-back'); await mode('exterior');
    await click('ship-back');
    assert.equal((await view()).tab, 'explore');
  });
  await test('Exploration analyzes, docks, pilots terrain, extracts a module, and equips the reward', async () => {
    await tab('explore'); await click('scan');
    assert.equal((await state()).galaxy.planets[0].scanned, true);
    await click('dock'); assert.equal((await state()).location.mode, 'docked');
    await click('sites'); await click('explore');
    const module = await completeTutorialExpedition(page);
    assert.ok(module);
    await page.locator(`[data-action="equip"][data-module="${module.id}"]:visible`).click();
    assert.equal((await state()).equipped[module.type].id, module.id);
    assert.equal(await page.getByRole('dialog').count(), 0);
  });
  await test('Replacement sheet traps keyboard focus and Escape returns to the inspected module', async () => {
    await tab('ship'); await click('open-interior'); await focusModule('scanner');
    await click('replace-module');
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    await mode('module'); assert.equal((await view()).shipDetail.selectedModule, 'scanner');
    await click('ship-back'); await click('ship-back');
  });
  await test('Interior and module controls fit widths 320, 390, 736, and 1024', async () => {
    for (const width of [320, 390, 736, 1024]) {
      await page.setViewportSize({ width, height: 950 });
      await tab('ship'); await click('open-interior'); await settle();
      await focusModule('engine'); await click('toggle-module'); await settle();
      const sizes = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, width: innerWidth, game: document.getElementById('orbit-game').scrollWidth, box: document.getElementById('orbit-game').clientWidth }));
      assert.ok(sizes.doc <= sizes.width, JSON.stringify({ width, sizes }));
      assert.ok(sizes.game <= sizes.box, JSON.stringify({ width, sizes }));
      const clipped = await page.locator('#og-context button:visible, [data-action="ship-back"]:visible').evaluateAll(es => es.filter(e => { const r = e.getBoundingClientRect(); const g = document.getElementById('orbit-game').getBoundingClientRect(); return r.left < g.left || r.right > g.right || r.top < g.top || r.bottom > g.bottom; }).map(e => e.textContent));
      assert.deepEqual(clipped, [], `Clipped controls at ${width}px`);
      if (width === 320) await screenshot('engine-mobile320');
      await click('ship-back'); await click('ship-back');
    }
  });
  await test('Equipment and game progress survive reload', async () => {
    const before = await state(); await page.reload(); await page.waitForFunction(() => window.orbitApp);
    assert.deepEqual(await state(), before);
    assert.equal((await state()).equipped.scanner.id, newScanner.id);
  });
  await test('Reduced-motion preference keeps interior interactions usable', async () => {
    const reduced = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    const p = await reduced.newPage(); captureErrors(p);
    await p.goto('file://' + path.resolve(__dirname, '../index.html')); await p.waitForFunction(() => window.orbitApp);
    assert.equal(await p.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    await p.locator('.og-tabs [data-tab="ship"]').click();
    await p.locator('[data-action="open-interior"]:visible').first().click();
    await p.locator('[data-module-focus="engine"]:visible').first().click();
    await p.locator('[data-action="toggle-module"]:visible').first().click();
    assert.equal(await p.evaluate(() => orbitApp.getView().shipDetail.expanded), true);
    await p.locator('[data-action="ship-back"]:visible').first().click();
    assert.equal(await p.evaluate(() => orbitApp.getView().shipDetail.mode), 'interior');
    await reduced.close();
  });
  await test('No browser errors', async () => assert.deepEqual(errors, []));
  const report = { results, errors, passed: results.every(r => r.pass) };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
