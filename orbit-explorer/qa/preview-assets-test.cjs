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
const names = {
  ship: 'andorinha-illustrated', interior: 'andorinha-open', modules: 'modules-atlas',
  worlds: 'worlds-atlas', galaxies: 'galaxies-atlas', phenomena: 'phenomena-atlas',
  stars: 'stars-atlas', commerce: 'commerce-atlas', rooms: 'rooms-atlas', biology: 'biology-atlas',
  campaign: 'campaign-atlas', cosmic: 'cosmic-atlas', relics: 'relics-atlas'
};
assert.deepEqual(Object.keys(context.window.OrbitIllustrations), Object.keys(names));
for (const [key, name] of Object.entries(names)) {
  const source = fs.readFileSync(path.resolve(__dirname, '../assets', name + '-inline.webp'));
  const decoded = Buffer.from(context.window.OrbitIllustrations[key].split(',')[1], 'base64');
  assert.deepEqual(decoded, source, name + ': serialization preserves every image byte');
}
console.log('PASS preview under 1 MB; all 13 images, color profiles and transparency preserved byte-for-byte.');
