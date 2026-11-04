const { chromium } = require('./node_modules/playwright');
const { solveCounts } = require('./expedition-helpers.cjs');
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
  // The exterior no longer has an "Abrir nave" button: tapping the rocket drawing opens the hull.
  const openHull = async (p = page) => { await p.locator('#og-canvas').click(); await p.waitForFunction(() => window.orbitApp.getView().shipDetail?.mode === 'interior'); };
  // Outside the guided training an expedition is an adventure: two terrain beacons must be activated before the core
  // circuit opens (the shared helper only knows the training path). Drive the visible field controls.
  async function completeAdventureExpedition() {
    const confirmRisk = async () => { if ((await view()).sheet === 'expedition-risk-confirm') await click('confirm-field-action'); };
    const press = async action => { await click(action); await confirmRisk(); };
    const field = () => page.evaluate(() => { const ex = orbitApp.getState().expedition; return ex && { x: ex.x, y: ex.y, beacons: ex.beacons || [], puzzle: ex.puzzle, board: OrbitEngine.expeditionBoard(ex).map(c => c.kind) }; });
    async function walkTo(target) {
      for (let guard = 0; guard < 40; guard++) {
        const f = await field(); if (f.y * 6 + f.x === target) return;
        const dist = new Map([[target, 0]]), queue = [target];
        while (queue.length) { queue.sort((a, b) => dist.get(a) - dist.get(b)); const i = queue.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i % 6 + dx, y = Math.floor(i / 6) + dy, j = y * 6 + x; if (x < 0 || y < 0 || x > 5 || y > 5 || f.board[j] === 'wall') continue; const d = dist.get(i) + (f.board[i] === 'hazard' ? 2 : 1); if (!dist.has(j) || d < dist.get(j)) { dist.set(j, d); queue.push(j); } } }
        const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [f.x + dx, f.y + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < 6 && y < 6 && dist.has(y * 6 + x)).sort((a, b) => dist.get(a[1] * 6 + a[0]) - dist.get(b[1] * 6 + b[0]))[0];
        assert.ok(next, 'Reachable field sector ' + target);
        await page.locator(`[data-expedition-x="${next[0]}"][data-expedition-y="${next[1]}"]:visible`).click(); await confirmRisk();
      }
      throw new Error('Could not reach sector ' + target);
    }
    let f = await field(); assert.ok(f, 'An expedition is active');
    for (const beacon of f.board.map((kind, i) => kind === 'beacon' && !f.beacons.includes(i) ? i : -1).filter(i => i >= 0).slice(0, 2 - f.beacons.length)) { await walkTo(beacon); await press('expeditionBeacon'); }
    await walkTo(f.board.indexOf('core')); await press('expeditionInteract');
    f = await field(); const counts = solveCounts(f.puzzle.dials, f.puzzle.target);
    for (let i = 0; i < 3; i++) for (let n = 0; n < counts[i]; n++) await page.locator(`[data-action="expeditionTune"][data-index="${i}"]:visible`).click();
    const before = await state(); await press('expeditionRecover');
    const recovered = await state(); assert.ok(recovered.expedition.coreRecovered);
    assert.deepEqual(recovered.inventory, before.inventory, 'Recovered gear is pending until extraction');
    await walkTo(32); await press('expeditionExtract');
    const after = await state(); assert.equal(after.expedition, null);
    assert.equal(after.progress.explorations, before.progress.explorations + 1);
    return after.inventory.find(module => module.id === recovered.expedition.pending.module.id);
  }
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForFunction(() => window.orbitApp);
  // A new game opens with the story intro and the guided first expedition: skip both.
  await page.locator('[data-story-action=skip]').click(); await page.locator('[data-guide-skip]').click();

  let inspectionResources, oldScanner, newScanner;
  await test('Rocket exterior keeps a single primary action and opens its interior', async () => {
    await tab('ship'); await mode('exterior');
    // The rocket drawing itself is now the one action of the exterior: no competing buttons are shown over it.
    assert.equal(await page.locator('#og-context button:visible').count(), 0);
    inspectionResources = (await state()).resources;
    await screenshot('rocket-exterior');
    const canvas = page.locator('#og-canvas');
    const canvasBox = await canvas.boundingBox();
    await canvas.click({ position: { x: canvasBox.width * .5, y: canvasBox.height * .46 } });
    await mode('interior');
    await click('ship-back'); await mode('exterior');
    await openHull(); await mode('interior'); await settle();
    const types = await page.locator('[data-module-focus]:visible').evaluateAll(es => [...new Set(es.map(e => e.dataset.moduleFocus))].sort());
    assert.deepEqual(types, Object.keys((await state()).equipped).sort());
    await screenshot('rocket-interior');
  });
  await test('Tapping the engine opens its card over the open ship, with no close-up', async () => {
    const resources = (await state()).resources;
    await focusModule('engine'); await mode('interior');
    assert.equal((await view()).sheet, 'system-module'); assert.equal((await view()).systemType, 'engine');
    await screenshot('engine-card');
    await click('close-sheet'); await mode('interior'); assert.deepEqual((await state()).resources, resources);
  });
  await test('Scanner replacement only offers compatible modules and swaps the actual equipment', async () => {
    const before = await state();
    oldScanner = before.equipped.scanner;
    newScanner = before.inventory.find(m => m.type === 'scanner' && m.power > oldScanner.power);
    assert.ok(newScanner, 'Initial inventory should contain a stronger scanner');
    await focusModule('scanner'); await mode('interior');
    assert.equal(await page.getByRole('dialog').count(), 1);
    // The scanner card's carousel replaced the replacement list: slide through every stored part it offers.
    const offered = [];
    for (let n = 0; n < 12; n++) {
      const next = page.locator('[data-action="module-slide"][data-step="1"]:visible:not(:disabled)'); if (!await next.count()) break;
      await next.first().click(); offered.push((await view()).selectedCandidateId);
    }
    assert.ok(offered.includes(newScanner.id), 'Compatible scanner must be offered');
    assert.ok(offered.every(id => before.inventory.find(m => m.id === id)?.type === 'scanner'), 'Incompatible hardware must not be offered for this socket');
    assert.equal(offered.length, before.inventory.filter(m => m.type === 'scanner').length, 'Every stored scanner is offered');
    for (let n = 0; n < 12 && (await view()).selectedCandidateId !== newScanner.id; n++) await page.locator('[data-action="module-slide"][data-step="-1"]:visible').click();
    await page.locator(`[data-action="compare-module"][data-module="${newScanner.id}"]:visible`).click();
    await page.locator(`[data-action="equip"][data-module="${newScanner.id}"]:visible`).click();
    const after = await state();
    assert.equal(after.equipped.scanner.id, newScanner.id);
    assert.equal(after.equipped.scanner.power, newScanner.power);
    assert.ok(after.inventory.some(m => m.id === oldScanner.id), 'Previous scanner is retained in inventory');
    if (await page.getByRole('dialog').count()) await click('close-sheet');
    // Installing from the ship now returns to the open hull, where the changed attributes are shown.
    await mode('interior');
  });
  await test('Cargo and all eight physical compartments can be inspected without using resources', async () => {
    for (const type of Object.keys((await state()).equipped)) {
      await focusModule(type); await mode('interior');
      assert.equal((await view()).systemType, type);
      // The compartment's card opens directly over the ship.
      assert.equal((await view()).sheet, 'system-module');
      assert.ok((await page.getByRole('dialog').innerText()).includes((await state()).equipped[type].name));
      if (type === 'cargo') await screenshot('cargo-interior');
      await click('close-sheet'); await mode('interior');
    }
    assert.deepEqual((await state()).resources, inspectionResources);
  });
  await test('Back and Escape step through the module card, interior, exterior, and main exploration', async () => {
    await focusModule('life'); await mode('interior');
    await page.keyboard.press('Escape'); await mode('interior');
    await click('ship-back'); await mode('exterior');
    await click('ship-back');
    assert.equal((await view()).tab, 'explore');
  });
  await test('Exploration analyzes, docks, pilots terrain, extracts a module, and equips the reward', async () => {
    await tab('explore'); const planet = (await state()).location.planetId; await click('scan');
    assert.equal((await state()).galaxy.planets.find(p => p.id === planet).scanned, true);
    // Scanning opens the exploration points directly; descending docks the ship (no separate dock/sites steps).
    assert.equal((await view()).sheet, 'sites');
    await click('explore'); assert.equal((await state()).location.mode, 'docked');
    const module = await completeAdventureExpedition();
    assert.ok(module);
    // The delivery receipt no longer has an install shortcut: the part goes to storage and is fitted from the ship
    // (its compartment card → slide to the new part → "Encaixar" → "Confirmar troca").
    assert.equal((await view()).sheet, 'reward');
    assert.match(await page.getByRole('dialog').innerText(), new RegExp(module.name));
    await click('close-sheet'); assert.equal(await page.getByRole('dialog').count(), 0);
    await tab('ship'); if ((await view()).shipDetail.mode === 'exterior') await openHull();
    await focusModule(module.type);
    for (let n = 0; n < 12 && (await view()).selectedCandidateId !== module.id; n++) await page.locator('[data-action="module-slide"][data-step="1"]:visible').click();
    await page.locator(`[data-action="compare-module"][data-module="${module.id}"]:visible`).click();
    await page.locator(`[data-action="equip"][data-module="${module.id}"]:visible`).click();
    assert.equal((await state()).equipped[module.type].id, module.id);
    assert.equal(await page.getByRole('dialog').count(), 0);
  });
  await test('Replacement sheet traps keyboard focus and Escape returns to the inspected module', async () => {
    await tab('ship'); if ((await view()).shipDetail.mode === 'exterior') await openHull(); await focusModule('scanner');
    assert.equal((await view()).sheet, 'system-module');
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    // The card opened from the ship returns to the open hull ("Nave aberta"), with focus back in the game.
    await mode('interior');
    assert.equal(await page.evaluate(() => document.getElementById('orbit-game').contains(document.activeElement)), true);
    await click('ship-back');
  });
  await test('Interior controls and the module card fit widths 320, 390, 736, and 1024', async () => {
    for (const width of [320, 390, 736, 1024]) {
      await page.setViewportSize({ width, height: 950 });
      await tab('ship'); if ((await view()).shipDetail.mode === 'exterior') await openHull(); await settle();
      const sizes = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, width: innerWidth, game: document.getElementById('orbit-game').scrollWidth, box: document.getElementById('orbit-game').clientWidth }));
      assert.ok(sizes.doc <= sizes.width, JSON.stringify({ width, sizes }));
      assert.ok(sizes.game <= sizes.box, JSON.stringify({ width, sizes }));
      const clipped = await page.locator('#og-context button:visible, [data-action="ship-back"]:visible').evaluateAll(es => es.filter(e => { const r = e.getBoundingClientRect(); const g = document.getElementById('orbit-game').getBoundingClientRect(); return r.left < g.left || r.right > g.right || r.top < g.top || r.bottom > g.bottom; }).map(e => e.textContent));
      assert.deepEqual(clipped, [], `Clipped controls at ${width}px`);
      await focusModule('engine'); await page.waitForFunction(() => orbitApp.getView().sheet === 'system-module');
      const card = await page.locator('.og-sheet:visible').evaluate(e => { const r = e.getBoundingClientRect(), g = document.getElementById('orbit-game').getBoundingClientRect(); return r.left >= g.left - 1 && r.right <= g.right + 1; });
      assert.ok(card, `Module card fits at ${width}px`);
      if (width === 320) await screenshot('engine-mobile320');
      await click('close-sheet'); await click('ship-back');
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
    await p.locator('[data-story-action=skip]').click(); await p.locator('[data-guide-skip]').click();
    assert.equal(await p.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    await p.locator('.og-tabs [data-tab="ship"]').click();
    await openHull(p);
    await p.locator('[data-module-focus="engine"]:visible').first().click();
    await p.waitForFunction(() => orbitApp.getView().sheet === 'system-module' && orbitApp.getView().systemType === 'engine');
    await p.keyboard.press('Escape');
    assert.equal(await p.evaluate(() => orbitApp.getView().shipDetail.mode), 'interior');
    await reduced.close();
  });
  await test('No browser errors', async () => assert.deepEqual(errors, []));
  const report = { results, errors, passed: results.every(r => r.pass) };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
