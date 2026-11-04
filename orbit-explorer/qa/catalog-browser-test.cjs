/* Discovery-catalog acceptance: real scans/jumps, touch navigation and fixed screens. */
const { chromium } = require('./node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Save = require('./save-slot.cjs');

const out = path.join(__dirname, 'catalog-artifacts');
const gameURL = process.env.QA_URL || 'file://' + path.resolve(__dirname, '../index.html');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(6000);
  const results = [], errors = [];
  const listen = p => {
    p.on('pageerror', error => errors.push(error.message));
    p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  listen(page);
  const state = () => page.evaluate(() => orbitApp.getState());
  const view = () => page.evaluate(() => orbitApp.getView());
  const survey = () => page.evaluate(() => OrbitEngine.discoveryCatalog(orbitApp.getState()));
  const settle = () => page.waitForTimeout(130);
  const snap = async name => { await settle(); await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true }); };
  async function test(name, fn) {
    if (process.env.QA_FILTER && !new RegExp(process.env.QA_FILTER, 'i').test(name)) return;
    try { await fn(); results.push({ name, pass: true }); console.log('PASS', name); }
    catch (error) { results.push({ name, pass: false, error: error.message }); console.log('FAIL', name, error.message); await snap('failure-' + results.length).catch(() => {}); }
  }
  async function boot(mode = 'new') {
    await page.goto(gameURL);
    await page.waitForFunction(() => window.orbitApp && window.OrbitEngine?.discoveryCatalog && window.OrbitDiscoveryCatalog);
    // A first visit opens the illustrated intro and the guided training; leave both before injecting the fixture.
    if (await page.locator('[data-story-action="skip"]:visible').count()) await page.locator('[data-story-action="skip"]').click();
    if (await page.locator('[data-guide-skip]:visible').count()) await page.locator('[data-guide-skip]').click();
    await Save.load(page, await page.evaluate(mode => {
      const E = OrbitEngine, s = E.create('qa-celestial-catalog');
      const run = (action, payload = {}) => {
        const result = E.dispatch(s, action, payload);
        if (!result.ok) throw new Error('Fixture ' + action + ': ' + result.message);
      };
      // A new game starts in the guided Prisma training; these fixtures exercise the free campaign that follows it.
      run('guideSkip');
      // The campaign holds each warp until that chapter's module is built. These catalog fixtures defer the
      // campaign to a far galaxy (a valid state) so ordinary routes stay open for archive coverage.
      s.campaign.start = 64; s.campaign.target = null;
      if (mode !== 'new') run('scan');
      if (mode === 'two-known') {
        const start = s.location.planetId, other = s.galaxy.planets.find(p => p.systemId === E.currentSystem(s).id && p.id !== start);
        run('travel', { planetId: other.id }); run('scan'); run('travel', { planetId: start });
      }
      if (mode === 'archived') {
        for (let i = 0; i < 7; i++) {
          s.resources.warpFuel = E.stats(s).maxWarpFuel;
          run('warp', { destinationId: E.destinations(s)[i % 3].id }); run('scan');
        }
      }
      s.resources.warpFuel = E.stats(s).maxWarpFuel;
      if (!E.validate(s)) throw new Error('Invalid discovery fixture');
      return {
        state: E.snapshot(s), tab: 'explore', selected: s.location.planetId,
        shipDetail: { mode: 'exterior' },
        mapLevel: 'system', catalogView: { page: 'systems', systemId: null }
      };
    }, mode));
    await settle();
  }
  async function clickSelector(selector) {
    const live = () => page.locator(selector + ':visible:not([inert] *)').first();
    if (await live().count()) { await live().click(); await settle(); return; }
    const previous = page.locator('[data-sheet-page="-1"]:visible');
    for (let i = 0; i < 80 && await previous.count() && !await previous.isDisabled(); i++) { await previous.click(); await settle(); }
    for (let i = 0; i < 80; i++) {
      if (await live().count()) { await live().click(); await settle(); return; }
      const next = page.locator('[data-sheet-page="1"]:visible');
      if (!await next.count() || await next.isDisabled()) break;
      await next.click(); await settle();
    }
    throw new Error('Control unreachable by pagination: ' + selector);
  }
  const click = action => clickSelector(`[data-action="${action}"]`);
  async function close() { if (await page.getByRole('dialog').count()) await click('close-sheet'); }
  async function tab(name) { await close(); await clickSelector(`.og-tabs [data-tab="${name}"]`); }
  async function catalog() {
    await close(); await tab('galaxy'); await click('catalog');
    await clickSelector('[data-catalog-page="systems"]');
    assert.equal((await view()).sheet, 'catalog');
  }
  async function geometry(label) {
    const d = await page.evaluate(() => {
      const root = document.getElementById('orbit-game'), box = root.getBoundingClientRect();
      const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden], [inert]');
      const content = root.querySelector('.og-sheet-content'), cb = content?.getBoundingClientRect();
      const scrolling = [...document.querySelectorAll('body,#orbit-game,#orbit-game *')].filter(visible).filter(e => {
        if (e.classList.contains('og-sr-only')) return false;
        const css = getComputedStyle(e);
        return /auto|scroll/.test(css.overflowY) && e.scrollHeight > e.clientHeight + 2 || /auto|scroll/.test(css.overflowX) && e.scrollWidth > e.clientWidth + 2;
      }).map(e => ({ id: e.id, className: e.className }));
      const clipped = [...root.querySelectorAll('button,select,input,.og-sheet-content p,.og-sheet-content h3,.og-catalog-counts,.og-catalog-progress,.og-catalog-card-title')].filter(visible).flatMap(e => {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height) return [];
        const top = Math.max(box.top, 0, e.closest('.og-sheet-content') && cb ? cb.top : 0);
        const bottom = Math.min(box.bottom, innerHeight, e.closest('.og-sheet-content') && cb ? cb.bottom : innerHeight);
        return r.left < Math.max(0, box.left) - 2 || r.right > Math.min(innerWidth, box.right) + 2 || r.top < top - 2 || r.bottom > bottom + 2 ? [{ text: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 90), rect: [r.x, r.y, r.width, r.height], bounds: [top, bottom] }] : [];
      });
      return { viewport: [innerWidth, innerHeight], document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], scrolling, clipped, contentOverflow: !!content && visible(content) && content.scrollHeight > content.clientHeight + 2 };
    });
    assert.ok(d.document[0] <= d.viewport[0] + 1 && d.document[1] <= d.viewport[1] + 1, label + ': document overflow ' + JSON.stringify(d));
    assert.deepEqual(d.scrolling, [], label + ': scrolling areas');
    assert.deepEqual(d.clipped, [], label + ': clipped controls or text');
    assert.equal(d.contentOverflow, false, label + ': unpaginated content');
  }
  async function auditPages(label) {
    const text = [], previous = page.locator('[data-sheet-page="-1"]:visible');
    for (let i = 0; i < 80 && await previous.count() && !await previous.isDisabled(); i++) { await previous.click(); await settle(); }
    for (let i = 0; i < 80; i++) {
      await geometry(label + ' page ' + (i + 1));
      text.push(await page.getByRole('dialog').innerText());
      const next = page.locator('[data-sheet-page="1"]:visible');
      if (!await next.count() || await next.isDisabled()) return text.join('\n');
      await next.click(); await settle();
    }
    throw new Error('Unbounded pagination: ' + label);
  }
  const assertHiddenNames = (text, planets) => {
    for (const planet of planets.filter(p => !p.scanned)) assert.ok(!text.includes(planet.name), 'Unanalyzed name leaked: ' + planet.name);
  };

  // The atlas shows one world per card; a picker (data-atlas-select="recordIndex") chooses which world of the system is shown.
  async function showWorld(systemId, planetId) {
    const index = (await survey()).current.systems.find(system => system.id === systemId).planets.findIndex(p => p.id === planetId);
    assert.ok(index >= 0, 'World listed in its system: ' + planetId);
    await page.locator('[data-atlas-select="recordIndex"]:visible').selectOption(String(index)); await settle();
  }

  await test('Catalog is reachable from the menu and map, with unknown worlds grouped without names', async () => {
    await boot(); const s = await state(), before = await survey();
    assert.equal(before.current.unknown, s.galaxy.planets.length);
    assert.equal(before.current.discovered, 0); assert.equal(before.current.percent, 0);
    await click('menu'); await click('catalog');
    assert.equal((await view()).sheet, 'catalog');
    let text = await auditPages('Initial catalog');
    assert.match(text, /0\/\d+ descobertos/i); assert.match(text, /0%/); assertHiddenNames(text, s.galaxy.planets);
    for (const system of s.galaxy.systems) {
      assert.ok(text.includes(system.name), 'System card reachable: ' + system.name);
      await clickSelector(`[data-catalog-system="${system.id}"]`);
      const systemText = await auditPages('Unknown system');
      assert.match(systemText, /Mundo desconhecido/); assertHiddenNames(systemText, s.galaxy.planets);
      await clickSelector('[data-catalog-page="systems"]');
    }
    await catalog(); assert.deepEqual(await state(), s, 'Browsing never mutates game progress');
    await snap('initial-catalog');
  });

  // Back/forward used to be a linear history across places; navigation is now hierarchical (a route to the map closes
  // the catalog and Back leads to the world, see final-navigation-test), so these checks cover the route itself.
  await test('A real orbital scan registers a named discovery without claiming site completion', async () => {
    await boot(); const before = await survey(), s = await state();
    await click('scan'); const after = await survey();
    assert.equal(after.current.discovered, before.current.discovered + 1);
    assert.equal(after.current.unknown, before.current.unknown - 1);
    assert.equal(after.current.completedSites, 0); assert.equal(after.current.percent, 0);
    await catalog(); await clickSelector(`[data-catalog-system="${s.galaxy.systems[0].id}"]`);
    const text = await auditPages('Discovered system');
    assert.ok(text.includes(s.galaxy.planets[0].name));
    assertHiddenNames(text, (await state()).galaxy.planets);
    await showWorld(s.galaxy.systems[0].id, s.location.planetId);
    const afterScan = await state();
    await clickSelector(`[data-catalog-planet="${s.location.planetId}"]`);
    assert.equal((await view()).tab, 'explore'); assert.equal((await view()).sheet, null);
    assert.deepEqual(await state(), afterScan, 'Opening the current world from the catalog changes nothing');
    await snap('discovered-world');
  });

  await test('Catalog routes preserve resources and open the selected world on the system map', async () => {
    await boot('two-known'); const s = await state(), other = s.galaxy.planets.find(p => p.scanned && p.id !== s.location.planetId);
    await catalog(); await clickSelector(`[data-catalog-system="${other.systemId}"]`);
    await showWorld(other.systemId, other.id);
    assert.ok((await page.getByRole('dialog').innerText()).includes(other.name), 'The picked world card is shown');
    await clickSelector(`[data-catalog-planet="${other.id}"]`);
    const routeView = await view();
    assert.equal(routeView.tab, 'galaxy'); assert.equal(routeView.sheet, null); assert.equal(routeView.selected, other.id);
    assert.equal(routeView.mapLevel, 'system'); assert.equal(routeView.selectedSystem, other.systemId);
    assert.ok((await page.locator('#og-context').innerText()).includes(other.name), 'Map context names the routed world');
    assert.deepEqual(await state(), s, 'Route selection does not travel or scan');
    assert.equal(await page.evaluate(() => orbitApp.back()), true); assert.equal((await view()).tab, 'explore', 'Back from the map returns to the world');
    assert.deepEqual(await state(), s);
    await snap('catalog-route-back');
  });

  await test('Every catalog card remains reachable without scrolling at 320×568 and 390×844', async () => {
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport); await boot('archived'); const s = await state(), record = await survey();
      await catalog(); const systemsText = await auditPages('Systems ' + viewport.width);
      for (const system of s.galaxy.systems) assert.ok(systemsText.includes(system.name), 'System reachable at ' + viewport.width);
      await clickSelector(`[data-catalog-system="${s.galaxy.systems[0].id}"]`);
      const planetsText = await auditPages('Worlds ' + viewport.width);
      for (const planet of s.galaxy.planets.filter(p => p.scanned)) assert.ok(planetsText.includes(planet.name));
      assertHiddenNames(planetsText, s.galaxy.planets);
      await snap('system-' + viewport.width + 'x' + viewport.height);
      await clickSelector('[data-catalog-page="systems"]'); await clickSelector('[data-catalog-page="galaxies"]');
      const galaxiesText = await auditPages('Archives ' + viewport.width);
      for (const galaxy of [record.current, ...record.archives]) assert.ok(galaxiesText.includes(galaxy.name), 'Archive reachable: ' + galaxy.name);
      await snap('archives-' + viewport.width + 'x' + viewport.height);
    }
  });

  await test('Unvisited galaxy routes reveal neither planetary names nor system names or environmental promises', async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await boot('scanned');
    const futures = await page.evaluate(() => {
      const E = OrbitEngine, s = orbitApp.getState();
      return E.destinations(s).map(route => {
        const branch = E.restore(E.snapshot(s)); branch.resources.warpFuel = E.stats(branch).maxWarpFuel;
        const result = E.dispatch(branch, 'warp', { destinationId: route.id });
        if (!result.ok) throw new Error(result.message);
        return { route, planets: branch.galaxy.planets.map(p => p.name), systems: branch.galaxy.systems.map(system => system.name) };
      });
    });
    const before = await state(); await tab('galaxy'); await clickSelector('[data-map-level="universe"]');
    for (const future of futures) {
      for (const key of ['planets', 'systems', 'totalPlanets', 'totalSites', 'survey', 'temperature', 'radiation', 'pressure']) assert.equal(Object.hasOwn(future.route, key), false, 'Future metadata leaked: ' + key);
      await clickSelector(`[data-destination="${future.route.id}"]`);
      const mapText = await page.locator('#orbit-game').innerText();
      assert.equal(await page.locator('[data-select]:visible,[data-system]:visible').count(), 0);
      await click('warp-menu'); const jumpText = await auditPages('Unknown destination');
      for (const name of [...future.planets, ...future.systems]) assert.ok(!mapText.includes(name) && !jumpText.includes(name), 'Future celestial name leaked: ' + name);
      assert.doesNotMatch(future.route.description + jumpText, /oceanos|florestas|pulsares|mundos ígneos|gigantes azuis|mares profundos|calor extremo/i);
      await close();
    }
    assert.deepEqual(await state(), before); await snap('unknown-galaxy-route');
  });

  await test('A real warp reveals a new catalog and preserves the previous discovery record', async () => {
    await boot('scanned'); const prior = await survey(), before = await state();
    await tab('galaxy'); await clickSelector('[data-map-level="universe"]');
    const route = await page.evaluate(() => OrbitEngine.destinations(orbitApp.getState())[0]);
    await clickSelector(`[data-destination="${route.id}"]`); await click('warp-menu'); await click('warp');
    const s = await state(), after = await survey();
    assert.equal(s.galaxy.name, route.name); assert.equal(after.current.discovered, 0); assert.equal(after.current.percent, 0);
    assert.equal(after.current.unknown, after.current.totalPlanets); assert.equal(after.archives.length, 1);
    assert.equal(after.archives[0].name, prior.current.name);
    for (const key of ['discovered', 'completed', 'completedSites', 'totalSites', 'percent']) assert.equal(after.archives[0][key], prior.current[key], 'Archived field ' + key);
    assert.equal(before.resources.warpFuel - s.resources.warpFuel, route.warpCost);
    await catalog(); const text = await auditPages('New galaxy');
    for (const system of s.galaxy.systems) assert.ok(text.includes(system.name), 'New system appears after arrival');
    assertHiddenNames(text, s.galaxy.planets);
    await clickSelector('[data-catalog-page="galaxies"]'); const archiveText = await auditPages('Previous galaxy record');
    assert.ok(archiveText.includes(prior.current.name)); assert.ok(archiveText.includes(after.current.name));
    await snap('arrived-and-archived');
  });

  await test('Save and reload retain names, catalog counts and archived discoveries within 16 KiB', async () => {
    await boot('archived'); await catalog(); await clickSelector('[data-catalog-page="galaxies"]');
    const before = await state(), beforeSurvey = await survey();
    const saved = await Save.last(page);
    assert.ok(saved?.privateContent?.state, 'Game saved the journey');
    const bytes = Buffer.byteLength(JSON.stringify(saved), 'utf8');
    assert.ok(bytes < 16384, 'Save is ' + bytes + ' bytes');
    const fresh = await browser.newPage({ viewport: { width: 390, height: 844 } }); listen(fresh);
    try {
      await Save.seed(fresh, saved);
      await fresh.goto(gameURL); await fresh.waitForFunction(() => window.orbitApp && window.OrbitEngine?.discoveryCatalog);
      assert.deepEqual(await fresh.evaluate(() => orbitApp.getState()), before);
      assert.deepEqual(await fresh.evaluate(() => OrbitEngine.discoveryCatalog(orbitApp.getState())), beforeSurvey);
      await fresh.reload(); await fresh.waitForFunction(() => window.orbitApp);
      assert.deepEqual(await fresh.evaluate(() => OrbitEngine.discoveryCatalog(orbitApp.getState())), beforeSurvey);
      fs.writeFileSync(path.join(out, 'save-size.json'), JSON.stringify({ bytes, limit: 16384, archivedGalaxies: beforeSurvey.archives.length }, null, 2));
    } finally { await fresh.close(); }
  });

  await test('No browser runtime errors', async () => assert.deepEqual(errors, []));
  const report = { results, errors, passed: results.length > 0 && results.every(item => item.pass) };
  fs.writeFileSync(path.join(out, process.env.QA_FILTER ? 'targeted-report.json' : 'report.json'), JSON.stringify(report, null, 2));
  await browser.close(); process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
