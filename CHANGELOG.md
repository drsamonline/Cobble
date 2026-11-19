# Changelog

All notable changes to Cobble. Dates are ISO 8601.

## 1.19.0 — 2026-11-19

### Changed

- **Forty-eight near-grey text colours became three tokens.** `--text-strong`, `--text-secondary` and `--text-muted`, across 71 declarations. The values are within a few points of the ones they replace, so nothing looks different — but the stylesheet no longer carries forty-seven ways to write the same grey, and the dark theme has three values to override instead of a list.

  Only near-greys were touched: colours with any real saturation are semantic (a district's own colour), and flattening those would lose meaning.

### Measured

- **How the timeline scales**, in `docs/performance.md`: 9 ms to filter at 100 moments, 35 ms at 500, 130 ms at 2,000, **598 ms at 5,000**. Load time stays flat at about 2 s because it is dominated by the page and the fonts. The virtualisation item now has a real threshold — two thousand moments — instead of a guess.

## 1.18.0 — 2026-11-19

The instrument, and the five defects it found on its first run.

### Added

- **`tools/browser-check.mjs`** — serves the repository locally, drives it in headless Chrome, and fails the build on any of: an axe accessibility violation at serious or critical, a layout shift over 0.1, or a behaviour regression. It runs on every push, in its own CI job with Chrome installed.
- The smoke test inside it: two moments load from storage, `N` opens the form, a save lands, an edit is undone, a delete is undone, search narrows, a filter chip applies, the app reloads with the network off, and no page errors occur.

### Fixed — all found by that check, none by eye

- **Seven footer links and labels on the landing page sat at 4.24:1**, because the footer's paper is darker than the page and the muted token was tuned for the page.
- **Six labels in the app sat between 4.35:1 and 4.47:1** on the sidebar and top-bar tints — the same mistake one surface further in.
- **Three buttons had accessible names that did not contain their visible text.** `#share-button` announced "Share or import a city" while reading "Share city"; the HUD toggle announced "Hide city controls" while reading "Hide controls"; the sample-city toggle announced "Exit sample city and return to my city" while reading "Back to my city".
- The check itself had a bug on its first run: it seeded storage and then reloaded the *sample-city* URL, so the seeded moments were never read. That is the difference between a test that passes and a test that means something.

## 1.17.0 — 2026-11-19

### Added

- **Save a postcard.** A button in the page footer draws the skyline to a 1200×630 PNG and downloads it: the wordmark, the city's level, `19 moments · 19 days · 6 districts`, the districts' colours as bars with windows, and the line *your life, taking shape*. No text from any moment, no dates, no photos — nothing personal leaves the device in a picture someone might post.

### Verified

- Downloaded in headless Chrome: `cobble-postcard-2026-11-19.png`, 123 KB, valid PNG, 1200×630, and inspected by eye — bars, windows, wordmark and level all render.

## 1.16.0 — 2026-11-19

### Added

- **Filters on the timeline**, which compose with the search box: six district chips, "Landmarks only", "With a photo", and a Clear button that appears only when something is active. Chips are `aria-pressed` toggles, so a screen reader hears which are on, and the status line says what is narrowing the list — *"5 moments in 5 days — landmarks · with a photo"*.
- While anything is active, every matching day is shown rather than the first fifty, and the empty state distinguishes "nothing matches that word" from "nothing matches those filters".

### Verified

- Filters alone, in combination, and composed with search: 19 moments → 4 (Nature) → 7 (Nature or Joy) → 9 (landmarks) → 5 (+ photo) → 1 (+ "rain"), then Clear left the search intact and returned 2.
- The chip for Outside & nature now says **Nature**, matching the district's own short name used in the status line.

## 1.15.0 — 2026-11-19

### Added

- **A year heatmap**, in Discoveries: one square per day for the last twelve months, weeks running down the columns, shaded by how many moments that day held (0, 1, 2–3, 4+). Days with moments are buttons — click one and it opens that day in the drawer; days without are inert spans with a title. Every square carries an `aria-label` like "20 November 2025 — 1 moment". Month labels are spaced so they cannot collide, and the whole strip scrolls sideways on a narrow screen.
- The panel hides itself when the archive is empty, like the "on this day" strip.

### Verified

- 369 cells over a seeded year, 14 of them clickable, all four shade levels present, month labels running Nov → Nov, and a click opening the right day (*Thursday, November 20, 2025*).
- First attempt had "NovDec" overlapping where two months started in adjacent weeks; labels now need four columns of room and skip the ones that would collide.

## 1.14.0 — 2026-11-19

A correction, and it matters more than a feature.

### Corrected

- **The layout-shift "defect" was not real.** 1.9.0 reported CLS 0.186 on a cold load and listed six experiments that failed to isolate it. Re-measured with a stated method — six runs in fresh browsers with the cache disabled, plus eight warm and eight with webfonts blocked — CLS is **0.008–0.010**, a fifth of Google's threshold, on every single run. The 0.186 came from the first load in a freshly started environment and never reproduced.

  `docs/performance.md` now says so plainly, keeps the retraction visible rather than deleting the claim, and records the lesson: one sample of a timing metric is noise.

- The enhancement list loses that defect and gains the check it should have had instead: **measure CLS and axe in CI** (item 2.16, rewritten), so the numbers are tracked rather than chased.

## 1.13.0 — 2026-11-19

The contrast sweep finished, measured rather than eyeballed.

### Fixed

- **Seventy-one text colours were below 4.5:1 on the app's own paper.** Not a few stragglers — the stylesheet had accumulated near-duplicate greys (`#929990`, `#929992`, `#929890` and eight more within three points of each other) from years of hand-editing. Each one was darkened along its own hue until it cleared 4.6:1 against `#f6f4ef`, the darkest of the app's light surfaces, and the result was checked by re-rendering every screen: **81 declarations changed, zero text colours left below 4.5:1.**
- The method is repeatable: extract every `color:` hex, skip anything light enough to be text on a dark surface, compute the ratio against the darkest light surface, darken in two-point steps until it passes, then look at the screenshots.

### Known, and worth doing later

- The sweep fixed the values but not the cause. Those 71 colours should be three or four semantic tokens (`--text-secondary`, `--text-muted`, `--text-faint`, `--text-warm`) rather than 71 hand-picked hexes. Recorded in the enhancement list, because a token pass is a redesign of the stylesheet rather than a substitution.

## 1.12.0 — 2026-11-19

### Added

- **A dark interface, and a light one.** A ☾ button in the top bar flips the shell — sidebar, top bar, panels, cards, dialogs, inputs and the drawer — and the choice is remembered in `cobble-shell-theme`. With no choice made, it follows `prefers-color-scheme`, so a dark-mode system gets a dark app on the first visit. The city keeps its own palette and its own Night control; this is the interface around it, not a filter over it.
- **`tools/check-version.mjs`** — fails the build when `sw.js`, the README badge and the newest `CHANGELOG.md` heading disagree. It found one on its first run: the badge had been stuck at 1.5.0 for seven releases.

### Verified

- Contrast measured in the dark palette: body text 16.0:1, panel text 14.65:1, secondary 9.03:1, muted 6.65:1, links 11.04:1, placeholder 5.41:1 — every pair above 4.5:1.
- Driven in headless Chrome across all three views, with the theme following the system preference, toggling by hand, and surviving a reload.

## 1.11.0 — 2026-11-19

Two more off the short list.

### Changed

- **Undo now covers edit and import, not just delete.** One slot, one action: the bar names what it will take back ("Moment updated.", "Moment removed.", "2 moments imported.") and `Ctrl`/`Cmd`+`Z` runs the same thing. Editing parks the previous version and restores it; importing remembers the ids it added and removes exactly those.

### Added

- **A storage guard.** At 80% of the origin quota a warning appears in the Discoveries view, with a one-click readable backup; at 95% the wording changes to say new moments may not save. Past 97% the photo picker refuses a new photo and says why, instead of letting the save fail afterwards. The numbers come from `navigator.storage.estimate()`, and the guard says nothing at all when the browser will not answer.

### Verified

- Three undo paths driven in headless Chrome: edit → undo restored the original text; delete → `Ctrl+Z` restored the moment; import of two moments took the archive from 1 to 3 and undo took it back to 1.
- The guard at 30%, 85% and 97% of quota: silent, warning, urgent.

## 1.10.0 — 2026-11-19

Two items off the short list.

### Added

- **On this day.** A strip under the city that shows moments from the same calendar date in earlier years, newest first, with a "1 yr" / "3 yrs" badge and the district's colour. Click one and it opens that day in the drawer. The panel hides itself entirely when there is nothing to show, so a new city never meets an empty box.
- The sample city now includes one moment dated exactly a year ago today, so the strip has something to show on a first visit. Exact date arithmetic, not "365 days", so it lands on the same month and day across leap years.

### Changed

- **Photos are encoded as WebP when the browser can, and JPEG when it cannot**, keeping whichever is smaller. A 400×200 test JPEG with EXIF orientation 6 now stores as `data:image/webp` at 200×400 — the rotation is applied, so a photo taken sideways on a phone is stored the way it was meant to be seen. The import validator already accepted WebP; nothing else changed.

## 1.9.0 — 2026-11-19

A performance pass, with the numbers written down.

### Added

- **`docs/performance.md`** — requests, transfer sizes, paint timings and CSS coverage for both pages, the fixes that came out of them, and one defect stated plainly rather than buried: the landing page's layout shift is 0.018 warm and 0.186 cold, and six experiments failed to pin the mechanism down. The page lists all six so the next person does not repeat them.

### Changed

- **The two hero fonts are preloaded** on both pages, and **the app's three scripts carry `defer`**. Neither moved the layout-shift number; both are correct regardless.

### Measured

- Landing page: 11 requests, 273 KB, FCP 1.66 s. App: 20 requests, 234 KB, FCP 1.12 s.
- **100% CSS coverage on both pages** — every rule in both stylesheets is used. There is no dead CSS to purge, which is why the size budgets are the guard.

## 1.8.0 — 2026-11-19

### Added

- **An architecture diagram** — `docs/cobble-architecture.excalidraw`, 36 elements, editable in Excalidraw. It answers one question in one look: what is local, what is served, and the two things that ever leave the device. The layout was checked by rendering it and looking, twice, because a diagram that overlaps its own arrows is worse than no diagram.

### Recorded, not resolved

- **The name is contested.** A search for "Cobble" turns up a funded group-planning app (trycobble.com), an audio walking-tour app from Cobble Media Limited, and a Pebble watch app. None of them is a journalling tool, and this project is non-commercial, so the practical cost is findability and confusion rather than a legal risk. It is written into [ENHANCEMENTS.md](ENHANCEMENTS.md) as a decision to make rather than a task to do.

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
