'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('./engine.js');
const { prepareRecipe } = require('./component-test-helper.cjs');
const { checkedAct: act, rejectUnchanged: noChange, revealedBoard, route, walk, solve, finish, start } = require('./expedition-test-helper.cjs');

test('exploration starts a tactical mission without instant rewards, progress, or discovery', () => {
  const state = E.create('expedition-start');
  act(state, 'scan'); act(state, 'dock');
  const inventory = structuredClone(state.inventory), previous = { ...state.resources }, rng = state.rng;
  const expectedCost = E.preview(state, 'explore').cost;
  const result = start(state);
  assert.deepEqual(result.reward, {});
  assert.equal(state.rng, rng);
  assert.equal(state.progress.explorations, 0);
  assert.equal(E.currentPlanet(state).sites[0].explored, false);
  assert.deepEqual(state.inventory, inventory);
  for (const key of Object.keys(previous)) assert.equal(state.resources[key], previous[key] - (expectedCost[key] || 0));
  const view = E.expeditionView(state);
  assert.equal(view.width, 6); assert.equal(view.height, 6);
  assert.deepEqual(view.position, { x: 2, y: 5 });
  assert.deepEqual(view.core, { x: 3, y: 0 });
  assert.equal(view.reserve, 24);
  assert.ok(view.cells.filter(cell => !cell.visible).length >= 28);
  assert.ok(view.cells.filter(cell => !cell.visible).every(cell => cell.kind === 'unknown' && cell.collected === false && cell.moveAllowed === false));
  assert.equal(E.beaconView(state).count, 0);
});

test('teleports, blocked terrain, stale controls, and ship operations reject atomically during expeditions', () => {
  const state = E.create('expedition-atomic'); start(state);
  noChange(state, 'expeditionMove', { x: 3, y: 0 });
  noChange(state, 'expeditionMove', { x: 2, y: 5 });
  noChange(state, 'expeditionMove', { x: -1, y: 5 });
  noChange(state, 'expeditionMove', { x: 2.5, y: 5 });
  noChange(state, 'expeditionCollect');
  noChange(state, 'expeditionInteract');
  noChange(state, 'expeditionRecover');
  noChange(state, 'expeditionExtract');
  for (const [action, payload] of [['travel', { planetId: 'g0-p1' }], ['warp'], ['launch'], ['equip', { moduleId: state.inventory[0].id }], ['salvage', { moduleId: state.inventory[0].id }], ['refillOxygen'], ['repair'], ['refuel'], ['refine'], ['fabricate', { recipeId: 'thermal-shield' }], ['rescue'], ['explore'], ['claimBeacon']]) noChange(state, action, payload);
  const board = revealedBoard(state);
  const wall = board.find(cell => cell.kind === 'wall' && board.some(neighbor => Math.abs(neighbor.x - cell.x) + Math.abs(neighbor.y - cell.y) === 1 && route(state, neighbor)));
  if (wall) {
    const neighbor = board.find(cell => Math.abs(cell.x - wall.x) + Math.abs(cell.y - wall.y) === 1 && route(state, cell));
    walk(state, neighbor);
    noChange(state, 'expeditionMove', wall);
  }
  act(state, 'expeditionAbort');
  noChange(state, 'expeditionMove', { x: 2, y: 4 });
  noChange(state, 'expeditionRecover');
});

test('scanning reveals fog for advertised reserve; adjacent hazard costs are transparent and local', () => {
  const state = E.create('engine-expedition'); start(state);
  const before = E.expeditionView(state), resources = { ...state.resources };
  assert.deepEqual(before.actions.scan.cost, { reserve: 2 });
  act(state, 'expeditionScan');
  assert.equal(state.expedition.reserve, before.reserve - 2);
  assert.ok(E.expeditionView(state).cells.filter(cell => cell.visible).length > before.cells.filter(cell => cell.visible).length);
  const hazard = E.expeditionView(state).cells.find(cell => cell.adjacent && cell.kind === 'hazard');
  assert.ok(hazard);
  const cost = hazard.moveCost, reserve = state.expedition.reserve, integrity = state.expedition.integrity;
  assert.deepEqual(cost, { reserve: 2, integrity: 2 });
  act(state, 'expeditionMove', hazard);
  assert.equal(state.expedition.reserve, reserve - cost.reserve);
  assert.equal(state.expedition.integrity, integrity - cost.integrity);
  assert.deepEqual(state.resources, resources);
});

test('cache loot is temporary, cannot be collected twice, and partial extraction prevents farming', () => {
  const state = E.create('cache-extraction'); start(state);
  const resources = { ...state.resources };
  walk(state, { x: 1, y: 4 });
  const cost = E.preview(state, 'expeditionCollect').cost.reserve;
  const reserve = state.expedition.reserve;
  act(state, 'expeditionCollect');
  assert.equal(state.expedition.reserve, reserve - cost);
  assert.equal(state.expedition.load, 1);
  assert.equal(state.expedition.pending.ore, 8);
  assert.deepEqual(state.resources, resources);
  noChange(state, 'expeditionCollect');
  noChange(state, 'expeditionExtract');
  walk(state, { x: 2, y: 5 });
  const result = act(state, 'expeditionExtract');
  assert.equal(result.reward.ore, 8);
  assert.equal(state.resources.ore, resources.ore + 8);
  assert.equal(state.progress.explorations, 0);
  assert.equal(E.currentPlanet(state).sites[0].explored, false);
  assert.deepEqual(state.siteCaches['g0-p0-s0'], [25]);
  const resumed = E.restore(E.snapshot(state));
  start(resumed);
  walk(resumed, { x: 1, y: 4 });
  noChange(resumed, 'expeditionCollect');
  assert.equal(E.expeditionView(resumed).cells.find(cell => cell.x === 1 && cell.y === 4).collected, true);
});

test('coupled rotors are solvable; wrong recovery spends known reserve and correct recovery stays provisional', () => {
  const state = E.create('coupled-puzzle'); start(state);
  walk(state, E.expeditionView(state).core);
  act(state, 'expeditionInteract');
  assert.equal(E.expeditionView(state).puzzle.matched, false);
  const before = { ...state.resources }, count = state.inventory.length, reserve = state.expedition.reserve;
  assert.deepEqual(E.preview(state, 'expeditionRecover').cost, { reserve: 2 });
  const wrong = act(state, 'expeditionRecover');
  assert.match(wrong.message, /desalinhado/);
  assert.equal(state.expedition.reserve, reserve - 2);
  assert.equal(state.expedition.coreRecovered, false);
  assert.deepEqual(state.resources, before);
  const dials = [...state.expedition.puzzle.dials];
  act(state, 'expeditionTune', { index: 0 });
  assert.deepEqual(state.expedition.puzzle.dials, [(dials[0] + 1) % 4, (dials[1] + 1) % 4, dials[2]]);
  noChange(state, 'expeditionTune', { index: 3 });
  solve(state);
  assert.deepEqual(E.preview(state, 'expeditionRecover').cost, { reserve: 3 });
  act(state, 'expeditionRecover');
  assert.equal(state.inventory.length, count);
  assert.equal(state.expedition.pending.module.type, 'engine');
  assert.equal(state.expedition.pending.module.rarity, 'rare');
  assert.equal(E.beaconView(state).count, 0);
  assert.equal(state.progress.explorations, 0);
  noChange(state, 'expeditionRecover');
  noChange(state, 'expeditionTune', { index: 0 });
  noChange(state, 'expeditionExtract');
  walk(state, { x: 2, y: 5 });
  const result = act(state, 'expeditionExtract');
  assert.equal(result.reward.module.type, 'engine');
  assert.equal(state.inventory.length, count + 1);
  assert.equal(state.progress.explorations, 1);
  assert.equal(E.currentPlanet(state).sites[0].explored, true);
  assert.equal(E.beaconView(state).count, 1);
  assert.equal(E.preview(state, 'explore', { siteId: 'g0-p0-s0' }).allowed, true);
  noChange(state, 'expeditionExtract');
});

test('evacuation loses provisional cargo only; equipment, banked resources, and replay circuit stay intact', () => {
  const state = E.create('evacuate'); start(state);
  const equipment = structuredClone(state.equipped), inventory = structuredClone(state.inventory), resources = { ...state.resources };
  walk(state, E.expeditionView(state).core); solve(state); act(state, 'expeditionRecover');
  const recovered = state.expedition.pending.module, target = [...state.expedition.puzzle.target];
  act(state, 'expeditionAbort');
  assert.equal(state.expedition, null);
  assert.deepEqual(state.resources, resources);
  assert.deepEqual(state.equipped, equipment); assert.deepEqual(state.inventory, inventory);
  assert.equal(E.beaconView(state).count, 0); assert.equal(state.progress.explorations, 0);
  start(state); walk(state, E.expeditionView(state).core); solve(state); act(state, 'expeditionRecover');
  assert.deepEqual(state.expedition.puzzle.target, target);
  for (const key of ['type', 'name', 'rarity', 'power']) assert.equal(state.expedition.pending.module[key], recovered[key]);
  assert.notEqual(state.expedition.pending.module.id, recovered.id);
});

test('active expedition snapshots preserve fog, puzzle, reserve, and pending loot without duplicates', () => {
  const state = E.create('resume-expedition'); start(state);
  act(state, 'expeditionScan');
  walk(state, E.expeditionView(state).core); act(state, 'expeditionInteract'); act(state, 'expeditionTune', { index: 2 });
  let restored = E.restore(E.snapshot(state));
  assert.deepEqual(restored, state);
  assert.ok(Buffer.byteLength(JSON.stringify(E.snapshot(state)), 'utf8') < 16384);
  solve(state); solve(restored);
  assert.deepEqual(act(state, 'expeditionRecover'), act(restored, 'expeditionRecover'));
  assert.deepEqual(restored, state);
  restored = E.restore(E.snapshot(state)); assert.deepEqual(restored, state);
  walk(state, { x: 2, y: 5 }); walk(restored, { x: 2, y: 5 });
  assert.deepEqual(act(state, 'expeditionExtract'), act(restored, 'expeditionExtract'));
  assert.deepEqual(restored, state);
  const corrupt = E.snapshot(state);
  corrupt.discovery.fragments.origin = 'yes';
  assert.equal(E.restore(corrupt), null);
  const active = E.create('corrupt-expedition'); start(active);
  for (const mutate of [s => { s.expedition.reserve = -1; }, s => { s.expedition.x = 10; }, s => { s.expedition.seed++; }, s => { s.expedition.harvested.push(35); }, s => { s.expedition.pending.module = { ...s.equipped.engine }; }, s => { s.expedition.revealed.push(100); }]) {
    const broken = E.snapshot(active); mutate(broken); assert.equal(E.restore(broken), null);
  }
});

test('empty reserve still allows base extraction or evacuation; insufficient actions cannot spend resources', () => {
  const state = E.create('reserve-empty'); start(state);
  walk(state, { x: 1, y: 4 }); act(state, 'expeditionCollect'); walk(state, { x: 2, y: 5 });
  while (state.expedition.reserve >= 2) act(state, 'expeditionScan');
  assert.equal(state.expedition.reserve, 0);
  noChange(state, 'expeditionMove', { x: 2, y: 4 }); noChange(state, 'expeditionScan');
  act(state, 'expeditionExtract');
  start(state); act(state, 'expeditionMove', { x: 2, y: 4 });
  while (state.expedition.reserve >= 2) act(state, 'expeditionScan');
  if (state.expedition.reserve) act(state, 'expeditionMove', { x: 2, y: 3 });
  assert.equal(state.expedition.reserve, 0);
  assert.equal(E.expeditionView(state).returnRisk, true);
  noChange(state, 'expeditionMove', { x: 2, y: 4 });
  act(state, 'expeditionAbort'); assert.equal(state.expedition, null);
});

test('full inventory requires a conscious salvage choice and keeps recovered signal fragments', () => {
  const state = E.create('full-expedition');
  while (state.inventory.length < E.stats(state).cargoCapacity) state.inventory.push({ ...state.equipped.engine, id: 'm' + state.nextModuleId++ });
  start(state); walk(state, E.expeditionView(state).core); solve(state); act(state, 'expeditionRecover'); walk(state, { x: 2, y: 5 });
  noChange(state, 'expeditionExtract');
  const ore = state.expedition.pending.ore;
  act(state, 'expeditionSalvage');
  assert.equal(state.expedition.load, 1);
  assert.ok(state.expedition.pending.ore > ore);
  noChange(state, 'expeditionSalvage');
  const result = act(state, 'expeditionExtract');
  assert.equal(result.reward.module, undefined);
  assert.equal(E.beaconView(state).count, 1);
});

test('scanner, collector, cargo, and survival upgrades alter expedition decisions', () => {
  const base = E.create('upgrades'), upgraded = E.create('upgrades');
  for (const type of ['scanner', 'arm', 'cargo', 'survival', 'life', 'shield']) {
    const module = { ...upgraded.equipped[type], id: 'm' + upgraded.nextModuleId++, rarity: 'epic', power: 2.3 };
    upgraded.inventory.push(module); act(upgraded, 'equip', { moduleId: module.id });
  }
  start(base); start(upgraded);
  assert.ok(upgraded.expedition.reserve > base.expedition.reserve);
  assert.ok(upgraded.expedition.integrity > base.expedition.integrity);
  assert.ok(upgraded.expedition.capacity > base.expedition.capacity);
  act(base, 'expeditionScan'); act(upgraded, 'expeditionScan');
  assert.ok(upgraded.expedition.revealed.length > base.expedition.revealed.length);
  walk(base, { x: 1, y: 4 }); walk(upgraded, { x: 1, y: 4 });
  assert.ok(E.preview(upgraded, 'expeditionCollect').cost.reserve < E.preview(base, 'expeditionCollect').cost.reserve);
  act(base, 'expeditionCollect'); act(upgraded, 'expeditionCollect');
  assert.ok(upgraded.expedition.pending.ore > base.expedition.pending.ore);
});

test('seeded sites vary after the tutorial while every circuit and safe return remain feasible', () => {
  const corePositions = new Set(), layouts = new Set();
  for (let seed = 0; seed < 60; seed++) {
    const state = E.create(seed); start(state, 'g0-p0-s1');
    const view = E.expeditionView(state), board = revealedBoard(state), path = route(state, view.core);
    corePositions.add(view.core.x); layouts.add(board.map(cell => cell.kind).join(','));
    assert.ok(path, 'No safe path for seed ' + seed);
    assert.ok(path.length * 2 + 3 + 2 <= view.reserve, 'No scan/recover/return budget for seed ' + seed);
    act(state, 'expeditionScan');
    const result = finish(state);
    assert.equal(result.reward.module.type, 'engine');
    assert.equal(state.progress.explorations, 1);
    assert.ok(E.validate(state));
  }
  assert.ok(corePositions.size >= 5);
  assert.ok(layouts.size >= 50);
});

test('the three extracted biome signals unlock one epic warp module and require installation', () => {
  const state = E.create('three-signals'); start(state); finish(state);
  noChange(state, 'claimBeacon');
  Object.assign(state.resources, { ore: 300, data: 500, crystals: 30, credits: 500 });
  for (const [biome, recipe] of [['volcanic', 'thermal-shield'], ['ocean', 'dive-kit']]) {
    prepareRecipe(state, recipe);
    const module = act(state, 'fabricate', { recipeId: recipe }).reward.module;
    act(state, 'equip', { moduleId: module.id }); act(state, 'launch');
    const planet = state.galaxy.planets.find(item => item.biome === biome);
    state.resources.fuel=E.stats(state).maxFuel;state.resources.oxygen=E.stats(state).maxOxygen;
    act(state, 'travel', { planetId: planet.id }); start(state); finish(state);
  }
  assert.equal(E.beaconView(state).count, 3); assert.equal(E.beaconView(state).ready, true);
  const warp = state.equipped.warp.id, before = E.warpCost(state);
  const module = act(state, 'claimBeacon').reward.module;
  assert.equal(module.rarity, 'epic'); assert.equal(module.type, 'warp');
  assert.equal(state.equipped.warp.id, warp);
  noChange(state, 'claimBeacon');
  act(state, 'equip', { moduleId: module.id });
  assert.ok(E.warpCost(state) < before);
  assert.equal(E.beaconView(state).claimed, true);
  assert.deepEqual(E.restore(E.snapshot(state)), state);
});

test('existing v2 saves migrate in place without losing ship, inventory, progression, or resources', () => {
  const fixturePath = path.join(__dirname, 'qa/expedition-artifacts/v2-save-fixture.json');
  const raw = fs.existsSync(fixturePath) ? JSON.parse(fs.readFileSync(fixturePath, 'utf8')) : E.snapshot(E.create('v2-fixture'));
  const fixture = raw.state || raw;
  delete fixture.expedition; delete fixture.discovery; delete fixture.siteCaches;
  const restored = E.restore(fixture);
  assert.ok(restored);
  assert.equal(restored.version, 2);
  assert.deepEqual(restored.ship, fixture.ship);
  assert.deepEqual(restored.resources, fixture.resources);
  assert.deepEqual(restored.equipped, fixture.equipped);
  assert.deepEqual(restored.progress, fixture.progress);
  assert.equal(restored.expedition, null);
  assert.equal(E.beaconView(restored).count, 0);
});
