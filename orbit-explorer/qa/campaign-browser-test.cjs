'use strict';
const { chromium } = require('./node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { solveCounts } = require('./expedition-helpers.cjs');
// Like expedition-helpers' completeTutorialExpedition, but adventure sites now require triangulating the signal at
// both terrain beacons (rows 4 and 2 of the tutorial column) before the core circuit opens. Drives visible controls.
async function completeTutorialExpedition(page) {
  const act = action => page.locator(`[data-action="${action}"]:visible`).first().click();
  const move = (x, y) => page.locator(`[data-expedition-x="${x}"][data-expedition-y="${y}"]:visible`).click();
  const before = await page.evaluate(() => orbitApp.getState());
  assert.ok(before.expedition?.firstExpedition, 'Helper only handles the first expedition');
  assert.equal(before.expedition.x, 2); assert.equal(before.expedition.y, 5);
  for (let y = 4; y >= 0; --y) { await move(2, y); if (y === 4 || y === 2) await act('expeditionBeacon'); }
  assert.equal(await page.evaluate(() => orbitApp.getState().expedition.beacons.length), 2, 'Both beacons triangulated');
  await move(3, 0); await act('expeditionInteract');
  const puzzle = await page.evaluate(() => orbitApp.getState().expedition.puzzle);
  const counts = solveCounts(puzzle.dials, puzzle.target);
  for (let i = 0; i < 3; i++) for (let n = 0; n < counts[i]; n++) await page.locator(`[data-action="expeditionTune"][data-index="${i}"]:visible`).click();
  await act('expeditionRecover');
  const recovered = await page.evaluate(() => orbitApp.getState());
  assert.ok(recovered.expedition.coreRecovered);
  assert.deepEqual(recovered.inventory, before.inventory, 'Recovered gear is pending until extraction');
  await move(2, 0); for (let y = 1; y <= 5; y++) await move(2, y);
  await act('expeditionExtract');
  const after = await page.evaluate(() => orbitApp.getState());
  assert.equal(after.expedition, null);
  assert.equal(after.progress.explorations, before.progress.explorations + 1);
}
const Legacy = require('../engine.js');
const H = require('../expedition-test-helper.cjs');
const out = path.join(__dirname, 'campaign-artifacts');
const url = process.env.ORBIT_QA_URL || 'http://localhost:8765/?mobile=1&v=coro-do-limiar';
fs.mkdirSync(out, { recursive: true });

async function captureHost(page, privateContent) {
  await page.addInitScript(snapshot => {
    window.__campaignSnapshots = [];
    window.openai = {
      ...(snapshot ? { widgetState: { privateContent: snapshot } } : {}),
      setWidgetState(value) { window.__campaignSnapshots.push(JSON.parse(JSON.stringify(value))); return Promise.resolve(); }
    };
  }, privateContent);
}
async function click(page, selector) {
  for (let count = 0; count < 20; count++) {
    const match = page.locator(selector + ':visible:not([inert] *)').first();
    if (await match.count()) { await match.click(); return; }
    const next = page.locator('[data-sheet-page="1"]:visible:not(:disabled)');
    if (!await next.count()) throw Error('Control not reachable: ' + selector);
    await next.click();
  }
  throw Error('Too many content pages for ' + selector);
}
async function fits(page, label) {
  await page.waitForTimeout(100);
  const layout = await page.evaluate(() => {
    const root = document.getElementById('orbit-game'), bounds = root.getBoundingClientRect();
    const content = root.querySelector('.og-sheet-content');
    const body = content?.querySelector('.og-page-body:not([hidden])');
    const badControls = [...root.querySelectorAll('button')].filter(el => {
      if (el.closest('[hidden],[inert]')) return false;
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      if (!r.width || !r.height || style.visibility === 'hidden' || style.display === 'none') return false;
      return r.left < bounds.left - 2 || r.top < bounds.top - 2 || r.right > bounds.right + 2 || r.bottom > bounds.bottom + 2;
    }).map(el => el.getAttribute('aria-label') || el.textContent.trim());
    return {
      outerWidth: document.documentElement.scrollWidth, outerHeight: document.documentElement.scrollHeight,
      viewportWidth: innerWidth, viewportHeight: innerHeight,
      rootWidth: root.scrollWidth, clientWidth: root.clientWidth,
      pageHeight: body?.scrollHeight || 0, pageAvailable: content?.clientHeight || 0,
      badControls
    };
  });
  assert.ok(layout.outerWidth <= layout.viewportWidth + 2, label + ' horizontal overflow ' + JSON.stringify(layout));
  assert.ok(layout.outerHeight <= layout.viewportHeight + 2, label + ' page scroll ' + JSON.stringify(layout));
  assert.ok(layout.rootWidth <= layout.clientWidth + 2, label + ' game overflow');
  assert.ok(layout.pageHeight <= layout.pageAvailable + 2, label + ' content overflow ' + JSON.stringify(layout));
  assert.deepEqual(layout.badControls, [], label + ' clipped controls');
}
async function assertSavedSize(page) {
  const saved = await page.evaluate(() => window.__campaignSnapshots.at(-1));
  assert.ok(saved, 'Interaction must save a host snapshot');
  const bytes = Buffer.byteLength(JSON.stringify(saved), 'utf8');
  assert.ok(bytes < 16384, 'Host snapshot exceeds 16 KiB: ' + bytes);
  return bytes;
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errors = [], checks = [];
  try {
    for (const [width, height] of [[390, 844], [320, 568]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await captureHost(page);
      await page.goto(url);
      await page.waitForFunction(() => window.orbitApp && window.OrbitEngine?.campaignView);
      await page.locator('.og-story-clip:visible').waitFor();
      const resources = await page.evaluate(() => orbitApp.getState().resources);
      await fits(page, 'intro ' + width);
      const firstScene = await page.locator('.og-story-clip').innerText();
      await click(page, '[data-story-action=next]');
      assert.notEqual(await page.locator('.og-story-clip').innerText(), firstScene, 'The next scene changes the narrative');
      await fits(page, 'second intro scene ' + width);
      await page.screenshot({ path: path.join(out, 'intro-' + width + '.png') });
      await click(page, '[data-story-action=skip]');
      assert.equal(await page.locator('.og-story-clip:visible').count(), 0, 'Intro closes');
      assert.deepEqual(await page.evaluate(() => orbitApp.getState().resources), resources, 'Intro must not consume or grant gameplay resources');
      assert.equal(await page.evaluate(() => OrbitEngine.campaignView(orbitApp.getState()).introSeen), true);
      const introBytes = await assertSavedSize(page);
      await page.reload();
      await page.waitForFunction(() => window.orbitApp);
      assert.equal(await page.locator('.og-story-clip:visible').count(), 0, 'Skipped intro stays skipped after reload');
      // A new game now also starts the guided Prisma training; skip it to reach the real campaign start.
      await page.locator('[data-guide-skip]').click();
      assert.equal(await page.evaluate(() => orbitApp.getState().guide.active), false, 'Guide skipped');
      assert.equal(await page.evaluate(() => OrbitEngine.campaignView(orbitApp.getState()).introSeen), true, 'Skipping the guide keeps the intro seen');

      await page.locator('.og-tabs [data-tab=expedition]').click();
      await fits(page, 'mission tab ' + width);
      await click(page, '[data-action=campaign]');
      for (const section of ['mission', 'collection', 'gate']) {
        await page.locator('[data-campaign-select]').selectOption(section);
        assert.equal(await page.evaluate(() => orbitApp.getView().campaignPage), section);
        await fits(page, section + ' ' + width);
        await page.screenshot({ path: path.join(out, section + '-' + width + '.png') });
      }
      const blocked = await page.evaluate(() => {
        const state = orbitApp.getState(), recipe = OrbitEngine.recipes.find(item => item.mission);
        return { recipe: OrbitEngine.preview(state, 'campaignCraft', { recipeId: recipe.id }), gate: OrbitEngine.preview(state, 'campaignCross'), campaign: OrbitEngine.campaignView(state) };
      });
      assert.equal(blocked.recipe.allowed, false, 'Mission recipes remain locked');
      assert.equal(blocked.gate.allowed, false, 'Gate requires the complete equipped set');
      assert.equal(blocked.campaign.resistance, 0);
      await click(page, '[data-action=close-sheet]');

      await page.locator('.og-tabs [data-tab=explore]').click();
      // Scanning opens the descent sheet; descending (explore) anchors the ship.
      await click(page, '[data-action=scan]');
      assert.equal(await page.evaluate(() => orbitApp.getView().sheet), 'sites');
      await click(page, '[data-action=explore][data-site="g0-p0-s0"]');
      const before = await page.evaluate(() => OrbitEngine.campaignView(orbitApp.getState()).active.sitesDone);
      assert.equal(before, 0, 'Starting a sortie gives no campaign credit');
      await completeTutorialExpedition(page);
      assert.equal(await page.evaluate(() => OrbitEngine.campaignView(orbitApp.getState()).active.sitesDone), 1, 'Only successful core extraction advances the mission');
      const after = await page.evaluate(() => orbitApp.getState());
      const bytes = await assertSavedSize(page);
      await page.reload();
      await page.waitForFunction(() => window.orbitApp);
      assert.deepEqual(await page.evaluate(() => orbitApp.getState()), after, 'Full campaign/expedition result survives reload');
      checks.push({ viewport: width + 'x' + height, introSkipped: true, missionPagesFit: true, realCoreExtraction: true, introSnapshotBytes: introBytes, snapshotBytes: bytes });
      await context.close();
    }

    // The fixture predates campaign.js and includes a running expedition. Migration
    // must add the story without resetting any existing user-owned gameplay data.
    const legacy = Legacy.create('campaign-legacy-browser');
    legacy.ship.name = 'Travessia Antiga';
    H.start(legacy);
    H.checkedAct(legacy, 'expeditionMove', { x: 2, y: 4 });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await captureHost(page, { state: Legacy.snapshot(legacy), tab: 'expedition', selected: legacy.location.planetId });
    await page.goto(url); await page.waitForFunction(() => window.orbitApp);
    const restored = await page.evaluate(() => orbitApp.getState());
    for (const key of ['ship', 'resources', 'equipped', 'inventory', 'progress', 'expedition']) assert.deepEqual(restored[key], legacy[key], 'Existing save retains ' + key);
    if (await page.locator('[data-story-action=skip]:visible').count()) await click(page, '[data-story-action=skip]');
    assert.equal(await page.evaluate(() => orbitApp.getView().tab), 'expedition');
    await fits(page, 'migrated active expedition');
    checks.push({ oldSaveWithExpeditionPreserved: true });
    await context.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'browser-report.json'), JSON.stringify({ passed: true, checks, errors }, null, 2));
    console.log('PASS campaign intro, skip/reload, mobile mission screens, locked recipes/gate, actual core extraction, host snapshot size and legacy expedition migration');
  } catch (error) {
    fs.writeFileSync(path.join(out, 'browser-report.json'), JSON.stringify({ passed: false, checks, errors, failure: error.message }, null, 2));
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
