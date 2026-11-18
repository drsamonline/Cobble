# Notices

Elsewhere — © 2026 Dr Sohil Momin. Licensed under [PolyForm Noncommercial 1.0.0](LICENSE).

The app's own source is five files with no build step. It does, however, use other people's work. This file records what, under which terms, and what you need to keep if you redistribute it.

## Bundled dependencies

All of these are in this repository. Nothing is fetched from a CDN at runtime.

| Component | Where | Licence | Notes |
|---|---|---|---|
| **Manrope** typeface | `fonts/Manrope.woff2` | SIL Open Font License 1.1 | By Mikhail Sharanda and contributors. One variable file, latin subset. |
| **DM Sans** typeface | `fonts/DMSans.woff2` | SIL Open Font License 1.1 | By Colophon Foundry, Jonny Pinhorn and Indian Type Foundry. One variable file, latin subset. |
| **IBM Plex Mono** typeface | `fonts/IBMPlexMono-400.woff2`, `-500.woff2` | SIL Open Font License 1.1 | By IBM. Used for the small monospace labels. |
| **JSZip 3.10.1** | `app/vendor/jszip.min.js` | MIT or GPL-3.0, at your option | Unmodified. Loaded only when "Download app package" is pressed. |
| **Three.js r128** | `app/vendor/three.min.js` | MIT | Unmodified. Loaded only when the experimental 3D layer is asked for with `app/?3d=1`. |

The three typefaces were downloaded from Google Fonts as woff2 files and are redistributed here under the SIL Open Font License, which permits it. If you fork this repository and keep the fonts, keep this notice: the OFL requires the copyright notice and licence to travel with the font files.

`app/vendor/README.md` records the exact version and upstream of each library.

## Sample content

The sample city (`makeDemoCity()` in `app/app.js`) uses twelve photographs hosted by **Unsplash**, requested from `images.unsplash.com`.

Photographs on Unsplash are covered by the [Unsplash Licence](https://unsplash.com/license): free to use for commercial and noncommercial purposes, no permission needed, attribution appreciated but not required. They are loaded by URL, not copied into this repository, so no Unsplash image is redistributed here.

The eighteen sample moments' text was written for this project.

## Brand assets

- `docs/assets/support-portrait.jpg` — a photograph of the author, used with his consent in the support block.
- `docs/assets/upi-qr.svg`, `assets/upi-qr.svg` — a UPI payment QR code for `drsohilboi@ybl`, generated with [Segno](https://pypi.org/project/segno/) (BSD-3-Clause). It encodes a payment address, not personal data.
- The `elsewhere.` wordmark and the three-bar mark are drawn in CSS and SVG in this repository. They are part of the project's identity; please do not reuse them for a different app.

## Licence of the PolyForm text

The full text of the PolyForm Noncommercial License 1.0.0 is reproduced verbatim in [LICENSE](LICENSE), as the licence requires. The licence text itself is by [Polyform Project](https://polyformproject.org/) and is available under CC BY 4.0.

## If you fork this

- Keep this file, or an equivalent list, and keep [LICENSE](LICENSE).
- If you self-host the fonts, include the OFL text for each family.
- If you vendor Tailwind, Three.js or JSZip, include their licence files in `app/vendor/`.
- If you replace the sample photographs with your own, check you have the right to use them — the current ones are used under a licence that does not extend to images you substitute.
- Commercial use of the app's own source needs a written licence from the author; the dependencies above keep their own permissive terms regardless.
