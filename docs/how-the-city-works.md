# How the city works

The city is not decoration. It is a chart with a roof on it. This guide explains exactly how a moment becomes a building, so you can read your own skyline.

## The five rules

**1. One district per kind of moment.** The six categories map to six district colours:

| Category key | Label | Colour | Glyph |
|---|---|---|---|
| `everyday` | Everyday detail | `#b59a79` | ✦ |
| `people` | People & connection | `#cb8e79` | ♡ |
| `nature` | Outside & nature | `#82a58a` | ✿ |
| `ideas` | Thoughts & ideas | `#8699b8` | ✧ |
| `joy` | Small joys | `#d5aa64` | ☀ |
| `milestone` | Something meaningful | `#aa86a0` | ✷ |

Defined once, in `app/app.js` under `const categories`. The city, the timeline swatches, the district bars and the Discoveries copy all read from it.

**2. Height is weight.** Every moment carries `importance`, 1 to 3 — a detail, something that mattered, a landmark. The city does not literally size a building from it (see rule 4), but it drives the timeline's emphasis, the "personal landmarks" count, and the milestone for marking something meaningful. The block heights you see are drawn from a seeded range so the skyline reads as a place rather than a bar chart.

**3. Repetition widens a block.** `repeatCount` from 1 to 5. Above 1 the moment counts as a "returning theme", and a building that holds more than two moments of its district gets a crown glyph (✦) on its roof.

**4. Buildings are drawn, not measured.** Each of the five district scenes on screen is generated from a seed:

```
seed = (|districtIndex × 2654435761| + total × 101 + Σ categoryCounts × 37) >>> 0
```

then a small LCG (`× 1664525 + 1013904223`) draws, per building:

- how many buildings the district holds — `2 + floor(random × 3)`, so 2 to 4, or none when the city is empty;
- which category it belongs to, weighted by which categories are busiest;
- a height between 62 px and 151 px;
- a width between 31 px and 50 px;
- one of six architectures: `building-house`, `building-office`, `building-shop`, `building-tower`, `building-stepped`, `building-home`;
- a colour from a six-swatch palette, offset by the district's index so a district leans towards its own hue;
- windows: `min(12, max(4, floor(count / 2) + 4))` — busier districts get more lit windows;
- a pointed roof on roughly 28% of buildings.

Because the seed includes the total count and the category totals, the city changes when your archive changes, and stays put when it does not. Two visits on the same day draw the same skyline.

**5. Every ninth district gets a theatre.** When `districtIndex % 9 === 3` and the city is not empty, a small theatre appears in that district. Click it to open the photo gallery — every moment you have saved with a photograph, in one place.

## Districts, panning and the middle

The viewport shows five district scenes side by side, with the centre one at `cityCenterIndex`. Dragging, scrolling, or pressing ← / → moves an offset; when the offset passes a full tile width the centre index shifts and the five scenes are re-rendered from their new seeds. So panning is not scrolling a picture — it is walking to the next block of a city that is being redrawn as you arrive.

On a phone the pan is touch-driven and the scenes are wider relative to the viewport, so a swipe feels like a stroll rather than a scroll.

## Levels

The line under "A place called you" is derived from the count, in `renderCity()`:

| Moments | Level |
|---|---|
| 0–2 | A new little town |
| 3–9 | A village with stories |
| 10–24 | A town finding its rhythm |
| 25–59 | A city coming alive |
| 60+ | A city full of wonder |

And the mood line: no moments at all gives "Quiet beginnings"; a city with any returning theme gives "Familiar streets are forming"; anything else gives "A world in the making".

## Atmosphere

Five themes — `meadow`, `coastal`, `amber`, `lavender`, `midnight` — and four weathers — `clear`, `cloudy`, `rain`, `snow`. Both are CSS: the viewport carries `data-theme`, `data-mood` and `data-weather` attributes, and `styles.css` recolours the sky, the hills, the water and the plaza from those attributes. Rain and snow are layered gradients and animated elements, not images.

Night is a separate class (`is-night`) that darkens the sky, turns the sun into a moon, lights every window and turns on the streetlamps. It is toggled by hand, never by the clock.

Moods — `serene`, `curious`, `dreamy`, `festive`, `tranquil` — change animation tempo and saturation rather than colour: a festive city glitters, a dreamy one is desaturated, a curious one moves faster.

The atmosphere resets on reload. It is a way of looking at the city, not a property of it.

## Discoveries

Three parts, all computed on the device from your own entries, in `renderInsights()` and `renderAchievements()`:

**Four numbers.** Moments kept; days remembered (distinct dates); personal landmarks (`importance >= 3`); returning themes (`repeatCount > 1`).

**Six milestones.** First light (1 moment), a little neighbourhood (5), city taking shape (25), days remembered (moments on 7 different days), many sides of you (4 kinds of moment), a landmark moment (any landmark). Each shows a progress bar until it is earned. Nothing decays: a milestone earned stays earned.

**Observations.** Up to three sentences, written from your data: your busiest district and its share of your moments; the day that held the most; and the word count of your shortest saved moment. They are deliberately phrased as observations, not advice — the app is not qualified to advise you, and a journalling tool that starts prescribing is a journalling tool you stop being honest with.

If the archive is too thin for an observation, the panel says so instead of inventing one.
