# Changelog

All notable changes to Cobble. Dates are ISO 8601.

## 1.2.0 — 2026-11-19

Renamed, before the first release, from *Elsewhere* to **Cobble**. Nothing had shipped and nobody had an archive, which is the only cheap moment to change a name that is baked into storage keys, a file extension and a URL.

- **Name.** *To cobble* is to make something out of whatever is at hand; a cobble is the stone underfoot. The tagline becomes "a city made of small things", and "your life, taking shape" stays as the emotional line.
- **Storage keys** are now `cobble-archive` (IndexedDB) and `cobble-moments-v1` (the localStorage fallback).
- **The share format** is `cobble-pincode`, and exported files end in `.cobble`.
- **Every URL, badge, manifest field, service-worker cache name and screenshot** was regenerated to match.
- The icon set is unchanged: three bars, a skyline, in the same palette.

## 1.1.0 — 2026-11-18

The app becomes genuinely self-contained: no CDN at runtime, works with the network off, installable, and checked in CI. Everything in this release was adapted from the other repositories in the same collection — see [Built on the fleet](README.md#built-on-the-fleet).

### Added

- **A service worker** (`sw.js`) at the site root. Network-first for navigations, cache-first for same-origin assets, cross-origin requests untouched. One versioned cache covers the landing page, the app, the fonts, the icons and the docs hub; the old cache is deleted on activate.
- **A web app manifest** (`manifest.json`) with a maskable icon, a standalone display mode and two shortcuts — "My city" and "Sample city". The site is installable from the address bar.
- **An icon set** (`icons/`) generated from the site's own three-bar mark: 192, 512, maskable 512 and a 180 px apple-touch icon, plus `favicon.svg`.
- **`selftest.html`** — loads every precached file and reports, per file, whether it came from the cache or the network. The offline claim now has a button behind it.
- **Self-hosted fonts** (`fonts/`): Manrope, DM Sans and IBM Plex Mono as woff2, latin subset, 118 KB total. Manrope and DM Sans arrive from Google as one variable file each, so each is declared once with a weight range instead of five times.
- **Vendored libraries** (`app/vendor/`): JSZip 3.10.1 and Three.js r128, unmodified, with their licence headers and a README recording version, licence and upstream.
- **Two checks and a workflow** — `tools/check-links.mjs` resolves every local reference including the service-worker precache list and the manifest, and fails if any page points at a CDN again; `tools/check-size.mjs` holds four size budgets; `.github/workflows/check.yml` runs both plus `node --check` on the four scripts.

### Changed

- **The 3D layer is now opt-in** and labelled experimental. It renders a white floor and floats its buildings above it on the machines it was tested on; with Three.js served locally that would have become the default view for everyone. It is now behind `app/?3d=1` (or `#3d`), and Three.js is not downloaded unless you ask for it. The camera in `city3d.js` also now corrects for the viewport aspect ratio, which it never did. Repairing the scene is [item 6.1](ENHANCEMENTS.md#6-the-3d-layer) on the enhancement list.
- **Tailwind is gone.** It was loaded from a CDN to provide exactly two utility classes on `<body>`; those two rules are now in `theme.css`.
- **`app/styles.css` no longer `@import`s Google Fonts** — the `@import` had been duplicating the `<link>` in the HTML and blocking the first paint.
- **The service worker is registered from both pages**, and from `app/app.js` rather than inline, so a strict `script-src 'self'` policy is now feasible for the app.

### Verified

- Fonts resolve from the local files (`document.fonts.check` true for all three families).
- With the network switched off, `/app/` reloads and renders from the cache.
- "Download app package" still produces a zip, now using the vendored JSZip.
- A page load makes no request to any host but its own — the only external request in the whole app is the sample city's Unsplash photographs.

## 1.0.0 — 2026-11-18

The first public release: the app as it was written, plus the four fixes it needed to be a repository rather than a folder of files.

### Added

- **Landing page** (`index.html`, `assets/`) — a survey-sheet design in the app's own palette, with a skyline generated from a seed rather than an image, a day/night switch, a six-button "grow a block" demo, and the support block.
- **Documentation** (`docs/`) — getting started, how the city works, architecture, data model, privacy and security, customising, deploying, and an FAQ.
- **Enhancement list** (`ENHANCEMENTS.md`) — every idea, ordered by effort, quick wins first.
- **Screenshots** (`screenshots/`) — twelve real renders of this repository at 1440×900, 1440×1000 and 390×844, produced with headless Chrome against the sample city.
- **Deep link into the sample city** — `app/?demo=1` and `app/#demo` open it directly. The landing page's "Wander a sample city" button uses it.
- **`aria-label` on the share button**, which previously relied on `title` alone.

### Fixed

- **The achievements grid rendered as plain stacked text.** `app.js` generated `.achievement-card`, `.achievement-icon`, `.achievement-copy`, `.achievement-progress` and `.achievement-status`, and `styles.css` contained no rules for any of them. The Discoveries view now shows a proper grid, with earned states, icons and progress bars.
- **The mobile share button was an empty pill.** It hides its label with `font-size: 0`, which also hid the `↗` glyph. The glyph is restored with a `::before`.
- **The add button showed a tofu box.** It used the fullwidth plus `＋` (U+FF0B), which DM Sans does not carry, so "Add a moment" rendered as a missing-glyph square on systems without a fallback for that codepoint. Replaced with an ordinary `+`.
- **The app assumed a domain root.** `downloadAppPackage()` fetched `/index.html` and its siblings, which fails on a project page such as `drsamonline.github.io/cobble/app/`. All paths are now relative, and the brand link points at `../`.
### Moved

- The app now lives in `app/`, with the landing page at the root. Every reference inside the app was already relative except the brand link and the package downloader, both fixed above.

### Known gaps

These are the top of the [enhancement list](ENHANCEMENTS.md), and they are stated here rather than hidden:

- No delete or edit for a saved moment — the entry modal only adds.
- No service worker and no manifest, so the app is not installable and not offline on a cold load.
- The toast has no `aria-live`, so save confirmations are silent to a screen reader.
- No search.
- Three dependencies still come from public CDNs: Google Fonts, Tailwind's Play CDN (two classes), and optionally Three.js and JSZip.
