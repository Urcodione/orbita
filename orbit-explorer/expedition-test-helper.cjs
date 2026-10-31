'use strict';
const assert = require('node:assert/strict');
const E = require('./engine.js');

function checkedAct(state, action, payload) {
  const result = E.dispatch(state, action, payload);
  assert.equal(result.ok, true, action + ': ' + result.message);
  assert.equal(E.validate(state), true, 'Invalid state after ' + action);
  return result;
}
function rejectUnchanged(state, action, payload) {
  const before = E.serialize(state), preview = E.preview(state, action, payload);
  assert.equal(preview.allowed, false, action + ' should be blocked');
  const result = E.dispatch(state, action, payload);
  assert.equal(result.ok, false);
  assert.equal(result.message, preview.reason);
  assert.equal(E.serialize(state), before, action + ' mutated state or RNG');
  return result;
}
function revealedBoard(state) {
  // The unit-test planner inspects a separate snapshot to prove route feasibility.
  // The played state keeps its fog and moves only through the public actions.
  const probe = E.restore(E.snapshot(state));
  assert.ok(probe, 'Expedition snapshot should restore');
  probe.expedition.revealed = Array.from({ length: 36 }, (_, i) => i);
  return E.expeditionView(probe).cells;
}
function route(state, target, allowHazards = false) {
  const board = revealedBoard(state), start = state.expedition.y * 6 + state.expedition.x, end = target.y * 6 + target.x;
  const queue = [[start]], seen = new Set([start]);
  while (queue.length) {
    const path = queue.shift(), cell = board[path.at(-1)];
    if (path.at(-1) === end) return path.slice(1).map(i => ({ x: i % 6, y: Math.floor(i / 6) }));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cell.x + dx, y = cell.y + dy, index = y * 6 + x;
      if (x < 0 || x >= 6 || y < 0 || y >= 6 || seen.has(index) || board[index].kind === 'wall' || !allowHazards && board[index].kind === 'hazard') continue;
      seen.add(index); queue.push([...path, index]);
    }
  }
  return null;
}
function walk(state, target, act = checkedAct, allowHazards = false) {
  const path = route(state, target, allowHazards);
  assert.ok(path, 'A safe route should exist');
  for (const cell of path) {act(state, 'expeditionMove', cell);if(E.preview(state,'expeditionBeacon').allowed)act(state,'expeditionBeacon');}
  return path.length;
}
function solve(state, act = checkedAct) {
  if(state.expedition.adventure&&state.expedition.beacons.length<2){for(const beacon of revealedBoard(state).filter(c=>c.kind==='beacon'&&!c.collected))walk(state,beacon,act);walk(state,E.expeditionView(state).core,act);}
  act(state, 'expeditionInteract');
  if(E.encounterView?.(state)){while(!E.encounterView(state).done)act(state,'expeditionEncounter',{index:E.encounterView(state).step});return;}
  const { dials, target } = E.expeditionView(state).puzzle;
  let rotations;
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
    if ((dials[0] + a + c) % 4 === target[0] && (dials[1] + a + b) % 4 === target[1] && (dials[2] + b + c) % 4 === target[2]) {
      if (!rotations || a + b + c < rotations.reduce((sum, x) => sum + x, 0)) rotations = [a, b, c];
    }
  }
  assert.ok(rotations, 'Generated circuit must be solvable');
  rotations.forEach((amount, index) => { for (let i = 0; i < amount; i++) act(state, 'expeditionTune', { index }); });
  assert.equal(E.expeditionView(state).puzzle.matched, true);
}
function finish(state, act = checkedAct, { salvageIfFull = true } = {}) {
  if(state.expedition.adventure)for(const beacon of revealedBoard(state).filter(c=>c.kind==='beacon'&&!c.collected).sort((a,b)=>b.y-a.y))walk(state,beacon,act);
  walk(state, E.expeditionView(state).core, act);
  solve(state, act);
  act(state, 'expeditionRecover');
  walk(state, E.expeditionView(state).base, act);
  if (salvageIfFull && !E.preview(state, 'expeditionExtract').allowed) act(state, 'expeditionSalvage');
  return act(state, 'expeditionExtract');
}
function start(state, siteId) {
  if (!E.currentPlanet(state).scanned) checkedAct(state, 'scan');
  if (state.location.mode !== 'docked') checkedAct(state, 'dock');
  return checkedAct(state, 'explore', siteId ? { siteId } : undefined);
}
module.exports = { checkedAct, rejectUnchanged, revealedBoard, route, walk, solve, finish, start };
