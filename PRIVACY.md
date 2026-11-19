# Privacy notice

**Version 1.0 · Effective 19 November 2026 · Owner: Dr Sohil Momin**

This notice describes what the Cobble app does with your information. Every claim here is checkable against this repository — the file that proves it is named in each section.

Cobble is a static web app. There is no Cobble server, no account and no database belonging to the author. The app runs entirely in your browser, and the only copy of your moments is the one on your own device.

## What is stored, and where

| Stored | Where | File that proves it |
|---|---|---|
| Your moments: the text you wrote, the date, the district, the weight, the repetition count, and a photo if you attached one | Your browser's IndexedDB, database `cobble-archive`, object store `archive`, single record `moments` | `app/app.js`, `openDatabase()` / `saveToDatabase()` |
| The same archive, when IndexedDB is unavailable or full | `localStorage`, key `cobble-moments-v1` | `app/app.js`, `save()` |
| Your choice of city theme, mood, weather and day/night | `localStorage`, key `cobble-atmosphere-v1` | `app/app.js`, `saveAtmosphere()` |

Photographs are resized on your device before they are stored: at most 1280 pixels on the long edge, re-encoded as JPEG at quality 0.76. Files larger than 12 MB are refused. The resized image never leaves the device unless you export it.

There is no identifier that survives a reload other than your own words. No device id, no session token, no "last seen" timestamp.

## What leaves your device

Three things, and only three.

1. **A `.cobble` file you create yourself.** When you press *Encrypt & download*, your browser encrypts the moments you selected with a key derived from your PIN and saves the result to your downloads folder. Nothing is uploaded. The file travels only if you send it to someone.
2. **Ordinary web requests to whoever hosts the page.** If you use the published copy, that is GitHub Pages; a request to any web server discloses your IP address and user agent in the usual way. Those requests carry none of your moments.
3. **Photographs in the sample city.** The eighteen example moments load images from `images.unsplash.com`. This happens only while the sample city is on, and never for your own moments.

There is no analytics, no telemetry, no error reporting, no advertising and no third-party script. The typefaces, the icons and the two JavaScript libraries are served from this repository rather than a CDN, so loading the page contacts nobody but its own host. To check the last claim yourself:

```bash
grep -rn "fetch(\|sendBeacon\|XMLHttpRequest\|WebSocket" app/*.js sw.js selftest.html
```

The only hits are the app reading its own source files to build the download zip, the service worker caching its own origin, and the self-test page checking that cache.

## Cookies

None. The app sets no cookies and reads none.

## Sharing with another person

When you export a city, the file is encrypted with AES-256-GCM using a key derived from your PIN by PBKDF2-SHA-256 at 250,000 iterations, with a fresh 16-byte salt and 12-byte IV on every export. The PIN is never written into the file and never stored anywhere.

Two practical points: send the file and the PIN by different channels, and use twelve digits rather than six for anything you would mind being read. A six-digit PIN is a lock on a drawer, not a safe.

## Deleting your data

Your moments are deleted when you delete them in the app, and completely when you clear the site's data in your browser. There is no copy on any server to request, so there is no erasure request to make. Use *Share city → Export readable backup* before you clear browser data, move to another machine, or hand a device to someone else.

## Children

Cobble is a general-purpose reflective tool, not directed at children, and it has no age gate. Because the author receives no data at all, no children's data is collected by the author. If you deploy this app yourself for use by children, that becomes your responsibility.

## If you deploy Cobble yourself

The author publishes source code and a static site. If you host Cobble, or run it for other people, you become the operator of that deployment, and the obligations that attach to operating it — under India's Digital Personal Data Protection Act 2023, and under any law that applies where you are — are yours, not the author's. The app as written stores everything in the visitor's own browser and transmits nothing, which keeps that surface small. It does not make it zero: your host's logs, your domain, and anything you add to the page are outside this notice.

## What this notice does not do

It does not quote statutory text, and it makes no claim of certification, registration or compliance. It describes what the software does as shipped at version 1.5.x. If the code changes, this file changes in the same commit.

For a deployment that holds health information about identified patients, or that is sold commercially, take advice from a qualified Indian advocate before publishing. The author is a physician, not a lawyer.

## Contact

Dr Sohil Momin — <sohilmomin2000@gmail.com> · [github.com/drsamonline](https://github.com/drsamonline)

Security reports: see [SECURITY.md](SECURITY.md).
