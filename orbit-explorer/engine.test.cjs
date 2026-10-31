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
function noChange(state, action, payload) {
  const before = E.serialize(state);
  const preview = E.preview(state, action, payload);
  assert.equal(preview.allowed, false, action + ' should be disabled');
  const result = E.dispatch(state, action, payload);
  assert.equal(result.ok, false, action + ' should be rejected');
  assert.equal(E.serialize(state), before, action + ' mutated rejected state');
  assert.equal(result.message, preview.reason);
}
function visitFirst(state) {
  act(state, 'scan');
  act(state, 'dock');
  return act(state, 'explore');
}

test('seeded worlds are reproducible, distinct, and start on safe Auralis', () => {
  for (let seed = 0; seed < 75; seed++) {
    const a = E.create(seed);
    assert.deepEqual(a, E.create(seed));
    assert.equal(E.validate(a), true);
    assert.ok(new Set(a.galaxy.planets.map(p => p.biome)).size >= 9);
    assert.equal(new Set(a.galaxy.planets.map(p => p.name)).size, a.galaxy.planets.length);
    assert.equal(new Set(a.galaxy.planets.map(p => p.seed)).size, a.galaxy.planets.length);
    const p = E.currentPlanet(a);
    assert.equal(p.name, 'Auralis');
    assert.equal(p.biome, 'forest');
    assert.equal(p.breathable, true);
    assert.equal(E.explorationCost(a).hull, 0);
    for (const [key, value] of Object.entries(E.stats(a))) {
      if (key === 'protection') assert.ok(Object.values(value).every(capacity => typeof capacity === 'boolean' || Number.isFinite(capacity)));
      else assert.ok(Number.isFinite(value));
    }
  }
  assert.notDeepEqual(E.create(1).galaxy, E.create(2).galaxy);
  assert.deepEqual(E.create('aurora'), E.create('aurora'));
});

test('onboarding completes through actual exploration, equipment, and a new galaxy', () => {
  const s = E.create(1234);
  assert.equal(s.mission.stage, 0);
  act(s, 'scan');
  assert.equal(s.mission.stage, 1);
  act(s, 'dock');
  assert.equal(s.mission.stage, 2);
  const found = act(s, 'explore').reward.module;
  assert.equal(found.rarity, 'rare');
  assert.equal(s.mission.stage, 3);
  const previousEngine = s.equipped.engine;
  const beforeFuelCost = E.travelCost(s, s.galaxy.planets[5].id);
  act(s, 'equip', { moduleId: found.id });
  assert.equal(s.mission.stage, 4);
  assert.equal(s.equipped.engine.id, found.id);
  assert.ok(s.inventory.some(m => m.id === previousEngine.id));
  assert.ok(E.travelCost(s, s.galaxy.planets[5].id) < beforeFuelCost);
  s.resources.ore=48; // Conversion fixture; earned progression is tested separately.
  act(s, 'refine');
  act(s, 'refine');
  act(s, 'launch');
  const previousGalaxy = s.galaxy.seed;
  act(s, 'warp');
  assert.equal(s.mission.stage, 5);
  assert.equal(s.mission.completed.length, 5);
  assert.notEqual(s.galaxy.seed, previousGalaxy);
  assert.equal(s.galaxyIndex, 1);
  assert.equal(s.resources.warpFuel, 0);
  assert.equal(s.visitedGalaxies, 2);
  assert.ok(s.galaxy.planets.length >= 12 && s.galaxy.planets.length <= 18);
  assert.ok(s.galaxy.systems.length >= 3 && s.galaxy.systems.length <= 4);
  assert.ok(s.galaxy.planets.every(p => !p.scanned && p.sites.every(site => !site.explored)));
});

test('rejected actions and previews never mutate state or advance randomness', () => {
  const s = E.create(23);
  const start = E.serialize(s);
  E.preview(s, 'travel', { planetId: s.galaxy.planets[1].id });
  assert.equal(E.serialize(s), start);
  noChange(s, 'dock');
  noChange(s, 'explore');
  noChange(s, 'launch');
  noChange(s, 'warp');
  noChange(s, 'travel', { planetId: s.location.planetId });
  noChange(s, 'travel', { planetId: 'another-galaxy' });
  noChange(s, 'equip', { moduleId: 'missing' });
  noChange(s, 'salvage', { moduleId: s.equipped.engine.id });
  noChange(s, 'repair');
  noChange(s, 'refillOxygen');
  noChange(s, 'refine', { amount: -1 });
  noChange(s, 'refine', { amount: 1.5 });
  noChange(s, 'paint', { color: 'invalid' });
  noChange(s, 'rename', { name: '<script>' });
  noChange(s, 'unknown');
  act(s, 'scan');
  noChange(s, 'scan');
  act(s, 'dock');
  noChange(s, 'dock');
  noChange(s, 'travel', { planetId: s.galaxy.planets[1].id });
  noChange(s, 'warp');
  const site = E.currentPlanet(s).sites[0].id;
  act(s, 'explore', { siteId: site });
  assert.equal(E.siteStatus(s,site).coreSecured,true);
  assert.equal(E.preview(s,'explore',{siteId:site}).allowed,true);
  s.resources.oxygen = 0;
  noChange(s, 'explore');
  act(s, 'launch');
  noChange(s, 'travel', { planetId: s.galaxy.planets[1].id });
});

test('each technology is one-time, rewards are deterministic, and planet risk changes costs', () => {
  const a = E.create(993);
  const b = E.create(993);
  visitFirst(a);
  visitFirst(b);
  assert.deepEqual(a, b);
  act(a, 'explore');
  act(a, 'explore');
  assert(E.currentPlanet(a).sites.every(site=>site.explored));
  assert(E.preview(a,'explore').allowed,'remaining finite deposits can be revisited');
  act(a, 'launch');
  const target = a.galaxy.planets.find(p => p.biome === 'volcanic');
  const preview = E.preview(a, 'travel', { planetId: target.id });
  const fuelBefore = a.resources.fuel;
  act(a, 'travel', { planetId: target.id });
  assert.equal(fuelBefore - a.resources.fuel, preview.cost.fuel);
  assert.ok(E.explorationCost(a).hull > 0);
  assert.ok(E.explorationCost(a).oxygen > 9);
  act(a, 'scan');
  noChange(a, 'dock');
  prepareRecipe(a, 'thermal-shield');
  const thermalShield = act(a, 'fabricate', { recipeId: 'thermal-shield' }).reward.module;
  act(a, 'equip', { moduleId: thermalShield.id });
  act(a, 'dock');
  const hullBefore = a.resources.hull;
  const cost = E.preview(a, 'explore').cost;
  act(a, 'explore');
  assert.equal(hullBefore - a.resources.hull, cost.hull);
  a.resources.hull = 1;
  noChange(a, 'explore');
});

test('refueling, atmospheric air, fabrication, and refinement pay only advertised costs', () => {
  const s = E.create(45);
  const p = E.preview(s, 'refuel');
  assert.deepEqual(p.cost, { ore: 3 });
  assert.equal(p.amount, 10);
  act(s, 'refuel');
  assert.equal(s.resources.fuel, E.stats(s).maxFuel);
  noChange(s, 'refuel');
  visitFirst(s);
  const before = { ...s.resources };
  assert.deepEqual(E.preview(s, 'refillOxygen').cost, {});
  act(s, 'refillOxygen');
  assert.equal(s.resources.oxygen, E.stats(s).maxOxygen);
  assert.equal(s.resources.credits, before.credits);
  assert.equal(s.resources.ore, before.ore);
  act(s, 'launch');
  s.resources.oxygen = 1;
  s.resources.lumenfern=1;
  assert.deepEqual(E.preview(s, 'refillOxygen').cost, { lumenfern: 1 });
  act(s, 'refillOxygen');
  assert.equal(s.resources.oxygen, 13);
  assert.equal(s.resources.lumenfern,0);
  s.resources.hull = 97;
  assert.equal(E.preview(s, 'repair').amount, 3);
  act(s, 'repair');
  assert.equal(s.resources.hull, 100);
  s.resources.ore=48;
  act(s, 'refine', { amount: 2 });
  assert.equal(s.resources.ore,0);
  assert.equal(s.resources.warpFuel, 3);
  assert.equal(s.resources.crystals, 0);
  noChange(s, 'refine');
  s.resources.fuel = 0;
  s.resources.ore = 0;
  const creditsBefore = s.resources.credits;
  noChange(s, 'refuel');
  assert.equal(s.resources.credits, creditsBefore);
  s.resources.credits = 0;
  noChange(s, 'refuel');
});

test('full cargo permits deliberate field salvage, module swaps conserve inventory, and salvage frees space', () => {
  const s = E.create(902);
  while (s.inventory.length < E.stats(s).cargoCapacity) {
    s.inventory.push({ ...s.equipped.engine, id: 'm' + s.nextModuleId++ });
  }
  const count = s.inventory.length;
  const result = visitFirst(s);
  assert.ok(result.reward.ore > 6);
  assert.equal(result.reward.module, undefined);
  assert.equal(s.inventory.length, count);
  const scanner = s.inventory.find(m => m.type === 'scanner');
  act(s, 'equip', { moduleId: scanner.id });
  assert.equal(s.inventory.length, count);
  assert.equal(E.stats(s).scanBonus > 0, true);
  const scrap = s.inventory[0];
  const oreBefore = s.resources.ore;
  act(s, 'salvage', { moduleId: scrap.id });
  assert.equal(s.inventory.length, count - 1);
  assert.ok(s.resources.ore > oreBefore);
  noChange(s, 'salvage', { moduleId: scrap.id });
});

test('higher-tier warp, shield, life, arm, cargo, and survival have functional benefits', () => {
  const s = E.create(555);
  const base = E.stats(s);
  for (const type of E.catalog.map(x => x.type)) {
    const module = { ...s.equipped[type], id: 'm' + s.nextModuleId++, rarity: 'epic', power: 2.3, origin: 'recovered' };
    s.inventory.push(module);
    act(s, 'equip', { moduleId: module.id });
  }
  const upgraded = E.stats(s);
  assert.ok(upgraded.maxFuel > base.maxFuel);
  assert.ok(upgraded.maxOxygen > base.maxOxygen);
  assert.ok(upgraded.maxHull > base.maxHull);
  assert.ok(upgraded.cargoCapacity > base.cargoCapacity);
  assert.ok(upgraded.radiationProtection > base.radiationProtection);
  assert.ok(upgraded.oxygenEfficiency > base.oxygenEfficiency);
  assert.ok(upgraded.collectionBonus > base.collectionBonus);
  assert.ok(E.warpCost(s) < 3);
});

test('rescue recovers from zero supplies and exhausted galaxies without losing modules', () => {
  const s = E.create(6);
  const equipment = JSON.stringify(s.equipped);
  const inventory = JSON.stringify(s.inventory);
  for (const key of Object.keys(s.resources)) s.resources[key] = 0;
  act(s, 'rescue');
  assert.ok(s.resources.fuel > 0 && s.resources.oxygen > 0 && s.resources.hull > 0);
  assert.equal(JSON.stringify(s.equipped), equipment);
  assert.equal(JSON.stringify(s.inventory), inventory);
  visitFirst(s);
  act(s, 'refillOxygen');
  for (const p of s.galaxy.planets) for (const site of p.sites) site.explored = true;
  for (const key of Object.keys(s.resources)) s.resources[key] = 0;
  const rescue = act(s, 'rescue');
  assert.match(rescue.message, /emergência/);
  assert.equal(s.resources.warpFuel, E.warpCost(s));
  act(s, 'warp');
  assert.equal(s.galaxyIndex, 1);
});

test('saving preserves randomness and progress; restore rejects corrupt or incompatible snapshots', () => {
  const s = E.create('Andorinha');
  visitFirst(s);
  act(s, 'paint', { color: '#5DAAEE' });
  act(s, 'rename', { name: '  Horizonte  ' });
  assert.equal(s.ship.color, '#5daaee');
  assert.equal(s.ship.name, 'Horizonte');
  const restored = E.restore(E.serialize(s));
  assert.deepEqual(s, restored);
  assert.deepEqual(act(s, 'explore'), act(restored, 'explore'));
  assert.deepEqual(s, restored);
  assert.equal(E.restore('garbage'), null);
  assert.equal(E.restore('{}'), null);
  assert.equal(E.restore(null), null);
  assert.equal(E.restore({ ...s, version: 999 }), null);
  const negative = JSON.parse(E.serialize(s));
  negative.resources.oxygen = -1;
  assert.equal(E.restore(negative), null);
  const duplicates = JSON.parse(E.serialize(s));
  duplicates.inventory.push(duplicates.inventory[0]);
  assert.equal(E.restore(duplicates), null);
  const oversized = JSON.parse(E.serialize(s));
  oversized.resources.hull = 10000;
  assert.equal(E.restore(oversized), null);
});

test('extended exploration across galaxies remains bounded and saves stay compact', () => {
  const s = E.create(777);
  // This endurance test commissions a complete expedition kit. The separate
  // onboarding and universe tests cover earning its resources through play.
  Object.assign(s.resources, { ore: 900, lumenfern:999, data: 220, crystals: 120, credits: 400 });
  const equipment = {};
  for (const recipeId of ['radiation-mesh', 'solar-suit', 'cryo-suit', 'pressure-filter', 'atmospheric-probe', 'abyss-hold']) {
    prepareRecipe(s, recipeId);
    const module = act(s, 'fabricate', { recipeId }).reward.module;
    equipment[recipeId] = module.id;
    act(s, 'equip', { moduleId: module.id });
  }
  let expectedExplorations = 0;
  for (let galaxy = 0; galaxy < 4; galaxy++) {
    expectedExplorations += s.galaxy.planets.reduce((sum, planet) => sum + planet.sites.length, 0);
    for (const planetId of s.galaxy.planets.map(p => p.id)) {
      const target = s.galaxy.planets.find(p => p.id === planetId);
      const requiredSurvival = equipment[target.biome === 'ice' || target.biome === 'rogue' ? 'cryo-suit' : 'solar-suit'];
      if (s.equipped.survival.id !== requiredSurvival) act(s, 'equip', { moduleId: requiredSurvival });
      if (s.location.mode === 'docked') act(s, 'launch');
      if (s.location.planetId !== planetId) {
        while (s.resources.fuel < E.stats(s).maxFuel) act(s, 'refuel');
        while (s.resources.oxygen < 50) act(s, 'refillOxygen');
        act(s, 'travel', { planetId });
      }
      act(s, 'scan');
      act(s, 'dock');
      for (const site of E.currentPlanet(s).sites) {
        while (s.resources.oxygen < 50) act(s, 'refillOxygen');
        while(s.resources.fuel<E.explorationCost(s,site.id).fuel)act(s,'refuel');
        if (s.resources.hull < 35) act(s, 'repair');
        act(s, 'explore', { siteId: site.id });
      }
    }
    act(s, 'launch');
    while (s.resources.warpFuel < E.warpCost(s)) act(s, 'refine');
    if (s.resources.oxygen < 10) act(s, 'refillOxygen');
    act(s, 'warp');
    assert.equal(s.log.length, 20);
    assert.ok(Buffer.byteLength(JSON.stringify(E.snapshot(s)), 'utf8') < 16384);
    assert.ok(Object.values(s.resources).every(value => value >= 0 && Number.isFinite(value)));
  }
  assert.equal(s.progress.explorations, expectedExplorations);
  assert.equal(s.galaxyIndex, 4);
});

test('rescue rejects healthy orbit and repeated requests without charging', () => {
  const s = E.create(6);
  noChange(s, 'rescue');
  s.resources.fuel = 0;
  act(s, 'rescue');
  assert.equal(s.location.mode, 'orbit');
  noChange(s, 'rescue');
  s.resources.oxygen = 0;
  act(s, 'rescue');
  noChange(s, 'rescue');
});
