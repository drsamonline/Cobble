#!/usr/bin/env node
/* Checks every local link in the site: hrefs, srcs, and the files the service
 * worker precaches. Dependency-free on purpose — it runs in CI without an
 * install step, and it is the check this project actually needs, because a
 * path that works at a domain root and fails on a project page is the mistake
 * this repository has already made once.
 *
 *   node tools/check-links.mjs
 *
 * Exits 1 with a list of broken references. Exits 0 quietly when everything
 * resolves.
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PAGES = [
  'index.html',
  'docs/index.html',
  'app/index.html',
  'selftest.html'
];

const problems = [];
const checked = new Set();

const resolveTarget = (fromFile, ref) => {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return null;
  const base = clean.startsWith('/')
    ? join(ROOT, clean)
    : resolve(dirname(join(ROOT, fromFile)), clean);
  const candidates = [base, join(base, 'index.html')];
  return candidates.find(candidate => existsSync(candidate) && statSync(candidate).isFile()) || null;
};

const checkRef = (fromFile, ref, kind) => {
  if (!ref) return;
  if (/^(https?:|mailto:|data:|tel:|javascript:|\/\/|#)/.test(ref)) return;
  const key = `${fromFile}::${ref}`;
  if (checked.has(key)) return;
  checked.add(key);
  const target = resolveTarget(fromFile, ref);
  if (!target) problems.push(`${fromFile} → ${kind} "${ref}" does not resolve`);
};

for (const page of PAGES) {
  const path = join(ROOT, page);
  if (!existsSync(path)) {
    problems.push(`missing page: ${page}`);
    continue;
  }
  const html = readFileSync(path, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) checkRef(page, match[1], 'link');
  for (const match of html.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) checkRef(page, match[1], 'asset');
}

/* CSS files reference fonts and images. */
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'screenshots') return [];
  const full = join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

for (const file of walk(ROOT).filter(file => extname(file) === '.css')) {
  const relative = file.slice(ROOT.length + 1);
  const css = readFileSync(file, 'utf8');
  for (const match of css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) checkRef(relative, match[1], 'asset');
}

/* The service worker's precache list must exist, or the offline promise is a lie. */
const swPath = join(ROOT, 'sw.js');
if (existsSync(swPath)) {
  const sw = readFileSync(swPath, 'utf8');
  const block = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
  if (!block) {
    problems.push('sw.js: no PRECACHE list found');
  } else {
    for (const match of block[1].matchAll(/'([^']+)'/g)) {
      const ref = match[1];
      if (ref === './') continue;
      checkRef('sw.js', ref, 'precache');
    }
  }
  const optional = sw.match(/const OPTIONAL = \[([\s\S]*?)\];/);
  if (optional) {
    for (const match of optional[1].matchAll(/'([^']+)'/g)) checkRef('sw.js', match[1], 'precache');
  }
}

/* The manifest's icons and shortcuts must resolve too. */
const manifestPath = join(ROOT, 'manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const icon of manifest.icons || []) checkRef('manifest.json', icon.src, 'icon');
  for (const shortcut of manifest.shortcuts || []) checkRef('manifest.json', shortcut.url, 'shortcut');
  checkRef('manifest.json', manifest.start_url, 'start_url');
}

/* Nothing may fetch from a third-party CDN any more. */
for (const file of walk(ROOT).filter(file => ['.html', '.js', '.css'].includes(extname(file)))) {
  const relative = file.slice(ROOT.length + 1);
  if (relative.startsWith('app/vendor/')) continue;
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/https?:\/\/(cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)/g)) {
    problems.push(`${relative} still references ${match[1]} — vendor it or remove it`);
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length} broken reference${problems.length === 1 ? '' : 's'}:`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`✓ ${checked.size} references checked across ${PAGES.length} pages, the stylesheets, the manifest and the service worker.`);
