#!/usr/bin/env node
/* The version in sw.js must match the newest entry in CHANGELOG.md.
 * A cache that never bumps is the one failure mode a service worker adds, and
 * this is the cheapest possible guard against forgetting.
 *
 *   node tools/check-version.mjs
 */
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');

const newest = changelog.match(/^## (\d+\.\d+\.\d+)/m);
const asset = sw.match(/const ASSET_VERSION = '([^']+)'/);
const cache = sw.match(/const CACHE_VERSION = '([^']+)'/);

if (!newest) {
  console.error('✗ CHANGELOG.md has no "## x.y.z" heading');
  process.exit(1);
}
if (!asset || !cache) {
  console.error('✗ sw.js is missing ASSET_VERSION or CACHE_VERSION');
  process.exit(1);
}

const problems = [];
if (asset[1] !== newest[1]) {
  problems.push(`sw.js ASSET_VERSION is ${asset[1]}, CHANGELOG's newest version is ${newest[1]}`);
}
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const badge = readme.match(/version-(\d+\.\d+\.\d+)-/);
if (badge && badge[1] !== newest[1]) {
  problems.push(`README badge says ${badge[1]}, CHANGELOG's newest version is ${newest[1]}`);
}

if (problems.length) {
  console.error('✗ version mismatch:');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`✓ version ${newest[1]} agrees across CHANGELOG, README and sw.js (cache ${cache[1]})`);
