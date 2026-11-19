# Customising

Everything visual in Cobble is a token, a table or a string in one of five files. This guide lists the ones worth touching, in the order people usually want them.

## Palette

`app/theme.css` holds seventeen variables. Change them here and the whole app follows:

```css
:root {
  --color-primary: #477d70;        /* buttons, accents, links */
  --color-primary-contrast: #ffffff;
  --color-bg: #f6f4ef;             /* the paper the app sits on */
  --color-surface: #ffffff;
  --color-text: #293632;
  --color-muted: #88918c;
  --color-line: #e9e8e1;
  --color-soft: #eff4f0;
  --color-accent: #e2a66f;         /* the warm second colour */
  --radius: 16px;
  --font-heading: 'Manrope', sans-serif;
  --font-body: 'DM Sans', sans-serif;
}
```

Two caveats, honestly stated: `styles.css` also contains a good many hard-coded hex values for the city — the hills, the water, the sky gradients, the building palette. Those are the illustration, not the chrome, and they are meant to be edited directly. Search for `--sky-top` to find the sky, `palette` in `app.js` to find the building colours.

The landing page keeps its own copies of these values at the top of `assets/landing.css`. If you change the palette, change both.

## Districts

In `app/app.js`:

```js
const categories = {
  everyday:  { label: 'Everyday detail',      short: 'Everyday',   color: '#b59a79', icon: '✦' },
  people:    { label: 'People & connection',  short: 'People',     color: '#cb8e79', icon: '♡' },
  nature:    { label: 'Outside & nature',     short: 'Nature',     color: '#82a58a', icon: '✿' },
  ideas:     { label: 'Thoughts & ideas',     short: 'Ideas',      color: '#8699b8', icon: '✧' },
  joy:       { label: 'Small joys',           short: 'Joy',        color: '#d5aa64', icon: '☀' },
  milestone: { label: 'Something meaningful', short: 'Meaningful', color: '#aa86a0', icon: '✷' }
};
```

Renaming a `label` is safe. Renaming a **key** is not: keys are written into every saved moment and into exported files, so a rename orphans existing entries. If you must, add the new key and keep the old one as an alias in the render path.

Adding a seventh district works, but check three things afterwards: the city palette in `renderCityScenes()` has six swatches, the district bar chart wraps at six comfortably, and the "many sides of you" milestone counts distinct kinds (its goal of 4 still makes sense).

## Atmosphere

```js
const themes = ['meadow', 'coastal', 'amber', 'lavender', 'midnight'];
const moods = ['serene', 'curious', 'dreamy', 'festive', 'tranquil'];
const weatherTypes = ['clear', 'cloudy', 'rain', 'snow'];
```

Each value must exist as a selector in `styles.css` — `[data-theme="coastal"]`, `[data-weather="rain"]`, `.city-viewport[data-mood="festive"]` — or the button will cycle through a state that changes nothing. The controls pick a different value at random (`pickDifferent`), so the order in the arrays is only an ordering, not a sequence.

## Copy and tone

The app's voice is plain, second person, and deliberately unimpressed with itself. The strings live in `app/app.js`, in the render functions, and in `app/index.html` for the static parts. The ones most worth editing for your own use:

- the toasts (`toast('A new meadow palette settles over your city.')`) — they are the app's only small talk;
- the Discoveries observations in `renderInsights()`;
- the level names in `renderCity()` — a new little town through to a city full of wonder;
- the six milestone titles in `renderAchievements()`;
- the help panel in `app/index.html`, which explains the whole idea in about a hundred words.

If you translate the app, the date formatting already follows the browser locale (`toLocaleDateString` with no explicit locale), so dates will localise for free — but the strings will not. Hindi and Gujarati are on the [enhancement list](../ENHANCEMENTS.md), because the author writes in both.

## Layout

- **Sidebar width** — `.sidebar` in `styles.css`.
- **City height** — `.city-viewport { height: clamp(275px, 33vw, 405px) }`. Raising it gives the skyline more room; the buildings are anchored to the ground, so a taller viewport buys more sky, not taller buildings.
- **Number of visible districts** — `renderCityScenes()` builds five scenes; `startCityMotion()` positions them at `-2 × tileWidth`. Three or seven both work, but the pan maths assumes the centre is the middle of the array.
- **The day drawer** — `#day-backdrop`, a right-hand panel on desktop and a full sheet on a phone.

## The sample city

`makeDemoCity()` returns eighteen moments. If you fork this for a different language or a different tone, this is the best place to start: the sample is what a new visitor judges the app by, and its text sets the expectation for their own.

Two rules if you edit it: keep the dates relative (`daysAgo(n)`, not fixed dates, or the sample ages), and keep the photo URLs on a host you are allowed to hotlink from.

## Fonts, vendor files and the cache

The app no longer asks a CDN for anything, so there is nothing to remove. What you may want to change instead:

- **Fonts** live in `fonts/` as four woff2 files (Manrope and DM Sans are served by Google as one variable file each, so one file covers the whole weight range) plus `fonts/fonts.css`. To swap a family, replace the file, keep the name or update `fonts.css`, and bump `ASSET_VERSION` in `sw.js` so the cache is refilled.
- **The vendor file** is `app/vendor/jszip.min.js`, unmodified, with its licence intact. See `app/vendor/README.md` before you replace it.
- **The service worker** precaches an explicit list. If you add a file that the app needs at load time, add it to `PRECACHE` in `sw.js` and to the list in `selftest.html`, or the offline copy will be missing it. `tools/check-links.mjs` fails the build if a precache path does not exist.
- **The icon set** is generated from the same three-bar mark as the site: `icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (extra padding, for Android's mask) and `apple-touch-icon.png`. Replace all four together.
- **Colours in the manifest and the theme.** `manifest.json` carries `background_color` and `theme_color`; `app/theme.css` and `assets/landing.css` carry the same values. Three places, one palette.
