# Android build (.apk)

Capacitor wraps the app folder in a WebView and gives it a real package.

```
packaging/android/
├── package.json              Capacitor CLI and the Android platform
├── capacitor.config.json     app id, name, and where the web files live
└── README.md
```

## Build it

```bash
cd packaging/android
npm install
npx cap add android          # creates ./android on first run
npx cap sync android
cd android && ./gradlew assembleDebug
```

The APK lands in `android/app/build/outputs/apk/debug/`.

## Status

**Authored, not yet built.** No Android SDK or JDK in this sandbox. The workflow
runs it on `workflow_dispatch` with a real SDK; the first run will want
`capacitor.config.json`'s `webDir` copied into `android/app/src/main/assets`
(which `npx cap sync` does) and a keystore for a signed release — a debug APK
needs neither.
