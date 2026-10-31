'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('./engine.js');
const { prepareRecipe, prepareComponents } = require('./component-test-helper.cjs');
const { checkedAct: act, rejectUnchanged: noChange, start, finish, walk, solve, route, revealedBoard } = require('./expedition-test-helper.cjs');

function stocked(seed = 'module-workshop') {
  const state = E.create(seed);
  Object.assign(state.resources, { ore: 10000, crystals: 10000, data: 10000, credits: 10000 });
  return state;
}
function craft(state, recipeId, equip = false) {
  prepareRecipe(state, recipeId);
  const result = act(state, 'fabricate', { recipeId });
  if (equip) act(state, 'equip', { moduleId: result.reward.module.id });
  return result.reward.module;
}
function installed(recipeId, seed) {
  const state = stocked(seed);
  craft(state, recipeId, true);
  return state;
}
function fixture(file) { return JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8')).state; }

test('all eight systems have distinct craftable specialists with real traits and explicit ingredients', () => {
  assert.equal(E.recipes.length, 19);
  assert.equal(E.componentRecipes.length, 6);
  for (const { type } of E.catalog) {
    const choices = E.recipes.filter(recipe => recipe.type === type);
    assert.ok(choices.length >= 2, type);
    assert.equal(new Set(choices.map(recipe => recipe.specialty)).size, choices.length);
    for (const recipe of choices) {
      const state = stocked();
      const old = E.serialize(state.equipped[type]);
      const module = craft(state, recipe.id);
      assert.equal(E.serialize(state.equipped[type]), old, 'Fabrication must not equip');
      assert.equal(module.recipeId, recipe.id);
      assert.ok(Object.keys(recipe.components).length > 0);
      assert.ok(Object.keys(module.effects).length + Object.keys(module.capabilities).length > 0);
      const details = E.moduleDetails(state, module.id);
      assert.equal(details.specialty, recipe.specialty);
      assert.ok(details.metrics.length > 0 && details.benefits.length > 0);
      assert.ok(details.metrics.every(metric => typeof metric.value === 'boolean' || Number.isFinite(metric.value)));
      assert.equal(E.compareModule(state, module.id).allowed, true);
    }
  }
});

test('component batches and nested assemblies spend precisely the advertised materials', () => {
  const state = stocked();
  let before = structuredClone(state.resources), check = E.preview(state, 'craftComponent', { componentId: 'prism', amount: 4 });
  assert.deepEqual(check.cost, { crystals: 4, data: 12, credits: 16 });
  act(state, 'craftComponent', { componentId: 'prism', amount: 4 });
  assert.equal(state.components.prism, 4);
  for (const key of Object.keys(before)) assert.equal(state.resources[key], before[key] - (check.cost[key] || 0));
  act(state, 'craftComponent', { componentId: 'circuit', amount: 2 });
  before = structuredClone(state.resources);
  check = E.preview(state, 'craftComponent', { componentId: 'field-core', amount: 2 });
  assert.deepEqual(check.components, { prism: 4, circuit: 2 });
  const result = act(state, 'craftComponent', { componentId: 'field-core', amount: 2 });
  assert.deepEqual(result.reward.components, { 'field-core': 2 });
  assert.deepEqual(state.components, { prism: 0, circuit: 0, 'field-core': 2 });
  for (const key of Object.keys(before)) assert.equal(state.resources[key], before[key] - (check.cost[key] || 0));
  prepareRecipe(state, 'radiation-mesh');
  before = structuredClone(state.resources);
  const parts = structuredClone(state.components);
  check = E.preview(state, 'fabricate', { recipeId: 'radiation-mesh' });
  act(state, 'fabricate', { recipeId: 'radiation-mesh' });
  for (const key of Object.keys(before)) assert.equal(state.resources[key], before[key] - (check.cost[key] || 0));
  for (const key of Object.keys(parts)) assert.equal(state.components[key], parts[key] - (check.components[key] || 0));
});

test('failed components and module assembly are atomic, including batch limits and depleted raw stock', () => {
  const state = stocked();
  noChange(state, 'craftComponent', { componentId: 'unknown' });
  for (const amount of [0, -1, 1.5, 21, '2', null]) noChange(state, 'craftComponent', { componentId: 'alloy', amount });
  noChange(state, 'craftComponent', { componentId: 'field-core' });
  noChange(state, 'fabricate', { recipeId: 'thermal-shield' });
  state.components.alloy = 999;
  noChange(state, 'craftComponent', { componentId: 'alloy' });
  prepareRecipe(state, 'thermal-shield');
  state.resources.credits = 0;
  const before = E.serialize(state);
  const check = E.preview(state, 'fabricate', { recipeId: 'thermal-shield' });
  assert.deepEqual(check.components, E.recipes.find(recipe => recipe.id === 'thermal-shield').components);
  assert.equal(E.serialize(state), before);
  noChange(state, 'fabricate', { recipeId: 'thermal-shield' });
});

test('thermal and radiological comparisons show real gains, losses and newly blocked worlds without mutating state', () => {
  const state = installed('thermal-shield');
  const radiation = craft(state, 'radiation-mesh');
  const target = state.galaxy.planets.find(planet => planet.biome === 'volcanic' && planet.systemId === state.galaxy.systems[0].id);
  const before = E.serialize(state);
  const comparison = E.compareModule(state, radiation.id, target.id);
  assert.equal(comparison.kind, 'tradeoff');
  assert.equal(comparison.rows.find(row => row.key === 'heat').better, 'down');
  assert.equal(comparison.rows.find(row => row.key === 'radiation').better, 'up');
  assert.equal(comparison.rows.find(row => row.key === 'heat').before, 1400);
  assert.equal(comparison.rows.find(row => row.key === 'radiation').after, 450);
  assert.equal(comparison.environment.before.allowed, true);
  assert.equal(comparison.environment.after.allowed, false);
  assert.ok(comparison.closes.some(planet => planet.id === target.id));
  E.moduleDetails(state, radiation);
  E.suggestions(state, 'shield', target.id);
  E.salvageInfo(state, radiation.id);
  assert.equal(E.serialize(state), before, 'Read-only inspection changes no resources, turns or RNG');
  const previousId = state.equipped.shield.id;
  act(state, 'equip', { moduleId: radiation.id });
  assert.ok(state.inventory.some(module => module.id === previousId));
  assert.equal(E.stats(state).protection.heat, comparison.rows.find(row => row.key === 'heat').after);
  assert.equal(E.stats(state).protection.radiation, comparison.rows.find(row => row.key === 'radiation').after);
});

test('comparison uses combined ship protection, so another installed specialist can preserve an unlocked route', () => {
  const state = installed('thermal-shield');
  craft(state, 'solar-suit', true);
  const radiation = craft(state, 'radiation-mesh');
  const comparison = E.compareModule(state, radiation.id);
  assert.equal(E.stats(state).protection.heat, 1800);
  assert.ok(!comparison.rows.some(row => row.key === 'heat' && row.better === 'down'));
  assert.deepEqual(comparison.closes, []);
  assert.equal(E.moduleDetails(state, radiation).metrics.find(row => row.key === 'heat').value, 220);
});

test('contextual suggestions prefer environmental access and advertise specialist tradeoffs', () => {
  const state = installed('radiation-mesh');
  const kinetic = craft(state, 'kinetic-shell'), thermal = craft(state, 'thermal-shield');
  const target = state.galaxy.planets.find(planet => planet.biome === 'volcanic' && planet.systemId === state.galaxy.systems[0].id);
  const choices = E.suggestions(state, 'shield', target.id);
  assert.equal(choices[0].moduleId, thermal.id);
  assert.equal(choices[0].kind, 'tradeoff');
  assert.ok(choices[0].score > choices.find(choice => choice.moduleId === kinetic.id).score);
  assert.ok(choices[0].summary.length > 0);
  assert.equal(E.compareModule(state, 'missing').allowed, false);
});

test('tank reductions are disclosed before installation; incompatible smaller depots reject without losing cargo', () => {
  const state = installed('long-haul');
  const economical = craft(state, 'ion-sail');
  state.resources.fuel = E.stats(state).maxFuel;
  const before = state.resources.fuel, comparison = E.compareModule(state, economical.id);
  const loss = comparison.resourceLoss.find(item => item.key === 'fuel');
  assert.ok(loss && loss.amount > 0);
  act(state, 'equip', { moduleId: economical.id });
  assert.equal(state.resources.fuel, before - loss.amount);
  craft(state, 'caravan-hold', true);
  const smaller = craft(state, 'abyss-hold');
  while (state.inventory.length < E.stats(state).cargoCapacity) craft(state, 'ion-sail');
  assert.equal(E.compareModule(state, smaller.id).allowed, false);
  noChange(state, 'equip', { moduleId: smaller.id });
});

test('favorites protect inventory and installed modules across swaps and save restore, while salvage warns about unique abilities', () => {
  let state = stocked();
  const shield = craft(state, 'radiation-mesh');
  const info = E.salvageInfo(state, shield.id);
  assert.ok(info.uniqueBenefits.some(value => value.includes('450')));
  act(state, 'favoriteModule', { moduleId: shield.id });
  noChange(state, 'salvage', { moduleId: shield.id });
  state = E.restore(E.snapshot(state));
  assert.equal(E.salvageInfo(state, shield.id).favorite, true);
  act(state, 'equip', { moduleId: shield.id });
  const oldShield = state.inventory.find(module => module.type === 'shield');
  act(state, 'equip', { moduleId: oldShield.id });
  noChange(state, 'salvage', { moduleId: shield.id });
  act(state, 'favoriteModule', { moduleId: shield.id });
  const before = { ...state.resources };
  act(state, 'salvage', { moduleId: shield.id });
  assert.equal(state.resources.ore, before.ore + info.ore);
  assert.equal(state.resources.credits, before.credits + info.credits);
  assert.equal(E.salvageInfo(state, shield.id), null);
  noChange(state, 'favoriteModule', { moduleId: 'missing' });
});

test('engine, warp and life specializations change paid travel, warp and expedition costs', () => {
  const ion = installed('ion-sail'), caravan = installed('long-haul');
  assert.ok(E.stats(ion).maxFuel < E.stats(caravan).maxFuel);
  const ionCost = E.preview(ion, 'travel', { planetId: 'g0-p1' }).cost.fuel;
  const caravanCost = E.preview(caravan, 'travel', { planetId: 'g0-p1' }).cost.fuel;
  assert.ok(ionCost < caravanCost);
  const prior = ion.resources.fuel;
  act(ion, 'travel', { planetId: 'g0-p1' });
  assert.equal(ion.resources.fuel, prior - ionCost);
  const lens = installed('fold-lens'), anchor = installed('pulsar-anchor');
  assert.ok(E.warpCost(lens) < E.warpCost(anchor));
  assert.equal(E.stats(anchor).protection.radiation, 300);
  assert.ok(E.stats(lens).protection.radiation < 300);
  const garden = installed('oxygen-garden'), biosphere = installed('pressure-filter');
  assert.ok(E.stats(garden).maxOxygen > E.stats(biosphere).maxOxygen);
  assert.ok(E.explorationCost(garden).oxygen < E.explorationCost(biosphere).oxygen);
  assert.equal(E.stats(biosphere).protection.toxicity, 100);
  assert.ok(E.stats(garden).protection.toxicity < 100);
});

test('scanner specialists trade pulse coverage for real orbital and terrain research yields', () => {
  const horizon = installed('wide-lens', 'scanner-behavior'), archive = installed('archive-eye', 'scanner-behavior');
  const horizonData = act(horizon, 'scan').reward.data, archiveData = act(archive, 'scan').reward.data;
  assert.ok(archiveData > horizonData);
  start(horizon); start(archive);
  act(horizon, 'expeditionScan'); act(archive, 'expeditionScan');
  assert.ok(horizon.expedition.revealed.length > archive.expedition.revealed.length);
  const cache = revealedBoard(horizon).find(cell => cell.kind === 'data' && route(horizon, cell));
  assert.ok(cache);
  walk(horizon, cache); walk(archive, cache);
  act(horizon, 'expeditionCollect'); act(archive, 'expeditionCollect');
  assert.ok(archive.expedition.pending.data > horizon.expedition.pending.data);
});

test('collector, cargo, shield and survival specialists alter local yield, carrying room, endurance and hazard damage', () => {
  const claw = installed('mining-claw', 'collector-behavior'), probe = installed('atmospheric-probe', 'collector-behavior');
  assert.equal(E.stats(probe).protection.gas, true);
  assert.equal(E.stats(claw).protection.gas, false);
  start(claw); start(probe);
  const cache = revealedBoard(claw).find(cell => cell.kind === 'ore' && route(claw, cell));
  assert.ok(cache);
  walk(claw, cache); walk(probe, cache);
  act(claw, 'expeditionCollect'); act(probe, 'expeditionCollect');
  assert.ok(claw.expedition.pending.ore > probe.expedition.pending.ore);
  const caravan = installed('caravan-hold'), abyss = installed('abyss-hold');
  assert.ok(E.stats(caravan).cargoCapacity > E.stats(abyss).cargoCapacity);
  assert.equal(E.stats(abyss).protection.liquid, true);
  start(caravan); start(abyss);
  assert.ok(caravan.expedition.capacity > abyss.expedition.capacity);
  const bastion = installed('kinetic-shell', 'engine-expedition'), ceramic = installed('thermal-shield', 'engine-expedition');
  start(bastion); start(ceramic);
  assert.ok(bastion.expedition.maxIntegrity > ceramic.expedition.maxIntegrity);
  act(bastion, 'expeditionScan'); act(ceramic, 'expeditionScan');
  const hazard = E.expeditionView(bastion).cells.find(cell => cell.adjacent && cell.kind === 'hazard');
  assert.ok(hazard);
  assert.ok(E.preview(bastion, 'expeditionMove', hazard).cost.integrity < E.preview(ceramic, 'expeditionMove', hazard).cost.integrity);
  const trail = installed('trail-camp'), cryo = installed('cryo-suit');
  start(trail); start(cryo);
  assert.ok(trail.expedition.maxReserve > cryo.expedition.maxReserve);
  assert.ok(E.stats(cryo).protection.cold > E.stats(trail).protection.cold);
});

test('active expeditions block fabrication, component crafting, swapping and recycling without spending anything', () => {
  const state = stocked();
  const candidate = craft(state, 'thermal-shield');
  prepareComponents(state, { alloy: 3 });
  start(state);
  for (const [action, payload] of [
    ['craftComponent', { componentId: 'alloy' }], ['fabricate', { recipeId: 'ion-sail' }],
    ['equip', { moduleId: candidate.id }], ['favoriteModule', { moduleId: candidate.id }], ['salvage', { moduleId: candidate.id }]
  ]) noChange(state, action, payload);
  assert.equal(E.compareModule(state, candidate.id).allowed, false);
});

test('recovered cores now provide persistent specialist modules as part of the actual expedition reward', () => {
  const state = E.create('specialist-recovery');
  start(state);
  const first = finish(state).reward.module;
  assert.equal(first.recipeId, 'ion-sail');
  assert.equal(first.type, 'engine');
  assert.equal(first.rarity, 'rare');
  assert.ok(first.effects.fuelEfficiency > 0);
  start(state);
  const second = finish(state).reward.module;
  assert.ok(E.recipes.some(recipe => recipe.id === second.recipeId && recipe.type === second.type));
  const restored = E.restore(E.snapshot(state));
  assert.deepEqual(restored.inventory.find(module => module.id === second.id), second);
});

test('real v1/v2 saves migrate without adding new effects to old modules, and reject corrupt new fields', () => {
  for (const file of ['qa/universe-artifacts/v1-save-fixture.json', 'qa/expedition-artifacts/v2-save-fixture.json']) {
    const original = fixture(file);
    delete original.components;
    const migrated = E.restore(original);
    assert.ok(migrated, file);
    assert.deepEqual(migrated.components, {});
    assert.deepEqual(migrated.resources, original.resources);
    assert.deepEqual(migrated.equipped, original.equipped);
    assert.deepEqual(migrated.inventory, original.inventory);
    const snapshot = E.snapshot(migrated);
    for (const value of [{ alloy: -1 }, { alloy: 1.5 }, { alloy: 1000 }, { unknown: 1 }]) {
      assert.equal(E.restore({ ...snapshot, components: value }), null);
    }
    const badEffects = structuredClone(snapshot);
    badEffects.equipped.engine.effects = { fuelEfficiency: 9 };
    assert.equal(E.restore(badEffects), null);
    const badFavorite = structuredClone(snapshot);
    badFavorite.inventory[0].favorite = 'yes';
    assert.equal(E.restore(badFavorite), null);
  }
});

test('a full specialist collection, legacy worlds, component stock and active expedition fit the inline save budget', () => {
  const state = E.restore(fixture('qa/universe-artifacts/v1-save-fixture.json'));
  Object.assign(state.resources, { ore: 10000, crystals: 10000, data: 10000, credits: 10000 });
  for (const { type } of E.catalog) {
    craft(state, E.recipes.find(recipe => recipe.type === type).id, true);
    for (const module of [...state.inventory]) act(state, 'salvage', { moduleId: module.id });
  }
  // A valid maximum-size depot fixture exercises the upper bound, beyond the current level-one recipes.
  state.equipped.cargo.power = 6;
  state.equipped.cargo.effects.cargoCapacity = 8;
  for (let index = 0; state.inventory.length < E.stats(state).cargoCapacity; index++) {
    const module = craft(state, E.recipes[index % E.recipes.length].id);
    act(state, 'favoriteModule', { moduleId: module.id });
  }
  for (const component of E.componentRecipes) state.components[component.id] = 999;
  start(state); walk(state, E.expeditionView(state).core); solve(state); act(state, 'expeditionRecover');
  const saved = E.snapshot(state);
  const wrapper = { state: saved, tab: 'expedition', selected: state.location.planetId, shipDetail: { mode: 'module', selectedModule: 'shield', expanded: false }, mapLevel: 'system', selectedSystem: state.galaxy.systems[0].id, selectedDestination: E.destinations(state)[0].id };
  assert.ok(Buffer.byteLength(JSON.stringify(wrapper)) < 16 * 1024);
  const restored = E.restore(saved);
  assert.ok(restored);
  assert.deepEqual(restored.components, state.components);
  assert.deepEqual(restored.equipped, state.equipped);
  assert.deepEqual(restored.inventory, state.inventory);
  assert.deepEqual(restored.expedition, state.expedition);
});
