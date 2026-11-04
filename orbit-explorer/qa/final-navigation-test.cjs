'use strict';

const {chromium} = require('./node_modules/playwright');
const assert = require('node:assert/strict');

const url = process.env.ORBITA_TEST_URL || 'http://localhost:8765/';
const results = [];
let browser;

async function scenario(viewport, name, run) {
  // Every scenario gets disposable browser storage. Never use the player's profile.
  const context = await browser.newContext({viewport, storageState: {cookies: [], origins: []}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(6000);
  const view = () => page.evaluate(() => orbitApp.getView());
  const record = label => results.push(`${viewport.width}: ${name}: ${label}`);
  async function click(selector) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const target = page.locator(`${selector}:visible`).first();
      if (await target.count()) {
        await target.click();
        return;
      }
      const next = page.locator('[data-sheet-page="1"]:visible:not(:disabled)');
      if (!await next.count()) {
        await target.waitFor({state: 'visible'});
        await target.click();
        return;
      }
      await next.click();
    }
    throw new Error(`Control not found after paging: ${selector}`);
  }
  const action = name => click(`[data-action="${name}"]`);
  async function expectSheet(sheet, label) {
    assert.equal((await view()).sheet, sheet, label);
    record(label);
  }
  async function back(sheet, label) {
    assert.equal(await page.evaluate(() => orbitApp.back()), true, `${label}: handled`);
    await expectSheet(sheet, label);
  }
  async function start() {
    await click('[data-story-action="skip"]');
    await click('[data-guide-skip]');
  }
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.orbitApp);
    await run({page, view, click, action, expectSheet, back, start, record});
    assert.deepEqual(errors, [], `${name}: no browser errors`);
  } finally {
    await context.close();
  }
}

(async () => {
  browser = await chromium.launch({
    executablePath: process.env.ORBITA_CHROME || '/usr/bin/google-chrome',
    args: ['--no-sandbox']
  });
  for (const viewport of [{width: 320, height: 568}, {width: 390, height: 844}]) {
    await scenario(viewport, 'card cancel and Android parents', async ({
      page, view, click, action, expectSheet, back, start, record
    }) => {
      assert.equal(await page.locator('.og-story-clip').count(), 1);
      const introView = await view();
      assert.equal(await page.evaluate(() => orbitApp.back()), true);
      assert.equal(await page.locator('.og-story-clip').count(), 1);
      assert.deepEqual(await view(), introView, 'back must not bypass the introduction');
      record('introduction consumes Android Back');
      await click('[data-story-action="skip"]');
      assert.equal(await page.evaluate(() => orbitApp.getState().guide.active), true);
      const tutorialView = await view();
      assert.equal(await page.evaluate(() => orbitApp.back()), true);
      assert.deepEqual(await view(), tutorialView, 'back must not bypass the tutorial');
      record('tutorial consumes Android Back without changing location');
      await click('[data-guide-skip]');

      await action('menu');
      await action('stock');
      await action('modules');
      await action('stored-module');
      const selected = (await view()).selectedCandidateId;
      await action('compare-module');
      await expectSheet('system-module', 'stored module opens comparison');
      await click('.og-system-confirm button.secondary');
      await expectSheet('stored-module', 'lower Cancel returns to the original card');
      assert.equal((await view()).selectedCandidateId, selected, 'cancel preserves selected module');
      await action('compare-module');
      await back('stored-module', 'Android Back matches comparison cancel');
      assert.equal((await view()).selectedCandidateId, selected);
      await back('modules', 'card returns to module inventory');
      const inventoryView = await view();
      await click('[data-inventory="equipped"]');
      await click('[data-module-focus="engine"]');
      await expectSheet('system-module', 'installed module opens from inventory');
      assert.equal((await view()).tab, inventoryView.tab, 'inventory inspection keeps underlying location');
      assert.deepEqual((await view()).shipDetail, inventoryView.shipDetail);
      await back('modules', 'installed module returns to inventory, not ship inspection');
      await back('stock', 'module inventory returns to stock');
      await back('menu', 'stock returns to menu');
      await back(null, 'menu closes to the game');
      assert.equal((await view()).tab, 'explore');
      assert.equal(await page.evaluate(() => orbitApp.back()), false, 'only root requests native exit');
      record('root allows Android exit confirmation');
    });

    await scenario(viewport, 'full recipe context', async ({
      page, view, click, action, expectSheet, back, start, record
    }) => {
      await start();
      await page.evaluate(() => {
        const state = orbitApp.getState();
        const capacity = OrbitEngine.stats(state).cargoCapacity;
        while (state.inventory.length < capacity) {
          state.inventory.push({
            ...state.equipped.engine,
            id: `navigation-fixture-${state.inventory.length}`,
            name: 'Motor reserva de teste',
            favorite: false
          });
        }
      });
      // Prime the old stock origin before opening inventory from the recipe.
      await action('menu');
      await action('stock');
      await action('modules');
      await click('.og-place-exit');
      await expectSheet('stock', 'stock origin was set');
      await click('.og-place-exit');
      await action('workshop');
      await action('fabricator');
      await click('[data-lab-type="engine"]');
      await click('.og-lab-recipe[data-lab-recipe]');
      const recipe = (await view()).lab;
      assert.equal(recipe.page, 'recipe');
      await click('.og-capacity-tools [data-action="modules"]');
      await expectSheet('modules', 'full recipe opens inventory to free capacity');
      await click('.og-place-exit');
      await expectSheet('fabricator', 'inventory returns to recipe, not stale stock origin');
      assert.deepEqual((await view()).lab, recipe, 'recipe selection and ingredient context preserved');
      record('capacity detour preserves the complete recipe context');

      const recipeView = await view();
      await click('.og-capacity-tools [data-module-focus="cargo"]');
      await expectSheet('system-module', 'recipe opens cargo inspection');
      assert.equal((await view()).systemType, 'cargo');
      assert.equal((await view()).tab, recipeView.tab, 'recipe inspection keeps underlying location');
      assert.deepEqual((await view()).shipDetail, recipeView.shipDetail);
      await click('.og-place-exit');
      await expectSheet('fabricator', 'cargo inspection returns directly to recipe');
      assert.deepEqual((await view()).lab, recipe);
      await click('.og-capacity-tools [data-module-focus="cargo"]');
      await back('fabricator', 'Android Back also returns cargo inspection to recipe');
      assert.deepEqual((await view()).lab, recipe);

      await click('.og-capacity-tools [data-action="modules"]');
      await action('stored-module');
      await back('modules', 'capacity inventory card returns to inventory');
      await back('fabricator', 'Android Back retains recipe origin after card inspection');
      assert.deepEqual((await view()).lab, recipe);
      await back('fabricator', 'recipe returns to its module category');
      assert.equal((await view()).lab.page, 'type');
      await back('fabricator', 'module category returns to categories');
      assert.equal((await view()).lab.page, 'home');
      await back('workshop', 'categories return to workshop');
      await back('menu', 'workshop returns to its menu origin');
    });

    await scenario(viewport, 'cargo and ship hierarchy', async ({
      page, view, click, action, expectSheet, back, start, record
    }) => {
      await start();
      await click('.og-tabs [data-tab="ship"]');
      // The closed hull has no "open" button any more: tapping the painted ship opens it.
      await click('#og-canvas');
      await page.waitForFunction(() => orbitApp.getView().shipDetail.mode === 'interior');
      await click('[data-module-focus="cargo"]');
      await click('[data-cargo="ore"]');
      await expectSheet('cargo-content', 'cargo item opens its contents');
      await click('.og-sheet-content button.secondary[data-action="nav-back"]');
      await expectSheet('system-module', 'lower Return to cargo returns to the cargo module');
      assert.equal((await view()).systemType, 'cargo');
      await click('[data-cargo="crystals"]');
      await back('system-module', 'Android Back returns resource to cargo module');
      assert.equal((await view()).systemType, 'cargo');
      await back(null, 'cargo module returns to open ship');
      assert.equal((await view()).shipDetail.mode, 'interior');
      assert.equal((await view()).tab, 'ship');
      await back(null, 'open ship returns to exterior');
      assert.equal((await view()).shipDetail.mode, 'exterior');
      assert.equal((await view()).tab, 'ship');
      await back(null, 'ship exterior returns to the planet');
      assert.equal((await view()).tab, 'explore');
      assert.equal(await page.evaluate(() => orbitApp.back()), false);
      record('ship hierarchy reaches a single exit root');
      await click('.og-tabs [data-tab="galaxy"]');
      await back(null, 'galaxy map returns to planet');
      assert.equal((await view()).tab, 'explore');
      assert.equal(await page.evaluate(() => orbitApp.back()), false);
      await click('.og-tabs [data-tab="expedition"]');
      await back(null, 'mission overview returns to planet');
      assert.equal((await view()).tab, 'explore');
    });
  }
  console.log(`PASS ${results.length} navigation regressions across 320×568 and 390×844.`);
  console.log(results.join('\n'));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await browser?.close();
});
