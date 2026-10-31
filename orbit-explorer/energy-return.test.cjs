'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const { checkedAct: act, rejectUnchanged: noChange, start, walk, solve } = require('./expedition-test-helper.cjs');

function mission(seed) { const state = E.create(seed); start(state); return state; }
function at(state, x, y, revealed) {
  Object.assign(state.expedition, { x, y, visited: [...new Set([32, y * 6 + x])], revealed });
  assert.equal(E.validate(state), true, 'Fixture remains a valid saved expedition');
}
function purePreview(state, action, payload) {
  const before = E.serialize(state), preview = E.preview(state, action, payload);
  assert.deepEqual(preview.safety, E.expeditionSafety(state, action, payload));
  assert.equal(E.serialize(state), before, 'Planning must not spend resources, reveal fog, or advance RNG');
  return preview;
}

test('return uses the advertised known path, preserves pending loot, and allows extraction at zero energy', () => {
  const state = mission('return-loot');
  walk(state, { x: 1, y: 4 }); act(state, 'expeditionCollect');
  const route = E.expeditionReturnRoute(state), pending = structuredClone(state.expedition.pending), resources = { ...state.resources };
  assert.equal(route.steps, 2); assert.equal(route.reserve, 2); assert.equal(route.integrity, 0);
  for (const cell of route.path) assert.ok(state.expedition.revealed.includes(cell.y * 6 + cell.x));
  state.expedition.reserve = route.reserve;
  const turns = state.expedition.turns;
  const preview = purePreview(state, 'expeditionReturn');
  assert.equal(preview.allowed, true);
  assert.deepEqual(preview.cost, { reserve: route.reserve, integrity: route.integrity });
  assert.equal(preview.safety.afterReserve, 0);
  assert.equal(preview.safety.returnReserve, 0);
  assert.equal(preview.safety.stranded, false);
  act(state, 'expeditionReturn');
  assert.equal(state.expedition.reserve, 0);
  assert.equal(state.expedition.turns, turns + route.steps);
  assert.deepEqual(E.expeditionView(state).position, { x: 2, y: 5 });
  assert.deepEqual(state.expedition.pending, pending);
  assert.deepEqual(state.resources, resources);
  noChange(state, 'expeditionReturn');
  const extracted = act(state, 'expeditionExtract');
  assert.equal(extracted.reward.ore, pending.ore);
  assert.equal(state.expedition, null);
});

test('scan and movement previews distinguish a tight return from an action that strands the crew', () => {
  const state = mission('return-warning');
  walk(state, { x: 2, y: 3 });
  state.expedition.reserve = 4;
  let preview = purePreview(state, 'expeditionScan');
  assert.equal(preview.allowed, true);
  assert.equal(preview.safety.afterReserve, 2);
  assert.equal(preview.safety.returnReserve, 2);
  assert.equal(preview.safety.returnMargin, 0);
  assert.equal(preview.safety.risky, true);
  assert.equal(preview.safety.stranded, false);
  act(state, 'expeditionScan');
  preview = purePreview(state, 'expeditionScan');
  assert.equal(preview.allowed, true, 'The UI may let players consciously accept risk');
  assert.equal(preview.safety.afterReserve, 0);
  assert.equal(preview.safety.returnMargin, -2);
  assert.equal(preview.safety.stranded, true);
  assert.match(preview.safety.reason, /faltam 2 de energia/);
  state.expedition.reserve = 3;
  preview = purePreview(state, 'expeditionMove', { x: 2, y: 2 });
  assert.equal(preview.safety.afterReserve, 2);
  assert.equal(preview.safety.returnReserve, 3);
  assert.equal(preview.safety.returnMargin, -1);
  assert.equal(preview.safety.stranded, true);
  const cell = E.expeditionView(state).cells.find(cell => cell.x === 2 && cell.y === 2);
  assert.deepEqual(cell.safety, preview.safety);
});

test('collection and both puzzle outcomes advertise the exact reserve available for returning', () => {
  const collecting = mission('return-collect');
  walk(collecting, { x: 1, y: 4 });
  collecting.expedition.reserve = 3;
  const collect = purePreview(collecting, 'expeditionCollect');
  assert.equal(collect.cost.reserve, 2);
  assert.equal(collect.safety.afterReserve, 1);
  assert.equal(collect.safety.returnReserve, 2);
  assert.equal(collect.safety.stranded, true);

  const puzzle = mission('return-circuit');
  walk(puzzle, E.expeditionView(puzzle).core); act(puzzle, 'expeditionInteract');
  puzzle.expedition.reserve = 7;
  const wrong = purePreview(puzzle, 'expeditionRecover');
  assert.equal(wrong.cost.reserve, 2);
  assert.equal(wrong.safety.afterReserve, 5);
  assert.equal(wrong.safety.returnReserve, 6);
  assert.equal(wrong.safety.returnMargin, -1);
  assert.equal(wrong.safety.stranded, true);
  solve(puzzle);
  const right = purePreview(puzzle, 'expeditionRecover');
  assert.equal(right.cost.reserve, 3);
  assert.equal(right.safety.afterReserve, 4);
  assert.equal(right.safety.returnMargin, -7, 'recovery forecasts the persistent reaction on the return route');
  assert.equal(right.safety.stranded, true);
});

test('a longer route without hazards is selected when the shortest route would destroy suit integrity', () => {
  const state = mission('return-hazard-0');
  at(state, 4, 4, Array.from({ length: 36 }, (_, index) => index));
  const fast = E.expeditionReturnRoute(state);
  assert.equal(fast.reserve, 4); assert.equal(fast.integrity, 2); assert.equal(fast.steps, 3);
  state.expedition.integrity = 1;
  const safe = E.expeditionReturnRoute(state);
  assert.equal(safe.reserve, 5); assert.equal(safe.integrity, 0); assert.equal(safe.steps, 5); assert.equal(safe.canReturn, true);
  const resources = { ...state.resources }, reserve = state.expedition.reserve;
  act(state, 'expeditionReturn');
  assert.equal(state.expedition.reserve, reserve - safe.reserve);
  assert.equal(state.expedition.integrity, 1);
  assert.deepEqual(state.resources, resources);
});

test('route cost includes every hazard and rejects an unsurvivable route or insufficient fuel atomically', () => {
  const state = mission('return-hazard-0');
  at(state, 4, 4, [28, 34, 33, 32]);
  const route = E.expeditionReturnRoute(state);
  assert.equal(route.reserve, 4); assert.equal(route.integrity, 2);
  state.expedition.reserve = 3;
  noChange(state, 'expeditionReturn');
  assert.equal(E.expeditionView(state).returnBlocked, true);
  state.expedition.reserve = 4; state.expedition.integrity = 2;
  assert.equal(E.expeditionReturnRoute(state).canReturn, false);
  assert.match(E.preview(state, 'expeditionReturn').reason, /integridade/);
  noChange(state, 'expeditionReturn');
  state.expedition.integrity = 3;
  act(state, 'expeditionReturn');
  assert.equal(state.expedition.reserve, 0);
  assert.equal(state.expedition.integrity, 1);
});

test('unrevealed shortcuts and disconnected known terrain never produce an optimistic Manhattan estimate', () => {
  const state = mission('return-fog');
  at(state, 2, 3, [20, 32, 3]);
  const before = E.serialize(state), route = E.expeditionReturnRoute(state);
  assert.equal(route.known, false);
  assert.equal(route.reserve, null);
  assert.equal(route.steps, null);
  assert.deepEqual(route.path, []);
  assert.equal(route.canReturn, false);
  assert.equal(E.expeditionView(state).returnBlocked, true);
  assert.equal(E.expeditionView(state).returnReserve, null);
  noChange(state, 'expeditionReturn');
  assert.equal(E.serialize(state), before);
  state.expedition.revealed.push(26);
  assert.equal(E.expeditionReturnRoute(state).reserve, 2);
});

test('return planning and save restoration preserve fog and pending module identity', () => {
  const state = mission('return-saved');
  walk(state, E.expeditionView(state).core); solve(state); act(state, 'expeditionRecover');
  const restored = E.restore(E.snapshot(state));
  assert.ok(restored);
  assert.deepEqual(E.expeditionReturnRoute(restored), E.expeditionReturnRoute(state));
  assert.deepEqual(purePreview(restored, 'expeditionReturn'), purePreview(state, 'expeditionReturn'));
  assert.deepEqual(act(restored, 'expeditionReturn'), act(state, 'expeditionReturn'));
  assert.deepEqual(restored, state);
  const id = state.expedition.pending.module.id;
  act(state, 'expeditionExtract');
  assert.ok(state.inventory.some(module => module.id === id));
});
