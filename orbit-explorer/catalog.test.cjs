'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const E = require('./engine.js');
const { checkedAct: act, start, walk, solve, finish } = require('./expedition-test-helper.cjs');
const { prepareRecipe } = require('./component-test-helper.cjs');

function worldShape(galaxy) {
  const copy = structuredClone(galaxy);
  delete copy.name;
  copy.systems.forEach(system => { delete system.name; });
  copy.planets.forEach(planet => { delete planet.name; });
  return copy;
}
function names(galaxy) { return [galaxy.name, ...galaxy.systems.map(system => system.name), ...galaxy.planets.map(planet => planet.name)]; }
function jump(state, destination) {
  state.resources.warpFuel = E.stats(state).maxWarpFuel;
  state.resources.oxygen = E.stats(state).maxOxygen;
  act(state, 'warp', destination ? { destinationId: destination.id } : undefined);
}

test('celestial names are unique across every object and alternative route in a long journey', () => {
  const state = E.create('unique-universe'), seen = new Set();
  const remember = galaxy => names(galaxy).forEach(name => {
    assert.ok(name && name.length <= 26, 'Short, defined celestial name');
    assert.doesNotMatch(name, /\d|\s[IVXLCDM]+$/u);
    assert.ok(!seen.has(name), 'Repeated celestial name: ' + name);
    seen.add(name);
  });
  remember(state.galaxy);
  for (let i = 0; i < 64; i++) {
    const before = E.serialize(state), destinations = E.destinations(state);
    assert.deepEqual(E.destinations(state), destinations);
    assert.equal(E.serialize(state), before, 'Names must not consume game randomness');
    let selected;
    for (const destination of destinations) {
      assert.deepEqual(Object.keys(destination).sort(), ['description', 'id', 'index', 'kind', 'name', 'warpCost']);
      assert.match(destination.description, /só serão conhecidos na chegada/);
      assert.doesNotMatch(destination.description, /oceano|floresta|planeta|pulsar|gigante|mundo/i);
      const branch = E.restore(E.snapshot(state));
      jump(branch, destination);
      assert.equal(branch.galaxy.name, destination.name);
      remember(branch.galaxy);
      if (destination === destinations[i % 3]) selected = branch;
    }
    Object.assign(state, selected);
  }
  assert.ok(seen.size > 2500);
});

test('renaming does not change the physical universe, seeds, IDs, or terrain RNG sequence', () => {
  // Digests captured from the previous generator with only celestial names removed.
  const expected = {
    frontier: '3aab216bdb560daf6cd374b1d10cf04b5f4cc0205d8f0ec2cea3d83ee45b0e9e',
    verdant: 'ac8a0f377f4079226f7b3e5fce63ddbb0d7b21fb2aa14c480452d90ea5ed2daf',
    forge: 'c5925a86135da7b79eaa9d72dabe3fa032591e33b3bb7a8612a338613d0b2cc4',
    abyss: '1b4998edade2a47d40a5dd09bf9ffb9ecbf51b8ddf596435cbb1bd3ac0e63267'
  };
  const state = E.create(0), galaxies = [state.galaxy];
  for (const destination of E.destinations(state)) {
    const branch = E.restore(E.snapshot(state)); jump(branch, destination); galaxies.push(branch.galaxy);
  }
  galaxies.forEach(galaxy => assert.equal(crypto.createHash('sha256').update(JSON.stringify(worldShape(galaxy))).digest('hex'), expected[galaxy.kind]));
});

test('catalog distinguishes orbital discovery from confirmed exploration and never counts an aborted core', () => {
  const state = E.create('catalog-progress');
  let view = E.discoveryCatalog(state);
  assert.equal(view.current.unknown, state.galaxy.planets.length);
  assert.equal(view.current.discovered, 0);
  assert.equal(view.current.percent, 0);
  assert.ok(view.current.systems.flatMap(system => system.planets).every(planet => planet.name === null && planet.biome === null));
  act(state, 'scan');
  view = E.discoveryCatalog(state);
  assert.equal(view.current.discovered, 1);
  assert.equal(view.current.unknown, state.galaxy.planets.length - 1);
  assert.equal(view.current.percent, 0);
  assert.equal(view.current.systems[0].planets[0].name, 'Auralis');
  start(state);
  walk(state, E.expeditionView(state).core); solve(state); act(state, 'expeditionRecover');
  assert.equal(E.discoveryCatalog(state).current.completedSites, 0, 'Pending cargo cannot count as confirmed exploration');
  act(state, 'expeditionAbort');
  assert.equal(E.discoveryCatalog(state).current.completedSites, 0);
  start(state); finish(state);
  view = E.discoveryCatalog(state);
  assert.equal(view.current.completedSites, 1);
  assert.equal(view.current.completed, 0);
  assert.equal(view.current.systems[0].planets[0].percent, 33);
  act(state,'refillOxygen'); start(state); finish(state); start(state); finish(state);
  view = E.discoveryCatalog(state);
  assert.equal(view.current.completedSites, 3);
  assert.equal(view.current.completed, 1);
  assert.equal(view.current.systems[0].planets[0].percent, 100);
  assert.equal(view.current.systems[0].planets[0].complete, true);
  assert.equal(view.current.percent, Math.floor(3 / view.current.totalSites * 100));
  const before = E.serialize(state);
  E.discoveryCatalog(state);
  assert.equal(E.serialize(state), before, 'Reading the catalog must be pure');
});

test('warping archives confirmed survey counts and persistence restores the same catalog', () => {
  const state = E.create('catalog-archive');
  start(state); finish(state); act(state, 'launch');
  const previous = E.discoveryCatalog(state).current;
  jump(state, E.destinations(state)[1]);
  const view = E.discoveryCatalog(state), archive = view.archives[0];
  for (const key of ['name', 'id', 'kind', 'percent', 'totalPlanets', 'unknown', 'discovered', 'completed', 'completedSites', 'totalSites']) assert.equal(archive[key], previous[key]);
  assert.equal(view.current.discovered, 0);
  assert.equal(view.current.completedSites, 0);
  assert.equal(view.totals.totalGalaxies, 2);
  assert.equal(view.totals.recordedGalaxies, 2);
  assert.equal(view.totals.completedSites, 1);
  assert.equal(view.totals.discovered, 1);
  assert.equal(view.totals.totalPlanets, previous.totalPlanets + view.current.totalPlanets);
  assert.equal(archive.systems, undefined);
  assert.deepEqual(E.discoveryCatalog(E.restore(E.snapshot(state))), view);
  assert.deepEqual(E.restore(E.snapshot(state)), state);
});

test('old full saves are renamed without losing equipment, active expeditions, or survey progress', () => {
  const state = E.create('old-catalog');
  start(state); finish(state); start(state);
  const expected = structuredClone(state);
  delete state.surveyArchive;
  state.galaxy.name = 'Galáxia antiga 1';
  state.galaxy.systems.forEach((system, index) => { system.name = 'Sistema antigo ' + index; });
  state.galaxy.planets.forEach((planet, index) => { planet.name = 'Planeta antigo ' + index; });
  const restored = E.restore(state);
  assert.ok(restored);
  assert.deepEqual(names(restored.galaxy), names(expected.galaxy));
  assert.deepEqual(worldShape(restored.galaxy), worldShape(expected.galaxy));
  for (const key of ['location', 'resources', 'rng', 'equipped', 'inventory', 'progress', 'expedition', 'siteCaches']) assert.deepEqual(restored[key], expected[key]);
  assert.equal(E.discoveryCatalog(restored).current.completedSites, 1);
  assert.match(state.galaxy.planets[0].name, /antigo/, 'Restore must not mutate the supplied save');
  act(restored, 'expeditionAbort'); act(restored, 'launch'); jump(restored); jump(restored);
  delete restored.surveyArchive;
  const migrated = E.restore(E.snapshot(restored));
  assert.equal(E.discoveryCatalog(migrated).unavailableGalaxies, 2);
  assert.equal(E.discoveryCatalog(migrated).archives.length, 0);
  jump(migrated);
  assert.equal(E.discoveryCatalog(migrated).archives.length, 1);
  assert.equal(E.discoveryCatalog(migrated).unavailableGalaxies, 2);
});

test('long journeys retain aggregate progress, bound archives, and fit a fully equipped active save under 16 KiB', () => {
  const state = E.create('catalog-long-save');
  let totalPlanets = 0, totalSites = 0;
  for (let i = 0; i < 55; i++) {
    act(state, 'scan');
    // Confirmed progress fixture: game-action confirmation is covered above.
    E.currentPlanet(state).sites[0].explored = true;
    totalPlanets += state.galaxy.planets.length;
    totalSites += state.galaxy.planets.reduce((sum, item) => sum + item.sites.length, 0);
    jump(state, E.destinations(state)[i % 3]);
  }
  const view = E.discoveryCatalog(state);
  assert.equal(view.archives.length, 48);
  assert.equal(view.earlier.totalGalaxies, 7);
  assert.equal(view.earlier.completedSites, 7);
  assert.equal(view.totals.discovered, 55);
  assert.equal(view.totals.completedSites, 55);
  assert.equal(view.totals.recordedGalaxies, 56);
  assert.equal(view.totals.totalPlanets, totalPlanets + view.current.totalPlanets);
  assert.equal(view.totals.totalSites, totalSites + view.current.totalSites);
  Object.assign(state.resources, { ore: 10000, crystals: 10000, credits: 10000, data: 10000 });
  for (const { type } of E.catalog) {
    const recipe = E.recipes.find(item => item.type === type);
    prepareRecipe(state, recipe.id);
    const module = act(state, 'fabricate', { recipeId: recipe.id }).reward.module;
    act(state, 'equip', { moduleId: module.id });
    for (const item of [...state.inventory]) act(state, 'salvage', { moduleId: item.id });
  }
  state.equipped.cargo.power = 6;
  state.equipped.cargo.effects.cargoCapacity = 8;
  for (let i = 0; state.inventory.length < E.stats(state).cargoCapacity; i++) {
    const recipe = E.recipes[i % E.recipes.length]; prepareRecipe(state, recipe.id);
    const module = act(state, 'fabricate', { recipeId: recipe.id }).reward.module;
    act(state, 'favoriteModule', { moduleId: module.id });
  }
  for (const component of E.componentRecipes) state.components[component.id] = 999;
  start(state); walk(state, E.expeditionView(state).core); solve(state); act(state, 'expeditionRecover');
  const saved = E.snapshot(state), bytes = Buffer.byteLength(JSON.stringify({ state: saved, tab: 'expedition', selected: state.location.planetId, shipDetail: { mode: 'module', selectedModule: 'shield', expanded: false }, mapLevel: 'system', selectedSystem: E.currentSystem(state).id, selectedDestination: E.destinations(state)[0].id }));
  assert.ok(bytes < 16384, 'Save size: ' + bytes);
  assert.deepEqual(E.restore(saved), state);
});

test('corrupt or future archive entries cannot inject catalog progress', () => {
  const state = E.create('archive-validation'); jump(state);
  for (const mutate of [
    saved => { saved.surveyArchive.entries[0][0] = saved.galaxyIndex; },
    saved => { saved.surveyArchive.entries[0][3] = 999; },
    saved => { saved.surveyArchive.entries[0][6] = -1; },
    saved => { saved.surveyArchive.entries[0][1] = 9; },
    saved => { saved.surveyArchive.earlier[0] = 2; }
  ]) {
    const saved = E.snapshot(state); mutate(saved); assert.equal(E.restore(saved), null);
  }
});
