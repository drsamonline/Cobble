# Working on this repository

Instructions for anyone — human or agent — changing Cobble. Short on purpose. The reasoning lives in [`docs/architecture.md`](docs/architecture.md); this file is the part you must not get wrong.

## What this is

A static web app with no build step and no backend. Eight files in `app/` are the product; everything else is the landing page, the documentation, the tests and the checks. A visitor's moments live in their browser and never reach a server, because there is no server.

## Run it

```bash
python3 -m http.server 8000        # landing at /, app at /app/, translated pages at /hi.html and /gu.html
node --test tests/                 # 37 tests, no dependencies
node tools/check-links.mjs         # every local reference, the precache list, the manifest, a ban on CDN references
node tools/check-size.mjs          # six budgets, gzipped
node tools/check-version.mjs       # CHANGELOG, README badge and sw.js agree
npm ci && CHROME_PATH=… node tools/browser-check.mjs   # axe on four documents, layout shift, a smoke test, saved cities
```

Serve over `http://` or `https://`. `file://` gives you no IndexedDB and no Web Crypto, which silently costs the archive and the share feature.

## Invariants — break one of these and it is a bug, not a preference

1. **No request leaves this origin at runtime.** Fonts are in `fonts/`, JSZip and Three.js are in `app/vendor/`. `tools/check-links.mjs` fails the build if a page or script starts pointing at a CDN. The one exception is the sample city's Unsplash photographs, which are `img-src` only.
2. **Paths inside `app/` are relative.** The app is served from a subdirectory (`/Cobble/app/`), so `/theme.css` would 404 on the published site. The brand link is `../`, the worker is `../sw.js`.
3. **Every string that reaches `innerHTML` goes through `escapeHTML()` or `highlight()`.** Nothing else is acceptable, including ids and dates. The one unescaped interpolation is a photo `src`, safe only because `core.js` admits nothing but base64 `data:image/…` URLs — do not relax that regex.
4. **Data-touching code lives in `app/core.js`.** The bundle format, key derivation, the import validator, the merge rule, the foreign-journal parser and the vault are there so `tests/core.test.mjs` can run the real code in Node. Do not re-implement any of it in `app.js`.
5. **Bump the cache when you ship.** `CACHE_VERSION` and `ASSET_VERSION` at the top of `sw.js`, and keep the README badge and the newest `CHANGELOG` heading in step — `check-version.mjs` fails if they disagree.
6. **Add new runtime files to three places**: the page's `<script>`/`<link>`, `PRECACHE` in `sw.js`, and the list in `selftest.html`. `check-links.mjs` verifies the first two agree.
7. **One live archive.** Cities are a shelf of snapshots (`snapshot:<id>`), not several archives running at once. Loading one writes the current archive back, swaps the entries and binds the live archive to the city. Three attempts at live switching each mixed two cities; do not reopen that without reading `ENHANCEMENTS.md` first.
8. **The 3D view is an enhancement, never the only route.** Everything it does — reading a district, opening a moment, seeing the year — exists in the illustrated city and the panels. If `scene3d.js` throws or WebGL is missing, the app is complete without it.
9. **A new interface string goes into all three dictionaries** in `app/i18n.js` — English, Hindi, Gujarati — with a `data-i18n` key on the element. Sentences with numbers in them are templates (`say()`), not strings with holes. And an element's accessible name must contain its visible text: that rule has been broken and fixed five times, and `browser-check.mjs` fails on it now.
10. **New prose on the landing page needs a home in `hi.html` and `gu.html` too**, or the page quietly becomes English-only again.

## Where things are

| Path | What it is |
|---|---|
| `app/core.js` | Share format, PBKDF2/AES-GCM, vault, merge rule, journal parser — no DOM, unit-tested |
| `app/app.js` | State, storage, render functions, wiring — one IIFE, no modules |
| `app/scene3d.js` | The 3D town: instanced geometry, its own camera, picking, quality dial |
| `app/ambience.js` | Wind, rain and birds, synthesised in WebAudio, off until asked |
| `app/i18n.js` | Three dictionaries, `t()` for words, `say()` for sentences |
| `app/styles.css` | Layout, the illustrated city, panels. Large and hand-written |
| `index.html`, `hi.html`, `gu.html`, `assets/` | Landing pages. Share the palette, not the code |
| `docs/` | Guides, plus a hand-built hub page at `docs/index.html` |
| `packaging/` | Tauri and Capacitor wrappers — authored, not yet built |
| `screenshots/` | Real renders, WebP, referenced by README and the landing pages |
| `tools/`, `tests/`, `.github/workflows/` | The checks; `check.yml` runs on push, `package.yml` on dispatch only |

## Conventions that keep the diff small

- **Dates are `YYYY-MM-DD` strings**, never `Date` objects in storage. Parse as `new Date(date + 'T12:00:00')` to stay clear of DST edges.
- **Categories are keys, not labels.** Renaming `everyday` orphans every moment filed under it; add an alias instead.
- **Photos are data URLs**, resized to 1280 px on the long edge, JPEG 0.76, before they are stored. On disk they live in their own record, not inside the moments JSON.
- **The voice is plain and unimpressed with itself.** Second person, short sentences, no streaks and no scolding. Read the landing page before writing new copy.
- **Accessibility is not a later pass.** Live regions, focus traps, labels and contrast have all been fixed once; do not undo them.
- **Measure before claiming a speed-up.** The 3D scene went from 4,089 draw calls to 75 and the frame rate on this machine did not move, because it renders in software. `docs/performance.md` records both numbers and says which one the claim rests on.

## Before you say it is done

Run the tests and the four checks, then drive the change in a browser — add a moment, edit it, delete it, undo, export, import with the wrong PIN, search, reload offline, save a city and load it back. Every claim in the README about behaviour is one someone verified that way.

## Licence

PolyForm Noncommercial 1.0.0. Third-party work and its terms are listed in [`NOTICE.md`](NOTICE.md). Legal surface: [`PRIVACY.md`](PRIVACY.md), [`SECURITY.md`](SECURITY.md).
