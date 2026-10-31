'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const { prepareRecipe } = require('./component-test-helper.cjs');
const { finish: finishExpedition } = require('./expedition-test-helper.cjs');

function act(state, action, payload) {
  if(action==='explore'&&state.resources.oxygen<E.explorationCost(state,payload?.siteId).oxygen&&E.currentPlanet(state).breathable)assert(E.dispatch(state,'refillOxygen').ok);
  const result = E.dispatch(state, action, payload);
  assert.equal(result.ok, true, action + ': ' + result.message);
  assert.equal(E.validate(state), true, 'Invalid state after ' + action);
  // These integration scenarios require a completed expedition. The dedicated
  // expedition suite asserts every intermediate rule and provisional reward.
  if (action === 'explore') return { ...finishExpedition(state), cost: result.cost };
  return result;
}
function rejectUnchanged(state, action, payload) {
  const before = E.serialize(state);
  const preview = E.preview(state, action, payload);
  assert.equal(preview.allowed, false, action + ' should be blocked');
  const result = E.dispatch(state, action, payload);
  assert.equal(result.ok, false);
  assert.equal(result.message, preview.reason);
  assert.equal(E.serialize(state), before, 'Rejection mutated state or RNG');
  return result;
}
function gatherFirstWorld(state) {
  act(state, 'scan');
  act(state, 'dock');
  const first = act(state, 'explore').reward.module;
  assert.equal(first.type, 'engine');
  assert.equal(first.rarity, 'rare');
  act(state, 'explore');
  act(state, 'explore');
  act(state, 'launch');
  return first;
}
function stockForRules(state) {
  Object.assign(state.resources, { ore: 500, crystals: 80, data: 800, credits: 2000 });
}
function craft(state, id, install = true) {
  prepareRecipe(state, id);
  const module = act(state, 'fabricate', { recipeId: id }).reward.module;
  if (install) act(state, 'equip', { moduleId: module.id });
  return module;
}
function legacyFixture() {
  // Version 1 schema: six worlds, three sites each, without system or capability fields.
  const state = E.create('legacy-real-schema');
  state.version = 1;
  state.galaxy.planets = state.galaxy.planets.slice(0, 6);
  delete state.galaxy.systems;
  delete state.galaxy.kind;
  for (const planet of state.galaxy.planets) {
    for (const key of ['systemId', 'medium', 'pressure', 'toxicity', 'weather']) delete planet[key];
    planet.sites = [0, 1, 2].map((i) => ({ id: planet.id + '-s' + i, name: 'Local legado ' + i, explored: i === 0 }));
    planet.scanned = true;
  }
  state.ship.name = 'Viajante antiga';
  state.location.mode = 'docked';
  state.resources.ore = 41;
  state.resources.data = 87;
  state.progress.scans = 6;
  state.progress.explorations = 6;
  state.progress.landings = 6;
  return state;
}

test('procedural galaxies vary in size, retain safe routes, and contain physical world types', () => {
  const counts = new Set(), systemCounts = new Set();
  for (let seed = 0; seed < 100; seed++) {
    const state = E.create(seed);
    assert.equal(E.validate(state), true);
    assert.deepEqual(state, E.create(seed));
    counts.add(state.galaxy.planets.length);
    systemCounts.add(state.galaxy.systems.length);
    assert.ok(state.galaxy.planets.length >= 12 && state.galaxy.planets.length <= 18);
    assert.ok(state.galaxy.systems.length >= 3 && state.galaxy.systems.length <= 4);
    assert.equal(new Set(state.galaxy.planets.map(p => p.id)).size, state.galaxy.planets.length);
    assert.equal(new Set(state.galaxy.planets.map(p => p.name)).size, state.galaxy.planets.length);
    assert.ok(state.galaxy.planets.every(p => !p.name.includes('undefined') && p.sites.length >= 2 && p.sites.length <= 4));
    assert.ok(state.galaxy.planets.filter(p => E.assess(state, p.id).allowed).length >= 2);
    assert.deepEqual(new Set(state.galaxy.planets.map(p => p.medium)), new Set(['solid', 'gas', 'liquid']));
    for (const system of state.galaxy.systems) {
      assert.ok(system.planetIds.length >= 2 && system.planetIds.length <= 8);
      assert.ok(system.planetIds.every(id => state.galaxy.planets.find(p => p.id === id).systemId === system.id));
    }
    const initial = E.currentPlanet(state);
    assert.equal(initial.name, 'Auralis');
    assert.equal(E.assess(state).level, 'safe');
    assert.equal(E.explorationCost(state).hull, 0);
    assert.equal(E.currentSystem(state).kind, 'yellow');
  }
  assert.ok(counts.size >= 3);
  assert.equal(systemCounts.size, 2);
});

test('real resource progression unlocks a volcanic expedition only after fabrication and installation', () => {
  const state = E.create('qa-hostile-universe');
  const engine = gatherFirstWorld(state);
  act(state, 'equip', { moduleId: engine.id });
  const volcanic = state.galaxy.planets.find(p => p.systemId === E.currentSystem(state).id && p.biome === 'volcanic');
  const oldShield = state.equipped.shield;
  act(state, 'travel', { planetId: volcanic.id });
  act(state, 'scan');
  const missing = E.assess(state).missing;
  assert.ok(missing.some(item => item.key === 'heat' && item.required === 320 && item.available < 320));
  rejectUnchanged(state, 'dock');
  const recipe = E.recipes.find(item => item.id === 'thermal-shield');
  prepareRecipe(state, recipe.id);
  const before = { ...state.resources };
  assert.deepEqual(E.preview(state, 'fabricate', { recipeId: recipe.id }).cost, recipe.cost);
  const shield = craft(state, recipe.id, false);
  for (const [key, amount] of Object.entries(recipe.cost)) assert.equal(before[key] - state.resources[key], amount);
  assert.equal(state.equipped.shield.id, oldShield.id);
  rejectUnchanged(state, 'dock');
  act(state, 'equip', { moduleId: shield.id });
  assert.equal(E.assess(state).allowed, true);
  act(state, 'dock');
  const site = E.currentPlanet(state).sites[0];
  const preview = E.preview(state, 'explore', { siteId: site.id });
  const resources = { ...state.resources };
  act(state, 'explore', { siteId: site.id });
  assert.equal(resources.hull - state.resources.hull, preview.cost.hull);
  assert.equal(resources.oxygen - state.resources.oxygen, preview.cost.oxygen);
  act(state, 'equip', { moduleId: oldShield.id });
  assert.equal(E.assess(state).allowed, false);
  rejectUnchanged(state, 'explore');
  act(state, 'launch');
  rejectUnchanged(state, 'dock');
});

test('gas and liquid worlds require distinct hardware and execute distinct operations', () => {
  for (const [biome, recipeId, key, operation] of [
    ['gas', 'atmospheric-probe', 'gas', 'atmospheric'],
    ['ocean', 'dive-kit', 'liquid', 'submerge']
  ]) {
    const state = E.create('qa-hostile-universe');
    gatherFirstWorld(state);
    const world = state.galaxy.planets.find(p => p.biome === biome);
    act(state, 'travel', { planetId: world.id });
    act(state, 'scan');
    assert.equal(E.assess(state).operation, operation);
    assert.ok(E.assess(state).missing.some(item => item.key === key));
    rejectUnchanged(state, 'dock');
    const module = craft(state, recipeId);
    assert.equal(E.moduleCapabilities(module)[key], true);
    assert.equal(E.assess(state).allowed, true);
    act(state, 'dock');
    const result = act(state, 'explore');
    if (biome === 'gas') {
      assert.match(result.message, /Gases condensados/);
      assert.ok(result.reward.fuel > 0);
      assert.equal(state.location.mode, 'docked');
    } else assert.equal(state.location.mode, 'docked');
    assert.ok(result.cost.oxygen > 0 && result.cost.hull > 0);
    act(state, 'launch');
  }
});

test('star hazards are enforced on travel; shield substitutions create a real tradeoff', () => {
  const state = E.create('qa-hostile-universe');
  stockForRules(state);
  const blue = state.galaxy.systems.find(system => system.kind === 'blue-giant');
  const worldId = blue.planetIds[0];
  const route = E.assessSystem(state, blue.id);
  assert.ok(route.missing.some(item => item.key === 'heat' && item.required === 700));
  rejectUnchanged(state, 'travel', { planetId: worldId });
  const ceramic = craft(state, 'thermal-shield');
  assert.equal(E.assessSystem(state, blue.id).allowed, true);
  const expectedCost = E.preview(state, 'travel', { planetId: worldId }).cost;
  const before = { ...state.resources };
  act(state, 'travel', { planetId: worldId });
  assert.equal(before.fuel - state.resources.fuel, expectedCost.fuel);
  assert.equal(before.oxygen - state.resources.oxygen, expectedCost.oxygen);
  // Orbital analysis remains available, including after an unsafe shield replacement.
  const radiation = craft(state, 'radiation-mesh');
  assert.equal(E.assessSystem(state, blue.id).allowed, false);
  act(state, 'scan');
  rejectUnchanged(state, 'dock');
  assert.ok(E.moduleCapabilities(radiation).radiation > E.moduleCapabilities(ceramic).radiation);
  assert.ok(E.moduleCapabilities(radiation).heat < E.moduleCapabilities(ceramic).heat);
  craft(state, 'solar-suit');
  assert.equal(E.assessSystem(state, blue.id).allowed, true);
});

test('site depths add transparent pressure gates and costs instead of hidden failure rolls', () => {
  const state = E.create(6);
  stockForRules(state);
  const ocean = state.galaxy.planets.find(p => p.biome === 'ocean' && p.pressure === 27);
  assert.ok(ocean);
  craft(state, 'dive-kit');
  act(state, 'travel', { planetId: ocean.id });
  act(state, 'scan');
  act(state, 'dock');
  const shallow = E.assess(state, ocean.id, ocean.sites[0].id);
  const deep = E.assess(state, ocean.id, ocean.sites[2].id);
  assert.equal(shallow.allowed, true);
  assert.equal(deep.allowed, false);
  const pressure = deep.missing.find(item => item.key === 'pressure');
  assert.equal(pressure.required, 40.5);
  assert.equal(pressure.available, 40);
  assert.ok(deep.cost.oxygen > shallow.cost.oxygen);
  rejectUnchanged(state, 'explore', { siteId: ocean.sites[2].id });
  const before = E.serialize(state);
  assert.deepEqual(E.assess(state, ocean.id, ocean.sites[0].id), shallow);
  assert.equal(E.serialize(state), before);
  craft(state, 'abyss-hold');
  assert.equal(E.assess(state, ocean.id, ocean.sites[2].id).allowed, true);
  act(state, 'explore', { siteId: ocean.sites[2].id });
});

test('fabrication rejects invalid, unaffordable, and full-hold requests atomically', () => {
  const state = E.create(5);
  rejectUnchanged(state, 'fabricate', { recipeId: 'unknown' });
  rejectUnchanged(state, 'fabricate', { recipeId: 'thermal-shield' });
  stockForRules(state);
  while (state.inventory.length < E.stats(state).cargoCapacity) state.inventory.push({ ...state.equipped.engine, id: 'm' + state.nextModuleId++ });
  rejectUnchanged(state, 'fabricate', { recipeId: 'thermal-shield' });
  act(state, 'salvage', { moduleId: state.inventory.at(-1).id });
  const length = state.inventory.length;
  const module = craft(state, 'thermal-shield', false);
  assert.equal(state.inventory.length, length + 1);
  assert.deepEqual(module.capabilities, E.recipes.find(item => item.id === 'thermal-shield').capabilities);
  assert.equal(module.origin, 'fabricated');
});

test('three warp destinations produce distinct galaxies and pay the selected cost', () => {
  const state = E.create(25);
  state.resources.warpFuel = 12;
  const choices = E.destinations(state);
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices.map(item => item.id)).size, 3);
  rejectUnchanged(state, 'warp', { destinationId: 'stale-route' });
  const galaxySeeds = new Set();
  for (const choice of choices) {
    const branch = E.restore(E.snapshot(state));
    const previous = { ...branch.resources };
    const modules = JSON.stringify(branch.equipped);
    assert.equal(E.warpCost(branch, choice.id), choice.warpCost);
    assert.equal(E.preview(branch, 'warp', { destinationId: choice.id }).cost.warpFuel, choice.warpCost);
    act(branch, 'warp', { destinationId: choice.id });
    assert.equal(branch.galaxy.kind, choice.kind);
    assert.equal(branch.galaxy.name, choice.name);
    assert.equal(previous.warpFuel - branch.resources.warpFuel, choice.warpCost);
    assert.equal(branch.galaxyIndex, 1);
    assert.equal(branch.visitedGalaxies, 2);
    assert.equal(JSON.stringify(branch.equipped), modules);
    assert.equal(E.assess(branch).allowed, true);
    assert.ok(branch.galaxy.planets.every(p => !p.scanned && p.sites.every(site => !site.explored)));
    assert.deepEqual(E.restore(E.snapshot(branch)), branch);
    galaxySeeds.add(branch.galaxy.seed);
  }
  assert.equal(galaxySeeds.size, 3);
});

test('rescue allows another safe galaxy when all currently accessible sites are exhausted', () => {
  const state = E.create('recovery');
  for (const planet of state.galaxy.planets) for (const site of planet.sites) if (E.assess(state, planet.id, site.id).allowed) site.explored = true;
  assert.ok(state.galaxy.planets.some(p => p.sites.some(site => !site.explored)));
  const equipment = JSON.stringify(state.equipped);
  for (const key of Object.keys(state.resources)) state.resources[key] = 0;
  const result = act(state, 'rescue');
  assert.match(result.message, /emergência/);
  assert.equal(state.resources.warpFuel, E.warpCost(state));
  assert.equal(JSON.stringify(state.equipped), equipment);
  act(state, 'warp');
  assert.equal(E.assess(state).allowed, true);
  act(state, 'scan');
  act(state, 'dock');
  act(state, 'explore');
});

test('legacy migration preserves the six original worlds, equipment, resources, and ongoing operation', () => {
  const old = legacyFixture();
  const saved = JSON.stringify(old);
  const migrated = E.restore(saved);
  assert.ok(migrated);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.ship, old.ship);
  assert.deepEqual(migrated.resources, old.resources);
  assert.deepEqual(migrated.equipped, old.equipped);
  assert.deepEqual(migrated.inventory, old.inventory);
  assert.deepEqual(migrated.location, old.location);
  assert.deepEqual(migrated.progress, old.progress);
  assert.equal(migrated.galaxy.name, old.galaxy.name);
  for (const planet of old.galaxy.planets) {
    const restored = migrated.galaxy.planets.find(p => p.id === planet.id);
    for (const [key, value] of Object.entries(planet)) {
      if (key === 'sites') assert.deepEqual(restored.sites.map(({ difficulty, ...site }) => site), value);
      else assert.deepEqual(restored[key], value);
    }
  }
  assert.equal(migrated.galaxy.systems[0].planetIds.length, 6);
  assert.deepEqual(E.restore(E.snapshot(migrated)), migrated);
  assert.equal(JSON.stringify(old), saved, 'Migration changed the source snapshot');
  const corrupt = JSON.parse(saved);
  corrupt.resources.oxygen = -1;
  assert.equal(E.restore(corrupt), null);
});

test('compact snapshots preserve RNG and progress, remain bounded, and reject corrupt surveys', () => {
  for (const state of [E.create('compact'), E.restore(legacyFixture())]) {
    stockForRules(state);
    if (state.location.mode === 'docked') act(state, 'launch');
    if (!E.currentPlanet(state).scanned) act(state, 'scan');
    craft(state, 'thermal-shield');
    // A high-capacity hold plus a full inventory exercises the host persistence budget.
    state.equipped.cargo.power = 6;
    state.equipped.cargo.description = 'Capacidade ampliada';
    while (state.inventory.length < E.stats(state).cargoCapacity) state.inventory.push({ ...state.equipped.shield, id: 'm' + state.nextModuleId++ });
    for (let i = 0; i < 24; i++) act(state, 'paint', { color: i % 2 ? '#77ccbb' : '#ffaa77' });
    const compact = E.snapshot(state);
    assert.ok(Buffer.byteLength(JSON.stringify(compact), 'utf8') < 16384);
    const restored = E.restore(compact);
    assert.deepEqual(restored, state);
    assert.deepEqual(E.restore(E.serialize(state)), state);
    const bad = structuredClone(compact);
    bad.universe.survey = [[500, 1, 1]];
    assert.equal(E.restore(bad), null);
    const badCapabilities = structuredClone(compact);
    badCapabilities.equipped.shield.capabilities.heat = -100;
    assert.equal(E.restore(badCapabilities), null);
  }
  const state = E.create('deterministic');
  act(state, 'scan'); act(state, 'dock'); act(state, 'explore');
  const restored = E.restore(E.snapshot(state));
  assert.deepEqual(act(state, 'explore'), act(restored, 'explore'));
  assert.deepEqual(state, restored);
  assert.equal(E.restore({ version: 999 }), null);
  assert.equal(E.restore('{}'), null);
  assert.equal(E.restore('invalid'), null);
});

test('every generated site has a feasible combination of specialized modules', () => {
  for (let seed = 0; seed < 20; seed++) {
    const state = E.create(seed);
    const baseline = structuredClone(state.equipped);
    for (const planet of state.galaxy.planets) {
      for (const site of planet.sites) {
        let feasible = false;
        for (const shield of ['thermal-shield', 'radiation-mesh']) {
          for (const survival of ['cryo-suit', 'dive-kit', 'solar-suit']) {
            state.equipped = structuredClone(baseline);
            for (const recipeId of [shield, survival, 'pressure-filter', 'atmospheric-probe', 'abyss-hold']) {
              const recipe = E.recipes.find(item => item.id === recipeId);
              Object.assign(state.equipped[recipe.type], { power: recipe.power, capabilities: { ...recipe.capabilities } });
            }
            if (E.assess(state, planet.id, site.id).allowed) feasible = true;
          }
        }
        assert.ok(feasible, 'Unreachable site: ' + seed + ' ' + planet.name + ' ' + site.name);
      }
    }
  }
});
