# Privacy and security

A journal is the most personal thing on a phone after the photographs. This page states what Cobble does, what it does not do, and where the edges are. It is written to be checkable against the source, not to be reassuring.

## What is stored

One thing: your moments, as described in [the data model](data-model.md), in this browser's IndexedDB on this device, with a localStorage fallback.

Nothing else persists. Not the atmosphere you chose, not the view you were on, not the scroll position, not a "last seen" date. There is no identifier that survives a reload except your own words.

## What leaves the device

Three things, and you should know all three:

**1. A `.cobble` file — only when you press the button.** Created by your browser, saved to your downloads folder, encrypted with a key derived from your PIN. Nothing is uploaded; the file never touches a network until you send it to someone yourself.

**2. Unsplash images, in the sample city only.** The eighteen sample moments use photographs hosted by Unsplash, and those images are fetched from `images.unsplash.com` when the sample is on. Your own moments never load anything from anywhere.

That is the complete list. Everything else the app needs — the three typefaces, JSZip, the icons — is served from this repository's own folder. There is no font CDN, no script CDN, no analytics endpoint, no error reporting, no telemetry, no A/B assignment, and no server of ours to receive any of it. There is no analytics endpoint, no error reporting, no telemetry, no A/B assignment, no "anonymous usage statistics" — and no server of ours to receive any of it.

## The cryptography

When you share a city:

```
PIN (6–12 digits, digits only)
  └─ PBKDF2, SHA-256, 250,000 iterations, 16-byte random salt
      └─ AES-GCM, 256-bit key, 12-byte random IV
          └─ ciphertext + 128-bit auth tag, stored in the file
```

- **Salt and IV are fresh on every export**, generated with `crypto.getRandomValues`. Exporting the same city twice produces two different files.
- **The PIN never leaves the device.** It is not written into the file, not stored, not logged. It is read from an input field, used to derive a key, and dropped.
- **Tampering is detected.** AES-GCM authenticates; a modified file fails to decrypt rather than decrypting to something else.
- **Everything runs in Web Crypto** — the browser's own implementation, not a JavaScript library with its own bugs.

If `crypto.subtle` is unavailable — which happens on `file://` pages and on plain `http://` origins other than localhost — the app refuses to export and says so, rather than falling back to something weaker.

## The honest limits

**A six-digit PIN is a lock on a drawer, not a safe.** 250,000 PBKDF2 iterations makes each guess expensive, but a six-digit space is a million possibilities and a determined attacker with a GPU cluster can walk it. Use twelve digits for anything you would mind being read, and treat the PIN as protecting against a curious person, not an adversary with hardware.

**Send the file and the PIN separately.** Two messages in the same chat is one message. A file in email and a PIN by voice is a different thing entirely.

**Clearing site data deletes the city.** So does a browser "cleanup", a profile reset, or a private window closing. Cobble cannot prevent this — it has no copy anywhere else. Export before you clean.

**Browser extensions can read the page.** Any extension with permission to run on all sites can read your archive as you look at it. That is true of every web app, including ones with servers; it is worth knowing anyway.

**A shared computer is a shared city.** There is no app lock. If the device is shared, use a separate browser profile, and export before you hand it over.

**No protection against someone with the unlocked device.** Physical access wins. Encryption at rest for the whole archive is on the [enhancement list](../ENHANCEMENTS.md); the encrypted file format already exists, so it is a smaller job than it sounds.

## What is deliberately absent

| Not present | Why |
|---|---|
| Accounts, sign-in, email capture | There is no server to hold an identity |
| Analytics, heatmaps, session replay | The archive is the product; measuring readers is not the job |
| Ads, affiliate links, sponsored content | Support is voluntary and unrelated to the app |
| Cloud sync | Sync means a server, and a server means someone else can read your days |
| AI features that send text anywhere | If it ever arrives, it must run on the device, and it must be off by default |
| Push notifications, streak pressure | A city that scolds you for missing a week is a city you stop visiting |

## Verifying any of this

The whole app is 141 KB of readable source with no minification and no build step. Useful places to look:

```bash
# every network call the app can make
grep -rn "https://" app/*.js app/*.css app/index.html index.html assets/

# the crypto, in one function
sed -n '/async function deriveKey/,/^  }/p' app/app.js

# every write to storage
grep -n "localStorage\|indexedDB\|saveToDatabase" app/app.js

# confirm nothing is sent anywhere
grep -rn "fetch(\|XMLHttpRequest\|sendBeacon\|WebSocket" app/*.js
```

The last command should show exactly one `fetch` — the one that reads its own source files to build the download zip — plus the service worker's own fetches, which are all same-origin. `tools/check-links.mjs` fails the build if any page or script starts pointing at a CDN again.

Since v1.1.0 the app also works with the network switched off. That is not a privacy claim on its own, but it is a useful one: if the page keeps working in aeroplane mode, nothing on it was phoning home.

## If you find a problem

Open an issue at <https://github.com/drsamonline/Cobble/issues>, or email <sohilmomin2000@gmail.com> for anything you would rather not post publicly. There is no bounty programme; there is a person who will fix it and credit you.
