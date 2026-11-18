#!/usr/bin/env node
/* A size budget for the app shell, so "it is small" stays true.
 * Runs in CI next to the link check. Dependency-free.
 *
 *   node tools/check-size.mjs
 */
import { statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KB = 1024;

const BUDGETS = [
  { label: 'app shell (html + css + js)', files: ['app/index.html', 'app/theme.css', 'app/styles.css', 'app/app.js', 'app/city3d.js'], limit: 190 * KB },
  { label: 'landing page', files: ['index.html', 'assets/landing.css', 'assets/landing.js'], limit: 60 * KB },
  { label: 'fonts (self-hosted)', files: ['fonts/Manrope.woff2', 'fonts/DMSans.woff2', 'fonts/IBMPlexMono-400.woff2', 'fonts/IBMPlexMono-500.woff2'], limit: 160 * KB },
  { label: 'vendor (three + jszip)', files: ['app/vendor/three.min.js', 'app/vendor/jszip.min.js'], limit: 720 * KB }
];

let failed = false;
for (const budget of BUDGETS) {
  let total = 0;
  const missing = [];
  for (const file of budget.files) {
    const path = join(ROOT, file);
    if (!existsSync(path)) { missing.push(file); continue; }
    total += statSync(path).size;
  }
  const over = total > budget.limit;
  if (over || missing.length) failed = true;
  const mark = over ? '✗' : '✓';
  console.log(`${mark} ${budget.label}: ${(total / KB).toFixed(1)} KB of ${(budget.limit / KB).toFixed(0)} KB${missing.length ? ` — missing: ${missing.join(', ')}` : ''}`);
}

process.exit(failed ? 1 : 0);
