# Vendored libraries

Two files, copied here so the app makes no request to a third-party CDN.

| File | Version | Licence | Upstream |
|---|---|---|---|
| `jszip.min.js` | 3.10.1 | MIT or GPL-3.0 (dual, at your option) | <https://github.com/Stuk/jszip> |
| `three.min.js` | r128 | MIT | <https://github.com/mrdoob/three.js> |

Both are unmodified. The licence header inside each file is intact.

- **JSZip** is loaded only when someone presses "Download app package" in the app's help panel.
- **Three.js** is loaded only when the experimental 3D layer is switched on with `app/?3d=1`.

To update: download the new minified build from the upstream release, replace the file,
and bump the version in this table and in `sw.js`'s `ASSET_VERSION` if the file is
precached. Neither file is minified by this repository, and neither is modified.
