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


## The 3D town, and what its numbers mean

The illustrated city above is what you get without WebGL, or when the 3D view is switched off. The 3D town is the default everywhere else, and it follows the same six district colours — but its rules are its own, and they are worth knowing because they are what most people actually look at.

**Placement is seeded, not random.** The town is laid out by a small generator seeded from the total moment count, so the same archive always builds the same town. A street that rearranged itself on every repaint would read as a bug.

**A district grows up to a cap.** Each district draws one building per moment up to **48**, or **96** once it holds more than 150 — past that a bigger archive makes a denser town, not an endless one.

**House kind follows busyness.** A quiet district is mostly bungalows: wide, low, with a pitched roof. A middling one mixes villas — two volumes and a terrace — with bungalows. A busy one is mostly towers. Heights come from the same number, so the busiest district stands tallest.

**People, traffic and the rest scale with the archive:**

| What | How many | Where |
|---|---|---|
| People | `min(40, max(6, total / 12))`, every fourth a child | walking slow circles around the plaza |
| Vehicles | `min(14, max(3, total / 40))` — a bus every fifth, a two-wheeler every fourth | both directions on both roads |
| Train | five carriages | its own line behind the town |
| Plane | one | crossing high and slow |
| Fish | seven | circling under the pond's surface |
| Trees | `min(90, max(20, spread × 2.2))` | ringing the town |

**The camera fits the town it is given.** The orthographic frustum is derived from the town's radius — `max(10, radius × 1.2 + 3)` — so a large archive is a larger city rather than a cropped one. Zoom runs from 0.35× to 6×, and past 1.4× cloud fades in over the landscape, so scrolling out ends in weather rather than in empty grass.

**Hover, click, drag, scroll.** Hovering a building names its district and how many moments are in it; clicking opens the timeline filtered to that district. Dragging pans, scrolling zooms, double-clicking re-centres and re-fits.

**It draws itself cheaply, and slows itself down politely.** Every building, roof, window, tree, person, fish and mountain is an `InstancedMesh` — one mesh per shape, a matrix per placement — which took the scene from 4,089 draw calls at 1,200 moments to 75. The pixel ratio is a dial rather than a constant: the frame timer steps it between 1.75 and 0.5, down when frames run slower than 40 ms and back up when they run faster than 18 ms. The numbers behind both are in [performance](performance.md).

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
