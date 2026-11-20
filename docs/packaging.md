# Packaging: desktop and Android

Cobble is a folder of HTML, CSS and JavaScript with no build step, which makes
it unusually easy to wrap. Two wrappers are set up here: **Tauri** for a native
desktop window and **Capacitor** for Android.

## Read this first

**Neither package has been built yet.** This sandbox has no Rust toolchain, no
Android SDK and no Windows runner, so what is in `packaging/` is a first draft
that has been syntax-checked and path-checked, not a build that has run. The
workflow is `workflow_dispatch` only for that reason: an untested job should not
be able to turn `main` red.

Expect the first run to want one or two pins — a Tauri CLI version, an Android
SDK level, a keystore for a signed release. The failure will say which.

## Desktop

```
packaging/desktop/
├── package.json              @tauri-apps/cli, nothing else
├── src-tauri/Cargo.toml      tauri 2, serde
├── src-tauri/build.rs
├── src-tauri/src/main.rs     four lines
├── src-tauri/tauri.conf.json window size, CSP, bundle targets
└── src-tauri/icons/icon.png  512×512, generated from the brand's three bars
```

`frontendDist` points at `../../app`, so the window loads the same files GitHub
Pages serves — no copy step, no bundler, no chance of the package drifting from
the web version.

The content security policy is deliberately tight: `default-src 'self'`, images
from `self` and `data:` (the app stores photos as data URLs), inline styles
allowed because the app writes a few, and **no** `connect-src` beyond `self` —
the desktop app has nowhere to phone home to, and this makes that structural
rather than a promise.

Build:

```bash
cd packaging/desktop
npm install
npm run tauri build
```

Output: `.msi` and `.exe` on Windows, `.dmg` on macOS, `.AppImage` and `.deb` on
Linux, under `src-tauri/target/release/bundle/`.

## Android

```
packaging/android/
├── package.json             Capacitor CLI, core and the Android platform
└── capacitor.config.json    appId, appName, webDir
```

`webDir` is `../../app` as well. `npx cap add android` generates the Gradle
project on first run; `npx cap sync` copies the web files into the APK's assets.

Build:

```bash
cd packaging/android
npm install
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

A debug APK needs no keystore. A release APK does, and that key is yours to
create and keep — it must never live in this repository.

## What the packages inherit, and what they do not

They inherit everything: the archive in IndexedDB, the encrypted vault, the
share format, the offline worker, the 3D town, the sound. There is no second
implementation to keep in step.

They do not inherit the browser's quirks, which is worth testing on a real
device before anyone relies on it:

- **IndexedDB persistence** differs on Android — the OS can clear app data, and
  a WebView may be more aggressive than a desktop browser about eviction.
- **Service workers** behave differently in a WebView; the offline path may need
  a Capacitor plugin rather than the worker.
- **WebGL** may be absent on low-end devices. The app already falls back to the
  illustrated city when it is.

None of that is guesswork to be trusted — it is a list of what the first real
device test should look at.
