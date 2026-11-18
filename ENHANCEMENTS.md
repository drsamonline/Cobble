# Enhancement list

Everything Cobble could do next, in order of effort — quick wins first. Nothing here is a promise of a date; it is a map of the terrain, with the path that costs least marked in chalk.

Each entry says **what**, **why it matters**, **where** it lands, and **how long** it should take someone who knows the codebase. Effort is honest: `S` is under an hour, `M` is an afternoon, `L` is a day or two, `XL` is a week or more.

- **Repo:** <https://github.com/drsamonline/Cobble>
- **App:** <https://drsamonline.github.io/Cobble/app/>
- **Baseline:** v1.1.0 — no CDN at runtime, works offline, installable, two CI checks.

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

What is left from the original quick-win list — the things that still cost under an hour and still matter:

| # | What | Why it matters | Where | Effort |
|---|---|---|---|---|
| 1.5 | **Delete and edit a moment.** The entry modal only ever adds. Add Edit and Delete to the timeline rows and the day drawer, with a 20-second Undo. | The biggest gap left in a journalling tool. | `app/app.js`, `app/styles.css` | M |
| 1.6 | **Announce the toast.** `#toast` has no `role` or `aria-live`, so a screen reader hears neither "saved" nor "could not save". | Every confirmation and every failure goes through it. | `app/index.html` | S |
| 1.7 | **Trap focus in the four overlays** and return focus to the opener. | Tab currently walks out into the page behind the modal. | `app/app.js` | M |
| 1.8 | **A skip link and landmark roles** in the app. | Eight nav items before anything else in the tab order. | `app/index.html` | S |
| 1.9 | **Plain JSON export** beside the encrypted one. | Lose the PIN, lose the city. | `app/app.js` | S |
| 1.10 | **Remember the atmosphere** across reloads, in its own localStorage key. | People set the city to night and it comes back in daylight. | `app/app.js` | S |
| 1.12 | **Print stylesheet for the timeline.** | The archive on paper, one page. | `app/styles.css` | S |
| 1.13 | **Keyboard shortcut for a new moment** (`N`). | One keystroke from a habit. | `app/app.js` | S |
| 1.16 | **Licence and repository links in the help panel.** | People who love an app look for the source. | `app/index.html` | S |
| 1.17 | **Move the landing page's service-worker registration into `assets/landing.js`.** It is the last inline script, and moving it makes `script-src 'self'` possible. | A strict CSP with no exceptions. | `index.html`, `assets/landing.js` | S |
| 1.18 | **Bump the cache on deploy.** Wire `CACHE_VERSION` to the commit or add a release step that reminds you. | A stale cache is the one failure mode a worker introduces. | `sw.js`, `.github/workflows/` | S |

## 2. An afternoon each

| # | What | Why it matters | Where | Effort |
|---|---|---|---|---|
| 2.1 | **Full-text search.** Build an in-memory index of `text` on load; a search box filters the timeline and highlights the match. No fuzzy matching, no stemming — substring plus case folding is enough at this scale. | The most-requested missing feature. "What did I write about the bakery?" currently means scrolling. | `app/app.js`, `app/index.html` | M |
| 2.2 | **Filters on the timeline.** By district, by weight, by date range. | With two years of moments the timeline is a wall. Six chips and a date picker fix it. | `app/app.js` | M |
| 2.3 | **Dark mode for the app shell.** `prefers-color-scheme: dark` plus a manual override, driven by the same tokens in `theme.css`. The city already has a night state to borrow from. | Half the app's users open it at 11 pm. A white page at 11 pm is a reason not to open it. | `app/theme.css`, `app/styles.css` | M |
| 2.4 | **A year heatmap.** 53 × 7 cells, one per day, shaded by how many moments it held; click a cell to open the day. | The one view that answers "have I been keeping up?" without a streak or a scold. | `app/app.js`, `app/styles.css` | M |
| 2.5 | **On this day.** A quiet strip in the city view: what you saved on this date one month, one year, three years ago. | The cheapest possible version of the thing people actually want from a journal — being reminded of a day they had forgotten. | `app/app.js` | M |
| 2.6 | **Undo for everything.** A general undo stack for save, delete, import and edit, with `Ctrl/Cmd+Z`. | Deletes and imports are the only irreversible actions in the app; both deserve a way back. | `app/app.js` | M |
| 2.7 | **Storage guard.** Warn at 80% of the origin quota, refuse photos beyond a threshold, and offer a one-click "export and clear old photos". | The current failure mode is a toast saying the save failed. That is one moment too late. | `app/app.js` | M |
| 2.8 | **Photo pipeline upgrade.** Try `createImageBitmap` with `imageOrientation: 'from-image'`, encode to WebP when the browser supports it, and store the smaller of WebP/JPEG. | Roughly 30% smaller archives and correct orientation for phone photos, which currently can land sideways. | `app/app.js` | M |
| 2.9 | **Accessibility pass with axe.** Run axe-core in the headless script, fix the violations it reports, and add the check to CI. | A one-off audit that turns into a permanent guarantee. | `tools/`, `.github/workflows/` | M |
| 2.10 | **Unit tests for the two risky modules.** Crypto round-trip, and the import validator against a table of malformed files. Plain `node --test`, no framework. | These are the two places where a bug costs data rather than pixels. | `tests/` | M |
| 2.11 | **CI: link check, HTML validation, size budget.** A GitHub Action that fails on a broken relative link, invalid HTML, or an app shell over 200 KB. | Cheap, and it catches exactly the class of mistake this project makes — a path that only works on one host. | `.github/workflows/` | M |
| 2.12 | **A shareable postcard.** Render the current skyline to a 1200×630 PNG on a canvas and download it with the city's level and count. | The city is the most shareable thing in the app and there is currently no way to show anyone without a screenshot. | `app/app.js` | M |

---

## 3. Archive and search — the deeper work

| # | What | Why it matters | Where | Effort |
|---|---|---|---|---|
| 3.1 | **Virtualise the timeline.** Render 40 days at a time with an IntersectionObserver sentinel. | The current full re-render is fine at 500 moments and starts to stutter at a few thousand. The fix is local and well understood. | `app/app.js` | L |
| 3.2 | **Move photos out of the JSON blob.** One IndexedDB store per photo, keyed by moment id, with the entry holding only a key. | The single-record design rewrites every photo on every save. Splitting them makes saving O(1) instead of O(archive). | `app/app.js` | L |
| 3.3 | **Incremental saves.** Diff against the last saved snapshot and write only what changed. | Same motivation as 3.2, one level up. | `app/app.js` | L |
| 3.4 | **Merge on import.** Instead of skipping duplicates by id, offer to merge: newest text wins, photos combine, category conflicts are listed for a decision. | Re-importing after editing on another device currently loses one side of the edit. | `app/app.js` | L |
| 3.5 | **Import from other journals.** Day One JSON, Journey, plain markdown with `YYYY-MM-DD` headings. | Everyone who would love this app already has a decade of entries somewhere else. | `tools/importers/` | L |
| 3.6 | **Encryption at rest.** Wrap the whole archive with the same AES-GCM construction already used for sharing, unlocked by a passphrase at load. | The share format proves the crypto works. This closes the last honest gap in the privacy page. | `app/app.js` | L |
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

1. **1.5** — delete and edit. It is the largest gap left, and the app is a journal.
2. **1.6, 1.7, 1.8** — the toast announces itself, focus stays inside overlays, a skip link exists. An hour of accessibility that changes who can use the app at all.
3. **1.9** — plain JSON export. The cheapest insurance in the repository.
4. **2.1** — search. The most-requested feature, and an afternoon's work.
5. **2.9, 2.10** — axe in the headless run, and two unit tests for the validator and the crypto.
6. **2.5** — on this day. The feature that makes people come back.
7. **6.1** — repair the 3D layer, or delete it. A broken opt-in feature is worse than no feature.
8. **4.4** — desktop and Android builds through App Builder. The repository now has exactly the three inputs it wants.

Everything after that is taste.
