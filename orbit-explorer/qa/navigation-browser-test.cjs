/* Fixed-screen navigation and expedition safety acceptance tests.
   Fixtures preserve actual game actions; only reserves are reduced to exercise warnings. */
const { chromium } = require('./node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
    await page.evaluate(mode => {
      const E = OrbitEngine, s = E.create('qa-fixed-screen-navigation');
      const dispatch = (action, payload = {}) => { const result = E.dispatch(s, action, payload); if (!result.ok) throw new Error(action + ': ' + result.message); return result; };
      if (mode !== 'vanilla' && !mode.startsWith('field')) Object.assign(s.resources, { ore: 500, crystals: 200, credits: 900, data: 500 });
      if (mode === 'rich' || mode === 'inventory') {
        for (const r of E.componentRecipes) s.components[r.id] = 25;
        for (const id of ['thermal-shield', 'radiation-mesh']) dispatch('fabricate', { recipeId: id });
        dispatch('equip', { moduleId: s.inventory.find(m => m.recipeId === 'thermal-shield').id });
        if (mode === 'inventory') {
          for (const recipe of E.recipes) {
            if (s.inventory.length >= E.stats(s).cargoCapacity) break;
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
      if (!E.validate(s)) throw new Error('Invalid QA fixture');
      window.dispatchEvent(new CustomEvent('openai:set_globals', { detail: { globals: { widgetState: { privateContent: { state: E.snapshot(s), tab: mode.startsWith('field') ? 'expedition' : 'explore', selected: s.location.planetId, shipDetail: { mode: 'exterior', selectedModule: null, expanded: false } } } } } }));
    }, mode);
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
  async function inspect(type) { await tab('ship'); if ((await view()).shipDetail.mode === 'module') await click('ship-back'); if ((await view()).shipDetail.mode === 'exterior') await click('open-interior'); await page.locator(`[data-module-focus="${type}"]:visible`).first().waitFor(); await clickSelector(`[data-module-focus="${type}"]`); }
  async function lab() { await tab('ship'); await click('workshop'); await click('fabricator'); }

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

  await test('Module → laboratory → recipe → component supports exact back and forward navigation', async () => {
    await boot(); await inspect('shield');
    const before = await state();
    await click('system-lab'); await clickSelector('[data-lab-recipe="radiation-mesh"]'); await clickSelector('[data-lab-component="field-core"]');
    assert.equal((await view()).lab.componentId, 'field-core');
    await click('nav-back'); assert.equal((await view()).lab.recipeId, 'radiation-mesh');
    await click('nav-forward'); assert.equal((await view()).lab.componentId, 'field-core');
    assert.deepEqual(await state(), before, 'Navigation never fabricates or spends materials');
    await click('nav-back'); await click('nav-back'); await click('nav-back');
    assert.equal((await view()).sheet, 'system-module'); assert.equal((await view()).systemType, 'shield');
    await snap('module-navigation-return');
    await close(); assert.equal((await view()).sheet, null); assert.equal((await view()).tab, 'ship');
    await geometry('Ship after closing details');
  });
  await test('Forward navigation after crafting never repeats the transaction', async () => {
    await boot('lab'); await lab(); await clickSelector('[data-lab-type="shield"]'); await clickSelector('[data-lab-recipe="thermal-shield"]'); await clickSelector('[data-lab-component="alloy"]');
    await clickSelector('[data-action="craftComponent"][data-component="alloy"]:not([data-lab-return])');
    const after = await state(); assert.equal(after.components.alloy, 1);
    await click('nav-back'); await click('nav-forward');
    assert.deepEqual(await state(), after);
  });
  await test('Selected comparison returns intact and cancel never replaces installed hardware', async () => {
    await boot(); await inspect('shield');
    const candidate = (await state()).inventory.find(m => m.recipeId === 'radiation-mesh').id;
    await clickSelector('#og-module-choice');
    await page.locator('#og-module-choice').selectOption(candidate); await settle();
    const before = await state();
    await click('system-lab'); await click('nav-back');
    assert.equal((await view()).selectedCandidateId, candidate);
    await close(); assert.deepEqual(await state(), before);
  });
  await test('Module details return directly to the open ship for another selection, including cancel and Escape', async () => {
    await page.setViewportSize({width:320,height:568}); await boot();
    for (const exit of ['back','close','cancel','escape']) {
      await inspect('shield');
      const candidate=(await state()).inventory.find(m=>m.recipeId==='radiation-mesh').id;
      await page.locator('#og-module-choice').selectOption(candidate); await settle();
      const before=await state();
      assert.match(await page.locator('.og-panel-navigation [data-action="nav-back"]').innerText(),/Nave aberta/);
      if(exit==='escape')await page.keyboard.press('Escape');
      else if(exit==='cancel')await page.locator('.og-sheet-footer [data-action="close-sheet"]').click();
      else await click(exit==='back'?'nav-back':'close-sheet');
      await page.waitForFunction(()=>orbitApp.getView().shipDetail.mode==='interior'&&!orbitApp.getView().sheet);
      await page.waitForFunction(()=>[...document.querySelectorAll('.og-module-hotspot')].filter(b=>getComputedStyle(b).visibility==='visible').length===8);
      assert.equal((await view()).shipDetail.selectedModule,null);
      assert.deepEqual(await state(),before,'Returning never installs a candidate or spends resources');
      await clickSelector('[data-module-focus="life"]');
      assert.equal((await view()).systemType,'life');
      await close();
    }
    await inspect('cargo'); await click('inspect-module');
    assert.equal((await view()).sheet,null);assert.equal((await view()).shipDetail.selectedModule,'cargo');
    await click('toggle-module');assert.equal((await view()).shipDetail.expanded,true);
    await click('ship-back');assert.equal((await view()).shipDetail.mode,'interior');
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
    const help = await auditPages('Long help'); assert.ok(help.join('\n').includes('Farol'), 'Last help section remains reachable');
    assert.ok(help.length > 1, 'Long help is paginated');
    await tab('ship'); await click('modules');
    const inventory = await auditPages('Full inventory');
    for (const module of (await state()).inventory) assert.ok(inventory.join('\n').includes(module.name), 'Reachable module: ' + module.name);
    await snap('inventory-fixed-pages');
    await close(); await click('workshop'); await auditPages('Workshop');
    await tab('explore'); await click('scan'); await click('environment'); await auditPages('Environment');
    await close(); await click('dock'); await click('sites'); const sites = await auditPages('Planet sites');
    for (const site of (await page.evaluate(() => OrbitEngine.currentPlanet(orbitApp.getState()).sites))) assert.ok(sites.join('\n').includes(site.name), 'Reachable site: ' + site.name);
  });
  await test('Physical module controls remain separate and reachable in the fixed ship interior', async () => {
    for (const [width,height] of [[320,568],[390,700],[390,844],[736,900]]) {
      await page.setViewportSize({ width,height }); await boot(); await tab('ship'); await click('open-interior');
      await page.evaluate(() => {
        const publish = OrbitScene.prototype.publishHotspots;
        OrbitScene.prototype.publishHotspots = function(points) { window.qaShipPoints = points; publish.call(this, points); };
      });
      await page.locator('[data-module-focus="shield"]:visible').waitFor(); await page.waitForTimeout(1000);
      const overlaps = await page.locator('.og-module-hotspot:visible').evaluateAll(nodes => {
        const overlaps = [];
        for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
          const a=nodes[i].getBoundingClientRect(), b=nodes[j].getBoundingClientRect();
          if (Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1) overlaps.push([nodes[i].textContent,nodes[j].textContent]);
        }
        return overlaps;
      });
      assert.equal(await page.locator('.og-module-hotspot:visible').count(),8);
      assert.deepEqual(overlaps,[],`${width}×${height} module targets overlap`);
      async function verifyLinks() {
        const labels = await page.evaluate(() => {
          const stage = document.getElementById('og-stage').getBoundingClientRect();
          const top = document.getElementById('og-heading').getBoundingClientRect().bottom, bottom = document.getElementById('og-context').getBoundingClientRect().top;
          return window.qaShipPoints.map(point => {
            const node = document.querySelector(`[data-module-focus="${point.type}"]`), rect = node.getBoundingClientRect(), dot = node.querySelector('i').getBoundingClientRect();
            return { type: point.type, side: node.dataset.side, height: rect.height, inside: rect.top >= top && rect.bottom <= bottom, displacement: Math.abs(point.y-point.anchorY), centerError: Math.hypot(rect.x+rect.width/2-stage.x-point.x,rect.y+rect.height/2-stage.y-point.y), connectorError: Math.hypot(dot.x+dot.width/2-stage.x-point.connectorX,dot.y+dot.height/2-stage.y-point.y) };
          });
        });
        for (const label of labels) {
          assert.equal(label.side,['scanner','arm','life','engine'].includes(label.type)?'left':'right',label.type+' matches its socket side');
          assert.ok(label.inside && label.height >= 44,label.type+' fits the usable stage and touch target');
          assert.ok(label.centerError < 1 && label.connectorError < 1,label.type+' shares its connector and hit target coordinates');
          assert.ok(label.displacement < 40,label.type+' stays near its socket');
        }
      }
      await verifyLinks();
      await geometry('Ship interior '+width+'×'+height); await snap(`ship-interior-${width}x${height}`);
      for (const type of ['scanner','survival','arm','cargo','life','shield','engine','warp']) {
        await clickSelector(`[data-module-focus="${type}"]`);
        assert.equal((await view()).shipDetail.selectedModule,type);
        assert.equal((await view()).sheet,'system-module');
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
  await test('Back returns to the exact inventory page and forward restores the candidate without equipping it', async () => {
    await boot('inventory'); await tab('ship'); await click('modules');
    const next = page.locator('[data-sheet-page="1"]:visible');
    assert.ok(await next.count()); await next.click(); await settle();
    for (let n = 0; n < 15 && !await page.locator('[data-action="compare-module"]:visible').count(); n++) { assert.equal(await next.isDisabled(), false); await next.click(); await settle(); }
    const marker = await page.locator('.og-page-status:visible').innerText();
    const control = page.locator('[data-action="compare-module"]:visible').first(), moduleId = await control.getAttribute('data-module');
    const before = await state(); await control.click(); await settle(); assert.equal((await view()).selectedCandidateId, moduleId);
    await click('nav-back'); assert.equal((await view()).sheet, 'modules'); assert.equal(await page.locator('.og-page-status:visible').innerText(), marker);
    await click('nav-forward'); assert.equal((await view()).selectedCandidateId, moduleId); assert.deepEqual(await state(), before);
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
    await click('nav-back'); await page.keyboard.press('ArrowUp'); await settle();
    assert.equal((await view()).sheet, 'expedition-risk-confirm'); assert.deepEqual(await state(), before);
    await click('nav-back'); assert.equal((await view()).sheet, null);
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
