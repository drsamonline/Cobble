# Performance

Measured, not asserted. Every number below came from headless Chrome (Chromium 158) against this repository served over local HTTP, with the network cache cleared between runs. The date is 19 November 2026, version 1.9.0.

## What the pages weigh

| | Landing page | The app (sample city) |
|---|---|---|
| Requests | 11 | 20 |
| Transferred | **273 KB** | **234 KB** |
| DOMContentLoaded | 1,485 ms | 742 ms |
| First contentful paint | 1,656 ms | 1,124 ms |
| Render-blocking requests | 3 | 6 |
| CSS rules used | 156 / 156 (100%) | 210 / 210 (100%) |

Both pages are single-origin: no font CDN, no script CDN, no analytics. The heaviest asset on each is DM Sans at 62 KB, followed by `styles.css` and `app.js` at about 60 KB each.

The CSS coverage figure is worth stating plainly, because it is unusual: **every rule in both stylesheets is used**. There is no dead CSS to remove, which is why the size budgets in `tools/check-size.mjs` are the guard rather than a purge step.

## What was done about it

- **Screenshots are WebP.** Fourteen images went from 2,406 KB to 502 KB — a 79% cut — and they are the heaviest thing on the landing page.
- **Fonts are self-hosted and preloaded.** Manrope and DM Sans are each a single variable file; both are preloaded on both pages, so the hero text paints in its real typeface rather than swapping into it.
- **The app's scripts are deferred.** `core.js` and `app.js` carry `defer`, so parsing is never blocked behind them.
- **The vendor folder is not on the critical path.** JSZip (95 KB) is fetched only when someone presses "Download app package", and Three.js (590 KB) only when the 3D city starts — which needs WebGL and a visitor who has not turned it off. Neither is precached.

## Layout shift: corrected

An earlier version of this page reported a layout shift of **0.186 on a cold load**, and six experiments were run trying to isolate it. That number did not survive repetition. It is retracted here rather than quietly deleted.

Re-measured on 19 November 2026, two ways:

| Method | Runs | CLS |
|---|---|---|
| Fresh browser per run, cache disabled | 6 | 0.008 · 0.010 · 0.008 · 0.008 · 0.008 · 0.008 |
| Consecutive loads, cache warm | 8 | 0.008 on every run |
| Consecutive loads, all `.woff2` blocked | 8 | 0.008 on every run |

**CLS is 0.008–0.010. That is good** — a fifth of Google's 0.1 threshold. The single 0.186 sample came from the first load in a freshly started environment, with everything cold and the machine busy; it never reproduced, including in the same conditions that produced it.

The six experiments recorded here — JS disabled, `landing.js` emptied, reveal removed, fonts blocked, fonts preloaded, lazy loading removed — were chasing a number that was not real. The one useful finding from them is that **a one-sample CLS reading is noise**, and that the honest instrument is a handful of runs with a stated method.

What this changes:

- Nothing in the app. The landing page was already fine.
- The enhancement list loses a defect and gains a check: CLS and axe should be measured in CI, so the number is tracked rather than chased.

## Saving a photo archive

Photos used to live inside the same JSON string as everything else, so every save rewrote every photo's bytes. They now sit in their own `photos` record, written only when the set of photos changes; the `moments` record holds text.

Measured directly against IndexedDB with a 421 KB archive (60 moments, 20 photos of 21 KB each):

| Write | Time |
|---|---|
| One 421 KB record, as before | **813 ms** |
| Text record only (10 KB), photos unchanged | **11 ms** |
| Text record plus the photo map, first save | 228 ms |

A repeat save is **74× cheaper**. The first save after adding photos still pays for the photo map, which is the honest cost of storing them.

One more thing came out of this: `navigator.storage.estimate()` took about **1.8 s** in this browser, and it was awaited on every save. It is now throttled and never on the save path. (My first attempt to measure end-to-end save latency was measuring that call, not the save — the numbers above are the write itself, isolated.)

## Saving a locked archive

The vault derives its key with PBKDF2-SHA-256 at 250,000 iterations. That is deliberate — it is what makes a stolen ciphertext expensive to attack — but paying it on every save is not. The key is now derived once at unlock and reused for the session, with a fresh IV on every write.

Measured on a 205 KB archive (500 moments, 20 photos), encrypting in the page:

| | Time |
|---|---|
| Derive the key + encrypt | **285 ms** |
| Encrypt with the cached key | **91 ms** |

A save is 68% cheaper. The salt stays fixed for the session and the IV changes every time, which is what AES-GCM requires.

## The 3D scene: draw calls, not frame rate

The first version of the town drew every building, window, tree and person as its own mesh. Measured in the live scene at three archive sizes:

| Moments | Draw calls, before | Draw calls, after | Triangles |
|---|---|---|---|
| 19 | 170 | **54** | 3,714 |
| 300 | 2,127 | **64** | 14,726 |
| 1,200 | 4,089 | **75** | 26,210 |

The fix is instancing: one mesh per *shape*, with a matrix per placement. Buildings, roofs, windows, mountains, trees, people and fish are all `InstancedMesh` now, and a district's buildings are one mesh each, so picking reports the district rather than the individual box.

**What this measurement is not.** Frame rate on this machine is 1–4 fps before and after, because the sandbox renders WebGL in software (SwiftShader), where the cost is fill rate — every pixel of a 1440×1000 canvas shaded on the CPU — and draw calls barely register. So the honest claim is the one the numbers support: **draw calls fell by 50–60×**, which is what matters on a real GPU and especially on a phone, where a few hundred calls is already too many. The frame rate on real hardware has not been measured here and should be checked on a device before anyone quotes a number for it.

## The size budget measures the right thing

For a while this project capped **source** bytes, and that was the wrong measure: it counts whitespace and comments no browser parses, and it turned "keep the source readable" into a fight with "leave room for features". The budget is now on **gzipped** size, because that is what a visitor actually downloads — GitHub Pages serves everything with gzip — with a raw ceiling kept only as a sanity check against a stray megabyte.

| | gzip | source |
|---|---|---|
| App shell | **64.0 KB** of 75 | 244.2 KB (ceiling 320) |
| Landing page | 13.2 KB of 18 | 50.6 KB |
| Hindi page | 6.7 KB of 12 | 26.7 KB |
| Gujarati page | 6.6 KB of 12 | 26.3 KB |
| Fonts (already compressed) | 114.8 KB of 170 | 114.8 KB |
| Vendor (jszip + three) | 173.8 KB of 200 | 684.6 KB |

woff2 is not gzipped twice; it is already compressed, and pretending otherwise would only flatter the numbers.

## What grew, and why

The app shell budget was 200 KB and is now 220 KB. That is not drift, it is four features: the dark interface, the year heatmap, timeline filters and the encrypted vault took the shell from about 163 KB to 206 KB since v1.12. The CSS alone went from 57 KB to 80 KB.

The alternative — minifying — is deliberately not done: this repository ships readable source, and a reader can open `app/app.js` and follow it. If the shell ever needs to be smaller, that is the trade to revisit, not the budget.

## At scale

The timeline renders fifty days at a time, so the cost of a filter change is the pass over the archive, not the size of the page. Measured by clicking a district chip and timing the synchronous render, on archives seeded at four sizes:

| Moments | Load | Filter change, before | Filter change, now |
|---|---|---|---|
| 100 | 2,666 ms | 9 ms | 11 ms |
| 500 | 2,493 ms | 35 ms | 36 ms |
| 2,000 | 2,377 ms | 130 ms | 73 ms |
| 5,000 | 2,468 ms | **598 ms** | **74 ms** |

Load time is flat because it is dominated by the page and the fonts, not the archive.

The 598 ms at five thousand moments was not the filter pass — it was the DOM. While a filter or a search narrowed the list, *every* matching day was built, and at five thousand moments that was six hundred day rows with four preview moments each. The list is still counted in full and still says how many days matched; it now builds sixty at a time, with a *Show older days* button that adds sixty more. The status line says `(showing 60)` when there is more.

That took a filter change at five thousand moments from **598 ms to 74 ms**, and at two thousand from 130 ms to 73 ms — flat, because the work no longer depends on how many days matched. Full virtualisation (reusing rows while scrolling) is still the item, but the measured pain is gone.

## How to reproduce

```bash
python3 -m http.server 8000
# then, in Chrome DevTools: Lighthouse → Performance, or
# Performance panel → record a cold load with cache disabled
```

For the transfer sizes without DevTools, `Network` panel → disable cache → reload, and read the footer totals. The numbers above were taken the same way, from a headless run that clears the cache between pages.
