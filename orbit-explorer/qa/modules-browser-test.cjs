/* Browser acceptance tests for contextual module fitting and the component laboratory.
   Rich material fixtures exercise the shop; a separate vanilla expedition verifies progression. */
const { chromium } = require('./node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { completeTutorialExpedition } = require('./expedition-helpers.cjs');
const out = path.join(__dirname, 'modules-artifacts');
fs.mkdirSync(out, { recursive: true });
const gameURL = 'file://' + path.resolve(__dirname, '../index.html');
const legacy = JSON.parse(fs.readFileSync(path.join(out, 'v2-before-modular-lab.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [], results = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const state = () => page.evaluate(() => orbitApp.getState());
  const view = () => page.evaluate(() => orbitApp.getView());
  const click = action => page.locator(`[data-action="${action}"]:visible`).first().click();
  const tab = name => page.locator(`.og-tabs [data-tab="${name}"]`).click();
  const closeSheet = async () => { if (await page.getByRole('dialog').count()) await page.locator('[data-action="close-sheet"]:visible, [data-action="close"]:visible').first().click(); };
  const snap = async name => { await page.waitForTimeout(350); await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true }); };
  const preview = (action, payload = {}) => page.evaluate(({ action, payload }) => OrbitEngine.preview(orbitApp.getState(), action, payload), { action, payload });
  async function test(name, fn) {
    try { await fn(); results.push({ name, pass: true }); console.log('PASS', name); }
    catch (error) { results.push({ name, pass: false, error: error.message }); console.log('FAIL', name, error.message); await snap('failure-' + results.length).catch(() => {}); }
  }
  async function boot(mode = 'vanilla') {
    await page.goto(gameURL);
    await page.waitForFunction(() => window.orbitApp && window.OrbitEngine?.componentRecipes);
    await page.evaluate(mode => {
      const E = OrbitEngine, s = E.create('qa-module-workbench-' + mode);
      if (mode !== 'vanilla') Object.assign(s.resources, { ore: 300, crystals: 100, credits: 500, data: 300 });
      if (mode === 'shields') {
        for (const r of E.componentRecipes) s.components[r.id] = 15;
        for (const id of ['thermal-shield', 'radiation-mesh']) {
          const result = E.dispatch(s, 'fabricate', { recipeId: id });
          if (!result.ok) throw new Error(result.message);
        }
        const thermal = s.inventory.find(m => m.recipeId === 'thermal-shield');
        const result = E.dispatch(s, 'equip', { moduleId: thermal.id });
        if (!result.ok) throw new Error(result.message);
      }
      if (!E.validate(s)) throw new Error('Invalid QA fixture');
      window.__qaSaved = [];
      window.openai = { setWidgetState: value => { window.__qaSaved.push(JSON.parse(JSON.stringify(value))); return Promise.resolve(); } };
      window.dispatchEvent(new CustomEvent('openai:set_globals', { detail: { globals: { widgetState: { privateContent: { state: s, tab: 'explore', selected: s.location.planetId, shipDetail: { mode: 'exterior', selectedModule: null, expanded: false } } } } } }));
    }, mode);
  }
  async function inspect(type) {
    await closeSheet(); await tab('ship');
    if ((await view()).shipDetail.mode === 'module') await click('ship-back');
    if ((await view()).shipDetail.mode === 'exterior') await click('open-interior');
    await page.locator(`[data-module-focus="${type}"]:visible`).first().click();
  }
  async function laboratory() {
    await closeSheet(); await tab('ship');
    if ((await view()).shipDetail.mode === 'module') await click('ship-back');
    await click('workshop'); await click('fabricator');
  }
  function exactTransaction(before, after, cost, components = {}, componentOutput, outputAmount = 1) {
    for (const [key, amount] of Object.entries(before.resources)) assert.equal(after.resources[key], amount - (cost[key] || 0), 'Resource cost: ' + key);
    for (const key of new Set([...Object.keys(before.components), ...Object.keys(after.components)])) assert.equal(after.components[key] || 0, (before.components[key] || 0) - (components[key] || 0) + (key === componentOutput ? outputAmount : 0), 'Component cost: ' + key);
  }
  async function inventory() {
    await closeSheet(); await tab('ship');
    if ((await view()).shipDetail.mode === 'module') await click('ship-back');
    await click('modules');
    if (await page.locator('[data-inventory="inventory"]:visible').count()) await page.locator('[data-inventory="inventory"]:visible').click();
  }
  await test('Tapping each physical ship module opens its purpose and actual operating metrics', async () => {
    await boot('shields');
    for (const type of ['engine', 'warp', 'life', 'shield', 'scanner', 'arm', 'cargo', 'survival']) {
      await inspect(type);
      assert.equal((await view()).sheet, 'system-module', type);
      const text = await page.getByRole('dialog').innerText(), s = await state();
      assert.ok(text.includes(s.equipped[type].name), type + ': installed part name');
      const details = await page.evaluate(type => OrbitEngine.moduleDetails(orbitApp.getState(), orbitApp.getState().equipped[type]), type);
      assert.ok(details.metrics.some(metric => text.includes(metric.label)), type + ': at least one useful metric');
    }
    await snap('interactive-survival-module');
  });
  let thermalId, radiationId;
  await test('Choosing a shield shows heat lost and radiation gained; cancel leaves equipment and stock intact', async () => {
    await inspect('shield'); const before = await state();
    thermalId = before.equipped.shield.id; radiationId = before.inventory.find(module => module.recipeId === 'radiation-mesh').id;
    await page.locator('#og-module-choice').selectOption(radiationId);
    const text = await page.getByRole('dialog').innerText();
    assert.match(text, /térmic|calor/i); assert.match(text, /radiação|radiológic/i);
    const comparison = await page.evaluate(id => OrbitEngine.compareModule(orbitApp.getState(), id), radiationId);
    assert.ok(comparison.rows.some(row => row.key === 'heat' && row.after < row.before));
    assert.ok(comparison.rows.some(row => row.key === 'radiation' && row.after > row.before));
    assert.equal(comparison.kind, 'tradeoff');
    assert.match(text, /1400|1[.,\s]400/); assert.match(text, /450/);
    await snap('shield-tradeoff-comparison');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.deepEqual(await state(), before);
    const focusInside = await page.evaluate(() => document.activeElement !== document.body && document.getElementById('orbit-game').contains(document.activeElement));
    assert.equal(focusInside, true);
  });
  await test('Confirming the selected shield changes real protections and safely stores the previous piece', async () => {
    await inspect('shield'); await page.locator('#og-module-choice').selectOption(radiationId);
    const before = await state(), capsBefore = await page.evaluate(() => OrbitEngine.stats(orbitApp.getState()).protection);
    await page.locator(`[data-action="equip"][data-module="${radiationId}"]:visible`).click();
    const after = await state(), capsAfter = await page.evaluate(() => OrbitEngine.stats(orbitApp.getState()).protection);
    assert.equal(after.equipped.shield.id, radiationId); assert.ok(after.inventory.some(module => module.id === thermalId));
    assert.deepEqual(after.resources, before.resources); assert.deepEqual(after.components, before.components);
    assert.ok(capsAfter.heat < capsBefore.heat); assert.ok(capsAfter.radiation > capsBefore.radiation);
    await snap('shield-installed');
  });
  await test('Favorite protection blocks recycling and persists with a host save smaller than 16KiB', async () => {
    await inventory();
    await page.locator(`[data-action="favoriteModule"][data-module="${thermalId}"]:visible`).click();
    assert.equal((await state()).inventory.find(module => module.id === thermalId).favorite, true);
    const p = await preview('salvage', { moduleId: thermalId }); assert.equal(p.allowed, false); assert.match(p.reason, /favorito|protegid/i);
    const before = await state();
    const stored = await page.evaluate(() => window.__qaSaved.at(-1)); assert.ok(stored);
    const bytes = Buffer.byteLength(JSON.stringify(stored), 'utf8'); assert.ok(bytes < 16384, 'Host snapshot: ' + bytes);
    fs.writeFileSync(path.join(out, 'save-size.json'), JSON.stringify({ bytes, limit: 16384 }, null, 2));
    await page.reload(); await page.waitForFunction(() => window.orbitApp); assert.deepEqual(await state(), before);
    assert.equal((await state()).inventory.find(module => module.id === thermalId).favorite, true);
    await inventory(); await snap('favorite-thermal-shield');
  });
  await test('Recycling a unique specialist requires a warning and explicit confirmation; cancel is harmless', async () => {
    await page.locator(`[data-action="favoriteModule"][data-module="${thermalId}"]:visible`).click();
    const before = await state(), warning = await page.evaluate(id => OrbitEngine.salvageInfo(orbitApp.getState(), id), thermalId);
    assert.ok(warning.uniqueBenefits.length);
    await page.locator(`[data-action="salvage-review"][data-module="${thermalId}"]:visible`).click();
    const text = await page.getByRole('dialog').innerText(); assert.match(text, /únic|exclusiv|perd/i); assert.match(text, /térmic|calor|1400|1[.,\s]400/i);
    assert.deepEqual(await state(), before); await snap('unique-module-recycle-warning');
    await page.keyboard.press('Escape'); assert.deepEqual(await state(), before);
    await inventory(); await page.locator(`[data-action="salvage-review"][data-module="${thermalId}"]:visible`).click();
    await click('salvage');
    const after = await state(); assert.ok(!after.inventory.some(module => module.id === thermalId));
    assert.equal(after.resources.ore, before.resources.ore + warning.ore);
    assert.equal(after.resources.credits, before.resources.credits + warning.credits);
    assert.deepEqual(after.equipped, before.equipped);
  });
  await test('The laboratory opens as eight module categories with accurate visible resource stock', async () => {
    await boot('lab'); await laboratory();
    const categories = await page.locator('[data-lab-type]:visible').evaluateAll(nodes => nodes.map(node => node.dataset.labType).filter(type => type !== 'components'));
    assert.equal(categories.length, 8); assert.equal(new Set(categories).size, 8);
    assert.equal(await page.locator('[data-lab-recipe]:visible').count(), 0, 'No long list of recipes on the laboratory home');
    for (const key of ['ore', 'crystals', 'data', 'credits']) assert.ok((await page.locator(`.og-lab-stock [data-stock="${key}"]`).innerText()).includes(String((await state()).resources[key])), key);
    await snap('laboratory-home');
  });
  await test('A recipe shows component counts, opens its ingredient and returns without losing the selected design', async () => {
    await page.locator('[data-lab-type="shield"]:visible').click();
    await page.locator('[data-lab-recipe="thermal-shield"]:visible').click();
    const before = await state();
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="thermal-shield"]').isDisabled(), true);
    assert.equal((await preview('fabricate', { recipeId: 'thermal-shield' })).allowed, false);
    assert.match(await page.locator('.og-lab-ingredient[data-ingredient="alloy"]').innerText(), /0\s*(?:\/|de)\s*2/);
    await snap('thermal-recipe-missing-components');
    await page.locator('[data-lab-component="alloy"]:visible').click();
    const p = await preview('craftComponent', { componentId: 'alloy' });
    assert.equal(p.allowed, true, p.reason);
    await page.locator('[data-action="craftComponent"][data-component="alloy"]:not([data-lab-return]):visible').click();
    exactTransaction(before, await state(), p.cost, p.components || {}, 'alloy');
    assert.equal((await state()).components.alloy, 1);
    await snap('component-crafted');
    await page.locator('[data-lab-back="previous"]:visible').click();
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="thermal-shield"]:visible').count(), 1);
    assert.match(await page.locator('.og-lab-ingredient[data-ingredient="alloy"]').innerText(), /1\s*(?:\/|de)\s*2/);
  });
  await test('Handcrafted ingredients are consumed exactly by assembly and the module stays unequipped', async () => {
    for (const id of ['alloy', 'prism', 'seal']) {
      await page.locator(`[data-lab-component="${id}"]:visible`).click();
      const before = await state(), p = await preview('craftComponent', { componentId: id });
      assert.equal(p.allowed, true, p.reason);
      await page.locator(`[data-action="craftComponent"][data-component="${id}"]:not([data-lab-return]):visible`).click();
      exactTransaction(before, await state(), p.cost, p.components || {}, id);
      await page.locator('[data-lab-back="previous"]:visible').click();
    }
    const before = await state(), p = await preview('fabricate', { recipeId: 'thermal-shield' });
    assert.equal(p.allowed, true, p.reason);
    await page.locator('[data-action="fabricate"][data-recipe="thermal-shield"]:visible').click();
    const after = await state(); exactTransaction(before, after, p.cost, p.components || {});
    assert.deepEqual(after.equipped, before.equipped);
    assert.equal(after.inventory.length, before.inventory.length + 1);
    assert.ok(after.inventory.find(module => module.recipeId === 'thermal-shield'));
    assert.equal(after.components.alloy, 0); assert.equal(after.components.prism, 0); assert.equal(after.components.seal, 0);
    await snap('assembled-module-in-storage');
  });
  await test('A nested recipe can be assembled one ingredient at a time and returns to its parent module', async () => {
    await boot('lab'); await laboratory();
    await page.locator('[data-lab-type="shield"]:visible').click();
    await page.locator('[data-lab-recipe="radiation-mesh"]:visible').click();
    await page.locator('[data-lab-component="field-core"]:visible').click();
    assert.equal(await page.locator('[data-action="craftComponent"][data-component="field-core"]:not([data-lab-return])').isDisabled(), true);
    for (const [id, count] of [['prism', 2], ['circuit', 1]]) {
      await page.locator(`[data-lab-component="${id}"]:visible`).click();
      for (let n = 0; n < count; n++) {
        const before = await state(), p = await preview('craftComponent', { componentId: id });
        assert.equal(p.allowed, true, p.reason);
        await page.locator(`[data-action="craftComponent"][data-component="${id}"]:not([data-lab-return]):visible`).click();
        exactTransaction(before, await state(), p.cost, p.components || {}, id);
      }
      await page.locator('[data-lab-back="previous"]:visible').click();
      assert.equal(await page.locator('[data-action="craftComponent"][data-component="field-core"]:not([data-lab-return]):visible').count(), 1);
    }
    const before = await state(), p = await preview('craftComponent', { componentId: 'field-core' });
    assert.equal(p.allowed, true, p.reason);
    await page.locator('[data-action="craftComponent"][data-component="field-core"]:not([data-lab-return]):visible').click();
    const after = await state(); exactTransaction(before, after, p.cost, p.components || {}, 'field-core');
    assert.equal(after.components.prism, 0); assert.equal(after.components.circuit, 0); assert.equal(after.components['field-core'], 1);
    await snap('nested-field-core-crafted');
    await page.locator('[data-lab-back="previous"]:visible').click();
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="radiation-mesh"]:visible').count(), 1);
    assert.match(await page.locator('.og-lab-ingredient[data-ingredient="field-core"]').innerText(), /1\s*(?:\/|de)\s*1/);
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="radiation-mesh"]').isDisabled(), true, 'The uncrafted seal is still required');
  });
  await test('Closing contextual details preserves physical module dragging and direct cargo interactions', async () => {
    await boot(); await inspect('engine'); await closeSheet();
    const before = await state();
    for (const expand of [true, false]) {
      await page.waitForTimeout(950);
      const part = await page.evaluate(() => orbitApp.getInspection());
      assert.ok(part?.bounds, 'Engine geometry is available');
      const canvas = await page.locator('#og-canvas').boundingBox();
      const start = { x: canvas.x + part.bounds.x + part.bounds.width / 2, y: canvas.y + part.bounds.y + part.bounds.height / 2 };
      const end = expand ? { x: start.x + part.expansionVector.x * 1.12, y: start.y + part.expansionVector.y * 1.12 } : { x: canvas.x + part.socket.x, y: canvas.y + part.socket.y };
      await page.mouse.move(start.x, start.y); await page.mouse.down(); await page.mouse.move(end.x, end.y, { steps: 14 }); await page.mouse.up();
      await page.waitForFunction(expected => orbitApp.getView().shipDetail.expanded === expected, expand);
      assert.deepEqual(await state(), before);
    }
    await inspect('cargo'); await closeSheet(); await page.waitForTimeout(950);
    for (const resource of ['ore', 'crystals', 'oxygen']) {
      const part = await page.evaluate(() => orbitApp.getInspection());
      const item = part.contents.find(content => content.resource === resource);
      assert.ok(item, 'Physical cargo target: ' + resource);
      await page.locator('#og-canvas').click({ position: { x: item.x, y: item.y } });
      assert.equal((await view()).sheet, 'cargo-content');
      assert.equal((await page.locator('.og-cargo-amount strong').innerText()).trim(), String((await state()).resources[resource]));
      await closeSheet();
    }
    await page.locator('[data-cargo="ore"]:visible').first().click();
    const resources = (await state()).resources, p = await preview('refuel');
    assert.equal(p.allowed, true, p.reason); await click('refuel');
    const after = (await state()).resources;
    for (const key of Object.keys(resources)) assert.equal(after[key], resources[key] - (p.cost[key] || 0) + (key === 'fuel' ? p.amount : 0), 'Cargo refuel cost: ' + key);
    await snap('physical-cargo-regression');
  });
  await test('Crafting only missing pieces returns to the parent ingredient and supports a shortcut to the module recipe', async () => {
    await boot('lab'); await laboratory();
    await page.locator('[data-lab-type="shield"]:visible').click();
    await page.locator('[data-lab-recipe="radiation-mesh"]:visible').click();
    await page.locator('[data-lab-component="field-core"]:visible').click();
    await page.locator('[data-lab-component="prism"]:visible').click();
    const batch = page.locator('[data-action="craftComponent"][data-component="prism"][data-lab-return="true"]');
    assert.equal(await batch.getAttribute('data-amount'), '2');
    const before = await state(), p = await preview('craftComponent', { componentId: 'prism', amount: 2 });
    assert.equal(p.allowed, true, p.reason); await batch.click();
    const after = await state(); exactTransaction(before, after, p.cost, p.components || {}, 'prism', 2);
    assert.equal(after.components.prism, 2);
    assert.equal(await page.locator('[data-action="craftComponent"][data-component="field-core"]:not([data-lab-return]):visible').count(), 1, 'Returns to immediate ingredient');
    assert.match(await page.locator('.og-lab-ingredient[data-ingredient="prism"]').innerText(), /2\s*(?:\/|de)\s*2/);
    await snap('batch-components-returned');
    await page.locator('[data-lab-target="radiation-mesh"]:visible').click();
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="radiation-mesh"]:visible').count(), 1);
    await page.locator('[data-lab-back="previous"]:visible').click();
    assert.ok(await page.locator('[data-lab-recipe="radiation-mesh"]:visible').count(), 'Parent category remains reachable');
  });
  await test('An active expedition prevents equipment replacement and both crafting steps without spending anything', async () => {
    await boot();
    for (const action of ['scan', 'dock', 'sites', 'explore']) await click(action);
    const before = await state();
    const checks = await page.evaluate(() => {
      const s = orbitApp.getState(), E = OrbitEngine;
      return [['equip', { moduleId: s.inventory[0].id }], ['fabricate', { recipeId: 'thermal-shield' }], ['craftComponent', { componentId: 'alloy' }]].map(([action, payload]) => {
        const preview = E.preview(s, action, payload), copy = JSON.parse(JSON.stringify(s));
        const result = E.dispatch(copy, action, payload);
        return { action, preview, result, unchanged: JSON.stringify(copy) === JSON.stringify(s) };
      });
    });
    for (const check of checks) { assert.equal(check.preview.allowed, false); assert.match(check.preview.reason, /expedi|retorn|equipe/i); assert.equal(check.result.ok, false); assert.equal(check.unchanged, true, check.action); }
    assert.deepEqual(await state(), before);
    const recovered = await completeTutorialExpedition(page);
    assert.ok(recovered); assert.equal((await state()).expedition, null); assert.equal((await state()).progress.explorations, 1);
    assert.ok((await state()).inventory.some(module => module.id === recovered.id));
    await snap('expedition-regression-extracted');
  });
  await test('A genuine previous save gains an empty component stock while preserving its ship and exploration', async () => {
    const p = await context.newPage(); p.on('pageerror', error => errors.push(error.message));
    await p.addInitScript(snapshot => { window.openai = { widgetState: { privateContent: snapshot } }; }, legacy);
    await p.goto(gameURL); await p.waitForFunction(() => window.orbitApp);
    const after = await p.evaluate(() => orbitApp.getState());
    assert.deepEqual(after.resources, legacy.state.resources);
    assert.deepEqual(after.progress, legacy.state.progress);
    assert.deepEqual(after.ship, legacy.state.ship);
    for (const [type, module] of Object.entries(legacy.state.equipped)) assert.equal(after.equipped[type].id, module.id);
    assert.deepEqual(after.inventory.map(module => module.id), legacy.state.inventory.map(module => module.id));
    assert.equal(Object.values(after.components).reduce((sum, value) => sum + value, 0), 0);
    assert.equal(await p.evaluate(() => OrbitEngine.validate(orbitApp.getState())), true);
    await p.close();
  });
  await test('Module comparison and laboratory screens fit small phones without horizontal clipping', async () => {
    await boot('shields');
    for (const width of [320, 390, 736]) {
      await page.setViewportSize({ width, height: 900 });
      await inspect('shield');
      const id = (await state()).inventory.find(module => module.recipeId === 'radiation-mesh').id;
      await page.locator('#og-module-choice').selectOption(id);
      const footer = await page.locator('.og-system-confirm').boundingBox();
      const viewport = page.viewportSize();
      const gameBounds = await page.locator('#orbit-game').boundingBox();
      assert.ok(footer && footer.y >= gameBounds.y && footer.y + footer.height <= Math.min(viewport.height, gameBounds.y + gameBounds.height) + 1, 'Confirm/cancel footer fits screen at ' + width + 'px');
      for (const name of ['compare', 'laboratory', 'recipe']) {
        if (name === 'laboratory') await laboratory();
        if (name === 'recipe') { await page.locator('[data-lab-type="shield"]:visible').click(); await page.locator('[data-lab-recipe="thermal-shield"]:visible').click(); }
        const geometry = await page.evaluate(() => ({ width: innerWidth, doc: document.documentElement.scrollWidth, box: document.getElementById('orbit-game').clientWidth, game: document.getElementById('orbit-game').scrollWidth }));
        assert.ok(geometry.doc <= geometry.width && geometry.game <= geometry.box + 1, JSON.stringify({ name, width, geometry }));
        const clipped = await page.getByRole('dialog').locator('button, select').evaluateAll(nodes => nodes.filter(node => { const r = node.getBoundingClientRect(), g = document.getElementById('orbit-game').getBoundingClientRect(); return r.left < g.left - 1 || r.right > g.right + 1; }).map(node => node.textContent));
        assert.deepEqual(clipped, [], `${name} at ${width}px`);
        await snap(`${name}-phone${width}`);
      }
    }
    await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').count(), 0);
  });
  await test('No browser runtime errors', async () => assert.deepEqual(errors, []));
  const report = { results, errors, passed: results.every(result => result.pass) };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
