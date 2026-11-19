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
- **The vendor folder is not on the critical path.** JSZip (95 KB) is fetched only when someone presses "Download app package". The experimental Three.js layer that used to sit here was removed in 1.23.0 — 590 KB and a feature that did not work.

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
