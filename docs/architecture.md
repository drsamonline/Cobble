# Architecture

Five files, no build step, no dependencies to install. This guide is the map you want before changing any of them.

## The picture

[`cobble-architecture.excalidraw`](cobble-architecture.excalidraw) is the whole system in one drawing: what is served, what runs, where the archive sits, and the two things that ever leave the device. Open it at [excalidraw.com](https://excalidraw.com) with *File → Open*, or in the VS Code Excalidraw extension. It is a scene, not an image, so it stays editable.

The short version of it: everything inside the dashed box is same-origin and local; the bottom row is the only traffic that exists.

## The tree

```
cobble/
├── index.html            landing page (what GitHub Pages serves first)
├── manifest.json         installable app: icons, shortcuts, colours
├── sw.js                 the service worker — one cache for the whole site
├── selftest.html         loads every precached file and says where it came from
├── favicon.svg
├── assets/
│   ├── landing.css       landing page styles
│   ├── landing.js        the skyline, the grow demo, day/night, copy button
│   └── upi-qr.svg
├── app/
│   ├── index.html        the whole app: sidebar, three views, four overlays
│   ├── theme.css         the design tokens (17 variables)
│   ├── styles.css        ~2,600 lines: layout, the city, the panels
│   ├── core.js           the share format, key derivation and import validator — no DOM
│   ├── app.js            ~950 lines: state, storage, render, wiring
│   ├── city3d.js         experimental WebGL layer, off unless ?3d=1
│   └── vendor/           jszip 3.10.1 and three r128, unmodified
├── fonts/                Manrope, DM Sans, IBM Plex Mono — woff2, latin subset
├── icons/               192, 512, maskable, apple-touch
├── docs/                 these guides
├── screenshots/          real renders of this repository — WebP, 502 KB for all fourteen
├── tests/                core.test.mjs — 24 tests, node --test
├── tools/                check-links.mjs, check-size.mjs
├── .github/workflows/    check.yml — links, size budget, script syntax
├── README.md
├── ENHANCEMENTS.md
├── CHANGELOG.md
├── NOTICE.md
└── LICENSE
```

The landing page and the app share no code on purpose. The app must work with nothing but a browser; the landing page may be as decorative as it likes. Keeping them apart means a change to the marketing page can never break someone's archive.

## The app, top to bottom

`app/index.html` is one page with three views and four overlays:

| Element | Purpose |
|---|---|
| `#city-view` | The city card, the intro, the district insight |
| `#timeline-view` | Every saved day, newest first |
| `#insights-view` | Numbers, milestones, observations, district bars |
| `#entry-modal` | Add a moment (editing and deleting are not built yet — see the enhancement list) |
| `#share-modal` | Export or import a city file |
| `#help-modal` | The short explanation of what the app is |
| `#day-backdrop` | The day drawer, which also holds the photo gallery |

Only the active view carries the `.hidden` class; `setView()` swaps them and updates the breadcrumb, the nav highlight and `body.city-view-active` (which the CSS uses to decide how much chrome the city gets).

`app/app.js` is a single IIFE — no modules, no bundler, so it works from any static host without MIME-type surprises. Inside it, roughly in order:

1. **Constants** — the storage keys, the six categories with their labels, colours and glyphs, and the atmosphere lists.
2. **Small helpers** — `$`, `$$`, `escapeHTML`, `localDate`, `formatDate`, `groupDays`. Every string that reaches `innerHTML` goes through `escapeHTML` first; if you add markup, keep that rule.
3. **Storage** — `openDatabase`, `saveToDatabase`, `loadArchive`, `save`, `updateStorageInfo`. Covered in detail in [the data model](data-model.md).
4. **Render** — `render()` calls `renderCity()`, `renderTimeline()` and `renderInsights()`. Everything is a full re-render of its container; there is no diffing and no virtual DOM. With a few thousand moments this is imperceptible; the thresholds are discussed in [ENHANCEMENTS.md](../ENHANCEMENTS.md).
5. **The city** — `renderCityScenes()` builds five district scenes from a seed, `startCityMotion()` owns panning and the animation loop.
6. **Sharing** — `exportCity` and `importCity` handle the file and the dialog; the format, the key derivation and the per-entry validation live in `core.js`, which touches no DOM and is therefore testable in Node.
7. **The sample city** — `makeDemoCity()`, `enterDemo()`, `exitDemo()`.
8. **Wiring** — one `init()` that attaches every listener. No inline `onclick` anywhere, so a strict Content-Security-Policy is feasible later.

## State

Three module-level variables carry the whole app:

```js
let entries = [];          // what is on screen
let personalEntries = [];  // your archive, set aside while the sample city is on
let demoMode = false;
```

Plus `databaseReady`, `saveQueue`, `photoData` and `atmosphere`. There is no store, no reducer and no event bus — a change calls `save()` and then `render()`, in that order, and the screen follows.

The sample city works by swapping `entries` for eighteen generated moments and setting `demoMode`. `save()` returns early while `demoMode` is true, so a stray save cannot overwrite your archive, and `exitDemo()` puts `personalEntries` back.

## The render loop

```
init()
  └─ render()                  empty city, so the shell looks alive immediately
  └─ startCityMotion()         panning, pointer capture, the animation tick
  └─ loadArchive()             IndexedDB → entries (or the localStorage fallback)
  └─ render()                  the real city
  └─ updateStorageInfo()       sizes and quota
```

`render()` is synchronous and idempotent. Panning calls `renderCityScenes()` directly rather than `render()`, so moving through districts does not rebuild the timeline or the achievements.

## The optional 3D layer

`city3d.js` is deliberately separate and deliberately deferential:

- it injects a Three.js `<script>` from cdnjs asynchronously;
- if the script fails, or WebGL is missing, it returns silently and the CSS city stays;
- if it succeeds, it appends a canvas over the illustrated city and draws a low-poly neighbourhood from the same category counts;
- it exposes `window.cobbleCity3D.setPan()` and `.setAtmosphere()`, which `app.js` calls only if the object exists.

Nothing else in the app depends on it. Deleting the file and its `<script>` tag leaves a complete, working app.

## The landing page

`index.html` + `assets/landing.css` + `assets/landing.js`. The hero skyline is generated the same way the city is — a seeded LCG over a fixed plan of fifteen blocks — so the page looks identical on every visit without shipping an image. The rest is ordinary HTML with an IntersectionObserver for the reveals, a `data-time` attribute on `<html>` for day/night, and about sixty lines of JavaScript for the grow demo.

Both pages share the same palette values, copied deliberately rather than imported: `--paper #f6f4ef`, `--ink #22302b`, `--primary #477d70`, `--accent #e2a66f`. If you change one, change the other.

## Offline: the worker and the manifest

`sw.js` sits at the repository root so one cache covers the landing page, the app, the docs hub and the fonts. It is registered twice — once from the landing page, once from `app/app.js` — and registration failures are swallowed, so a browser without workers simply loses the offline cache and nothing else.

- **Install** fetches every path in `PRECACHE` with `cache: reload`, tolerating a missing optional file, then calls `skipWaiting()`.
- **Activate** deletes every cache whose name is not the current one, then `clients.claim()`.
- **Fetch** — navigations are network-first with a cached shell as the fallback; everything else same-origin is cache-first with a background refill. Cross-origin requests (the sample city's Unsplash photographs) are left alone entirely.
- **Bumping** `CACHE_VERSION` and `ASSET_VERSION` together is how you ship a change. Both are at the top of the file.

`manifest.json` declares `start_url: "./app/"`, scope `./`, a maskable icon, and two shortcuts. `selftest.html` exists because "it works offline" is the kind of claim that should come with a button.

## The checks

`tools/check-links.mjs` resolves every local `href`, `src`, CSS `url()`, manifest icon and service-worker precache path, and fails if any page still references a CDN. `tools/check-size.mjs` holds four budgets. `.github/workflows/check.yml` runs both plus `node --check` on the four scripts. The link check exists because this repository has already made the classic mistake once: a path that works at a domain root and 404s on a project page.

## The core, and why it is separate

`app/core.js` is the only file with a boundary drawn around it: `deriveKey`, `encryptEntries`, `decryptBundle` and `normaliseEntry`. Everything else in the app is a render function with a DOM dependency. Keeping the data-touching code DOM-free means `tests/core.test.mjs` can run the real functions under `node --test` — Node 20 exposes the same Web Crypto — instead of a reimplementation that could drift.

`core.js` assigns `globalThis.CobbleCore` and also `module.exports` when it is loaded as CommonJS, which is how the tests reach it. It is loaded before `app.js` in `index.html` and is in the service worker's precache list.

## What is not here

- **No automated browser test.** The screenshots in this repository are produced by a headless Chrome script that drives the real app, and the offline claim was verified the same way — but neither is committed as a test yet. That is the first item in the [enhancement list](../ENHANCEMENTS.md).
- **No unit tests.** The import validator and the crypto round-trip are the two places worth one.
- **No analytics, no error reporting.** By design, not by omission.
