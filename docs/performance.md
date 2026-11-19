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
- **The app's scripts are deferred.** `core.js`, `city3d.js` and `app.js` carry `defer`, so parsing is never blocked behind them.
- **The vendor folder is not on the critical path.** Three.js (590 KB) is not precached and is not requested at all unless the experimental layer is switched on with `?3d=1`; JSZip (96 KB) is fetched only when someone presses "Download app package".

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

## How to reproduce

```bash
python3 -m http.server 8000
# then, in Chrome DevTools: Lighthouse → Performance, or
# Performance panel → record a cold load with cache disabled
```

For the transfer sizes without DevTools, `Network` panel → disable cache → reload, and read the footer totals. The numbers above were taken the same way, from a headless run that clears the cache between pages.
