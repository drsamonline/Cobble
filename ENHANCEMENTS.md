# Enhancement list

Everything Cobble could do next, in order of effort — quick wins first. Nothing here is a promise of a date; it is a map of the terrain, with the path that costs least marked in chalk.

Each entry says **what**, **why it matters**, **where** it lands, and **how long** it should take someone who knows the codebase. Effort is honest: `S` is under an hour, `M` is an afternoon, `L` is a day or two, `XL` is a week or more.

- **Repo:** <https://github.com/drsamonline/Cobble>
- **App:** <https://drsamonline.github.io/Cobble/app/>
- **Baseline:** v1.22.0 — offline, installable, editable, searchable, keyboard-first, 24 tests, three CI checks, and a privacy notice that names its evidence.

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
| 1.3 | **Vendored Three.js and JSZip.** Neither is fetched from a CDN, and Three.js is not downloaded at all unless the 3D layer is asked for. | `app/vendor/` |
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
| 3.1 | **Virtualise the timeline.** Render 40 days at a time with an IntersectionObserver sentinel. | The current full re-render is fine at 500 moments and starts to stutter at a few thousand. The fix is local and well understood. | `app/app.js` | L |
| 3.2 | **Move photos out of the JSON blob.** One IndexedDB store per photo, keyed by moment id, with the entry holding only a key. | The single-record design rewrites every photo on every save. Splitting them makes saving O(1) instead of O(archive). | `app/app.js` | L |
| 3.5 | **Import from other journals.** Day One JSON, Journey, plain markdown with `YYYY-MM-DD` headings. | Everyone who would love this app already has a decade of entries somewhere else. | `tools/importers/` | L |
| 3.7 | **Multiple cities.** Named archives with a switcher, each in its own IndexedDB database. | One city for the diary, one for the clinic, one for the children. Also the cleanest way to start fresh without deleting. | `app/app.js` | L |

---

## 4. The larger bets

| # | What | Why it matters | Where | Effort |
|---|---|---|---|---|
| 4.1 | **Hindi and Gujarati.** Every string into a `strings` object with three locales, a language switch in help, and `lang` attributes updated. The author writes in both, and the audience for a reflective app in India is not monolingual. | `app/i18n/`, all render functions | XL |
| 4.2 | **A year in review.** A single scrolling page: the skyline of the year, the districts that grew, the days that held the most, the returning themes — printable and shareable as a PDF. | The payoff for a year of small entries, and the thing that makes someone start a second year. | `app/`, `tools/` | XL |
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

## 6. The 3D layer

`app/city3d.js` is 400 lines of Three.js that draws a low-poly neighbourhood over the illustrated city. It is switched off by default because it does not look right yet, and shipping it on would have made a broken view the default for everyone with a GPU.

| # | What | Detail | Effort |
|---|---|---|---|
| 6.1 | **Repair the scene.** On the machines this was tested on the floor plane renders near-white and the buildings float above it, detached from the ground. The camera now corrects for viewport aspect (it never did), which fixed the stretching but not the floor. Needs a pass on real hardware with the light rig, the floor material and the building Y-offsets in view. | `app/city3d.js` | M |
| 6.2 | **Then ship it on by default**, with a control in the deck next to Theme / Mood / Weather / Night, and `prefers-reduced-motion` respected. | `app/city3d.js`, `app/app.js`, `app/index.html` | M |
| 6.3 | **Draw the real city, not a seeded one.** One building per moment, placed by district, height by weight — the metaphor made literal. This is the expensive version, and the one worth doing only after 6.1. | `app/city3d.js` | XL |
| 6.4 | **A quality switch.** Cap pixel ratio, drop the layer on `saveData`, and fall back silently — the CSS city is already good enough that the 3D layer should never be a cost. | `app/city3d.js` | S |

## A decision, not a task: the name

A search on 19 November 2026 found at least three live products called Cobble: a funded group-planning app at [trycobble.com](https://www.trycobble.com/), an audio walking-tour app from Cobble Media Limited ([cobble.london](https://cobble.london/)), and a Pebble smartwatch app. None is a journalling tool.

| Option | What it costs | What it buys |
|---|---|---|
| **Keep Cobble** | Search results will mix the three; someone will eventually ask if this is the London audio app | Nothing to redo. The name is already on the repo, the site, the icon and the docs |
| **Rename now** | A new repository, a new Pages URL, and about an hour of mechanical work — the storage keys, the `.cobble` extension and every URL changed once already in 1.2.0, so the pattern is known | An uncommon name in the category, no confusion, and a clean App Store search if a mobile build ever happens |

If it renames, the candidates worth checking first are short, unusual and architectural: *Quoin*, *Twitten*, *Mullion*, *Ashlar*. Each needs the same search before it is adopted — this list is not a recommendation, it is a starting point.

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
