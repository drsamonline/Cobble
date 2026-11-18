# FAQ

**My city is gone. What happened?**

In order of likelihood:

1. **The site data was cleared** — by you, by a "clean up my browser" sweep, or by a browser that evicts storage under disk pressure. There is no copy anywhere else; that is the design.
2. **You are in a different browser or profile.** Each one has its own IndexedDB. Check the same browser you used before, then a different profile of it.
3. **You opened it in a private window last time.** Those archives go when the window closes.
4. **The site moved.** Storage is keyed by origin. `localhost:8000`, `127.0.0.1:8000`, `drsamonline.github.io` and a Netlify preview are four different cities. This catches people out constantly when testing locally.
5. **`file://`.** Opening `app/index.html` by double-clicking gives you no IndexedDB at all, so every save silently lands in the smaller fallback or nowhere.

If you have a `.cobble` file, open the share dialog, choose **Open a city file**, and import it. If you do not, there is no recovery — and the fix for next time is a monthly export.

**Can I get my data out as plain text?**

Yes, since v1.3.0: **Share city → Export readable backup** writes `cobble-backup-YYYY-MM-DD.json` with every moment, unencrypted, and says so inside the file. If you want the old route — open the app, open DevTools, and run

```js
copy(JSON.parse(localStorage.getItem('cobble-moments-v1') || '[]'))
```

on the localStorage path, or read the `moments` record from IndexedDB's `cobble-archive` on the primary path. Both are your data in plain JSON, with no protection to bypass. The `.cobble` format is documented in [the data model](data-model.md) if you would rather write a script.

**The share file says the PIN is wrong, and I am certain it is right.**

The PIN and the file must be from the same export. A file exported with 12 digits cannot be opened with 6. Also check you are not pasting a PIN with a space or a newline, and that the file did not pass through something that rewrote it — a chat app that "previews" a JSON file sometimes mangles it. Re-send as a document, not as text.

**Can I use it on my phone and my laptop with the same city?**

Not automatically — there is no sync. Export from one and import into the other. You can do that as often as you like; the importer skips moments it already has, so a re-import is safe rather than duplicating.

**Does it work offline?**

Yes, since v1.1.0. The first visit caches the whole site — landing page, app, fonts, icons — and after that it opens with the network off. Nothing is loaded from a CDN. Two caveats: a service worker will not register on `file://`, and the sample city's photographs come from Unsplash, so they are the one thing that needs a connection. Your own moments never do. `/selftest.html` will show you exactly what is cached.

**How many moments can it hold?**

The practical limit is your browser's storage quota, usually a few hundred megabytes to a gigabyte for the origin, and photos are the expensive part. A moment with no photo is roughly 300 bytes; a moment with a photo is 80–250 KB. So: tens of thousands of text moments, or a few thousand with photos. The app shows your archive size and the browser's remaining estimate on the Discoveries view.

**I deleted a moment by accident.**

There is an Undo strip for twenty seconds, and `Ctrl`/`Cmd`+`Z` works while the tab is open. After that, the only copy is a backup — which is why the readable JSON export exists.

**Why is the sample city read-only?**

Because it is not yours. Saving while the sample is on would either mix someone else's example moments into your archive or overwrite your own. The app suppresses saving, returns you to your city when you press Add or Share, and restores your archive exactly when you leave.

**Can I change the six categories?**

Yes, but read [customising](customising.md) first: renaming a category key orphans the moments already filed under it, because the key is stored in every moment.

**Is there a dark mode?**

Not a global one. There is a **Night** control in the city, which changes the city itself — sky, sun, lit windows, streetlamps — and it resets on reload. A full dark theme for the whole app is on the enhancement list.

**Does it work in Safari? Firefox? Brave?**

It is built on IndexedDB, Web Crypto, service workers and standard CSS, all of which are supported in current Safari, Firefox, Chrome, Edge and Brave. Firefox will not offer to install a PWA on the desktop, and Safari's "Add to Home Screen" is a different thing from Chrome's install prompt — but both keep working. Two known differences: Safari's storage eviction is more aggressive for sites you rarely visit, so export more often; and Brave's shields can restrict storage per-site, in which case the app falls back to localStorage and says so.

**Why no search?**

Because the city was built as the index, and search is a list-shaped answer to a place-shaped question. That said: it is the most-requested thing this app does not have, and it is first in the archive section of the enhancement list.

**Can I use it at work / in my clinic / commercially?**

Personal, academic, hobby, charitable and government use are free under the [PolyForm Noncommercial licence](../LICENSE). Commercial use needs a written licence from the author — email <sohilmomin2000@gmail.com>. If you are a practitioner who wants it for your own reflective notes, that is personal use and it is free.

**Who made this?**

Dr Sohil Momin, a homeopathic physician in India who writes offline-first software in the gaps between clinics. More at [drsamonline.github.io](https://drsamonline.github.io/).
