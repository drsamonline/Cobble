# Working on this repository

Instructions for anyone — human or agent — changing Cobble. Short on purpose. The reasoning lives in [`docs/architecture.md`](docs/architecture.md); this file is the part you must not get wrong.

## What this is

A static web app with no build step and no backend. Five files in `app/` are the product; everything else is the landing page, the documentation, the tests and the checks. A visitor's moments live in their browser and never reach a server, because there is no server.

## Run it

```bash
python3 -m http.server 8000     # landing at /, app at /app/
node --test tests/              # 24 tests, no dependencies
node tools/check-links.mjs      # every local reference, the precache list, the manifest, and a ban on CDN references
node tools/check-size.mjs       # four size budgets
```

Serve over `http://` or `https://`. `file://` gives you no IndexedDB and no Web Crypto, which silently costs the archive and the share feature.

## Invariants — break one of these and it is a bug, not a preference

1. **No request leaves this origin at runtime.** Fonts are in `fonts/`, JSZip and Three.js are in `app/vendor/`. `tools/check-links.mjs` fails the build if a page or script starts pointing at a CDN. The one exception is the sample city's Unsplash photographs, which are `img-src` only.
2. **Paths inside `app/` are relative.** The app is served from a subdirectory (`/Cobble/app/`), so `/theme.css` would 404 on the published site. The brand link is `../`, the worker is `../sw.js`.
3. **Every string that reaches `innerHTML` goes through `escapeHTML()` or `highlight()`.** `highlight()` escapes; `escapeHTML()` escapes. Nothing else is acceptable, including ids and dates. The one unescaped interpolation is a photo `src`, and it is safe only because `core.js` admits nothing but base64 `data:image/…` URLs — do not relax that regex.
4. **Data-touching code lives in `app/core.js`.** The bundle format, key derivation and the import validator are there so `tests/core.test.mjs` can run the real code in Node. Do not re-implement any of it in `app.js`.
5. **Bump the cache when you ship.** `CACHE_VERSION` and `ASSET_VERSION` at the top of `sw.js`. A stale cache is the one failure mode a service worker adds.
6. **Add new runtime files to three places**: the page's `<script>`/`<link>`, `PRECACHE` in `sw.js`, and the list in `selftest.html`. `check-links.mjs` verifies the first two agree.

## Where things are

| Path | What it is |
|---|---|
| `app/core.js` | Share format, PBKDF2/AES-GCM, import validator — no DOM, unit-tested |
| `app/app.js` | State, storage, render functions, wiring — one IIFE, no modules |
| `app/styles.css` | Layout, the illustrated city, panels. Large and hand-written |
| `app/city3d.js` | Experimental WebGL layer, off unless `?3d=1` |
| `index.html` + `assets/` | Landing page. Shares the palette, not the code |
| `docs/` | Guides, plus a hand-built hub page at `docs/index.html` |
| `screenshots/` | Real renders, WebP, referenced by README and the landing page |
| `tools/`, `tests/`, `.github/workflows/check.yml` | The checks |

## Conventions that keep the diff small

- **Dates are `YYYY-MM-DD` strings**, never `Date` objects in storage. Parse as `new Date(date + 'T12:00:00')` to stay clear of DST edges.
- **Categories are keys, not labels.** Renaming `everyday` orphans every moment filed under it; add an alias instead.
- **Photos are data URLs**, resized to 1280 px on the long edge, JPEG 0.76, before they are stored.
- **The voice is plain and unimpressed with itself.** Second person, short sentences, no streaks and no scolding. Read the landing page before writing new copy.
- **Accessibility is not a later pass.** Live regions, focus traps, labels and contrast have all been fixed once; do not undo them.

## Before you say it is done

Run the tests and the two checks, then drive the change in a browser — add a moment, edit it, delete it, undo, export, import with the wrong PIN, search, reload offline. Every claim in the README about behaviour is one someone verified that way.

## Licence

PolyForm Noncommercial 1.0.0. Third-party work and its terms are listed in [`NOTICE.md`](NOTICE.md). Legal surface: [`PRIVACY.md`](PRIVACY.md), [`SECURITY.md`](SECURITY.md).
