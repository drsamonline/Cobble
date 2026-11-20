# Desktop build (Windows .exe, macOS, Linux)

Tauri wraps the app folder in a native window. There is no frontend build step:
the app is plain HTML, CSS and JS, and `frontendDist` points straight at
`../../app`.

```
packaging/desktop/
├── package.json          the Tauri CLI, nothing else
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json   window size, icon, bundle targets
│   └── src/main.rs       three lines
```

## Build it

```bash
cd packaging/desktop
npm install
npm run tauri build
```

Output lands in `src-tauri/target/release/bundle/` — an `.msi` and an `.exe` on
Windows, `.dmg` on macOS, `.AppImage` and `.deb` on Linux.

## Status

**Authored, not yet built.** This sandbox has no Rust toolchain and no Windows
runner, so the first real build has not happened. The GitHub workflow
`.github/workflows/package.yml` runs it on `workflow_dispatch`; expect that first
run to want a dependency pinned or an icon added, which is normal for a first
Tauri build. It does not run on push, so it cannot break the checks.
