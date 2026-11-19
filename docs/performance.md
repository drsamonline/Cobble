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

## The one number that is not good: layout shift

The landing page's cumulative layout shift measures **0.018 on a warm run and 0.186 on a cold one**. Both are reproducible; which one you get depends on how quickly the webfonts arrive. Google's threshold for "good" is 0.1, so the cold case is a real defect.

Six experiments were run to isolate it, and the honest answer is that the mechanism is not yet pinned down:

| Experiment | CLS |
|---|---|
| As shipped, cold | 0.186 |
| As shipped, warm | 0.018 |
| JavaScript disabled entirely | 0 |
| `landing.js` emptied / aborted | 0.186 |
| Reveal animation removed (class and CSS) | 0.186 |
| All `.woff2` blocked | 0.186 |
| Fonts preloaded | 0.186 |
| `loading="lazy"` removed | 0.186 |

The shift always reports the same sources — `#skyline`, `.sky`, `.numbers`, `.cta-row`, `.orb` — which means the hero column changes height and everything below follows. The bimodality points at the font swap, but blocking the fonts did not remove it, so that is a hypothesis and not a finding.

Two fixes are known and neither is free: `font-display: optional` removes the swap entirely at the cost of sometimes painting the first visit in the fallback face, and metric-matched fallbacks (`size-adjust`, `ascent-override`) remove the reflow while keeping the design. The second needs the real metrics read out of the woff2 files. Both are recorded in [ENHANCEMENTS.md](../ENHANCEMENTS.md) rather than guessed at here.

## How to reproduce

```bash
python3 -m http.server 8000
# then, in Chrome DevTools: Lighthouse → Performance, or
# Performance panel → record a cold load with cache disabled
```

For the transfer sizes without DevTools, `Network` panel → disable cache → reload, and read the footer totals. The numbers above were taken the same way, from a headless run that clears the cache between pages.
