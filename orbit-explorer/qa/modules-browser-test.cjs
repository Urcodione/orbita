/* Browser acceptance tests for contextual module fitting and the component laboratory.
   Rich material fixtures exercise the shop; a separate vanilla expedition verifies progression. */
const { chromium } = require('./node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Save = require('./save-slot.cjs');
const { solveCounts } = require('./expedition-helpers.cjs');
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
    // A new game opens with the story intro: skip it before loading the fixture.
    if (await page.locator('[data-story-action=skip]').count()) await page.locator('[data-story-action=skip]').click();
    await Save.load(page, await page.evaluate(mode => {
      const E = OrbitEngine, s = E.create('qa-module-workbench-' + mode);
      // A fresh game starts in the guided Prisma training; leave it the way "Pular tutorial" does.
      const skipped = E.dispatch(s, 'guideSkip'); if (!skipped.ok) throw new Error(skipped.message);
      // Ore and crystals now occupy the cargo hold (250 units on the starting ship) and an overloaded hold refuses
      // assembly, so the rich fixture stays within it; credits and data take no room.
      if (mode !== 'vanilla') Object.assign(s.resources, { ore: 150, crystals: 50, credits: 500, data: 300 });
      if (mode === 'shields') {
        // Exactly the parts both shields need (stocking 15 of every component would overflow the hold).
        Object.assign(s.components, { alloy: 2, prism: 1, seal: 2, 'field-core': 1 });
        for (const id of ['thermal-shield', 'radiation-mesh']) {
          const result = E.dispatch(s, 'fabricate', { recipeId: id });
          if (!result.ok) throw new Error(result.message);
        }
        const thermal = s.inventory.find(m => m.recipeId === 'thermal-shield');
        const result = E.dispatch(s, 'equip', { moduleId: thermal.id });
        if (!result.ok) throw new Error(result.message);
      }
      if (!E.validate(s)) throw new Error('Invalid QA fixture');
      return { state: s, tab: 'explore', selected: s.location.planetId, shipDetail: { mode: 'exterior' } };
    }, mode));
    await page.waitForFunction(() => !orbitApp.getState().guide?.active);
  }
  // The exterior no longer has an "Abrir nave" button: tapping the rocket drawing opens the hull.
  async function openHull() {
    if ((await view()).shipDetail.mode === 'exterior') { await page.locator('#og-canvas').click(); await page.waitForFunction(() => orbitApp.getView().shipDetail.mode === 'interior'); }
  }
  async function inspect(type) {
    await closeSheet(); await tab('ship');
    await openHull();
    await page.locator(`[data-module-focus="${type}"]:visible`).first().click();
  }
  // Cards can be paginated on small screens: page forward (then back) until the control is on the visible page.
  async function reveal(selector) {
    for (const dir of ['1', '-1']) for (let n = 0; n < 6 && !await page.locator(selector + ':visible').count(); n++) {
      const step = page.locator(`[data-sheet-page="${dir}"]:visible:not(:disabled)`); if (!await step.count()) break; await step.click();
    }
  }
  // The stored-part <select> is gone: slide the module card to the stored part, then "Encaixar" opens the comparison.
  async function chooseCandidate(id) {
    for (let n = 0; n < 8 && (await view()).selectedCandidateId !== id; n++) {
      const next = '[data-action="module-slide"][data-step="1"]:not(:disabled)'; await reveal(next); await page.locator(next + ':visible').first().click();
    }
    assert.equal((await view()).sheet, 'stored-module');
    await reveal(`[data-action="compare-module"][data-module="${id}"]`); await page.locator(`[data-action="compare-module"][data-module="${id}"]:visible`).click();
    assert.equal((await view()).sheet, 'system-module'); assert.equal((await view()).selectedCandidateId, id);
  }
  // The laboratory's back control is the panel's top arrow ("Voltar: Receita", "Categoria"...).
  async function labBack() { await page.locator('#og-sheet-backdrop [data-action="nav-back"]:visible').first().click(); }
  async function labHome() { for (let n = 0; n < 6 && (await view()).lab.page !== 'home'; n++) await labBack(); assert.equal((await view()).lab.page, 'home'); }
  // "ESTOQUE / NECESSÁRIO" text of one ingredient row.
  const ingredient = id => page.locator(`.og-lab-ingredient[data-ingredient="${id}"]`).first().innerText();
  // Crafts with the component card's visible button and checks the exact advertised transaction; returns the amount.
  async function craftShown(id, before) {
    const button = page.locator(`[data-action="craftComponent"][data-component="${id}"]:visible`);
    const amount = Number(await button.getAttribute('data-amount') || 1);
    before = before || await state(); const p = await preview('craftComponent', { componentId: id, amount });
    assert.equal(p.allowed, true, p.reason); await button.click();
    exactTransaction(before, await state(), p.cost, p.components || {}, id, amount);
    return amount;
  }
  // Outside the guided training an expedition is an adventure: two terrain beacons must be activated before the core
  // circuit opens. The shared tutorial helper only knows the training path, so drive the visible field controls here:
  // walk to each beacon, open and tune the circuit, recover the core and extract it at the base.
  async function completeAdventureExpedition() {
    const press = async action => {
      await page.locator(`[data-action="${action}"]:visible`).first().click();
      if ((await view()).sheet === 'expedition-risk-confirm') await page.locator('[data-action="confirm-field-action"]:visible').click();
    };
    const field = () => page.evaluate(() => { const ex = orbitApp.getState().expedition; return ex && { x: ex.x, y: ex.y, beacons: ex.beacons || [], coreRecovered: ex.coreRecovered, puzzle: ex.puzzle, board: OrbitEngine.expeditionBoard(ex).map(c => c.kind) }; });
    async function walkTo(target) {
      for (let guard = 0; guard < 40; guard++) {
        const f = await field(); if (f.y * 6 + f.x === target) return;
        // Cheapest route over passable sectors (hazards cost more reserve).
        const dist = new Map([[target, 0]]), queue = [target];
        while (queue.length) { queue.sort((a, b) => dist.get(a) - dist.get(b)); const i = queue.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i % 6 + dx, y = Math.floor(i / 6) + dy, j = y * 6 + x; if (x < 0 || y < 0 || x > 5 || y > 5 || f.board[j] === 'wall') continue; const d = dist.get(i) + (f.board[i] === 'hazard' ? 2 : 1); if (!dist.has(j) || d < dist.get(j)) { dist.set(j, d); queue.push(j); } } }
        const here = f.y * 6 + f.x, next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [f.x + dx, f.y + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < 6 && y < 6 && dist.has(y * 6 + x)).sort((a, b) => dist.get(a[1] * 6 + a[0]) - dist.get(b[1] * 6 + b[0]))[0];
        assert.ok(next && dist.has(here), 'Reachable field sector ' + target);
        await page.locator(`[data-expedition-x="${next[0]}"][data-expedition-y="${next[1]}"]:visible`).click();
        if ((await view()).sheet === 'expedition-risk-confirm') await page.locator('[data-action="confirm-field-action"]:visible').click();
      }
      throw new Error('Could not reach sector ' + target);
    }
    let f = await field(); assert.ok(f, 'An expedition is active');
    const beacons = f.board.map((kind, i) => kind === 'beacon' ? i : -1).filter(i => i >= 0 && !f.beacons.includes(i));
    for (const beacon of beacons.slice(0, 2 - f.beacons.length)) { await walkTo(beacon); await press('expeditionBeacon'); }
    await walkTo(f.board.indexOf('core')); await press('expeditionInteract');
    f = await field(); const counts = solveCounts(f.puzzle.dials, f.puzzle.target);
    for (let i = 0; i < 3; i++) for (let n = 0; n < counts[i]; n++) await page.locator(`[data-action="expeditionTune"][data-index="${i}"]:visible`).click();
    const before = await state(); await press('expeditionRecover');
    const recovered = await state(); assert.ok(recovered.expedition.coreRecovered);
    assert.deepEqual(recovered.inventory, before.inventory, 'Recovered gear is pending until extraction');
    await walkTo(32); await press('expeditionExtract');
    const after = await state(); assert.equal(after.expedition, null);
    return after.inventory.find(module => module.id === recovered.expedition.pending.module.id);
  }
  async function laboratory() {
    await closeSheet(); await tab('ship');
    await openHull(); await click('workshop'); await click('fabricator');
  }
  function exactTransaction(before, after, cost, components = {}, componentOutput, outputAmount = 1) {
    for (const [key, amount] of Object.entries(before.resources)) assert.equal(after.resources[key], amount - (cost[key] || 0), 'Resource cost: ' + key);
    for (const key of new Set([...Object.keys(before.components), ...Object.keys(after.components)])) assert.equal(after.components[key] || 0, (before.components[key] || 0) - (components[key] || 0) + (key === componentOutput ? outputAmount : 0), 'Component cost: ' + key);
  }
  async function inventory() {
    await closeSheet(); await tab('ship');
    await click('modules');
    if (await page.locator('[data-inventory="inventory"]:visible').count()) await page.locator('[data-inventory="inventory"]:visible').click();
  }
  // Favorite and recycle controls now live on each stored part's card rather than on the storage list.
  async function storedCard(id) {
    await inventory(); await page.locator(`[data-action="stored-module"][data-module="${id}"]:visible`).click();
    assert.equal((await view()).sheet, 'stored-module'); assert.equal((await view()).selectedCandidateId, id);
  }
  async function cardControl(selector) { await reveal(selector); await page.locator(selector + ':visible').click(); }
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
    await chooseCandidate(radiationId);
    const text = await page.getByRole('dialog').innerText();
    assert.match(text, /térmic|calor/i); assert.match(text, /radiação|radiológic/i);
    const comparison = await page.evaluate(id => OrbitEngine.compareModule(orbitApp.getState(), id), radiationId);
    assert.ok(comparison.rows.some(row => row.key === 'heat' && row.after < row.before));
    assert.ok(comparison.rows.some(row => row.key === 'radiation' && row.after > row.before));
    assert.equal(comparison.kind, 'tradeoff');
    assert.match(text, /1400|1[.,\s]400/); assert.match(text, /450/);
    await snap('shield-tradeoff-comparison');
    const cancel = page.locator('.og-system-confirm [data-action="nav-back"]:visible'); assert.equal((await cancel.innerText()).trim(), 'Cancelar');
    await cancel.click();
    assert.deepEqual(await state(), before);
    const focusInside = await page.evaluate(() => document.activeElement !== document.body && document.getElementById('orbit-game').contains(document.activeElement));
    assert.equal(focusInside, true);
  });
  await test('Confirming the selected shield changes real protections and safely stores the previous piece', async () => {
    await inspect('shield'); await chooseCandidate(radiationId);
    const before = await state(), capsBefore = await page.evaluate(() => OrbitEngine.stats(orbitApp.getState()).protection);
    await page.locator(`[data-action="equip"][data-module="${radiationId}"]:visible`).click();
    const after = await state(), capsAfter = await page.evaluate(() => OrbitEngine.stats(orbitApp.getState()).protection);
    assert.equal(after.equipped.shield.id, radiationId); assert.ok(after.inventory.some(module => module.id === thermalId));
    assert.deepEqual(after.resources, before.resources); assert.deepEqual(after.components, before.components);
    assert.ok(capsAfter.heat < capsBefore.heat); assert.ok(capsAfter.radiation > capsBefore.radiation);
    await snap('shield-installed');
  });
  await test('Favorite protection blocks recycling and persists with a save smaller than 16 KiB', async () => {
    await storedCard(thermalId);
    await cardControl(`[data-action="favoriteModule"][data-module="${thermalId}"]`);
    assert.equal((await state()).inventory.find(module => module.id === thermalId).favorite, true);
    const p = await preview('salvage', { moduleId: thermalId }); assert.equal(p.allowed, false); assert.match(p.reason, /favorito|protegid/i);
    const before = await state();
    const stored = await Save.last(page); assert.ok(stored);
    const bytes = Buffer.byteLength(JSON.stringify(stored), 'utf8'); assert.ok(bytes < 16384, 'Save: ' + bytes);
    fs.writeFileSync(path.join(out, 'save-size.json'), JSON.stringify({ bytes, limit: 16384 }, null, 2));
    await page.reload(); await page.waitForFunction(() => window.orbitApp); assert.deepEqual(await state(), before);
    assert.equal((await state()).inventory.find(module => module.id === thermalId).favorite, true);
    await storedCard(thermalId); await snap('favorite-thermal-shield');
  });
  await test('Recycling a unique specialist requires a warning and explicit confirmation; cancel is harmless', async () => {
    await cardControl(`[data-action="favoriteModule"][data-module="${thermalId}"]`);
    const before = await state(), warning = await page.evaluate(id => OrbitEngine.salvageInfo(orbitApp.getState(), id), thermalId);
    assert.ok(warning.uniqueBenefits.length);
    await cardControl(`[data-action="salvage-review"][data-module="${thermalId}"]`);
    const text = await page.getByRole('dialog').innerText(); assert.match(text, /únic|exclusiv|perd/i); assert.match(text, /térmic|calor|1400|1[.,\s]400/i);
    assert.deepEqual(await state(), before); await snap('unique-module-recycle-warning');
    await page.keyboard.press('Escape'); assert.deepEqual(await state(), before);
    await storedCard(thermalId); await cardControl(`[data-action="salvage-review"][data-module="${thermalId}"]`);
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
    // The home no longer carries a stock strip: each recipe and component card now lists "ESTOQUE / NECESSÁRIO" per
    // ingredient. Check that every resource stock shown there is the real amount.
    const s = await state(), shown = {};
    await page.locator('[data-lab-type="shield"]:visible').click(); await page.locator('[data-lab-recipe="thermal-shield"]:visible').click();
    for (const key of ['data', 'credits']) shown[key] = await ingredient(key);
    await page.locator('.og-lab-ingredient[data-lab-component="alloy"]:visible').click(); shown.ore = await ingredient('ore'); await labBack();
    await page.locator('.og-lab-ingredient[data-lab-component="prism"]:visible').click(); shown.crystals = await ingredient('crystals');
    for (const key of ['ore', 'crystals', 'data', 'credits']) assert.match(shown[key], new RegExp(`(^|\\D)${s.resources[key]}\\s*\\/`), key + ': ' + shown[key]);
    await labHome(); await snap('laboratory-home');
  });
  await test('A recipe shows component counts, opens its ingredient and returns without losing the selected design', async () => {
    await page.locator('[data-lab-type="shield"]:visible').click();
    await page.locator('[data-lab-recipe="thermal-shield"]:visible').click();
    const before = await state();
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="thermal-shield"]').isDisabled(), true);
    assert.equal((await preview('fabricate', { recipeId: 'thermal-shield' })).allowed, false);
    assert.match(await page.locator('.og-lab-ingredient[data-ingredient="alloy"]').innerText(), /0\s*(?:\/|de)\s*2/);
    await snap('thermal-recipe-missing-components');
    await page.locator('.og-lab-ingredient[data-lab-component="alloy"]:visible').click();
    // Opened from a recipe, the ingredient offers a single "Montar 2 · concluir ingrediente" for exactly what is missing.
    assert.equal(await craftShown('alloy', before), 2);
    assert.equal((await state()).components.alloy, 2);
    await snap('component-crafted');
    await labBack();
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="thermal-shield"]:visible').count(), 1);
    assert.match(await page.locator('.og-lab-ingredient[data-ingredient="alloy"]').innerText(), /2\s*(?:\/|de)\s*2/);
  });
  await test('Handcrafted ingredients are consumed exactly by assembly and the module stays unequipped', async () => {
    // Liga estrutural was completed by the previous step; craft the remaining ingredients.
    for (const id of ['prism', 'seal']) {
      await page.locator(`.og-lab-ingredient[data-lab-component="${id}"]:visible`).click();
      assert.equal(await craftShown(id), 1);
      await labBack();
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
    await page.locator('.og-lab-ingredient[data-lab-component="field-core"]:visible').click();
    assert.equal(await page.locator('[data-action="craftComponent"][data-component="field-core"]').isDisabled(), true);
    for (const [id, count] of [['prism', 2], ['circuit', 1]]) {
      await page.locator(`.og-lab-ingredient[data-lab-component="${id}"]:visible`).click();
      assert.equal(await craftShown(id), count, id + ': crafts exactly what the parent ingredient lacks');
      await labBack();
      assert.equal(await page.locator('[data-action="craftComponent"][data-component="field-core"]:visible').count(), 1);
    }
    const before = await state();
    assert.equal(await craftShown('field-core'), 1);
    const after = await state();
    assert.equal(after.components.prism, 0); assert.equal(after.components.circuit, 0); assert.equal(after.components['field-core'], 1);
    assert.equal(after.components['field-core'], (before.components['field-core'] || 0) + 1);
    await snap('nested-field-core-crafted');
    await labBack();
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="radiation-mesh"]:visible').count(), 1);
    assert.match(await page.locator('.og-lab-ingredient[data-ingredient="field-core"]').innerText(), /1\s*(?:\/|de)\s*1/);
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="radiation-mesh"]').isDisabled(), true, 'The uncrafted seal is still required');
  });
  await test('Module and cargo cards open over the open ship and the Depósito card runs its services', async () => {
    await boot(); const before = await state(); await inspect('engine');
    assert.equal((await view()).sheet, 'system-module'); assert.equal((await view()).systemType, 'engine'); assert.equal((await view()).shipDetail.mode, 'interior');
    await closeSheet(); assert.equal((await view()).shipDetail.mode, 'interior'); assert.deepEqual(await state(), before);
    await inspect('cargo');
    for (const resource of ['ore', 'crystals', 'oxygen']) {
      if ((await view()).sheet !== 'system-module') await inspect('cargo');
      await reveal(`[data-cargo="${resource}"]`); await page.locator(`[data-cargo="${resource}"]:visible`).first().click();
      assert.equal((await view()).sheet, 'cargo-content');
      assert.equal((await page.locator('.og-cargo-amount strong').innerText()).trim(), String((await state()).resources[resource]));
      await closeSheet();
    }
    await inspect('cargo'); await reveal('[data-cargo="ore"]'); await page.locator('[data-cargo="ore"]:visible').first().click();
    const resources = (await state()).resources, p = await preview('refuel');
    assert.equal(p.allowed, true, p.reason); await click('refuel');
    const after = (await state()).resources;
    for (const key of Object.keys(resources)) assert.equal(after[key], resources[key] - (p.cost[key] || 0) + (key === 'fuel' ? p.amount : 0), 'Cargo refuel cost: ' + key);
    await snap('physical-cargo-regression');
  });
  await test('Crafting only missing pieces keeps the parent ingredient and module recipe one step back', async () => {
    await boot('lab'); await laboratory();
    await page.locator('[data-lab-type="shield"]:visible').click();
    await page.locator('[data-lab-recipe="radiation-mesh"]:visible').click();
    await page.locator('.og-lab-ingredient[data-lab-component="field-core"]:visible').click();
    await page.locator('.og-lab-ingredient[data-lab-component="prism"]:visible').click();
    const batch = page.locator('[data-action="craftComponent"][data-component="prism"]:visible');
    assert.equal(await batch.getAttribute('data-amount'), '2');
    assert.match(await batch.innerText(), /Montar 2/);
    const before = await state(), p = await preview('craftComponent', { componentId: 'prism', amount: 2 });
    assert.equal(p.allowed, true, p.reason); await batch.click();
    const after = await state(); exactTransaction(before, after, p.cost, p.components || {}, 'prism', 2);
    assert.equal(after.components.prism, 2);
    // The batch no longer jumps back by itself and the direct "recipe" shortcut is gone: the back control walks the
    // same path (ingredient, then module recipe, then category) without losing the design being prepared.
    await labBack();
    assert.equal(await page.locator('[data-action="craftComponent"][data-component="field-core"]:visible').count(), 1, 'Back returns to the immediate ingredient');
    assert.match(await page.locator('.og-lab-ingredient[data-ingredient="prism"]').innerText(), /2\s*(?:\/|de)\s*2/);
    await snap('batch-components-returned');
    await labBack();
    assert.equal(await page.locator('[data-action="fabricate"][data-recipe="radiation-mesh"]:visible').count(), 1);
    await labBack();
    assert.ok(await page.locator('[data-lab-recipe="radiation-mesh"]:visible').count(), 'Parent category remains reachable');
  });
  await test('An active expedition prevents equipment replacement and both crafting steps without spending anything', async () => {
    await boot();
    // Scanning now opens the exploration points directly (there is no separate dock/sites step).
    for (const action of ['scan', 'explore']) await click(action);
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
    const recovered = await completeAdventureExpedition();
    assert.ok(recovered); assert.equal((await state()).expedition, null); assert.equal((await state()).progress.explorations, 1);
    assert.ok((await state()).inventory.some(module => module.id === recovered.id));
    await snap('expedition-regression-extracted');
  });
  await test('A genuine previous save gains an empty component stock while preserving its ship and exploration', async () => {
    const p = await context.newPage(); p.on('pageerror', error => errors.push(error.message));
    await Save.seed(p, legacy);
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
      await chooseCandidate(id);
      const footer = await page.locator('.og-system-confirm').boundingBox();
      const viewport = page.viewportSize();
      const gameBounds = await page.locator('#orbit-game').boundingBox();
      assert.ok(footer && footer.y >= gameBounds.y && footer.y + footer.height <= Math.min(viewport.height, gameBounds.y + gameBounds.height) + 1, 'Confirm/cancel footer fits screen at ' + width + 'px');
      for (const name of ['compare', 'laboratory', 'recipe']) {
        if (name === 'laboratory') await laboratory();
        if (name === 'recipe') { await page.locator('[data-lab-type="shield"]:visible').click(); await page.locator('[data-lab-recipe="thermal-shield"]:visible').click(); }
        const geometry = await page.evaluate(() => ({ width: innerWidth, doc: document.documentElement.scrollWidth, box: document.getElementById('orbit-game').clientWidth, game: document.getElementById('orbit-game').scrollWidth }));
        assert.ok(geometry.doc <= geometry.width && geometry.game <= geometry.box + 1, JSON.stringify({ name, width, geometry }));
        // Only rendered controls count: a single-page panel keeps its pager arrows hidden (zero-size at x=0).
        const clipped = await page.getByRole('dialog').locator('button, select').evaluateAll(nodes => nodes.filter(node => { const r = node.getBoundingClientRect(), g = document.getElementById('orbit-game').getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.left < g.left - 1 || r.right > g.right + 1); }).map(node => node.textContent));
        assert.deepEqual(clipped, [], `${name} at ${width}px`);
        await snap(`${name}-phone${width}`);
      }
    }
    // Esc now steps back one place at a time (recipe, category, laboratory, workshop) until the game shows again.
    for (let n = 0; n < 8 && await page.getByRole('dialog').count(); n++) await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
  });
  await test('No browser runtime errors', async () => assert.deepEqual(errors, []));
  const report = { results, errors, passed: results.every(result => result.pass) };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
