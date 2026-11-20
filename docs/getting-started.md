# Getting started

Cobble is a static web app. There is nothing to install and no account to make. You need a browser, and a folder to serve.

## Run it locally

```bash
git clone https://github.com/drsamonline/Cobble.git
cd cobble
python3 -m http.server 8000
```

- Landing page: <http://localhost:8000/>
- The app: <http://localhost:8000/app/>
- The app with the sample city already loaded: <http://localhost:8000/app/?demo=1>

Any static server works — `npx serve`, `php -S localhost:8000`, nginx, Caddy. The only requirement is that it serves files over `http://` or `https://`, not `file://`.

Once the page has loaded, it works with the network off: a service worker keeps the landing page, the app, the fonts and the icons. Nothing is fetched from a CDN, so "offline" means offline. To install it, use your browser's **Install** button in the address bar (or *Add to Home Screen* on a phone); it opens straight into the city.

**Why not `file://`?** Browsers deliberately deny `file://` pages IndexedDB and Web Crypto. Opening `app/index.html` by double-clicking it costs you the archive and the encrypted share. The illustrated city still renders, which makes the failure look like a bug rather than a policy.

## Your first moment

1. Open the app and press **Add a moment**.
2. Write one thing you noticed. Up to 500 characters — a sentence is plenty.
3. Pick a district: everyday detail, people, outside, thoughts, small joys, or something meaningful.
4. Choose a weight: a detail, something that mattered, or a landmark. This becomes the block's height.
5. Optionally, add a photo. It is resized on your device to at most 1280 px on the long edge and re-encoded as a JPEG at quality 0.76 before it is stored. Files above 12 MB are refused.
6. Set the date — today by default — and save.

The block appears in the city, and the day appears in the timeline. That is the whole loop.

**Changing and removing.** Open a day in the timeline and each moment in the drawer has **Edit** and **Delete**. Edit reopens the form with everything already filled in. Both leave an Undo strip for twenty seconds, and `Ctrl`/`Cmd`+`Z` does the same — as does importing a city file, which can be taken back in one click.

**When the browser is nearly full.** Past 80% of the space this site is allowed, Discoveries shows a warning with a one-click backup. Past 97% the photo picker refuses a new photo rather than letting the save fail.

**Repetition.** If you have noticed the same thing before, say so with the repetition field. A moment seen twice or more gets a wider block and more windows, and counts towards "returning themes" in Discoveries.

## Where your moments live

In this browser, on this device, in IndexedDB:

```
database: cobble-archive
  object store: archive
    record: { id: 'moments', value: '<JSON array of every moment>' }
```

If IndexedDB is unavailable or refuses a write — private windows, some managed browsers, a full disk — the app falls back to `localStorage` under the key `cobble-moments-v1` and tells you it is on the smaller store. On the next load it prefers whichever copy is newer, and moves the localStorage copy back into IndexedDB when it can.

Consequences worth internalising:

- **Clearing site data deletes the city.** So does "clear cookies and site data" in a cleanup sweep.
- **A different browser is a different city.** There is no sync. That is the price of having no server.
- **A private window is temporary.** Everything in it goes when the window closes.
- **Uninstalling the browser deletes it**, unless the profile survives.

## Keeping it safe

Two mechanisms, for two different jobs.

**Share city** (`Share city` in the top bar) writes an encrypted `.cobble` file. Choose which moments to include, set a PIN of 6–12 digits, and the app writes AES-256-GCM ciphertext with a key derived from your PIN. This is the format for sending a city to another person. It is also a perfectly good backup format — write the PIN on the same piece of paper as the filename, not in the same file.

**Save a postcard** draws the skyline to a 1200×630 PNG and downloads it — the wordmark, the city's level and the counts, with no text from any moment and no photos in it. Safe to post.

**Download app package** (`↓ Download app package`, in the app's help panel) writes a zip of the five source files, so you can keep running the app even if the repository disappears. It deliberately does not include your moments: those are personal, and a "backup" that quietly bundles your diary into a zip is a bad default.

**Export readable backup** (also in the share dialog) writes plain, unencrypted JSON — `cobble-backup-YYYY-MM-DD.json`. It is the copy you keep, not the one you send: anyone who opens it can read it. Use it before clearing a browser, moving machines, or handing a laptop to someone else.

**Import** (`Open a city file` in the share dialog) reads a `.cobble` file, asks for its PIN, validates every field, skips moments whose ids already exist, and reports how many were added.

## The plan of the city

Discoveries opens with **Where your attention lives**: six tiles, one per district, each with its moment count, its share of the archive and a bar in the district's colour. Click a tile to open the timeline filtered to it; click it again to clear. It is the same filter the chips use, so a district selected here shows as a pressed chip there.

## The year, on one page

Discoveries → **Your year, on one page** summarises the last twelve months: moments kept, days remembered, districts visited, months with a moment, then four sentences taken from the archive itself — where your attention went, your longest run, your fullest month, the longest quiet stretch. Three moments worth looking at again sit underneath, and **Save as a postcard** turns the skyline into a 1200×630 PNG.

## Seeing the year

Discoveries carries a heatmap: one square per day for the last twelve months, shaded by how many moments that day held. It is not a streak and nothing breaks if it goes quiet — it is just the shape of the year, in one glance. Click any square with moments in it to open that day.

## Coming back to a day

Under the city there is an **On this day** strip: moments you saved on this calendar date in earlier years, with how long ago each one was. Click any of them to open that day. It only appears when there is something to show, so a new archive never sees an empty panel.

## Finding something again

The timeline has a search box. It looks at three things: what you wrote, the district (so `nature` finds every outside moment) and the date (`2026-11` finds a month). Case and accents are folded — `cafe` finds `café`. Matches are marked in place, and every matching day is shown, not just the first fifty.

`Esc` in the box clears it; so does the × that appears once you have typed something.

Under the box are filters: the six districts, **Landmarks only**, **With a photo**. They compose with the search and with each other, the status line says what is active, and **Clear filters** appears only when there is something to clear.

## The sample city

`Explore a sample city` loads eighteen example moments and their photographs. While it is on, the app is read-only with respect to your archive: saving is suppressed, the Add and Share buttons return you to your own city first, and leaving the sample restores exactly what you had. It exists so that someone arriving at an empty app can see what a city looks like after a couple of months.

The photographs in the sample come from Unsplash and are loaded from Unsplash's servers — the only time the app fetches an image from anywhere but its own origin.

## Checking the offline cache

Open `/selftest.html`. It loads every file the service worker is supposed to keep and reports, per file, whether it came from the cache or the network. Run it once online — everything should say `cached` — then turn the network off and run it again. A row that fails with the network off is a file the worker is not keeping, which is a bug worth reporting.

## More than one city

**Saved cities** in the sidebar keeps named copies of the whole archive. *Save a copy of this city* names what you have now; the shelf lists every copy with its moment count, and loading one swaps it in — after the city you were in is saved as *Before switching*, so a load can never lose anything. Delete a copy with the × beside it.

Copies are independent snapshots, not live archives: editing one does not touch another.

## Bringing a journal with you

*Share city → Import another journal* reads **Day One's JSON export** and **markdown or text with a `YYYY-MM-DD` line above each entry**. Everything is read in the page — nothing is uploaded. Dates become moments, long entries are cut to 500 characters, and the same merge rule applies, so importing the same file twice adds nothing. The import can be undone from the strip that appears afterwards.

## Locking your city

Discoveries → **Lock this city** asks for a passphrase of at least eight characters and seals the archive. From then on the app opens with an unlock screen, and every save re-encrypts before it reaches the disk. There is no recovery: if you forget the passphrase the city is gone, and the app says so before it locks. **Start a new city instead** wipes the sealed archive if you would rather begin again.

## The 3D city

Press **3D city** in the control deck. The town has bungalows, villas and towers, people walking, cars, a bus, two-wheelers, a train and a plane, a pond with fish, a river, and mountains on the horizon.

Hover a building and it tells you which district it belongs to and how many moments are in it; click it and the timeline opens filtered to that district. Drag to pan, scroll to zoom, double-click to re-centre. Scroll out past about 1.4× and cloud fades in over the landscape — at the far end you are looking at a valley with a town in it. The camera fits the town, so a large archive is shown as a larger city rather than a cropped one.

## Following the clock

**Auto** in the city's control deck matches the scene to the time of day: dawn is coastal and tranquil, midday is meadow and serene, dusk is amber and dreamy, night is midnight and after dark. It re-checks every five minutes, so a tab left open drifts with the day. Press Theme, Mood, Weather or Night and Auto switches off — a scene that keeps changing under a deliberate choice is a scene fighting you.

## Another language

Three pills at the bottom of the sidebar — **EN · हिं · ગુ** — translate the interface's chrome: the sidebar, the breadcrumb, the three view headings, the section titles, the city's control deck and the primary buttons. The choice is remembered, and the sentences Cobble writes about your archive follow it too — toasts, the Discoveries observations, the plan's footer. They are built from templates that are functions per language, so numbers land where each language wants them. The welcome dialog and the Discoveries stat cards are included; the long-form guides in `docs/` are English by design.

## Sound

The city's control deck has a **Sound** control: wind, rain and the occasional bird, generated in the browser rather than downloaded, and off until you press it. It is remembered between visits, though browsers only start audio after a gesture, so a stored preference waits for your first click. Night lowers it.

## Light or dark

The ☾ button in the top bar flips the interface between light and dark, and the choice is remembered. If you never touch it, the app follows your system's setting — a dark-mode system gets a dark app on the first visit. This is the interface only: the city keeps its own palette, and its own **Night** control sits in the city's control deck.

## Keyboard and touch

| Action | How |
|---|---|
| Pan the city | Drag it, scroll horizontally, or focus the city and use ← / → |
| Close any overlay | `Esc` (focus returns to whatever opened it) |
| New moment | `N` |
| Undo a delete | `Ctrl`/`Cmd`+`Z`, or the Undo strip |
| Move through the tab order | `Tab` — focus stays inside an open dialog |
| Hide every control | `Hide controls` in the city, or `Esc` to bring them back |
| Open a day | Click a day in the timeline, or a building in the city |

## Next

- [How the city works](how-the-city-works.md) — what the shapes mean.
- [Privacy and security](privacy-and-security.md) — the exact guarantees and their limits.
- [FAQ](faq.md) — when something has gone wrong.
