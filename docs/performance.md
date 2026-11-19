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

## Saving a locked archive

The vault derives its key with PBKDF2-SHA-256 at 250,000 iterations. That is deliberate — it is what makes a stolen ciphertext expensive to attack — but paying it on every save is not. The key is now derived once at unlock and reused for the session, with a fresh IV on every write.

Measured on a 205 KB archive (500 moments, 20 photos), encrypting in the page:

| | Time |
|---|---|
| Derive the key + encrypt | **285 ms** |
| Encrypt with the cached key | **91 ms** |

A save is 68% cheaper. The salt stays fixed for the session and the IV changes every time, which is what AES-GCM requires.

## What grew, and why

The app shell budget was 200 KB and is now 220 KB. That is not drift, it is four features: the dark interface, the year heatmap, timeline filters and the encrypted vault took the shell from about 163 KB to 206 KB since v1.12. The CSS alone went from 57 KB to 80 KB.

The alternative — minifying — is deliberately not done: this repository ships readable source, and a reader can open `app/app.js` and follow it. If the shell ever needs to be smaller, that is the trade to revisit, not the budget.

## At scale

The timeline renders fifty days at a time, so the cost of a filter change is the pass over the archive, not the size of the page. Measured by clicking a district chip and timing the synchronous render, on archives seeded at four sizes:

| Moments | Load | Filter change | Reset |
|---|---|---|---|
| 100 | 2,585 ms | 9 ms | 12 ms |
| 500 | 2,098 ms | 35 ms | 37 ms |
| 2,000 | 1,935 ms | 130 ms | 46 ms |
| 5,000 | 2,116 ms | **598 ms** | 70 ms |

Load time is flat because it is dominated by the page and the fonts, not the archive. A filter change grows roughly linearly: fine to about two thousand moments, visibly janky at five thousand. That is the measured basis for the virtualisation item, and it says the threshold is **2,000 moments**, not the ten thousand a guess would have picked.

## How to reproduce

```bash
python3 -m http.server 8000
# then, in Chrome DevTools: Lighthouse → Performance, or
# Performance panel → record a cold load with cache disabled
```

For the transfer sizes without DevTools, `Network` panel → disable cache → reload, and read the footer totals. The numbers above were taken the same way, from a headless run that clears the cache between pages.
