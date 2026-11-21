<div align="center">

# Cobble

**A city made of small things.**

Your life, taking shape. A private city built from the small things you notice. Save a moment: the warm loaf in the window, a sentence someone said on a train, the light on wet pavement. A building appears. Colour is what kind of moment it was. Height is how much it mattered. Come back in a year and see what you made.

[Live demo](https://drsamonline.github.io/Cobble/) · [Open the app](https://drsamonline.github.io/Cobble/app/) · [Wander a sample city](https://drsamonline.github.io/Cobble/app/?demo=1) · [Documentation](docs/) · [Report a bug](https://github.com/drsamonline/Cobble/issues)

**Status: v1.5.0 — shipped, offline, editable, searchable, and tested.** The city, the timeline, the discoveries, the sample city, the encrypted share and the export all work today. Nothing below is marked "planned"; the ideas that are not built yet live in [ENHANCEMENTS.md](ENHANCEMENTS.md), in order of effort.

[![Licence: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/licence-PolyForm%20Noncommercial%201.0.0-477d70.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.58.0-e2a66f.svg)](CHANGELOG.md)
[![Works offline](https://img.shields.io/badge/offline-works-2ea44f.svg)](sw.js)
[![Installable](https://img.shields.io/badge/installable-PWA-7ec8e3.svg)](manifest.json)
[![Runtime deps](https://img.shields.io/badge/runtime%20deps-zero%20CDNs-2ea44f.svg)](app/vendor/)
[![Data: device only](https://img.shields.io/badge/data-device%20only-2ea44f.svg)](#privacy)
[![Tracking: none](https://img.shields.io/badge/tracking-none-2ea44f.svg)](#privacy)
[![Server: none](https://img.shields.io/badge/backend-none-lightgrey.svg)](#architecture)
[![Vanilla JS](https://img.shields.io/badge/built%20with-HTML%20%7C%20CSS%20%7C%20JS-f7df1e.svg)](app/)
[![Tests](https://img.shields.io/badge/tests-24%20passing-34D399.svg)](tests/core.test.mjs)
[![App size](https://img.shields.io/badge/app%20shell-~162%20KB-blueviolet.svg)](app/)
[![Moments](https://img.shields.io/badge/moments-6%20districts%20%C2%B7%205%20atmospheres-d5aa64.svg)](docs/how-the-city-works.md)
[![GitHub Sponsors](https://img.shields.io/badge/sponsor-GitHub-ea4aaa.svg)](https://github.com/sponsors/drsamonline)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-matneo-ff5e5b.svg)](https://ko-fi.com/matneo)
[![UPI](https://img.shields.io/badge/UPI-drsohilboi%40ybl-2ea44f.svg)](#support)
[![Stars](https://img.shields.io/github/stars/drsamonline/cobble?style=social)](https://github.com/drsamonline/Cobble/stargazers)

</div>

---

![Cobble landing page](screenshots/landing.webp)

## What it is

Most journalling apps give you a list. A list is fine for finding something later; it is useless for seeing a year. Cobble asks one question — *what did you notice today?* — and answers it with a place.

Every saved moment becomes a block in a city. Six districts sort the blocks by kind, a landmark flag makes some of them taller, and repetition makes a block wider. Nothing is scored, nothing is graded, and no streak breaks if you skip a week. The city simply shows what you have been paying attention to.

The name: *to cobble* is to make a thing from whatever is at hand, and a cobble is the stone underfoot on a street that was laid one stone at a time. Both halves are the app.

- **No account.** There is no Cobble server, so there is nothing to sign in to.
- **Lock it if you want to.** One passphrase seals the archive: the plaintext record is deleted, a single AES-256-GCM record replaces it, and the app tells you plainly that a forgotten passphrase means a lost city.
- **No tracking.** No analytics, no cookies, no third-party scripts reading your words.
- **No subscription.** Noncommercial use is free, forever, under a licence that says so.
- **No lock-in.** Your archive exports as a file you own, encrypted with a PIN you choose.

## Screenshots

| My city |
|---|
| ![The city view with districts, streets and weather](screenshots/city.webp) |

| Timeline | Search |
|---|---|
| ![The timeline view, one row per day](screenshots/timeline.webp) | ![One search result, with the match marked](screenshots/search.webp) |

| On this day | Dark interface |
|---|---|
| ![The same date a year earlier, under the city](screenshots/on-this-day.webp) | ![The app with the dark interface](screenshots/dark.webp) |

| A map of your cities |
|---|
| ![Tiles of saved cities, each with its own skyline](screenshots/city-map.webp) |

| A map of your cities |
|---|
| ![Tiles of saved cities, each with its own skyline](screenshots/city-map.webp) |

| A map of your cities |
|---|
| ![Tiles of saved cities, each with its own skyline](screenshots/city-map.webp) |

| The town, close | The valley, zoomed out |
|---|---|---|
| ![The 3D town with houses, people and traffic](screenshots/city-3d.webp) | ![The landscape at zoom: mountains, river, clouds](screenshots/city-landscape.webp) |

| A year in squares | The year, on one page |
|---|---|
| ![The year heatmap on the Discoveries view](screenshots/year-heatmap.webp) | ![The year in review, with figures and lines drawn from the archive](screenshots/year-review.webp) |

| The city at night | The 3D town |
|---|---|
| ![The city after dark](screenshots/city-night.webp) | ![The rebuilt 3D city, buildings on a lit ground](screenshots/city-3d.webp) |

| Discoveries | Milestones |
|---|---|
| ![Statistics, milestones and district bars](screenshots/insights.webp) | ![The achievements grid on the Discoveries view](screenshots/achievements.webp) |

| A day, opened | Share city |
|---|---|
| ![The day drawer, with a moment, its photo, and the Edit and Delete buttons](screenshots/day-drawer.webp) | ![The share dialog, asking for a PIN](screenshots/share.webp) |

| Landing page, after dark | On a phone — timeline |
|---|---|
| ![The landing page at night](screenshots/landing-night.webp) | <img src="screenshots/mobile.webp" width="300" alt="The timeline on a phone"> |

| On a phone — city |
|---|
| <img src="screenshots/mobile-city.webp" width="300" alt="The city on a phone"> |

Every capture is a real render of this repository at 1440×900, 1440×1000 and 390×844, produced by headless Chrome with the sample city loaded — no mock-ups, no retouching. The city shown is the illustrated CSS city, which is what everyone sees: the WebGL layer is experimental and off by default (see [the enhancement list](ENHANCEMENTS.md#6-the-3d-layer)).

## What it does

**The city**

- **A skyline made of your days.** Six district colours, six building shapes, rooftops, windows that scale with how often something has recurred, and a crown on any block that holds more than two moments.
- **A light interface and a dark one.** The ☾ button in the top bar flips the shell and remembers the choice; with no choice made it follows the system. The city keeps its own palette and its own Night control.
- **Five atmospheres and four weathers.** Meadow, coastal, amber, lavender and midnight; clear, cloudy, rain and snow. All drawn in CSS, none of them photographs.
- **Day and night.** Night relights the windows, darkens the hills and quiets the palette. Day and night are a button, not a clock.
- **Streets with traffic.** Cars pass, a person walks, a bird or a cat turns up, streetlamps come on at night, and a little theatre appears every ninth district — click it to open your photo gallery.
- **Districts you can wander.** Drag, scroll or use the arrow keys and the city pans sideways through neighbouring districts, redrawing each one from the same seed as you arrive.
- **Hindi and Gujarati.** The landing page ships in English, Hindi (`hi.html`) and Gujarati (`gu.html`); the app's chrome — nav, view headings, deck, primary buttons — switches inside the app with three pills in the sidebar, and so does every piece of text Cobble shows about itself: the toasts, the Discoveries stat cards and observations, the plan's footer, the welcome dialog. Templates are functions per language, so numbers land where each language wants them.
- **The city follows the clock.** One control in the deck, *Auto*, matches the scene to the time of day — dawn, day, dusk, night — and keeps up while the tab is open.
- **Sound, generated in the browser.** Wind, rain and the occasional bird, synthesised in WebAudio from a noise buffer — no audio files, no network, off until you ask.
- **A 3D town you can walk around.** Bungalows, villas and towers; people, cars, a bus, two-wheelers, a train and a plane; a pond with fish and a river; mountains on the horizon and cloud when you zoom out past the town. Hover a building to see what it is, click it to open that district in the timeline, drag to pan, scroll to zoom. The camera fits the archive, so a thousand moments is a bigger town rather than a cropped one. The illustrated city stays underneath as the fallback, and the toggle is remembered.
- **Immersive mode.** Hide every control and look at the city alone.

**The archive**

- **Six kinds of moment.** Everyday detail, people and connection, outside and nature, thoughts and ideas, small joys, something meaningful — each with its own colour and glyph.
- **Three weights.** A detail, something that mattered, a landmark. Weight becomes height.
- **Repetition.** Say that you noticed the same thing again; the block widens and the windows multiply.
- **One photo per moment**, resized on the device to at most 1280 px and encoded as WebP where the browser allows it, JPEG otherwise, whichever is smaller. EXIF orientation is honoured, so a photo taken sideways is stored upright. Nothing is uploaded.
- **A day drawer** that opens any date as a short chapter, with its photos and its order in the day.
- **On this day.** Moments from the same calendar date in earlier years, under the city, with how long ago each was. The panel hides itself when there is nothing to show.
- **Edit and delete**, with undo for both. Any moment in the drawer can be changed or removed; the Undo strip names what it will take back, and `Ctrl`/`Cmd`+`Z` does the same for twenty seconds.
- **A full timeline** of every day you have saved, newest first, one click from the same drawer.
- **Search over the whole archive.** One box in the timeline: what you wrote, the district name, or a date. Case and accents are folded (`cafe` finds `café`), the match is marked in place, and results keep their day grouping.
- **Filters that compose with it.** Six district chips, "Landmarks only", "With a photo" — and the status line says exactly what is narrowing the list.

**The discoveries**

- **Four live numbers** — moments kept, days remembered, personal landmarks, returning themes.
- **Six milestones**, each with a progress bar rather than a broken streak: first light, a little neighbourhood, city taking shape, days remembered, many sides of you, a landmark moment.
- **Observations in words, not predictions.** Your busiest district; the day that held the most; the shortest moment you kept, and what its length might mean. All computed from your own words, on your own device.
- **A district bar chart** so you can see which part of your attention is winning.
- **A year heatmap** — one square per day for the last twelve months, shaded by how many moments it held. Click a day and it opens.
- **Where your attention lives** — a plan of the city: six district tiles with counts and shares, each a click away from the moments behind it.
- **Your year, on one page** — four figures, four sentences drawn from your own archive, three moments worth looking at again, and a postcard to keep. No streaks, nothing to lose.

**Sharing and keeping**

- **Encrypted city files.** Choose any subset of moments, set a 6–12 digit PIN, and Cobble writes a `.cobble` file: AES-256-GCM, key derived with PBKDF2-SHA-256 at 250,000 iterations, random 16-byte salt and 12-byte IV per export.
- **Import with validation.** Every field of every imported moment is checked against a schema before it touches your archive; duplicates are skipped; a damaged file is refused with a reason.
- **A readable backup too.** Beside the encrypted file there is "Export readable backup" — plain JSON, with a note inside saying it is not encrypted. Lose the PIN, keep the city.
- **Save a postcard.** One click draws the skyline to a 1200×630 PNG — wordmark, level, counts, district colours — with no text from any moment and no photos in it.
- **Download the whole app** as a zip, straight from the app, with a README inside.
- **Honest storage reporting, and a guard.** IndexedDB with a localStorage fallback, the size of your archive in KB, how much room the browser will still give you — and a warning at 80% of quota with a one-click backup, before a save has a chance to fail.

**Offline, installable, self-contained**

- **A service worker that keeps the whole site.** The first visit caches the landing page, the app, the fonts, the icons and the docs hub; after that it opens with the network off. Navigations try the network first and fall back to the cache, so a new deploy is picked up on the next online visit.
- **Installable.** `manifest.json` with a proper icon set (including a maskable one) and two shortcuts: "My city" and "Sample city". Install it from the address bar, or from the browser's menu on a phone.
- **No CDN at runtime.** The three families are self-hosted as woff2 and the only library is vendored: JSZip, fetched when you press "Download app package". A page load makes no request to anyone else.
- **`selftest.html`** loads every file the worker is supposed to keep and tells you, file by file, whether it came from the cache or the network. Run it online, then with the network off.

**Built to survive a boring browser**

- Escape closes every overlay and returns focus to whatever opened it; focus is trapped inside dialogs; a skip link is first in the tab order; the toast is a live region, so saves and failures are spoken.
- **Every text colour clears 4.5:1** on the surface it sits on, in both the light and dark interfaces — 71 colours were darkened to get there.
- `N` opens a new moment, `Ctrl`/`Cmd`+`Z` undoes a delete.
- The city's motion stops when the system asks for reduced motion, in the app and on the landing page.
- Printing the timeline gives you the days on paper, without the chrome.
- The illustrated city is CSS, so it renders even where WebGL, canvas or a CDN is missing.
- No build step, no bundler, no framework, no `node_modules`. Five files, served as they are.

## Tests

```bash
node --test tests/
```

Twenty-four tests over the two places where a bug costs data rather than pixels: the share format and the import validator. No framework, no dependencies — Node 20 ships the same Web Crypto the browser exposes, so the round-trip exercises the real format. The suite covers a city surviving encryption, two exports of the same city producing different salt and IV, a wrong PIN and a flipped ciphertext byte both failing, malformed bundles refused before any crypto runs, weights clamped rather than trusted, and eleven kinds of bad moment each rejected for its own reason.

## Quick start

```bash
git clone https://github.com/drsamonline/Cobble.git
cd cobble
python3 -m http.server 8000
```

Open <http://localhost:8000> for the landing page, or <http://localhost:8000/app/> for the app.

> Serve the folder; do not open `app/index.html` as a `file://` URL. Browsers give `file://` pages no IndexedDB and no Web Crypto, which costs you the archive and the encrypted share. Any static host works — GitHub Pages, Netlify, a Raspberry Pi on your own Wi-Fi.

Nothing is loaded from a CDN. The fonts are in `fonts/`, the two libraries are in `app/vendor/`, and the service worker keeps the whole site for offline use. Serve it over `http://` or `https://` — a service worker will not register on `file://`.

To check the offline promise yourself, open `/selftest.html` with the network on, then again with it off.

## Packaging

`packaging/` holds a Tauri desktop wrapper and a Capacitor Android wrapper, both
pointing at the same `app/` folder with no build step. They are **authored, not
yet built** — `docs/packaging.md` says what that means, what the first run will
likely need, and what a device test should look at.

## Documentation

| Guide | What it covers |
|---|---|
| [Getting started](docs/getting-started.md) | First moment, the sample city, where your data lives, how to keep it |
| [How the city works](docs/how-the-city-works.md) | Districts, weights, repetition, atmospheres, weather and the seed that draws your skyline |
| [Architecture](docs/architecture.md) | The files, the render loop, the storage layer, and why there is no build step — plus [the diagram](docs/cobble-architecture.excalidraw) |
| [Data model](docs/data-model.md) | The moment schema, IndexedDB layout, the localStorage fallback, the `.cobble` file format |
| [Privacy and security](docs/privacy-and-security.md) | What is stored, what leaves the device, the exact cryptography, and its limits |
| [Customising](docs/customising.md) | Palettes, districts, atmospheres, copy and layout — with the token names |
| [Deploying](docs/deploying.md) | GitHub Pages, any static host, and packaging as a desktop or Android app |
| [FAQ](docs/faq.md) | Lost data, broken share files, big archives, browser support |
| [Performance](docs/performance.md) | What the pages weigh, what was done about it, and the one number that is still bad |
| [Working on this repository](AGENTS.md) | The invariants, the file map, and the checks to run before a change is done |
| [Privacy notice](PRIVACY.md) | What is stored, where, what leaves the device, how to delete it |
| [Security policy](SECURITY.md) | How to report a vulnerability, and the limitations stated up front |

## Privacy, in one paragraph

Your moments live in your browser's IndexedDB on your device. There is no Cobble account and no Cobble backend, so there is nothing to leak, subpoena or sell. The app makes no analytics calls, and the fonts and both libraries are served from this repository — a page load makes no request to anyone else. The only data that ever leaves is a `.cobble` file you create yourself, encrypted with a PIN that never travels with it.

The honest caveats: the sample city's photographs come from `images.unsplash.com`, which is the one external request the site makes and only for the demo; clearing site data clears the city; a six-digit PIN protects against a person, not a cluster; and a locked city has no recovery if the passphrase is forgotten. All four are written up in [privacy and security](docs/privacy-and-security.md).

## Enhancements

[**ENHANCEMENTS.md**](ENHANCEMENTS.md) is the full list — every idea, ordered by effort, with the file each one touches. It opens with the quick wins: vendor the three CDN dependencies and the app becomes genuinely offline; add a manifest and a service worker and it becomes installable; add full-text search, a recycle bin and JSON export, and it becomes hard to lose anything. Then the larger bets: a year heatmap, multiple cities, print, translation, and single-file desktop and Android builds.

## Built on the fleet

Several of these projects came before this one. It borrows from them instead of reinventing them. What came from where:

| Repository | What was taken | How it was used here |
|---|---|---|
| [**Mood Mixer**](https://github.com/drsamonline/mood-mixer) | The versioned-cache, network-first service worker, the `manifest.json` shape, the `selftest.html` idea and the support block | `sw.js`, `manifest.json`, `selftest.html`, and the sponsor section of this README are adapted from it |
| [**Planner Pro**](https://github.com/drsamonline/planner-pro) | The CI layout (a link check and a size budget as separate scripts), the icon sizes, the packaging approach | `.github/workflows/check.yml`, `tools/check-links.mjs`, `tools/check-size.mjs` |
| [**App Builder**](https://github.com/drsamonline/app-builder) | The single-file Windows executable and Android WebView packaging pipeline | The route to a desktop and Android build, written up in [deploying](docs/deploying.md) — not run in this repository |
| [**Lockhtml**](https://github.com/drsamonline/lockhtml) | Its AES-256-GCM + PBKDF2 sealing pattern, and the vocabulary used to describe it honestly | Confirmed the parameters in the share format and the wording of the [privacy page](docs/privacy-and-security.md) |
| [**Offline PDF Toolkit**](https://github.com/drsamonline/offline-pdf-toolkit) | The habit of saying what a browser refuses to do on `file://` | The warnings in getting started and deploying |
| [**Base Bench**](https://github.com/drsamonline/base-bench) | The PolyForm Noncommercial licence setup and the `NOTICE.md` structure | `LICENSE`, `NOTICE.md` |

The app's own code is unchanged in behaviour: the city, the districts, the seed, the timeline, the discoveries, the sample city. What changed is the ground under it. Self-hosted fonts, vendored libraries, a worker, a manifest, an icon set and two CI checks.

## Support

<img src="docs/assets/support-portrait.jpg" width="72" height="72" alt="Dr. Sohil Momin" align="left" style="border-radius:50%;margin-right:1rem">

Free, offline, accountless, and staying that way. If it earned its keep:

| | |
|---|---|
| UPI (India) | `drsohilboi@ybl` — payee Dr. Sohil Momin, open amount, or scan [the QR](docs/assets/upi-qr.svg) |
| GitHub Sponsors | [github.com/sponsors/drsamonline](https://github.com/sponsors/drsamonline) |
| Ko-fi | [ko-fi.com/matneo](https://ko-fi.com/matneo) |
| PayPal | [paypal.me/drsohilmomin](https://paypal.me/drsohilmomin?locale.x=en_GB&country.x=IN) |
| My books | [Amazon author store](https://www.amazon.com/stores/author/B08ZT331LY/allbooks?ccs_id=aed72b9f-71d9-43dc-adee-e9368a317acc) |
| More apps | [drsamonline.github.io](https://drsamonline.github.io/) |
| Email | [sohilmomin2000@gmail.com](mailto:sohilmomin2000@gmail.com) |

Nothing is gated behind it: no accounts, no tracking, no network requests.

<div align="center">

[![Sponsor on GitHub](https://img.shields.io/badge/%E2%9D%A4%20Sponsor-GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/drsamonline)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-matneo-ff5e5b?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/matneo)
[![PayPal](https://img.shields.io/badge/PayPal-drsohilmomin-00457c?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/drsohilmomin?locale.x=en_GB&country.x=IN)
[![Books](https://img.shields.io/badge/Books-Amazon%20author%20store-ff9900?style=for-the-badge&logo=amazon&logoColor=white)](https://www.amazon.com/stores/author/B08ZT331LY/allbooks?ccs_id=aed72b9f-71d9-43dc-adee-e9368a317acc)

</div>

The same block is on the [landing page](https://drsamonline.github.io/Cobble/#support), with the UPI ID copyable and the QR scannable, so nobody has to open GitHub to support the work.

## Licence

[PolyForm Noncommercial 1.0.0](LICENSE) — free for personal, academic, hobby, charitable and government use. Commercial use needs a written licence from the author. Third-party work is credited in [NOTICE.md](NOTICE.md).

The legal surface is four files, sized to what the app actually does: [LICENSE](LICENSE), [NOTICE.md](NOTICE.md) (fonts, libraries, sample photographs), [PRIVACY.md](PRIVACY.md) (on-device storage, stated plainly, with the file that proves each claim) and [SECURITY.md](SECURITY.md) (how to report a problem, and the limitations listed rather than buried). There is no terms-of-service file: there is no service, no account and nothing to buy.

## Author

**Dr Sohil Momin** — [@drsamonline](https://github.com/drsamonline), homeopathic physician and builder of offline-first software.

<p align="center"><sub>Made for people who notice things.</sub></p>
