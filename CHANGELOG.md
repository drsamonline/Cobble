# Changelog

All notable changes to Cobble. Dates are ISO 8601.

## 1.7.0 — 2026-11-19

Performance and handover.

### Changed

- **Every screenshot is WebP.** Fourteen images went from **2,406 KB to 502 KB**, a 79% cut, with no visible difference at the sizes they are displayed. The landing page's gallery is the heaviest thing on it, and it is now a fifth of what it was. `og:image` and the README point at the WebP files; the PNGs are gone rather than kept "just in case", because a repository that ships both ships the wrong one eventually.
- **`AGENTS.md`** — a short file for whoever works on this next: the six invariants that are bugs if broken (no CDN, relative paths inside `app/`, escape everything that reaches `innerHTML`, data-touching code lives in `core.js`, bump the cache, add new files to three lists), where things are, and the checks to run before saying a change is done.

### Added

- **A GitHub release** for 1.6.0, with the notes the changelog already carried: https://github.com/drsamonline/Cobble/releases

## 1.6.0 — 2026-11-19

An audit pass with four skills, and the fixes it turned up.

### Added

- **`PRIVACY.md`** — what is stored, in which browser store, what leaves the device, how to delete it, and the three requests that do leave. Every claim names the file that proves it, so a reader can check rather than trust.
- **`SECURITY.md`** — how to report a vulnerability, what is in scope (a malicious `.cobble` file is the real surface), and the limitations listed rather than buried: no encryption at rest, no CSP header, no `frame-ancestors`, six-digit PINs are guessable offline.
- Both are linked from the README, the docs hub and the landing footer. There is still no terms-of-service file, and the README now says why: no service, no accounts, nothing to buy.

### Fixed

- **Muted text failed contrast.** Measured, not guessed: the app's muted grey was 3.02:1 on its own card and the landing page's was 3.4:1 on paper, against the 4.5:1 that small text needs. Both tokens are now `#66726c`, which measures 4.56–4.97:1 across every surface they sit on, and the landing page's section numbers moved from the decorative apricot (1.93:1) to a darkened `#8f6130` (4.87:1).
- **A cancelled edit left `editingId` set**, so a later save could have overwritten the moment you had been editing instead of adding a new one. `closeEntry()` now clears it, and the save path clears it too if the moment has vanished.
- **The service worker cached every stylesheet and script twice** — once under its bare path and once under a `?v=` URL it never matched, because lookups use `ignoreSearch`. The versioned list is gone.
- **Copy.** Thirteen em dashes in the landing page, five now; the hero lede, the three rule cards and the privacy paragraph were rewritten to state things rather than stage them. Every claim was kept.

### Known, measured, and not fixed

- Roughly forty distinct small-text colours in `app/styles.css` still sit between 2.5:1 and 4.4:1. They are mostly chip labels and one-off captions; fixing them is a visual redesign rather than a find-and-replace, so it is an enhancement item with the measurements attached rather than a silent half-fix.

## 1.5.0 — 2026-11-19

The share format and the import validator moved into `app/core.js`, and got a test suite.

### Changed

- **`app/core.js`** now holds the things that do not need a browser: the bundle format, `deriveKey`, `encryptEntries`, `decryptBundle`, and `normaliseEntry` (the import validator). `app.js` calls it. Same behaviour, one copy of the rules instead of two.
- The app shell budget went from 190 KB to 200 KB to cover the extra file; it currently sits at 162 KB.

### Added

- **`tests/core.test.mjs`** — 24 tests, no dependencies, `node --test tests/`. They cover: a city round-tripping through the encrypted bundle; two exports of the same city producing different salt, IV and ciphertext; a wrong PIN failing; a flipped ciphertext byte being detected rather than decrypted; malformed bundles refused before any crypto runs; weights clamped rather than trusted; unknown fields dropped; and a table of eleven malformed moments (bad ids, empty text, impossible dates, unknown districts, a `javascript:` photo, an SVG data URL) each rejected for its own reason.
- **A hostile-file test**: a bundle carrying two good moments and three broken ones imports exactly the two good ones.
- **CI runs the tests** — `node --test tests/` sits beside the link check and the size budget.

The validator's constants now have one home. `docs/data-model.md` points at `core.js` for the limits rather than repeating them from memory.

## 1.4.0 — 2026-11-19

**Search.** The most-requested missing feature, and the last of the app's obvious absences.

- **One box over the whole archive**, in the timeline. Results keep their day grouping; the matching run of characters is marked in every card and in the day drawer.
- **Folded matching.** Case and accents are stripped on both sides, so `cafe` finds `café`, `sebastien` finds `Sébastien`, `crepe` finds `crêpe`. Plain substring — no stemming, no ranking, no fuzzy distance, because an archive of a few thousand moments does not need any of that.
- **It searches three things**: what you wrote, the district name ("nature" finds every outside moment), and the date (`2026-11` finds a month).
- **Honest states.** A query with no hits says so and suggests a shorter word; the count line changes from "18 moments · 18 days" to "1 found"; the clear button appears only when there is something to clear; `Esc` in the box clears it.
- While a search is active, every matching day is shown, not just the first fifty of the archive.

Also in this release: an empty archive now carries one line about the city living in this browser, and points at **Share city → Export readable backup** — the answer to the most common support question.

## 1.3.0 — 2026-11-19

The top of the [enhancement list](ENHANCEMENTS.md) — the things a journalling app needs before anything else.

### Added

- **Edit a moment.** Every card in the day drawer now has an **Edit** button that reopens the entry form pre-filled — text, date, district, weight and photo. The dialog title becomes "Change a moment" and the button reads "Save changes". The id and creation time are preserved.
- **Delete a moment**, with **Undo**: a strip appears for twenty seconds with an Undo button, and `Ctrl`/`Cmd`+`Z` works too.
- **A readable backup.** "Export readable backup" writes every moment to `cobble-backup-YYYY-MM-DD.json` — plain, unencrypted, with a note in the file saying so. The encrypted `.cobble` export stays the default for sending a city to someone; this one is for keeping it.
- **The atmosphere is remembered.** Theme, mood, weather and day/night are stored in `cobble-atmosphere-v1` and restored on the next visit.
- **Keyboard.** `N` opens a new moment from anywhere outside a text field; `Ctrl`/`Cmd`+`Z` undoes a delete; `Esc` already closed overlays.
- **A print stylesheet.** Printing the timeline now drops the sidebar, the controls and every overlay, and prints the days with their moments, page-break-safe.

### Accessibility

- **The toast announces itself** — `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. Every save, every failure and every undo now reaches a screen reader.
- **Focus is trapped in dialogs** and returned to whatever opened them on `Esc`.
- **A skip link** ("Skip to your city") is the first thing in the tab order, and the sidebar has a name.
- **All four overlays are labelled dialogs** (`role="dialog"`, `aria-modal`, `aria-labelledby`/`aria-label`). One nested duplicate was removed.
- **The help panel links to the source, the licence and the docs.**

### Fixed

- **"Edit" opened the form behind the drawer.** All four backdrops shared `z-index: 20` and the drawer comes later in the DOM, so the entry modal painted underneath the panel it was opened from. The entry modal now sits at 30.

### Changed

- The landing page's service-worker registration moved out of an inline `<script>` into `assets/landing.js`. It was the last inline script on the site, so a `script-src 'self'` policy no longer needs an exception.
- Service worker `CACHE_VERSION` v2, `ASSET_VERSION` 1.3.0.

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
- **The app assumed a domain root.** `downloadAppPackage()` fetched `/index.html` and its siblings, which fails on a project page such as `drsamonline.github.io/Cobble/app/`. All paths are now relative, and the brand link points at `../`.
### Moved

- The app now lives in `app/`, with the landing page at the root. Every reference inside the app was already relative except the brand link and the package downloader, both fixed above.

### Known gaps

These are the top of the [enhancement list](ENHANCEMENTS.md), and they are stated here rather than hidden:

- No delete or edit for a saved moment — the entry modal only adds.
- No service worker and no manifest, so the app is not installable and not offline on a cold load.
- The toast has no `aria-live`, so save confirmations are silent to a screen reader.
- No search.
- Three dependencies still come from public CDNs: Google Fonts, Tailwind's Play CDN (two classes), and optionally Three.js and JSZip.
