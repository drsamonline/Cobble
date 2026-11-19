#!/usr/bin/env node
/* A size budget for the app shell, so "it is small" stays true.
 * Runs in CI next to the link check. Dependency-free.
 *
 *   node tools/check-size.mjs
 *
 * Two numbers per line, and they mean different things:
 *
 *   source  what the repository holds, and what a reader opens
 *   gzip    what a visitor actually downloads, because GitHub Pages serves
 *           everything with gzip
 *
 * The budget is on the gzip figure. Source bytes were the old measure and they
 * were the wrong one: they count whitespace and comments that no browser ever
 * parses, and they pushed this project toward choosing between readable source
 * and room for features. Gzipped size is what the reader waits for, so that is
 * what is capped. A raw ceiling stays as a sanity check — not a budget — so a
 * stray megabyte still fails the build.
 */
import { statSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KB = 1024;

const BUDGETS = [
  {
    label: 'app shell (html + css + js)',
    files: ['app/index.html', 'app/theme.css', 'app/styles.css', 'app/core.js', 'app/i18n.js',
            'app/scene3d.js', 'app/ambience.js', 'app/app.js'],
    gzip: 75 * KB,
    raw: 320 * KB
  },
  { label: 'Hindi landing page', files: ['hi.html'], gzip: 12 * KB, raw: 45 * KB },
  { label: 'Gujarati landing page', files: ['gu.html'], gzip: 12 * KB, raw: 45 * KB },
  { label: 'landing page', files: ['index.html', 'assets/landing.css', 'assets/landing.js'], gzip: 18 * KB, raw: 70 * KB },
  { label: 'fonts (self-hosted)', files: ['fonts/Manrope.woff2', 'fonts/DMSans.woff2', 'fonts/IBMPlexMono-400.woff2', 'fonts/IBMPlexMono-500.woff2'], gzip: 170 * KB, raw: 170 * KB },
  { label: 'vendor (jszip + three)', files: ['app/vendor/jszip.min.js', 'app/vendor/three.min.js'], gzip: 200 * KB, raw: 720 * KB }
];

let failed = false;
for (const budget of BUDGETS) {
  let raw = 0;
  let packed = 0;
  const missing = [];
  for (const file of budget.files) {
    const path = join(ROOT, file);
    if (!existsSync(path)) { missing.push(file); continue; }
    const bytes = readFileSync(path);
    raw += bytes.length;
    /* woff2 is already compressed; gzipping it again would only flatter it */
    packed += file.endsWith('.woff2') ? bytes.length : gzipSync(bytes, { level: 9 }).length;
  }
  const overGzip = packed > budget.gzip;
  const overRaw = raw > budget.raw;
  if (overGzip || overRaw || missing.length) failed = true;
  const mark = overGzip || overRaw ? '✗' : '✓';
  console.log(
    `${mark} ${budget.label}: ${(packed / KB).toFixed(1)} KB gzip of ${(budget.gzip / KB).toFixed(0)} KB` +
    ` (${(raw / KB).toFixed(1)} KB source, ceiling ${(budget.raw / KB).toFixed(0)} KB)` +
    `${missing.length ? ` — missing: ${missing.join(', ')}` : ''}`
  );
}

process.exit(failed ? 1 : 0);
