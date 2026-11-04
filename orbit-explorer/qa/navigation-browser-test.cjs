/* Fixed-screen navigation and expedition safety acceptance tests.
   Fixtures preserve actual game actions; only reserves are reduced to exercise warnings. */
const { chromium } = require('./node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Save = require('./save-slot.cjs');
const out = path.join(__dirname, 'navigation-artifacts');
fs.mkdirSync(out, { recursive: true });
const gameURL = 'file://' + path.resolve(__dirname, '../index.html');

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } });
  page.setDefaultTimeout(6000);
  const errors = [], results = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const state = () => page.evaluate(() => orbitApp.getState());
  const view = () => page.evaluate(() => orbitApp.getView());
  const settle = () => page.waitForTimeout(140);
  const snap = async name => { await settle(); await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true }); };
  async function test(name, fn) {
    if (process.env.QA_FILTER && !new RegExp(process.env.QA_FILTER, 'i').test(name)) return;
    try { await fn(); results.push({ name, pass: true }); console.log('PASS', name); }
    catch (error) { results.push({ name, pass: false, error: error.message }); console.log('FAIL', name, error.message); await snap('failure-' + results.length).catch(() => {}); }
  }
  async function boot(mode = 'rich') {
    await page.goto(gameURL); await page.waitForFunction(() => window.orbitApp && window.OrbitWorkshop);
    // A first visit opens the illustrated intro and the guided training; leave both before injecting the fixture.
    if (await page.locator('[data-story-action="skip"]:visible').count()) await page.locator('[data-story-action="skip"]').click();
    if (await page.locator('[data-guide-skip]:visible').count()) await page.locator('[data-guide-skip]').click();
    await Save.load(page, await page.evaluate(mode => {
      const E = OrbitEngine, s = E.create('qa-fixed-screen-navigation');
      const dispatch = (action, payload = {}) => { const result = E.dispatch(s, action, payload); if (!result.ok) throw new Error(action + ': ' + result.message); return result; };
      // New games start in the guided Prisma training; these fixtures cover the free game that follows it.
      dispatch('guideSkip');
      // The depot is measured in volume (raw materials and components occupy space), so reserves stay modest and
      // each recipe receives exactly the components it needs.
      const topUp = id => { for (const [k, n] of Object.entries(E.recipes.find(r => r.id === id).components || {})) s.components[k] = Math.max(s.components[k] || 0, n); };
      if (mode !== 'vanilla' && !mode.startsWith('field')) Object.assign(s.resources, { ore: 40, crystals: 20, credits: 900, data: 500 });
      if (mode === 'rich' || mode === 'inventory') {
        for (const r of E.componentRecipes) s.components[r.id] = 4;
        for (const id of ['thermal-shield', 'radiation-mesh']) { topUp(id); dispatch('fabricate', { recipeId: id }); }
        dispatch('equip', { moduleId: s.inventory.find(m => m.recipeId === 'thermal-shield').id });
        if (mode === 'inventory') {
          for (const recipe of E.recipes) {
            if (s.inventory.length >= E.stats(s).cargoCapacity) break;
            if (recipe.id.startsWith('chorus-')) continue;
            topUp(recipe.id);
            const p = E.preview(s, 'fabricate', { recipeId: recipe.id });
            if (p.allowed) dispatch('fabricate', { recipeId: recipe.id });
          }
        }
      }
      if (mode.startsWith('field')) {
        dispatch('scan'); dispatch('dock'); dispatch('explore', { siteId: E.currentPlanet(s).sites[0].id });
        if (mode !== 'field-base') {
          dispatch('expeditionMove', { x: 2, y: 4 });
          dispatch('expeditionMove', { x: 1, y: 4 });
          dispatch('expeditionCollect');
          if (mode === 'field-risk') s.expedition.reserve = E.expeditionView(s).returnReserve + 1;
          if (mode === 'field-empty') s.expedition.reserve = 0;
        }
      }
      if (E.storageView(s).excess) throw new Error('QA fixture overloads the depot');
      if (!E.validate(s)) throw new Error('Invalid QA fixture');
      return { state: E.snapshot(s), tab: mode.startsWith('field') ? 'expedition' : 'explore', selected: s.location.planetId, shipDetail: { mode: 'exterior' } };
    }, mode));
    await settle();
  }
  async function clickSelector(selector) {
    const direct = page.locator(selector + ':visible:not([inert] *)').first();
    if (await direct.count()) { await direct.click(); await settle(); return; }
    // In fixed-screen sheets, controls on later pages must be discoverable by pagination.
    const previous = page.locator('[data-sheet-page="-1"]:visible');
    for (let i = 0; i < 40 && await previous.count() && !await previous.isDisabled(); i++) { await previous.click(); await settle(); }
    for (let i = 0; i < 40; i++) {
      const control = page.locator(selector + ':visible:not([inert] *)').first();
      if (await control.count()) { await control.click(); await settle(); return; }
      const next = page.locator('[data-sheet-page="1"]:visible');
      if (!await next.count() || await next.isDisabled()) break;
      await next.click(); await settle();
    }
    throw new Error('Control not reachable on any page: ' + selector);
  }
  const click = action => clickSelector(`[data-action="${action}"]`);
  async function close() { if (await page.getByRole('dialog').count()) await click('close-sheet'); }
  async function tab(name) { await close(); await clickSelector(`.og-tabs [data-tab="${name}"]`); }
  // The closed hull has no "open" button any more: tapping the painted ship opens it.
  async function openInterior() { await clickSelector('#og-canvas'); await page.waitForFunction(() => orbitApp.getView().shipDetail.mode === 'interior'); }
  async function inspect(type) { await tab('ship'); if ((await view()).shipDetail.mode === 'exterior') await openInterior(); await page.locator(`[data-module-focus="${type}"]:visible`).first().waitFor(); await clickSelector(`[data-module-focus="${type}"]`); }
  // The module card now chooses stored candidates with a carousel (module-slide), which opens the candidate's card.
  async function slideTo(moduleId) { for (let i = 0; i < 12 && (await view()).selectedCandidateId !== moduleId; i++) await clickSelector('[data-action="module-slide"][data-step="1"]'); assert.equal((await view()).selectedCandidateId, moduleId, 'Carousel reaches the candidate'); }
  async function lab() { await tab('ship'); if ((await view()).shipDetail.mode !== 'interior') await openInterior(); await click('workshop'); await click('fabricator'); }

  async function geometry(label) {
    const diagnostics = await page.evaluate(() => {
      const root = document.getElementById('orbit-game'), box = root.getBoundingClientRect();
      const visible = node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden' && !node.closest('[hidden], [inert]');
      const scroll = [...document.querySelectorAll('body, #orbit-game, #orbit-game *')].filter(visible).filter(node => {
        const css = getComputedStyle(node); return !node.classList.contains('og-sr-only') && ((/auto|scroll/.test(css.overflowY) && node.scrollHeight > node.clientHeight + 2) || (/auto|scroll/.test(css.overflowX) && node.scrollWidth > node.clientWidth + 2));
      }).map(node => ({ tag: node.tagName, id: node.id, class: node.className, h: [node.clientHeight, node.scrollHeight], w: [node.clientWidth, node.scrollWidth] }));
      const sheetContent = document.querySelector('.og-sheet-content'), contentBox = sheetContent?.getBoundingClientRect();
      const clipped = [...root.querySelectorAll('button, select, input, .og-sheet-content p, .og-sheet-content h3, .og-sheet-content li, #og-field-energy')].filter(visible).filter(node => !node.closest('.og-module-hotspots') && !node.closest('.og-field-cells')).flatMap(node => {
        const r = node.getBoundingClientRect();
        if (!r.width || !r.height) return [];
        let lower = Math.min(box.bottom, innerHeight), upper = Math.max(box.top, 0);
        if (node.closest('.og-sheet-content') && contentBox) { upper = Math.max(upper, contentBox.top); lower = Math.min(lower, contentBox.bottom); }
        return r.left < Math.max(box.left, 0) - 2 || r.right > Math.min(box.right, innerWidth) + 2 || r.top < upper - 2 || r.bottom > lower + 2 ? [{ text: (node.textContent || node.getAttribute('aria-label') || '').trim().slice(0, 100), r: { x: r.x, y: r.y, w: r.width, h: r.height }, bounds: [upper, lower] }] : [];
      });
      const hiddenContent = sheetContent && visible(sheetContent) && sheetContent.scrollHeight > sheetContent.clientHeight + 2 ? [sheetContent.clientHeight, sheetContent.scrollHeight] : null;
      return { viewport: [innerWidth, innerHeight], document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], game: { x: box.x, y: box.y, w: box.width, h: box.height }, scroll, clipped, hiddenContent };
    });
    assert.ok(diagnostics.document[0] <= diagnostics.viewport[0] + 1 && diagnostics.document[1] <= diagnostics.viewport[1] + 1, label + ': document overflow ' + JSON.stringify(diagnostics));
    assert.deepEqual(diagnostics.scroll, [], label + ': internal scroll areas');
    assert.deepEqual(diagnostics.clipped, [], label + ': inaccessible/clipped content');
    assert.equal(diagnostics.hiddenContent, null, label + ': content must be paginated, never clipped');
    return diagnostics;
  }
  async function auditPages(label) {
    const seen = [], previous = page.locator('[data-sheet-page="-1"]:visible');
    for (let i = 0; i < 40 && await previous.count() && !await previous.isDisabled(); i++) { await previous.click(); await settle(); }
    for (let i = 0; i < 40; i++) {
      await geometry(label + ' page ' + (i + 1));
      seen.push(await page.getByRole('dialog').innerText());
      const next = page.locator('[data-sheet-page="1"]:visible');
      if (!await next.count() || await next.isDisabled()) return seen;
      await next.click(); await settle();
    }
    throw new Error('Pagination did not terminate: ' + label);
  }

  // Navigation is hierarchical now: the module card no longer links to the laboratory and there is no Forward history,
  // so the laboratory is entered from the ship's workshop and Back climbs one exact parent at a time.
  await test('Workshop → laboratory → recipe → component supports exact back navigation', async () => {
    await boot(); await lab();
    const before = await state();
    await clickSelector('[data-lab-type="shield"]'); await clickSelector('[data-lab-recipe="radiation-mesh"]'); await clickSelector('[data-lab-component="field-core"]');
    assert.equal((await view()).lab.componentId, 'field-core');
    await click('nav-back'); assert.equal((await view()).lab.page, 'recipe'); assert.equal((await view()).lab.recipeId, 'radiation-mesh');
    assert.equal(await page.locator('[data-action="nav-forward"]:visible').count(), 0);
    assert.deepEqual(await state(), before, 'Navigation never fabricates or spends materials');
    await click('nav-back'); assert.equal((await view()).lab.page, 'type'); assert.equal((await view()).lab.type, 'shield');
    await click('nav-back'); assert.equal((await view()).lab.page, 'home');
    await click('nav-back'); assert.equal((await view()).sheet, 'workshop');
    await snap('module-navigation-return');
    await close(); assert.equal((await view()).sheet, null); assert.equal((await view()).tab, 'ship');
    assert.deepEqual(await state(), before);
    await geometry('Ship after closing details');
  });
  await test('Navigating after crafting never repeats the transaction', async () => {
    await boot('lab'); await lab(); await clickSelector('[data-lab-type="shield"]'); await clickSelector('[data-lab-recipe="thermal-shield"]'); await clickSelector('[data-lab-component="alloy"]');
    // The ingredient card offers one batch button sized to what the recipe still lacks.
    const craft = page.locator('[data-action="craftComponent"][data-component="alloy"]:visible').first(), amount = Number(await craft.getAttribute('data-amount') || 1);
    await clickSelector('[data-action="craftComponent"][data-component="alloy"]');
    const after = await state(); assert.equal(after.components.alloy, amount);
    await click('nav-back'); assert.equal((await view()).lab.page, 'recipe');
    await clickSelector('[data-lab-component="alloy"]'); await click('nav-back');
    assert.deepEqual(await state(), after);
  });
  await test('Selected comparison returns intact and cancel never replaces installed hardware', async () => {
    await boot(); await tab('ship'); await openInterior(); await click('modules');
    const candidate = (await state()).inventory.find(m => m.recipeId === 'radiation-mesh').id;
    await clickSelector(`[data-action="stored-module"][data-module="${candidate}"]`);
    const before = await state();
    await click('compare-module'); assert.equal((await view()).sheet, 'system-module'); assert.equal((await view()).selectedCandidateId, candidate);
    await clickSelector('.og-sheet button.secondary[data-action="nav-back"]');
    assert.equal((await view()).sheet, 'stored-module'); assert.equal((await view()).selectedCandidateId, candidate);
    await close(); assert.deepEqual(await state(), before);
  });
  await test('Module details return directly to the open ship for another selection, including cancel and Escape', async () => {
    await page.setViewportSize({width:320,height:568}); await boot();
    for (const exit of ['back','close','cancel','escape']) {
      await inspect('shield');
      const candidate=(await state()).inventory.find(m=>m.recipeId==='radiation-mesh').id;
      await slideTo(candidate); await click('compare-module');
      assert.equal((await view()).sheet,'system-module'); assert.equal((await view()).selectedCandidateId,candidate);
      const before=await state();
      assert.match(await page.locator('.og-place-exit[data-action="nav-back"]:visible').getAttribute('aria-label'),/Nave aberta/);
      if(exit==='escape')await page.keyboard.press('Escape');
      else if(exit==='cancel')await clickSelector('.og-sheet button.secondary[data-action="nav-back"]');
      else await clickSelector(exit==='back'?'.og-place-exit[data-action="nav-back"]':'[data-action="close-sheet"]');
      await page.waitForFunction(()=>orbitApp.getView().shipDetail.mode==='interior'&&!orbitApp.getView().sheet);
      await page.waitForFunction(()=>[...document.querySelectorAll('.og-module-hotspot')].filter(b=>getComputedStyle(b).visibility==='visible').length===8);
      assert.deepEqual((await view()).shipDetail,{mode:'interior'});
      assert.deepEqual(await state(),before,'Returning never installs a candidate or spends resources');
      await clickSelector('[data-module-focus="life"]');
      assert.equal((await view()).systemType,'life');
      await close();
    }
    // The touch-only "inspect module"/"expand module" buttons were replaced by dragging the module on the ship
    // (covered by the physical-controls test below); the open ship itself stays one step from every card.
    await snap('touch-buttons-open-ship');
  });
  await test('Every main tab and deeply nested laboratory screen fits four fixed viewports', async () => {
    for (const [width, height] of [[320,568],[390,700],[390,844],[736,900]]) {
      await page.setViewportSize({ width, height }); await boot();
      for (const name of ['explore','ship','galaxy','expedition']) { await tab(name); await geometry(`${width}×${height} ${name}`); }
      await lab(); await auditPages(`${width}×${height} lab home`);
      await clickSelector('[data-lab-type="shield"]'); await auditPages(`${width}×${height} shield recipes`);
      await clickSelector('[data-lab-recipe="radiation-mesh"]'); await auditPages(`${width}×${height} radiation recipe`);
      await clickSelector('[data-lab-component="field-core"]'); await auditPages(`${width}×${height} field core`);
      await snap(`lab-component-${width}x${height}`);
      await inspect('shield'); await auditPages(`${width}×${height} shield comparison`); await snap(`module-${width}x${height}`);
    }
  });
  await test('Long help, full inventory, environment and workshop remain fully reachable without scrolling', async () => {
    await page.setViewportSize({ width: 320, height: 568 }); await boot('inventory');
    await click('menu'); await click('help');
    // The guide is now a topic picker: every topic must fit its fixed card, including the last one.
    const topics = await page.locator('select[data-help-topic] option').evaluateAll(options => options.map(o => o.textContent));
    assert.ok(topics.length > 1, 'Long help is split into topics');
    const help = [];
    for (let i = 0; i < topics.length; i++) { await page.locator('select[data-help-topic]').selectOption(String(i)); await settle(); help.push(...await auditPages('Help topic ' + topics[i])); }
    assert.ok(help.join('\n').includes(topics.at(-1)), 'Last help section remains reachable');
    await tab('ship'); await openInterior(); await click('modules');
    const inventory = await auditPages('Full inventory');
    for (const module of (await state()).inventory) assert.ok(inventory.join('\n').includes(module.name), 'Reachable module: ' + module.name);
    await snap('inventory-fixed-pages');
    await close(); await click('workshop'); await auditPages('Workshop');
    // Scanning now opens the landing-site panel directly (with each site's protection check); the full environment
    // panel is reached from the map.
    await tab('explore'); await click('scan'); assert.equal((await view()).sheet, 'sites'); const sites = await auditPages('Planet sites');
    await tab('galaxy'); await click('environment'); await auditPages('Environment');
    for (const site of (await page.evaluate(() => OrbitEngine.currentPlanet(orbitApp.getState()).sites))) assert.ok(sites.join('\n').includes(site.name), 'Reachable site: ' + site.name);
  });
  await test('Physical module controls remain separate and reachable in the fixed ship interior', async () => {
    for (const [width,height] of [[320,568],[390,700],[390,844],[736,900]]) {
      await page.setViewportSize({ width,height }); await boot(); await tab('ship'); await openInterior();
      await page.evaluate(() => {
        const publish = OrbitScene.prototype.publishHotspots;
        OrbitScene.prototype.publishHotspots = function(points) { window.qaShipPoints = points; publish.call(this, points); };
      });
      await page.locator('[data-module-focus="shield"]:visible').waitFor(); await page.waitForTimeout(1000);
      // The interior is now a painting: each module's touch target sits on its own socket in the drawing (no side
      // labels or connector lines). Neighbouring sockets are closer than the 44 px minimum target, so target margins
      // may touch; what must stay separate is each socket itself: a tap on a module's drawing selects that module.
      assert.equal(await page.locator('.og-module-hotspot:visible').count(),8);
      const stolen = await page.locator('.og-module-hotspot:visible').evaluateAll(nodes => nodes.filter(node => {
        const r = node.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return hit?.closest('.og-module-hotspot') !== node;
      }).map(node => node.dataset.moduleFocus));
      assert.deepEqual(stolen,[],`${width}×${height} module sockets covered by another target`);
      async function verifyLinks() {
        const labels = await page.evaluate(() => {
          const stage = document.getElementById('og-stage').getBoundingClientRect();
          const top = document.getElementById('og-heading').getBoundingClientRect().bottom, bottom = document.getElementById('og-context').getBoundingClientRect().top;
          return window.qaShipPoints.map(point => {
            const node = document.querySelector(`[data-module-focus="${point.type}"]`), rect = node.getBoundingClientRect();
            return { type: point.type, side: node.dataset.side, height: rect.height, width: rect.width, inside: rect.y + rect.height / 2 >= top && rect.y + rect.height / 2 <= bottom && rect.top >= stage.top && rect.bottom <= stage.bottom, socketError: Math.hypot(rect.x+rect.width/2-stage.x-point.anchorX,rect.y+rect.height/2-stage.y-point.anchorY) };
          });
        });
        assert.equal(labels.length,8);
        for (const label of labels) {
          assert.equal(label.side,['scanner','arm','life','engine'].includes(label.type)?'left':'right',label.type+' matches its socket side');
          assert.ok(label.inside && label.height >= 44 && label.width >= 44,label.type+' socket lies in the usable stage (between heading and controls) with a full touch target');
          assert.ok(label.socketError < 1,label.type+' hit target is centred on its socket');
        }
      }
      await verifyLinks();
      await geometry('Ship interior '+width+'×'+height); await snap(`ship-interior-${width}x${height}`);
      for (const type of ['scanner','survival','arm','cargo','life','shield','engine','warp']) {
        await clickSelector(`[data-module-focus="${type}"]`);
        assert.equal((await view()).systemType,type);
        assert.equal((await view()).sheet,'system-module');
        assert.equal((await view()).shipDetail.mode,'interior','no close-up behind the card');
        await click('nav-back');
        assert.equal((await view()).shipDetail.mode,'interior');
        await page.waitForFunction(() => window.qaShipPoints?.length === 8);
      }
      const canvas = await page.locator('#og-canvas').boundingBox();
      await page.mouse.move(canvas.x+canvas.width/2,canvas.y+canvas.height/2);
      await page.mouse.down(); await page.mouse.move(canvas.x+canvas.width/2+65,canvas.y+canvas.height/2+20,{steps:5}); await page.mouse.up();
      await page.mouse.move(canvas.x+canvas.width/2,canvas.y+canvas.height/2);
      for (const delta of [-800,1600]) { await page.mouse.wheel(0,delta); await page.waitForTimeout(700); await verifyLinks(); }
      await click('camera'); await page.waitForTimeout(700); await verifyLinks();
    }
  });
  await test('Back returns to the exact inventory page and reopening the card never equips the candidate', async () => {
    await boot('inventory'); await tab('ship'); await openInterior(); await click('modules');
    const next = page.locator('[data-sheet-page="1"]:visible');
    assert.ok(await next.count()); assert.equal(await next.isDisabled(), false); await next.click(); await settle();
    const marker = await page.locator('.og-page-status:visible').innerText();
    assert.doesNotMatch(marker, /^1 \//, 'Inventory moved past its first page');
    const control = page.locator('[data-action="stored-module"]:visible:not([inert] *)').first(), moduleId = await control.getAttribute('data-module');
    const before = await state(); await control.click(); await settle(); assert.equal((await view()).sheet, 'stored-module'); assert.equal((await view()).selectedCandidateId, moduleId);
    await click('nav-back'); assert.equal((await view()).sheet, 'modules'); assert.equal(await page.locator('.og-page-status:visible').innerText(), marker);
    await page.locator(`[data-action="stored-module"][data-module="${moduleId}"]:visible`).click(); await settle();
    assert.equal((await view()).selectedCandidateId, moduleId); assert.deepEqual(await state(), before);
  });
  await test('Energy, return requirement and usable margin stay visible on the expedition board', async () => {
    for (const [width,height] of [[320,568],[390,700],[390,844],[736,900]]) {
      await page.setViewportSize({ width, height }); await boot('field-cargo');
      const ex = await page.evaluate(() => OrbitEngine.expeditionView(orbitApp.getState()));
      const text = await page.locator('#og-field-energy').innerText();
      assert.match(text, /energia/i); assert.match(text, /volt|retorn/i); assert.match(text, /livre|margem/i);
      assert.ok(text.includes(String(ex.reserve))); assert.ok(text.includes(String(ex.returnReserve)));
      await geometry(`Active expedition ${width}×${height}`); await snap(`expedition-energy-${width}x${height}`);
    }
  });
  await test('Spending the return reserve warns before mutation; cancel preserves energy and cargo', async () => {
    await page.setViewportSize({ width: 390, height: 700 }); await boot('field-risk');
    const before = await state(); await click('expeditionScan');
    assert.equal((await view()).sheet, 'expedition-risk-confirm'); assert.deepEqual(await state(), before);
    const text = await page.getByRole('dialog').innerText(); assert.match(text, /volt|retorn/i); assert.match(text, /carga|perd/i);
    await auditPages('Low energy warning'); await snap('return-reserve-warning');
    await click('nav-back'); assert.deepEqual(await state(), before); assert.equal((await view()).sheet, null);
  });
  await test('Explicitly accepting risk spends once and forward navigation cannot repeat it', async () => {
    await boot('field-risk'); const before = await state();
    const cost = await page.evaluate(() => OrbitEngine.preview(orbitApp.getState(), 'expeditionScan').cost.reserve);
    await click('expeditionScan'); await click('confirm-field-action');
    const after = await state(); assert.equal(after.expedition.reserve, before.expedition.reserve - cost); assert.equal(after.expedition.scans, before.expedition.scans + 1);
    assert.deepEqual(after.expedition.pending, before.expedition.pending);
    const back = page.locator('[data-action="nav-back"]:visible:not([inert] *)').first();
    if (await back.count() && !await back.isDisabled()) { await back.click(); await settle(); const forward = page.locator('[data-action="nav-forward"]:visible:not([inert] *)').first(); if (await forward.count() && !await forward.isDisabled()) { await forward.click(); await settle(); } }
    assert.deepEqual(await state(), after);
  });
  await test('Board movement and keyboard movement both warn before crossing the safe return margin', async () => {
    await boot('field-risk'); const before = await state();
    await clickSelector('[data-expedition-x="1"][data-expedition-y="3"]');
    assert.equal((await view()).sheet, 'expedition-risk-confirm'); assert.deepEqual(await state(), before);
    await click('nav-back');
    // Keyboard movement listens on the game; after Back the focus must stay there for the arrow keys to work.
    const focusAfterBack = await page.evaluate(() => document.getElementById('orbit-game').contains(document.activeElement) ? null : document.activeElement.tagName);
    if (focusAfterBack) await page.locator('.og-tabs [data-tab="expedition"]').focus(); // keep verifying the keyboard warning itself
    await page.keyboard.press('ArrowUp'); await settle();
    assert.equal((await view()).sheet, 'expedition-risk-confirm'); assert.deepEqual(await state(), before);
    await click('nav-back'); assert.equal((await view()).sheet, null);
    assert.equal(focusAfterBack, null, 'Back from the risk warning drops keyboard focus out of the game (focus went to ' + focusAfterBack + '), so arrow keys stop moving the vehicle');
  });
  await test('Return to the ship follows a known route, charges its cost and preserves recovered cargo', async () => {
    await boot('field-cargo'); const before = await state();
    const p = await page.evaluate(() => OrbitEngine.preview(orbitApp.getState(), 'expeditionReturn'));
    assert.equal(p.allowed, true, p.reason); assert.ok(before.expedition.pending.ore > 0);
    await click('expedition-return'); assert.equal((await view()).sheet, 'expedition-return-menu'); assert.deepEqual(await state(), before);
    await auditPages('Return confirmation'); await click('expeditionReturn');
    const after = await state(); assert.equal(after.expedition.x, 2); assert.equal(after.expedition.y, 5);
    assert.equal(after.expedition.reserve, before.expedition.reserve - p.cost.reserve);
    assert.deepEqual(after.expedition.pending, before.expedition.pending);
    assert.deepEqual(after.inventory, before.inventory);
    await snap('cargo-returned-to-base'); await click('expeditionExtract');
    const extracted = await state(); assert.equal(extracted.expedition, null); assert.equal(extracted.resources.ore, before.resources.ore + before.expedition.pending.ore);
  });
  await test('Insufficient-energy return is explained and evacuation never occurs without confirmation', async () => {
    await boot('field-empty'); const before = await state();
    const p = await page.evaluate(() => OrbitEngine.preview(orbitApp.getState(), 'expeditionReturn'));
    assert.equal(p.allowed, false); await click('expedition-return');
    assert.equal(await page.locator('[data-action="expeditionReturn"]:visible').isDisabled(), true);
    assert.match(await page.getByRole('dialog').innerText(), /energia|reserva/i); assert.deepEqual(await state(), before);
    await close(); await click('expedition-abort-menu'); assert.deepEqual(await state(), before);
    await auditPages('Evacuation confirmation'); await snap('explicit-empty-energy-state');
  });
  await test('No browser runtime errors', async () => assert.deepEqual(errors, []));
  const report = { results, errors, passed: results.every(result => result.pass) };
  fs.writeFileSync(path.join(out, process.env.QA_FILTER ? 'targeted-report.json' : 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
