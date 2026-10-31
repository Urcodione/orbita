const assert = require('node:assert/strict');

function solveCounts(dials, target) {
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
    const counts = [a, b, c], next = dials.slice();
    for (let i = 0; i < 3; i++) { next[i] = (next[i] + counts[i]) % 4; next[(i + 1) % 3] = (next[(i + 1) % 3] + counts[i]) % 4; }
    if (next.every((value, i) => value === target[i])) return counts;
  }
  throw new Error('Generated rotor puzzle has no solution');
}

// This intentionally drives visible controls rather than dispatching state changes.
// The first expedition's protected tutorial path is stable across game seeds.
async function completeTutorialExpedition(page) {
  const click = action => page.locator(`[data-action="${action}"]:visible`).first().click();
  const move = (x, y) => page.locator(`[data-expedition-x="${x}"][data-expedition-y="${y}"]:visible`).click();
  const before = await page.evaluate(() => orbitApp.getState());
  assert.ok(before.expedition?.firstExpedition, 'Helper only handles the first expedition tutorial');
  assert.equal(before.expedition.x, 2); assert.equal(before.expedition.y, 5);
  for (let y = 4; y >= 0; --y) await move(2, y);
  await move(3, 0); await click('expeditionInteract');
  const puzzle = await page.evaluate(() => orbitApp.getState().expedition.puzzle);
  const counts = solveCounts(puzzle.dials, puzzle.target);
  for (let i = 0; i < 3; i++) for (let n = 0; n < counts[i]; n++) await page.locator(`[data-action="expeditionTune"][data-index="${i}"]:visible`).click();
  await click('expeditionRecover');
  const recovered = await page.evaluate(() => orbitApp.getState());
  assert.ok(recovered.expedition.coreRecovered);
  assert.deepEqual(recovered.inventory, before.inventory, 'Recovered gear is pending until extraction');
  await move(2, 0); for (let y = 1; y <= 5; y++) await move(2, y);
  await click('expeditionExtract');
  const after = await page.evaluate(() => orbitApp.getState());
  assert.equal(after.expedition, null);
  assert.equal(after.progress.explorations, before.progress.explorations + 1);
  return after.inventory.find(module => module.id === recovered.expedition.pending.module.id);
}

module.exports = { solveCounts, completeTutorialExpedition };
