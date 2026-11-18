# Deploying

Cobble is static files. Anywhere that can serve HTML can serve it.

## GitHub Pages (what this repository uses)

The repository is already set up for it: **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.

- Landing page: `https://<user>.github.io/cobble/`
- The app: `https://<user>.github.io/cobble/app/`
- Sample city: `https://<user>.github.io/cobble/app/?demo=1`

Two things to know about a project page like this one:

1. The app lives in a subdirectory, so every path inside it must be **relative**. That is why `app/index.html` links `theme.css` rather than `/theme.css`, and why the download-package function fetches `index.html` rather than `/index.html`. If you deploy the app at a domain root instead, both work — relative paths are the portable choice.
2. There is an empty `.nojekyll` at the root, so Pages serves the folder exactly as it is and Jekyll never touches it. That is deliberate: the app and the landing page are plain HTML, and the markdown guides are read on GitHub, where they render properly. Delete the file if you would rather have Jekyll turn `docs/*.md` into HTML pages.

## Any static host

```bash
# Netlify
netlify deploy --prod --dir .

# Cloudflare Pages, Vercel, Surge, S3+CloudFront
# upload the folder; no build command, no output directory
```

The only server requirement is correct MIME types for `.html`, `.css`, `.js`, `.svg`, `.json` and `.woff2`, which every static host gets right. A service worker additionally needs `https://` (or `localhost`) — on a plain `http://` origin other than localhost the browser will refuse to register it, and you lose the offline cache but nothing else.

**Serve over `http://` or `https://`, never `file://`.** IndexedDB and Web Crypto are unavailable to `file://` pages, which removes the archive and the encrypted share. On plain `http://` other than `localhost`, `crypto.subtle` is also unavailable — so a LAN deployment without TLS gives you the app and the city but not the encrypted export. Put it behind a self-signed certificate or a tunnel if you need sharing.

## Your own LAN

The app is a good fit for a home server, because the archive lives in the browser anyway — the server only ever hands over five files.

```bash
cd cobble
python3 -m http.server 8000 --bind 0.0.0.0
# then open http://<server-ip>:8000/app/ from any device on the Wi-Fi
```

Each device keeps its own city. Nothing is shared between them unless you export and import a file, which is the intended model: no sync, no accounts, no merge conflicts.

## A desktop app

The repository is a folder of files with no dependencies, which makes it an easy target for a single-file wrapper. The author's own [`app-builder`](https://github.com/drsamonline/app-builder) does exactly this for other projects: it compiles a static web app into one portable Windows executable and an Android WebView APK. It expects a static folder, a start page and an icon — `app/`, `app/index.html` and `icons/icon-512.png` are the three inputs here. It has not been run against this repository yet; doing so, and publishing the artefacts as releases, is on the [enhancement list](../ENHANCEMENTS.md).

If you do this yourself, in Electron or Tauri or a WebView:

- serve from a custom scheme (`app://`) or from `http://localhost` inside the wrapper, so Web Crypto and IndexedDB behave;
- keep `nodeIntegration` off in Electron, and turn the context isolation on;
- point the wrapper at `app/index.html`, not the landing page.

## Subresource Integrity and CSP

Nothing is loaded from a third party any more, which makes a policy short and strict. The pieces are in place — no inline `onclick`, no inline `<script>` body in the app — with one exception: the landing page registers the service worker from a three-line inline script, so either allow `'unsafe-inline'` for scripts or move that line into `assets/landing.js`.

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
font-src 'self';
img-src 'self' data: https://images.unsplash.com;
connect-src 'self';
worker-src 'self';
manifest-src 'self';
```

`connect-src 'self'` is what makes the policy worth having: it means the app cannot phone home even if someone later adds a line that tries. Verify it before you trust it — the download-package function fetches its own files, which is `'self'` and allowed, and the sample-city photographs are `img-src`, not `connect-src`.

`tools/check-links.mjs` already fails the build if a page or script starts pointing at a CDN, so the policy and the code cannot drift apart silently.

## What not to do

- **Do not put a backend behind it** to "sync" the archive, unless you also change the licence conversation and the privacy page. The whole value of the app is that no such thing exists.
- **Do not minify and call it smaller.** The readable source is a feature; it is how a suspicious person verifies the privacy claims in an afternoon.
- **Do not precache a CDN URL.** The worker only caches same-origin files, and it should stay that way: a cached third-party URL is a cache of someone else's server that breaks quietly when they change a path.
- **Do not forget to bump the cache version.** `CACHE_VERSION` and `ASSET_VERSION` at the top of `sw.js` are what make a deploy visible. Change a file without them and returning visitors keep the old copy.
