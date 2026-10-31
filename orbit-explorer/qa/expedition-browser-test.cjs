const { chromium } = require('./node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'expedition-artifacts');
fs.mkdirSync(out, { recursive: true });
const url = 'file://' + path.resolve(__dirname, '../index.html');
const fixture = JSON.parse(fs.readFileSync(path.join(out, 'v2-save-fixture.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  const errors = [], results = [];
  function listen(p) { p.on('pageerror', e => errors.push(e.message)); p.on('console', e => { if (e.type() === 'error') errors.push(e.text()); }); }
  listen(page);
  const state = () => page.evaluate(() => orbitApp.getState());
  const view = () => page.evaluate(() => orbitApp.getView());
  const expedition = () => page.evaluate(() => OrbitEngine.expeditionView(orbitApp.getState()));
  const click = action => page.locator(`[data-action="${action}"]:visible`).first().click();
  const tab = name => page.locator(`.og-tabs [data-tab="${name}"]`).click();
  const settle = () => page.waitForTimeout(350);
  const snap = async name => { await settle(); await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true }); };
  const closeSheet = async () => { if (await page.getByRole('dialog').count()) await click('close-sheet'); };
  async function test(name, fn) {
    try { await fn(); results.push({ name, pass: true }); console.log('PASS', name); }
    catch (error) { results.push({ name, pass: false, error: error.message }); console.log('FAIL', name, error.message); await snap('failure-' + results.length).catch(() => {}); }
  }
  async function fresh(seed = 'qa-expedition-route') {
    await page.goto(url); await page.waitForFunction(() => window.orbitApp && window.OrbitEngine?.expeditionView);
    await page.evaluate(seed => {
      const s = OrbitEngine.create(seed);
      window.__qaSaved = [];
      window.openai = { setWidgetState: value => { window.__qaSaved.push(JSON.parse(JSON.stringify(value))); return Promise.resolve(); } };
      window.dispatchEvent(new CustomEvent('openai:set_globals', { detail: { globals: { widgetState: { privateContent: { state: s, tab: 'explore', selected: s.location.planetId, shipDetail: { mode: 'exterior', selectedModule: null, expanded: false } } } } } }));
    }, seed);
  }
  // UI selectors are deliberately centralized: all play below uses actual controls.
  async function move(x, y) { await page.locator(`[data-expedition-x="${x}"][data-expedition-y="${y}"]:visible`).click(); }
  async function goCore() { const ex = (await state()).expedition; if (ex.x !== 2) await move(2, ex.y); for (let y = ex.y - 1; y >= 0; --y) await move(2, y); await move(3, 0); }
  async function goBase() { await move(2, 0); for (let y = 1; y <= 5; ++y) await move(2, y); }
  async function start() { await tab('explore'); await click('scan'); await click('dock'); await click('sites'); await click('explore'); }
  function countsToSolve(dials, target) {
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
      const counts = [a, b, c], next = dials.slice();
      for (let i = 0; i < 3; i++) { next[i] = (next[i] + counts[i]) % 4; next[(i + 1) % 3] = (next[(i + 1) % 3] + counts[i]) % 4; }
      if (next.every((v, i) => v === target[i])) return counts;
    }
    throw new Error('No valid solution for the generated rotor puzzle');
  }

  await fresh();
  let initial, begun, pendingModule, equippedBefore;
  await test('Diary is replaced by the playable expedition tab', async () => {
    assert.equal(await page.locator('.og-tabs [data-tab="log"]').count(), 0);
    assert.equal(await page.locator('.og-tabs [data-tab="expedition"]').count(), 1);
    await tab('expedition'); assert.match(await page.locator('#orbit-game').innerText(), /expedi|explora|sinal|planeta/i);
    initial = await state(); equippedBefore = initial.equipped;
  });
  await test('The idle beacon objective fits 320px and the desktop phone frame without overlapping its action', async () => {
    for (const width of [320, 736]) {
      await page.setViewportSize({ width, height: 950 }); await tab('expedition'); await settle();
      const boxes = await page.evaluate(() => {
        const rect = id => { const r = document.getElementById(id).getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; };
        return { beacon: rect('og-beacon'), heading: rect('og-heading'), context: rect('og-context') };
      });
      assert.ok(boxes.beacon.top >= boxes.heading.bottom, JSON.stringify(boxes));
      assert.ok(boxes.beacon.bottom <= boxes.context.top - 5, JSON.stringify(boxes));
      await snap('beacon-idle-' + width);
    }
    await page.setViewportSize({ width: 390, height: 900 });
  });
  await test('Starting an expedition opens a terrain board without instant loot or completed sites', async () => {
    await start(); begun = await state();
    assert.ok(begun.expedition);
    assert.deepEqual(begun.inventory, initial.inventory);
    assert.equal(begun.progress.explorations, initial.progress.explorations);
    assert.equal(begun.galaxy.planets.find(p => p.id === begun.location.planetId).sites.filter(s => s.explored).length, 0);
    assert.equal((await view()).tab, 'expedition');
    await snap('expedition-start');
  });
  await test('Active expeditions lock ship equipment and travel with no mutation', async () => {
    const before = await state();
    const checks = await page.evaluate(() => {
      const s = orbitApp.getState();
      return ['equip', 'travel', 'launch', 'warp'].map(action => ({ action, preview: OrbitEngine.preview(s, action, { moduleId: s.inventory[0].id, planetId: s.galaxy.planets.find(p => p.id !== s.location.planetId).id }) }));
    });
    for (const check of checks) { assert.equal(check.preview.allowed, false, check.action); assert.match(check.preview.reason, /expedi|equipe|retorn|resgate/i); }
    assert.deepEqual(await state(), before);
  });
  await test('Scan uses a finite expedition reserve and reveals terrain without banking rewards', async () => {
    const before = await state(); await click('expeditionScan'); const after = await state();
    assert.equal(after.expedition.reserve, before.expedition.reserve - 2);
    assert.ok(after.expedition.revealed.length > before.expedition.revealed.length);
    assert.deepEqual(after.resources, before.resources);
    assert.deepEqual(after.inventory, before.inventory);
    await snap('expedition-scan');
  });
  await test('A detour collects a resource cache into temporary cargo without instant ship rewards', async () => {
    await move(2, 4); await move(1, 4); const before = await state(); await click('expeditionCollect'); const after = await state();
    assert.ok(after.expedition.pending.ore > before.expedition.pending.ore); assert.equal(after.expedition.load, before.expedition.load + 1);
    assert.deepEqual(after.resources, before.resources); assert.deepEqual(after.inventory, before.inventory);
    assert.equal(await page.evaluate(() => OrbitEngine.preview(orbitApp.getState(), 'expeditionCollect').allowed), false);
    await move(2, 4); await snap('temporary-resource-cargo');
  });
  await test('Cardinal movement reaches the core while extract remains unavailable away from base', async () => {
    await goCore();
    const preview = await page.evaluate(() => OrbitEngine.preview(orbitApp.getState(), 'expeditionExtract'));
    assert.equal(preview.allowed, false); assert.match(preview.reason, /base|nave|retorn/i);
    await page.setViewportSize({ width: 736, height: 950 }); await settle();
    const box = await page.evaluate(() => ({ captionBottom: document.getElementById('og-field-caption').getBoundingClientRect().bottom, contextTop: document.getElementById('og-context').getBoundingClientRect().top }));
    assert.ok(box.captionBottom <= box.contextTop - 5, JSON.stringify(box));
    await snap('core-field-desktop736'); await click('expeditionInteract'); await snap('core-puzzle-desktop736');
    const clipped = await page.getByRole('dialog').locator('button').evaluateAll(es => es.filter(e => { const r = e.getBoundingClientRect(), g = document.getElementById('orbit-game').getBoundingClientRect(); return r.left < g.left || r.right > g.right; }).map(e => e.textContent)); assert.deepEqual(clipped, []);
    await page.setViewportSize({ width: 390, height: 900 }); await snap('core-puzzle');
  });
  await test('A solved coupled-rotor puzzle recovers cargo but does not equip or bank it', async () => {
    const before = await state();
    const puzzle = before.expedition.puzzle;
    assert.ok(!puzzle.dials.every((value, i) => value === puzzle.target[i]));
    await click('expeditionRecover');
    assert.equal((await state()).expedition.reserve, before.expedition.reserve - 2);
    assert.equal((await state()).expedition.pending.module, undefined);
    const counts = countsToSolve(puzzle.dials, puzzle.target);
    for (let i = 0; i < 3; i++) for (let n = 0; n < counts[i]; n++) await page.locator(`[data-action="expeditionTune"][data-index="${i}"]:visible`).click();
    await click('expeditionRecover');
    const after = await state();
    assert.deepEqual(after.inventory, before.inventory);
    assert.deepEqual(after.equipped, equippedBefore);
    assert.deepEqual(after.resources, before.resources);
    pendingModule = after.expedition.pending.module;
    assert.ok(pendingModule);
    assert.equal(after.discovery.fragments.origin, false, 'An unextracted frequency must not advance the beacon');
    await snap('core-recovered');
  });
  await test('Expedition position, puzzle, temporary cargo and fog persist across reload below the host limit', async () => {
    const before = await state();
    const saved = await page.evaluate(() => window.__qaSaved.at(-1));
    const bytes = Buffer.byteLength(JSON.stringify(saved), 'utf8'); assert.ok(bytes < 16384, `Snapshot ${bytes} bytes`);
    fs.writeFileSync(path.join(out, 'save-size.json'), JSON.stringify({ bytes, limit: 16384 }, null, 2));
    await page.reload(); await page.waitForFunction(() => window.orbitApp); assert.deepEqual(await state(), before);
    assert.equal((await view()).tab, 'expedition');
  });
  await test('Returning to base and extracting banks recovered rewards exactly once', async () => {
    await closeSheet(); await goBase(); const before = await state(); await click('expeditionExtract'); const after = await state();
    assert.equal(after.expedition, null);
    assert.equal(after.progress.explorations, initial.progress.explorations + 1);
    assert.ok(after.inventory.some(m => m.id === pendingModule.id));
    assert.deepEqual(after.equipped, equippedBefore);
    assert.equal(after.discovery.fragments.origin, true);
    assert.equal(await page.evaluate(() => OrbitEngine.preview(orbitApp.getState(), 'claimBeacon').allowed), false);
    assert.ok(Object.keys(after.resources).some(k => after.resources[k] > before.resources[k]));
    const preview = await page.evaluate(() => OrbitEngine.preview(orbitApp.getState(), 'expeditionExtract'));
    assert.equal(preview.allowed, false); await snap('expedition-extracted');
  });
  await test('Terrain and contextual controls fit 320, 390 and 736px screens', async () => {
    await fresh('qa-expedition-mobile'); await start();
    for (const width of [320, 390, 736]) {
      await page.setViewportSize({ width, height: 900 }); await settle();
      const geometry = await page.evaluate(() => ({ width: innerWidth, doc: document.documentElement.scrollWidth, box: document.getElementById('orbit-game').clientWidth, game: document.getElementById('orbit-game').scrollWidth }));
      assert.ok(geometry.doc <= geometry.width && geometry.game <= geometry.box, JSON.stringify(geometry));
      const clipped = await page.locator('[data-expedition-x]:visible').evaluateAll(es => es.filter(e => { const r = e.getBoundingClientRect(), g = document.getElementById('orbit-game').getBoundingClientRect(); return r.left < g.left || r.right > g.right || r.top < g.top || r.bottom > g.bottom; }).map(e => e.textContent));
      assert.deepEqual(clipped, []);
      const gaps = await page.evaluate(() => ({ captionBottom: document.getElementById('og-field-caption').getBoundingClientRect().bottom, contextTop: document.getElementById('og-context').getBoundingClientRect().top }));
      assert.ok(gaps.captionBottom <= gaps.contextTop - 5, JSON.stringify({ width, gaps }));
      await snap('expedition-phone' + width);
    }
  });
  await test('Arrow-key movement works and emergency evacuation preserves installed modules', async () => {
    await page.keyboard.press('Escape'); await page.locator('#og-field-cells button:not(:disabled)').first().focus();
    const before = await state(); await page.keyboard.press('ArrowUp'); const after = await state(); assert.notDeepEqual(after.expedition, before.expedition);
    await goCore(); await click('expeditionInteract');
    const puzzle = (await state()).expedition.puzzle, counts = countsToSolve(puzzle.dials, puzzle.target);
    for (let i = 0; i < 3; i++) for (let n = 0; n < counts[i]; n++) await page.locator(`[data-action="expeditionTune"][data-index="${i}"]:visible`).click();
    await click('expeditionRecover'); assert.ok((await state()).expedition.pending.module);
    await click('expedition-abort-menu'); await click('expeditionAbort');
    const aborted = await state(); assert.equal(aborted.expedition, null); assert.deepEqual(aborted.equipped, before.equipped); assert.deepEqual(aborted.inventory, before.inventory);
    assert.equal(aborted.progress.explorations, before.progress.explorations);
    assert.equal(aborted.discovery.fragments.origin, false);
    assert.equal(aborted.discovery.evacuations, before.discovery.evacuations + 1);
  });
  await test('A touch-screen player can launch and steer the surface vehicle by tapping terrain', async () => {
    const c = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await c.newPage(); listen(p); await p.goto(url); await p.waitForFunction(() => window.orbitApp);
    for (const action of ['scan', 'dock', 'sites', 'explore']) await p.locator(`[data-action="${action}"]:visible`).first().tap();
    const before = await p.evaluate(() => orbitApp.getState().expedition);
    await p.locator('[data-expedition-x="2"][data-expedition-y="4"]').tap();
    const after = await p.evaluate(() => orbitApp.getState().expedition);
    assert.equal(after.x, 2); assert.equal(after.y, 4); assert.equal(after.reserve, before.reserve - 1);
    await p.screenshot({ path: path.join(out, 'expedition-touch-phone.png'), fullPage: true }); await c.close();
  });
  await test('A real version-2 save preserves equipment and progress and retires the diary tab', async () => {
    const c = await browser.newContext({ viewport: { width: 390, height: 900 } }); const p = await c.newPage(); listen(p);
    await p.addInitScript(snapshot => { window.openai = { widgetState: { privateContent: snapshot } }; }, fixture);
    await p.goto(url); await p.waitForFunction(() => window.orbitApp); const s = await p.evaluate(() => orbitApp.getState());
    assert.deepEqual(s.resources, fixture.state.resources); assert.deepEqual(s.equipped, fixture.state.equipped); assert.deepEqual(s.inventory, fixture.state.inventory);
    for (const [key, value] of Object.entries(fixture.state.progress)) assert.equal(s.progress[key], value, key);
    assert.equal(s.expedition, null); assert.notEqual((await p.evaluate(() => orbitApp.getView())).tab, 'log');
    await p.screenshot({ path: path.join(out, 'migrated-v2.png'), fullPage: true }); await c.close();
  });
  await test('No browser runtime errors during the complete expedition loop', async () => assert.deepEqual(errors, []));
  const report = { results, errors, passed: results.every(r => r.pass) };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
