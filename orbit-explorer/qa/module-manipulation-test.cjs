const { chromium } = require('./node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'manipulation-artifacts');
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
  const inspection = () => page.evaluate(() => orbitApp.getInspection());
  const click = action => page.locator(`[data-action="${action}"]:visible`).first().click();
  const settle = () => page.waitForTimeout(950);
  const screenshot = async name => { await settle(); await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true }); };
  async function test(name, fn) {
    try { await fn(); results.push({ name, pass: true }); console.log('PASS', name); }
    catch (error) { results.push({ name, pass: false, error: error.message }); console.log('FAIL', name, error.message); await page.screenshot({ path: path.join(out, `failure-${results.length}.png`), fullPage: true }).catch(() => {}); }
  }
  async function dragModule(p, extract, touch = false) {
    await p.waitForTimeout(950);
    const part = await p.evaluate(() => orbitApp.getInspection());
    assert.ok(part?.bounds, 'Selected physical module must expose its on-screen bounds');
    const canvas = await p.locator('#og-canvas').boundingBox();
    const start = { x: canvas.x + part.bounds.x + part.bounds.width / 2, y: canvas.y + part.bounds.y + part.bounds.height / 2 };
    const end = extract ? { x: start.x + part.expansionVector.x * 1.12, y: start.y + part.expansionVector.y * 1.12 } : { x: canvas.x + part.socket.x, y: canvas.y + part.socket.y };
    if (touch) {
      const cdp = await p.context().newCDPSession(p);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start.x, y: start.y }] });
      for (let i = 1; i <= 14; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + (end.x - start.x) * i / 14, y: start.y + (end.y - start.y) * i / 14 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
    } else {
      await p.mouse.move(start.x, start.y); await p.mouse.down(); await p.mouse.move(end.x, end.y, { steps: 14 }); await p.mouse.up();
    }
    await p.waitForFunction(expected => orbitApp.getView().shipDetail.expanded === expected, extract, { timeout: 5000 });
    await p.waitForTimeout(850);
  }
  async function focusModule(type) {
    if ((await view()).shipDetail.mode === 'module') await click('ship-back');
    await page.locator(`[data-module-focus="${type}"]:visible`).first().click(); await settle();
  }
  async function assertQuantity(resource, quantity) {
    const dialog = page.getByRole('dialog');
    assert.equal((await view()).sheet, 'cargo-content');
    assert.ok(await dialog.count());
    const marker = dialog.locator('.og-cargo-amount strong');
    if (await marker.count()) assert.equal((await marker.first().innerText()).trim(), String(quantity));
    else assert.match(await dialog.innerText(), new RegExp(`(^|\\D)${quantity}(\\D|$)`), `Cargo sheet must show current ${resource} amount`);
  }
  await page.goto(gameURL); await page.waitForFunction(() => window.orbitApp?.getInspection);
  await click('scan');
  await page.locator('.og-tabs [data-tab="ship"]').click(); await click('open-interior');
  let inspectionResources, installedEngine;
  await test('Dragging the actual engine separates it from its socket without unequipping or spending resources', async () => {
    await focusModule('engine'); const before = await state(); inspectionResources = before.resources; installedEngine = before.equipped.engine;
    const attached = await inspection(); assert.equal(attached.type, 'engine'); assert.equal((await view()).shipDetail.expanded, false);
    await dragModule(page, true);
    const detached = await inspection(); assert.equal(detached.expanded, true); assert.ok(detached.pose > .9);
    assert.deepEqual((await state()).resources, inspectionResources); assert.deepEqual((await state()).equipped.engine, installedEngine);
    await screenshot('engine-dragged-out');
  });
  await test('Tapping a detached module keeps it detached until it is deliberately moved', async () => {
    const part = await inspection();
    await page.locator('#og-canvas').click({ position: { x: part.bounds.x + part.bounds.width / 2, y: part.bounds.y + part.bounds.height / 2 } });
    await settle(); assert.equal((await view()).shipDetail.expanded, true); assert.ok((await inspection()).pose > .9);
    assert.deepEqual((await state()).resources, inspectionResources);
  });
  await test('Dragging the detached engine back to its visible socket locks it in place', async () => {
    await dragModule(page, false); const part = await inspection(); assert.equal(part.expanded, false); assert.ok(part.pose < .1);
    assert.deepEqual((await state()).resources, inspectionResources); assert.deepEqual((await state()).equipped.engine, installedEngine);
    await screenshot('engine-dragged-in');
  });
  await test('A cancelled pointer drag returns to the previous placement without changing equipment or supplies', async () => {
    const part = await inspection(), canvas = await page.locator('#og-canvas').boundingBox();
    const x = canvas.x + part.bounds.x + part.bounds.width / 2, y = canvas.y + part.bounds.y + part.bounds.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + part.expansionVector.x * .8, y + part.expansionVector.y * .8, { steps: 10 });
    await page.locator('#og-canvas').dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', isPrimary: true });
    await page.mouse.up(); await settle();
    assert.equal((await view()).shipDetail.expanded, false); assert.ok((await inspection()).pose < .1);
    assert.deepEqual((await state()).resources, inspectionResources); assert.deepEqual((await state()).equipped.engine, installedEngine);
  });
  await test('Dragging empty space rotates the inspection while keeping the module attached and resources unchanged', async () => {
    const canvas = await page.locator('#og-canvas').boundingBox(); const part = await inspection();
    const y = Math.max(180, Math.min(canvas.height - 200, part.bounds.y + part.bounds.height / 2));
    const x = part.bounds.x > 65 ? 12 : canvas.width - 12;
    await page.mouse.move(canvas.x + x, canvas.y + y); await page.mouse.down(); await page.mouse.move(canvas.x + x + (x < 30 ? 36 : -36), canvas.y + y + 25, { steps: 12 }); await page.mouse.up();
    await settle(); assert.equal((await view()).shipDetail.expanded, false); assert.deepEqual((await state()).resources, inspectionResources);
    await click('camera'); await settle();
  });
  await test('Mineral crates, crystals and gas tanks can each be tapped directly in the cargo drawing', async () => {
    await focusModule('cargo');
    for (const resource of ['ore', 'crystals', 'oxygen']) {
      const part = await inspection(), item = part.contents.find(c => c.resource === resource);
      assert.ok(item, `Physical cargo target for ${resource}`);
      const canvas = page.locator('#og-canvas');
      await canvas.click({ position: { x: item.x, y: item.y } });
      await assertQuantity(resource, (await state()).resources[resource]);
      await screenshot(`cargo-${resource}`); await click('close-sheet');
    }
  });
  await test('Cargo shortcuts show actual contents and apply exactly the advertised resource transactions', async () => {
    for (const [resource, action, output] of [['ore', 'refuel', 'fuel'], ['crystals', 'refine', 'warpFuel'], ['oxygen', 'refillOxygen', 'oxygen']]) {
      await page.locator(`[data-cargo="${resource}"]:visible`).first().click();
      const before = (await state()).resources;
      await assertQuantity(resource, before[resource]);
      const preview = await page.evaluate(action => OrbitEngine.preview(orbitApp.getState(), action), action);
      assert.equal(preview.allowed, true, `Initial expedition should allow ${action}`);
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
    await page.setViewportSize({ width: 320, height: 900 }); await settle();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth); assert.equal(overflow, false);
    const clipped = await page.locator('[data-cargo]:visible').evaluateAll(es => es.filter(e => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).map(e => e.textContent)); assert.deepEqual(clipped, []);
    await page.locator('[data-cargo="oxygen"]:visible').click(); await assertQuantity('oxygen', (await state()).resources.oxygen);
    await screenshot('cargo-phone320'); await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').count(), 0);
  });
  await test('A finger can pull out and reconnect a module in mobile emulation', async () => {
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
    const p = await touchContext.newPage(); capture(p); await p.goto(gameURL); await p.waitForFunction(() => window.orbitApp?.getInspection);
    await p.locator('.og-tabs [data-tab="ship"]').tap(); await p.locator('[data-action="open-interior"]:visible').tap();
    await p.locator('[data-module-focus="engine"]:visible').tap();
    const resources = await p.evaluate(() => orbitApp.getState().resources);
    await dragModule(p, true, true); await dragModule(p, false, true);
    assert.deepEqual(await p.evaluate(() => orbitApp.getState().resources), resources);
    await p.screenshot({ path: path.join(out, 'touch-engine.png'), fullPage: true }); await touchContext.close();
  });
  await test('Cargo changes and module placement survive reload without browser errors', async () => {
    const before = await state(), beforeView = await view(); await page.reload(); await page.waitForFunction(() => window.orbitApp?.getInspection);
    assert.deepEqual(await state(), before); assert.deepEqual((await view()).shipDetail, beforeView.shipDetail); assert.deepEqual(errors, []);
  });
  const report = { results, errors, passed: results.every(r => r.pass) }; fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
