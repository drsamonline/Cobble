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

**Download app package** (`↓ Download app package`, in the app's help panel) writes a zip of the five source files, so you can keep running the app even if the repository disappears. It deliberately does not include your moments: those are personal, and a "backup" that quietly bundles your diary into a zip is a bad default.

**Export readable backup** (also in the share dialog) writes plain, unencrypted JSON — `cobble-backup-YYYY-MM-DD.json`. It is the copy you keep, not the one you send: anyone who opens it can read it. Use it before clearing a browser, moving machines, or handing a laptop to someone else.

**Import** (`Open a city file` in the share dialog) reads a `.cobble` file, asks for its PIN, validates every field, skips moments whose ids already exist, and reports how many were added.

## Coming back to a day

Under the city there is an **On this day** strip: moments you saved on this calendar date in earlier years, with how long ago each one was. Click any of them to open that day. It only appears when there is something to show, so a new archive never sees an empty panel.

## Finding something again

The timeline has a search box. It looks at three things: what you wrote, the district (so `nature` finds every outside moment) and the date (`2026-11` finds a month). Case and accents are folded — `cafe` finds `café`. Matches are marked in place, and every matching day is shown, not just the first fifty.

`Esc` in the box clears it; so does the × that appears once you have typed something.

## The sample city

`Explore a sample city` loads eighteen example moments and their photographs. While it is on, the app is read-only with respect to your archive: saving is suppressed, the Add and Share buttons return you to your own city first, and leaving the sample restores exactly what you had. It exists so that someone arriving at an empty app can see what a city looks like after a couple of months.

The photographs in the sample come from Unsplash and are loaded from Unsplash's servers — the only time the app fetches an image from anywhere but its own origin.

## Checking the offline cache

Open `/selftest.html`. It loads every file the service worker is supposed to keep and reports, per file, whether it came from the cache or the network. Run it once online — everything should say `cached` — then turn the network off and run it again. A row that fails with the network off is a file the worker is not keeping, which is a bug worth reporting.

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
