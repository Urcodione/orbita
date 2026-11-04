'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const preview = fs.readFileSync(process.argv[2], 'utf8');
assert(Buffer.byteLength(preview) < 1_000_000, 'preview stays within its delivery limit');
assert(!/<!doctype|<html[\s>]|<body[\s>]/i.test(preview), 'inline source is a fragment');
const initialization = preview.split('<script>\n')[1].split('\n')[0];
const context = {window: {}};
vm.runInNewContext(initialization, context, {timeout: 1000});
// The artwork build.py embeds: its fixed table, story/room cuts, optional xenobiology art and one closed/open painting per fleet ship.
const root = path.resolve(__dirname, '..'), build = fs.readFileSync(path.join(root, 'build.py'), 'utf8');
const names = Object.fromEntries([...build.match(/^art_files = \{([^}]*)\}/m)[1].matchAll(/'([^']+)':'([^']+)'/g)].map(m => [m[1], m[2]]));
for (let i = 0; i < 4; i++) names['story' + i] = 'story-scene-' + i;
for (let i = 0; i < 6; i++) names['room' + i] = 'room-' + i;
for (const [key, name] of [['landscapes', 'cine-landscapes'], ['xenoTools', 'xeno-tools'], ['xenoSpecimens', 'xeno-specimens']])
  if (fs.existsSync(path.join(root, 'assets', name + '.webp'))) names[key] = name;
for (const file of fs.readdirSync(path.join(root, 'assets')).filter(f => /^ship-.*\.webp$/.test(f) && !f.endsWith('-inline.webp')).sort()) {
  const ship = file.slice(5, -5);
  names[ship.endsWith('-open') ? 'open-' + ship.slice(0, -5) : 'hull-' + ship] = file.slice(0, -5);
}
assert(Object.keys(names).length >= 30, 'artwork list parsed from build.py');
assert.deepEqual(Object.keys(context.window.OrbitIllustrations).sort(), Object.keys(names).sort());
for (const [key, name] of Object.entries(names)) {
  // The preview uses the compact "-inline" cut when one exists, and the full painting otherwise.
  const compact = path.resolve(root, 'assets', name + '-inline.webp');
  const source = fs.readFileSync(fs.existsSync(compact) ? compact : path.resolve(root, 'assets', name + '.webp'));
  const decoded = Buffer.from(context.window.OrbitIllustrations[key].split(',')[1], 'base64');
  assert.deepEqual(decoded, source, name + ': serialization preserves every image byte');
}
console.log('PASS preview under 1 MB; all ' + Object.keys(names).length + ' images, color profiles and transparency preserved byte-for-byte.');
