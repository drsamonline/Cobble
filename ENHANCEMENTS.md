# Enhancement list

Everything Cobble could do next, in order of effort — quick wins first. Nothing here is a promise of a date; it is a map of the terrain, with the path that costs least marked in chalk.

Each entry says **what**, **why it matters**, **where** it lands, and **how long** it should take someone who knows the codebase. Effort is honest: `S` is under an hour, `M` is an afternoon, `L` is a day or two, `XL` is a week or more.

- **Repo:** <https://github.com/drsamonline/Cobble>
- **App:** <https://drsamonline.github.io/Cobble/app/>
- **Baseline:** v1.42.0 — offline, installable, editable, searchable, keyboard-first, 24 tests, three CI checks, and a privacy notice that names its evidence.

---

## 0. Already done in v1.0.0

Five things that were broken in the app as received, fixed during the repository build. Listed so the diff makes sense.

| # | Fix | Where |
|---|---|---|
| 0.1 | **The achievements grid had no CSS.** `app.js` generated six `.achievement-card` elements and `styles.css` had no rules for any of them, so Discoveries rendered them as stacked plain text. Grid, cards, icons, progress bars and earned states added. | `app/styles.css` |
| 0.2 | **The mobile share button was an empty pill.** It sets `font-size: 0` to hide its label, which also hid the `↗` glyph. The glyph is restored with a `::before`, and the button gained an `aria-label`. | `app/styles.css`, `app/index.html` |
| 0.3 | **The app assumed it lived at a domain root.** `downloadAppPackage()` fetched `/index.html` and friends, which 404s on a project page like `…github.io/cobble/app/`. Now relative. The brand link points at `../` instead of `/`. | `app/app.js`, `app/index.html` |
| 0.4 | **The add button rendered a tofu box.** `＋` (U+FF0B) is absent from DM Sans, so "Add a moment" showed a missing-glyph square. Replaced with `+` in the three places it appeared. | `app/index.html`, `app/app.js` |
| 0.5 | **No deep link into the sample city.** `app/?demo=1` and `app/#demo` now open the sample city directly, which is what the landing page's "Wander a sample city" button uses. | `app/app.js` |

---

## 1. Shipped in v1.1.0 — the old quick wins

These were the top of this list. They are done, verified and in the repository, so they move here rather than sitting in the queue looking undone.

| # | What | Where it landed |
|---|---|---|
| 1.1 | **Vendored Tailwind out of existence.** Two utility classes became two lines of CSS. | `app/theme.css`, `app/index.html` |
| 1.2 | **Self-hosted the fonts.** Manrope, DM Sans and IBM Plex Mono as woff2, latin subset, 118 KB; the variable files are declared once each instead of five times. | `fonts/`, `app/index.html`, `index.html` |
| 1.3 | **Vendored JSZip.** Not fetched from a CDN. (Three.js was vendored here too, then removed in 1.23.0 with the 3D layer.) | `app/vendor/` |
| 1.4 | **Manifest and service worker.** Versioned cache, network-first navigations, cache-first assets, old caches deleted on activate. The site installs and works offline. | `manifest.json`, `sw.js` |
| 1.15 | **The checks ship with the repository.** A dependency-free link check that also guards the precache list and forbids CDN references, a size budget, and a workflow that runs both. | `tools/`, `.github/workflows/check.yml` |
| 1.11 | **Icons, favicon, manifest colours.** A full icon set from the site's own mark, including a maskable one. | `icons/`, `favicon.svg` |
| new | **`selftest.html`** — every precached file, cache or network, with a button. | `selftest.html` |
| 1.5 | **Delete and edit a moment**, with a 20-second Undo strip and `Ctrl`/`Cmd`+`Z`. | `app/app.js`, `app/styles.css` |
| 1.6 | **The toast announces itself** — `role="status"`, `aria-live="polite"`. | `app/index.html` |
| 1.7 | **Focus is trapped in dialogs** and returned to the opener on `Esc`. | `app/app.js` |
| 1.8 | **A skip link** and named landmarks in the app. | `app/index.html` |
| 1.9 | **Plain JSON export** beside the encrypted one, with the warning inside the file. | `app/app.js`, `app/index.html` |
| 1.10 | **The atmosphere is remembered** in its own localStorage key. | `app/app.js` |
| 1.12 | **A print stylesheet** for the timeline. | `app/styles.css` |
| 1.13 | **`N` for a new moment**, `Ctrl`/`Cmd`+`Z` to undo a delete. | `app/app.js` |
| 1.16 | **Source, licence and docs links** in the help panel. | `app/index.html` |
| 1.17 | **The landing page's worker registration moved out of the inline script.** | `assets/landing.js` |
| 1.19 | **An empty archive explains where the city lives** and points at the readable backup. | `app/app.js` |
| 2.14 | **Two edit-state bugs** — a cancelled edit left `editingId` set, and the worker cached css/js twice. | `app/app.js`, `sw.js` |
| 2.1 | **Full-text search** over text, district and date, with accent folding, in-place marks and honest empty states. | `app/app.js`, `app/index.html` |
| 2.10 | **Unit tests for the validator and the crypto** — 24 of them, no dependencies, run in CI. The share logic moved to `app/core.js` so the tests exercise the real code. | `app/core.js`, `tests/core.test.mjs` |
| new | **`PRIVACY.md` and `SECURITY.md`**, with each factual claim naming the file that proves it. | repo root |
| 2.13 | **Muted text contrast raised to 4.5:1** in both stylesheets, measured rather than eyeballed. | `app/theme.css`, `app/styles.css`, `assets/landing.css` |

What is left of the quick-win tier:

| # | What | Why it matters | Where | Effort |
|---|---|---|---|---|
| 1.19 | **A "your city is in another browser" hint.** On an empty archive, offer one line about exports and how to bring a city across. | The most common support question in the [FAQ](docs/faq.md) is "my city is gone" when it is only in another browser profile. | `app/app.js` | S |

## 2. An afternoon each

| # | What | Why it matters | Where | Effort |
|---|---|---|---|---|
| 2.11 | **CI: link check, HTML validation, size budget.** A GitHub Action that fails on a broken relative link, invalid HTML, or an app shell over 200 KB. | Cheap, and it catches exactly the class of mistake this project makes — a path that only works on one host. | `.github/workflows/` | M |
| 4.1e | **Stat cards and the welcome dialog in Hindi and Gujarati** — the interface is now fully translated; only `docs/` prose is English. | `app/i18n.js` |
| 4.1d | **Generated sentences in Hindi and Gujarati** — 15 templates as per-language functions, district names and atmosphere words as dictionary entries, views redrawn on switch. | `app/i18n.js`, `app/app.js` |
| 4.6 | **A plan of the city** — six district tiles with counts, shares and a click into the timeline. The map the 3D town implies, written down. | `app/app.js` |
| 6.2 | **The 3D city is explorable** — hover to identify, click to open the district in the timeline, drag to pan, scroll to zoom, camera fits the archive. Four pointer faults fixed. | `app/scene3d.js` |
| 2.19 | **The size budget measures gzip** — the number a visitor actually waits for, with a raw ceiling as a sanity check. Shell 64.0 of 75 KB. | `tools/check-size.mjs` |
| 2.18 | **Auto day** — the scene follows the clock (dawn/day/dusk/night), re-checked every five minutes; any manual press clears it. | `app/app.js` |
| 4.1c | **The app's chrome in Hindi and Gujarati** — sidebar, breadcrumb, view headings, deck, primary buttons. Generated sentences (toasts, observations, year review) still English: templates with numbers inside them. | `app/i18n.js` |
| 4.1b | **The landing page in Gujarati** — `gu.html`, values zipped to the English keys by index with a length assertion. Three-language switcher on all pages. Awaiting native review. | `gu.html`, `hi.html`, `index.html` |
| 4.1a | **The landing page in Hindi** — `hi.html`, hand-written, switcher in both headers, `hreflang` alternates, precached. Awaiting native review. | `hi.html`, `index.html` |
| 3.7a | **Saved cities — shipped in 1.42.0.** Named copies on a shelf, load replaces the live archive after auto-saving it as *Before switching*. Gives the user need without the race. | `app/app.js` |
| 3.7 | **A live switch between archives — attempted three times (1.30.0, 1.34.0, 1.40.0), reverted three times.** The third avoided in-memory races by reloading the page on switch; creation, isolation and deletion worked, but the return to the first city came up empty and navigation from a sealed city hung. Three attempts, three different faults: this needs the refactor below, not another patch. | `app/app.js` | L |
| 3.7b | **Multiple cities — second attempt.** Second attempt threaded the city explicitly through every read and write and still mixed archives on a mid-save switch. The conclusion is that the shape is wrong: `entries`, `personalEntries`, `lastPhotoKeys` and `activeCity` are module-level and every function reaches into them. Needs a city object owning its entries, records and render. | `app/app.js` | L |
| 3.7a | **Multiple cities — first attempt.** The switcher, per-city records, create and delete all worked; the save queue read the active city when it drained rather than when the save was made, so a save could land in the next city. A proper version needs the city passed through every write path and a state object instead of module-level globals. Both failure modes are in the changelog. | `app/app.js` | L |
| 3.5 | **Import another journal** — Day One JSON and dated markdown, parsed in `core.js` with three tests, merged and undoable. | `app/core.js`, `app/app.js` |
| 3.2 | **Photos in their own record** — repeat saves write 10 KB instead of 421 KB: 813 ms → 11 ms. `storage.estimate()` off the save path. | `app/app.js` |
| 3.1 | **A bounded render while narrowing** — sixty day rows at a time instead of every matching day: 598 ms → 74 ms at 5,000 moments. | `app/app.js` |
| 4.2 | **A year in review** — figures, four sentences from the archive, three resurfaced moments, and a postcard. | `app/app.js`, `app/index.html` |
| 6.1 | **The 3D layer removed** — 590 KB of vendor code and 400 lines that never rendered correctly. Code kept in git history at v1.22.0. | `app/city3d.js`, `app/vendor/` |
| 3.3 | **The vault's key is derived once per unlock**, not per save — measured 285 ms → 91 ms on a 205 KB archive. | `app/core.js`, `app/app.js` |
| 3.4 | **Merge on import** — skip only when id *and* content match; keep an edited version alongside under a content-derived id; rule lives in `core.js` with four tests. | `app/core.js`, `app/app.js` |
| 3.6 | **A locked archive** — one passphrase, AES-256-GCM at rest, plaintext record deleted, unlock screen, no recovery and told so. | `app/core.js`, `app/app.js` |
| 2.17 | **Three text tokens replace 48 near-grey colours** — 71 declarations, no visual change, dark theme now overrides three values. | `app/theme.css`, `app/styles.css` |
| 2.9 | **axe in CI**, plus layout shift and a behaviour smoke test — one script, its own job, five defects found on the first run. | `tools/browser-check.mjs`, `.github/workflows/check.yml` |
| 2.12 | **A postcard export** — the skyline as a 1200×630 PNG, no personal content in it. | `app/app.js`, `app/index.html` |
| 2.2 | **Timeline filters** — six districts, landmarks, photos, composing with search, `aria-pressed` chips and a Clear button. | `app/app.js`, `app/index.html`, `app/styles.css` |
| 2.4 | **A year heatmap** in Discoveries — a square per day for twelve months, shaded by count, clickable, labelled for screen readers. | `app/app.js`, `app/styles.css` |
| 2.15 | **The contrast sweep, finished** — 71 text colours darkened along their own hue, 81 declarations, zero left below 4.5:1. | `app/styles.css` |
| 2.3 | **A dark interface** for the shell — toggle in the top bar, remembered, follows `prefers-color-scheme` by default, contrast measured in the dark palette. | `app/styles.css`, `app/app.js` |
| 1.18 | **Version agreement in CI** — `sw.js`, the README badge and the changelog must match. It caught a badge stuck at 1.5.0. | `tools/check-version.mjs` |
| 2.6 | **Undo for edit and import**, not just delete — one slot, one action, named in the bar. | `app/app.js` |
| 2.7 | **A storage guard** at 80% of quota, with a one-click backup, and a photo refusal past 97%. | `app/app.js`, `app/styles.css` |
| 2.5 | **On this day** — same calendar date in earlier years, under the city, hidden when empty. | `app/app.js`, `app/styles.css` |
| 2.8 | **Photo pipeline** — EXIF orientation honoured, WebP encoding with a JPEG fallback, smaller of the two kept. | `app/app.js` |

---

## 3. Archive and search — the deeper work

| # | What | Why it matters | Where | Effort |
|---|---|---|---|---|
| 3.1b | **Virtualise the timeline properly.** The bounded render fixed the measured cost (598 ms → 74 ms at 5,000). What remains is reusing rows while scrolling, which only matters past about ten thousand moments. | `app/app.js` | L |
| 3.7 | **Multiple cities.** Named archives with a switcher, each in its own IndexedDB database. | One city for the diary, one for the clinic, one for the children. Also the cleanest way to start fresh without deleting. | `app/app.js` | L |

---

## 4. The larger bets

| # | What | Why it matters | Where | Effort |
|---|---|---|---|---|
| 4.1 | **Hindi and Gujarati.** Every string into a `strings` object with three locales, a language switch in help, and `lang` attributes updated. The author writes in both, and the audience for a reflective app in India is not monolingual. | `app/i18n/`, all render functions | XL |
| 4.3 | **A real 3D city.** Replace the ambient Three.js scene with the actual skyline: one building per moment, placed by district, height by weight. | It would make the metaphor literal. It is also the most expensive thing on this list per unit of value, which is why it sits here. | `app/city3d.js` | XL |
| 4.4 | **Desktop and Android builds.** One portable Windows executable and one Android WebView APK, using the author's own [`app-builder`](https://github.com/drsamonline/app-builder). | A journal that lives in a browser tab is a journal you forget. An icon is a habit. | `build/` | L |
| 4.5 | **Optional local model.** A small on-device model that proposes a district and a weight as you type, with a switch that is off by default and a hard rule that nothing leaves the device. | Genuinely useful, genuinely risky for a private app. Only worth doing if 1.1–1.3 are done and the network surface is provably zero. | `app/` | XL |
| 4.6 | **Map view, if you want it.** Optional coarse location per moment, stored as a city name — never coordinates — and a district map that groups them. | Some people think in places. Most do not, and the privacy cost is real, which is why it is opt-in and last. | `app/` | L |

---

## 5. Deliberate non-goals

Written down so they stop being suggested.

- **Accounts and cloud sync.** Sync needs a server; a server needs someone to trust. The entire proposition is that there is no such thing. If sync ever arrives it will be through a file the user owns (File System Access API, or a folder in their own cloud), not through a backend of ours.
- **Streaks, badges that expire, notifications.** A city that scolds you for missing a week is a city you stop visiting. The six milestones do not decay for exactly this reason.
- **Social feed, likes, following.** This is a private place. Sharing is a file you send to one person.
- **Ads, sponsored districts, upsells.** Support is voluntary and unrelated to the software.
- **Server-side AI.** Any model that reads your entries must run on your device, and must be off by default.
- **Minifying the source.** The readable source is how the privacy claims are verified. A build step would trade the app's best feature for bytes it does not need.

---

## 6. The 3D layer — rebuilt in 1.28.0

Removed in 1.23.0 because it did not render; rebuilt from scratch in 1.28.0 and verified in a headless browser before shipping. The four faults and their fixes are in the changelog. What remains open here:

- **Real shadows.** Everything is lit, nothing casts. A shadow map on the directional light would ground the buildings further.
- **A building per moment.** The scene caps at 96 per district; past that it needs instancing rather than more meshes.
- **Audio.** Done in 1.29.0: wind, rain and birds synthesised in WebAudio. What is still open is per-district sound (a market, a park), and a volume slider rather than one fixed level.

## What was there before

The experimental Three.js view rendered a white floor with the buildings floating above it, on every machine it was tried on. It was gated behind `?3d=1` in 1.1.0 so it could not reach anyone by accident, and removed in 1.23.0 along with its 590 KB of vendor code.

What it would take to bring back, if anyone wants it: a real scene graph with a ground plane that receives light properly, a camera that respects the viewport aspect, and a check on a real GPU rather than a software rasteriser. That is a project, not a patch. The code is in the git history at `v1.22.0`.

## What the rest of the collection already solved

Written down because the answer to "should we build this?" is usually "no, it is two repositories over". These are the pieces of the author's own fleet that fit Cobble, and what each one would save:

| Repository | What it has | What it would save here |
|---|---|---|
| [Mood Mixer](https://github.com/drsamonline/mood-mixer) | A complete PWA: worker, manifest, icons, `selftest.html`, link check | Already adapted for v1.1.0 — this is where `sw.js` and `selftest.html` come from |
| [Planner Pro](https://github.com/drsamonline/planner-pro) | Multi-profile storage, PIN lock, `crypto.js`, three build workflows (pages, desktop, android) | The multi-profile work in 3.7, and the release pipelines in 4.4 |
| [App Builder](https://github.com/drsamonline/app-builder) | Compiles a static app into a Windows EXE and an Android APK | All of 4.4 — it wants a folder, a start page and an icon, which this repository now has |
| [Lockhtml](https://github.com/drsamonline/lockhtml) | AES-256-GCM + PBKDF2 sealing of an HTML file, CLI and browser GUI | The archive-at-rest work in 3.6, and a second opinion on the share format's parameters |
| [Offline PDF Toolkit](https://github.com/drsamonline/offline-pdf-toolkit) | Browser-side PDF assembly, and the same `file://` caveats | The year-in-review PDF in 4.2 |
| [Kinemotif](https://github.com/drsamonline/kinemotif) | A single-file HTML studio with a generated soundtrack and a one-file export | A "city postcard" export that animates, if the static one in 2.12 is not enough |
| [Ambient Sound Studio](https://github.com/drsamonline/ambient-sound-studio) | 25 synthesised layers, no samples, WAV/Opus export | A quiet soundscape for the city view — optional, off by default, synthesised rather than streamed |
| [Base Bench](https://github.com/drsamonline/base-bench) | The PolyForm licence setup and `NOTICE.md` structure | Already used for `LICENSE` and `NOTICE.md` |
| [Forge](https://github.com/drsamonline/forge) | The system kit: templates, workflows, the dashboard | Housekeeping — release notes and the fleet index entry |

## The first ten, in order

If you have one weekend and want the largest improvement per hour:

1. **2.9** — axe in the headless run. The tests are in; the accessibility audit still needs a browser in CI.
2. **2.5** — on this day. The feature that makes people come back.
3. **2.3** — dark mode for the app shell.
4. **2.12** — a shareable postcard of the skyline.
5. **6.1** — repair the 3D layer, or delete it. A broken opt-in feature is worse than no feature.
6. **4.4** — desktop and Android builds through App Builder. The repository now has exactly the three inputs it wants.

Everything after that is taste.
