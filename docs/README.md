# Cobble — documentation

Cobble is a private city built from the small things you notice. These guides cover how to use it, how it is put together, and how to change it.

| Guide | Read it when |
|---|---|
| [Getting started](getting-started.md) | You have just opened the app and want to know where your data lives |
| [How the city works](how-the-city-works.md) | You want to understand why a block looks the way it does |
| [Architecture](architecture.md) | You are about to change the code |
| [Data model](data-model.md) | You are writing an importer, a backup tool, or debugging storage |
| [Privacy and security](privacy-and-security.md) | You are deciding whether to trust it with something personal |
| [Customising](customising.md) | You want different colours, districts or copy |
| [Deploying](deploying.md) | You want it on your own domain, your LAN, or in a desktop wrapper |
| [FAQ](faq.md) | Something went wrong, or you are wondering about a browser |

Two documents live at the repository root rather than here, because they are about the project rather than the software: [PRIVACY.md](../PRIVACY.md) and [SECURITY.md](../SECURITY.md).

## The short version

- **Five files.** `app/index.html`, `app/theme.css`, `app/styles.css`, `app/app.js`. No build step, no framework, no dependencies to install. Fonts and two libraries sit beside them in `fonts/` and `app/vendor/` so nothing is fetched from a CDN.
- **One worker, one cache.** `sw.js` at the root keeps the whole site, so the app opens with the network off. `selftest.html` proves it, file by file.
- **One storage layer.** IndexedDB (`cobble-archive` → `archive` → `moments`), with a localStorage fallback under the key `cobble-moments-v1`.
- **No backend.** Nothing is uploaded, ever. The only thing that leaves the device is a `.cobble` file you encrypt yourself.
- **A sample city is built in.** Open `app/?demo=1` and it appears; your own archive is never touched while it is on.

## Conventions in this documentation

- Paths are relative to the repository root.
- "The app" means everything under `app/`. "The landing page" means `index.html` at the root, which is the page GitHub Pages serves first.
- Where a claim is about a specific number — a limit, an iteration count, a pixel size — it was read from the source, and the file is named so you can check it.
