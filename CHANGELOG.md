# Changelog

All notable changes to Cobble. Dates are ISO 8601.

## 1.42.0 — 2026-11-20

### Added

- **Saved cities — a shelf of named copies.** *Saved cities* in the sidebar keeps named snapshots of the whole archive beside the live one. *Save a copy of this city* names the current archive; the shelf lists every copy with its moment count; loading one replaces the live city **after saving the current one as "Before switching"**, so a load can never lose anything. Copies can be deleted individually.

### Why copies, not a live switch

Three attempts at switching between live archives (1.30.0, 1.34.0, 1.40.0) each found a different way to mix two cities' moments. The common cause is that `entries`, `personalEntries`, `lastPhotoKeys` and `activeCity` are module-level and every function reaches into them, so a switch has to win a race against whatever is already in flight. Copies have no such race: there is only ever one live archive being written, and a copy is written beside it.

This gives the thing people actually asked for — more than one city — without the failure mode. A true live switch still needs the refactor, and `ENHANCEMENTS.md` says so.

### Verified

- One moment saved, a copy named *Kerala*, a second moment added, then *Kerala* loaded: the live city returned to one moment with the first text and not the second, and the shelf had grown a *Before switching* copy holding both. Nothing lost, nothing mixed.

## 1.41.0 — 2026-11-20

### Added

- **The Discoveries stat cards and the welcome dialog now follow the language pills.** *moments kept*, *days remembered*, *personal landmarks*, *returning themes* and their four captions; the welcome dialog's heading, body, privacy line, source link and *Let's wander* button.
- That closes the interface: every piece of text Cobble shows about itself is in all three languages. What is still English is the long-form prose in `docs/` and the landing pages' own translations, which are separate files by design.

### Verified

- Same archive read in Hindi and Gujarati: stat cards render *सहेजे पल / याद रखे दिन / निजी पड़ाव / लौटते विषय* and *સાચવેલી ક્ષણો / યાદ રહેલા દિવસો / પોતાના પડાવ / પાછા આવતા વિષયો*; the welcome dialog reads from its eyebrow to its button in both. No page errors.
- Two strings failed to tag on the first pass because the source text had been edited since I wrote the dictionary — the substitution silently matched nothing. Found by rendering, not by the tests.

## 1.40.0 — 2026-11-20

### Fixed

- **A locked archive left the save queue waiting forever.** When the archive was sealed, `loadArchive()` showed the unlock screen and returned *before* resolving the readiness promise that every save waits on — so the first save after unlocking, or any save in a tab that had loaded sealed, sat in the queue and never ran. The promise is now resolved in that branch too. Found while attempting the third version of multiple cities, which is the only good thing that came out of it.

### Attempted and reverted, a third time — multiple cities

Third attempt, third revert. This one avoided in-memory races entirely: each city is a pair of records, switching writes the active id and **reloads the page**, so there is no in-flight save to land in the wrong archive. Creation, switching and deletion all worked, and isolation held — a moment added in one city stayed out of the other.

It still failed on the way back. City A's record survived in IndexedDB but the page came up empty, and navigating to it from a sealed city hung. Three attempts have now found three different faults, which is the signal that this is a refactor and not a patch: `entries`, `personalEntries`, `lastPhotoKeys` and `activeCity` are module-level and every function reaches into them. It is not going back in until that changes, and `ENHANCEMENTS.md` says so.

## 1.39.0 — 2026-11-20

### Added

- **The sentences Cobble writes about your archive are translated too.** Fifteen templates — the toasts for a district, an unlock, a merge, an import, a theme, a mood, a weather, the time of day; the three Discoveries observations; the plan's footer — are functions per language, not strings, so each language builds the sentence in its own order and places its numbers where it wants them. District names and the atmosphere words (*serene*, *rain*, *midnight*) are dictionary entries, so nothing English is left inside a Hindi sentence.
- Switching language now redraws the views whose sentences are built at render time. Before this, the chrome changed and the observations did not.

### Verified

- Same archive read in three languages: *"Outside & nature is your busiest district. 4 of your 19 saved moments live there"* → *"बाहर और क़ुदरत आपका सबसे व्यस्त ज़िला है। आपके 19 सहेजे पलों में से 4 वहाँ हैं।"* → *"બહાર અને કુદરત તમારો સૌથી વ્યસ્ત ઝિલ્લો છે…"*; the plan footer and the mood toast follow the same way.
- `say()` falls back to English when a key is missing, so an untranslated sentence reads as English rather than as an empty toast.

### Still English

The help dialog's prose and a handful of long-form insights paragraphs. Recorded in `ENHANCEMENTS.md`.

## 1.38.0 — 2026-11-20

### Added

- **Where your attention lives** — a plan of the city in Discoveries. Six tiles, one per district, each showing how many moments it holds, its share of the whole and a bar in the district's own colour. Click a tile and the timeline opens filtered to it; click it again to clear.
- The footer says the useful sentence rather than a total: *"4 of 19 moments sit in outside & nature. Click a tile to read them."*

### Verified

- On the sample city: tiles read 4 / 3 / 3 / 3 / 3 / 3 with shares 21% and 16% each, summing to the archive. Clicking the first tile opened the timeline at *"4 found"* with the `nature` chip pressed. No page errors.
- The plan uses the same filter path as the chips and the 3D buildings, so there is one way for a district to be selected, not three.

## 1.37.0 — 2026-11-20

The 3D city became something you can use, not just look at.

### Added

- **Click a building to open its district.** Hovering a block shows *"Everyday detail — 3 moments. Click to open."*; clicking it switches to the timeline with that district's chip already pressed and says what it found. The building under the pointer lifts out of the scene in a warm glow, and the cursor changes to a pointer.
- **Drag to pan, scroll to zoom, double-click to re-centre.** Panning is clamped to the town so you cannot lose it.
- **The camera fits the city it is given.** The old scene had a fixed frustum, so a large archive simply ran off the edges. The view is now derived from the radius of the town: 19 moments sits at 9 units, 300 at 31.6, 1,200 at 38.1 — each fills the frame.
- **Bigger archives get a denser town**: up to 96 buildings per district past 150 moments, instead of a flat cap of 48.

### Fixed — four reasons the city was neither explorable nor clickable

| Fault | Why it happened |
|---|---|
| Nothing was clickable at all | The illustrated CSS city sat *above* the canvas and ate every pointer event. It is now `display: none` while the 3D view is on, `.city-ground` included |
| Hover worked in a test but not in the browser | Two canvases were built — one from the first render, one from `DOMContentLoaded` — and the pointer listeners were on the one underneath. `start()` now guards against re-entry |
| Clicks never landed | `setPointerCapture` on the canvas swallowed the `pointerup`. Dragging is tracked on the window instead |
| The frame ended in a flat band | The orthographic camera's near plane clipped the ground in front of it. An ortho camera may look behind itself, so `near` is now negative |

### Verified

- Hover and click driven by real mouse events in headless Chrome: title text appears, the click lands, the timeline opens filtered to *everyday* with "3 found" and the matching chip pressed.
- Three archive sizes measured: 19 / 300 / 1,200 moments → 19 / 288 / 576 buildings, camera 9 / 31.6 / 38.1. Wheel zoom and drag pan read back from the live scene.
- Screenshots inspected at both sizes: no clipped ground, no empty band, town centred.

## 1.36.0 — 2026-11-19

### Changed

- **The size budget measures gzipped bytes, not source bytes.** Source size counts whitespace and comments no browser parses, and it had turned "keep the source readable" into a fight with "leave room for features" — the shell was at 243 of 245 KB. GitHub Pages serves everything gzipped, so that is what a visitor actually waits for: the shell is **64.0 KB gzipped**, and the budget is 75. A raw ceiling stays as a sanity check (320 KB) so a stray megabyte still fails the build. `docs/performance.md` carries both columns.
- **The two labels JavaScript draws itself — *Sound* and *3D city* — now follow the language pills**, through `CobbleI18n.t()` and a `cobble-lang` event rather than a second copy of the dictionary.

### Verified

- `node tools/check-size.mjs` reports gzip and source for all six budgets; the shell passes at 64.0 of 75 KB gzipped.
- With the pills switched to Hindi, the deck reads थीम · मूड · मौसम · ध्वनि · 3D शहर, and the sound and 3D labels change with it.

## 1.35.0 — 2026-11-19

### Added

- **Auto: the city follows the clock.** A seventh control in the deck. Turn it on and the scene matches the time of day — dawn (coastal, tranquil), day (meadow, serene), dusk (amber, dreamy), night (midnight, after dark). It re-checks every five minutes, so a tab left open drifts with the day, and the choice is remembered.
- Any manual press on Theme, Mood, Weather or Night turns Auto off. A scene that keeps changing under a deliberate choice is a scene fighting you.

### Fixed

- **The control deck's labels were two different sizes.** `Theme`, `Mood` and `Weather` were `<span>` (16px) while `Sound` and `3D city` were `<small>` (8px), so the deck looked uneven and, with a seventh control, ran past its own rounded edge. All seven labels are `<small>` now and the row sits inside the pill.

### Verified

- Four times of day faked in the page: 06:00 → coastal/tranquil, 13:00 → meadow/serene, 18:00 → amber/dreamy, 23:00 → midnight with "after dark" in the status line. Auto's `aria-pressed` follows, the choice survives a reload, and a manual press clears it.
- Screenshots at dawn and dusk inspected; no horizontal overflow at 1440px.

## 1.34.0 — 2026-11-19

### Changed

- **The sample-city banner and the city's intro line are translated too**, along with the top-bar buttons. What is left in English is deliberate and listed below.

### Attempted and reverted, again — multiple cities

Second attempt, second revert. This time the city was threaded explicitly into `loadArchive`, `saveArchive`, `readPhotos` and `saveToDatabase` rather than read from a module-level variable at drain time — which fixed the first attempt's bug — and it still mixed archives: a switch mid-save left the interface showing one city's moments under another's name, and a reload lost the first city entirely. Reverting took four minutes; the archive is intact.

Two attempts is enough to conclude the shape is wrong, not the details. The next attempt needs `app.js` split so that a city is an object holding its entries, its records and its render, instead of four module-level variables (`entries`, `personalEntries`, `lastPhotoKeys`, `activeCity`) that every function reaches into. Recorded in `ENHANCEMENTS.md`.

### Still English, on purpose

The sentences Cobble writes about your archive — toasts, the observations in Discoveries, the year-in-review lines — and two labels set by JavaScript at runtime (*Sound*, *3D city*). Templates with numbers inside them need more than a dictionary.

## 1.33.0 — 2026-11-19

### Added

- **The app's interface in Hindi and Gujarati.** Three small pills in the sidebar footer — EN · हिं · ગુ — translate the chrome: the sidebar and its nav, the breadcrumb, all three view headings, the section titles in each view, the city's control deck, *Add a moment*, *Share city*, *Hide controls*, and *On this day*. The choice is remembered, `lang` is set on the document, and each pill carries `aria-pressed`.
- `app/i18n.js`, with the dictionaries in one file and elements opting in through `data-i18n`, `data-i18n-aria` and `data-i18n-placeholder`. A missing key leaves the English in place rather than blanking an element — a half-empty interface is worse than an untranslated one.

### Scope, stated plainly

This is the chrome, not the whole app. The sentences Cobble writes about your archive — toasts, the observations in Discoveries, the year-in-review lines — stay in English, because they are assembled from templates with numbers inside them and a half-translated sentence is worse than an English one. The sample-city banner and some panel body copy are also still English. `ENHANCEMENTS.md` records the rest.

### Verified

- In the browser: EN → HI → GU changes nav, headings, deck and buttons; `lang` follows; the pill states follow; the choice survives a reload; switching back to EN restores everything. No page errors.
- A fourth, caught by CI after the local run passed: wrapping the breadcrumb's words in a span made them inherit the *separator's* pale grey — 1.55:1 against the page. The separator now has its own class instead of being every span inside the breadcrumb.
- Three defects caught by looking at the renders, not by the tests: the heading's emphasised half stayed English (the `<em>` was a separate element), `city.title.a` was mapped to the wrong sentence, and a breadcrumb tag landed on the sidebar's `aria-label`, pushing the words "Your world" above the logo.

## 1.32.0 — 2026-11-19

### Added

- **The landing page in Gujarati.** `gu.html`, a full translation: nav, hero, the three rules, all six districts, screenshots, privacy, support, footer. `lang="gu"`, a translated title, `hreflang` alternates, precached like the other two.
- **A three-language switcher** in the header of all three pages: EN · हिं · ગુ, with `aria-current` on the one being read.
- The Gujarati values are zipped to the English keys **by index with an assertion that the two lists are the same length** — 127 and 127. A missing line fails the build instead of shifting every translation by one, which is the failure mode that makes a translated page quietly wrong.

### Verified

- Rendered at 1440×1000 and 390×844: no horizontal overflow at either width, `lang="gu"`, translated title, switcher showing all three with ગુ current, no page errors.
- Both remaining English fragments (the split sentence after the `.cobble` code element) were found by scanning the built page for Latin text rather than by trusting the dictionary.

## 1.31.0 — 2026-11-19

### Added

- **The landing page in Hindi.** `hi.html` is a full translation of the page — nav, hero, the three rules, all six districts, the screenshots section, privacy, support and the footer — with `lang="hi"`, a translated title, and `hreflang` alternates. A two-link switcher (EN · हिं) sits in the header of both pages, with `aria-current` on the one you are reading. No script: the Hindi page is a file, so it works offline and prints.
- `hi.html` is precached, so a Hindi reader gets the page offline like everyone else.

### About the translation, plainly

- It is **written by hand, not machine-translated**, and it needs a native-speaker review before anyone treats it as final. `translate_text` was tried first and returned segments that did not line up one-to-one with the source — a batch of seventeen strings came back as eighteen — and misaligned substitution is how a page ends up with the wrong sentence under the wrong heading. The dictionary is keyed by the English string itself, so a missing entry fails loudly instead of silently.
- The app's own interface is still English. This is the page that explains the app, not the app.

### Verified

- Rendered at 1440×1000 and at 390×844: no horizontal overflow at either width, switcher intact, `lang="hi"` set, title translated, no page errors.
- Two defects caught by looking at the render: adjacent text nodes ran together because the substitution dropped the whitespace around each match, and the switcher appeared twice because the rebuild started from the already-switched English page.

## 1.30.0 — 2026-11-19

### Fixed

- **A moment saved while the archive was still loading could vanish.** `loadArchive()` ran after the first render, and it replaced the in-memory entries with whatever was on disk — so a moment added in the first second was written and then thrown away by the load that followed it. Saves now wait for the archive to be readable, and a load merges with anything already in memory instead of overwriting it. Found by a test that added a moment 1.3 seconds after load; every earlier test had waited longer, which is why it had never shown up.

### Attempted and reverted

- **Multiple cities.** A switcher in the sidebar, one pair of storage records per city, a create prompt and a delete. It worked in pieces and failed as a whole: a save queued in one city wrote into the next one, because the record name was read when the queue drained rather than when the save was made; and switching was slow enough that the interface disagreed with itself for a second. Reverting it took ten minutes and removed a feature that could have silently mixed two archives — the worst kind of bug this app can have. It is recorded in `ENHANCEMENTS.md` with both failure modes, because the design was sound and the implementation was not.

### Changed

- The browser check focuses the page before pressing `N`. Headless Chrome sometimes delivers key events to a page that has not been focused, which made that step flip between runs.

## 1.29.0 — 2026-11-19

### Added

- **The sound of the place.** A *Sound* control in the city's deck starts a WebAudio graph built from a brown-noise buffer: wind through a lowpass filter that gusts on a 0.06 Hz LFO, rain through a bandpass, and a bird every four to thirteen seconds from a small oscillator envelope. Nothing is downloaded — no audio files, no CDN, no network — and it is off until asked, because a page that makes noise on arrival is a page people close. Night lowers the wind and the master.
- The choice is remembered, but a stored preference still waits for a gesture, since browsers will not start audio without one.
- `app/ambience.js`, precached, with the graph documented at the top of the file.

### Verified

- In headless Chrome: the toggle starts the context (`state: "running"`), flips `aria-pressed`, mirrors its label, and stores the preference; a second click closes the context and stores `off`. No page errors.
- The deck now carries six controls; the sound one shows its state by brightening its glyph rather than by growing a longer label, which had pushed the row out of shape.

## 1.28.0 — 2026-11-19

The 3D city is back, rebuilt rather than repaired — and it works this time.

### Added

- **A real 3D town.** Buildings sit on a lit ground, in their district colours, in a spiral that fills from the middle outward; roofs catch the light, windows glow, two roads cross a plaza, and a ring of trees holds the edge. Seven birds drift across a sky gradient, and the camera breathes a few units a second so the view is alive without moving under your eye.
- **A toggle in the city's control deck** — *3D city* / *Flat city* — remembered per browser. It starts on when the browser has WebGL and the person has not turned it off, and the illustrated city stays underneath as the fallback.
- Night reaches the 3D view: the ground darkens, the lights dim to moonlight, the windows stay lit.

### What was wrong the first time, and what fixed it

The old scene drew a white floor with the buildings floating above it. Four things were wrong, and each is a line in the new file:

| Fault | Fix |
|---|---|
| An orthographic frustum of 16×13 regardless of viewport shape | The frustum is computed from the viewport's aspect and recomputed on resize |
| A 590 KB library and a scene with no ground plane receiving light | A `PlaneGeometry` with a `MeshLambertMaterial` and a canvas grass texture |
| Hemisphere light at 1.65 and a directional at 2.1 — everything blown to white | 0.85 and 0.95, with a night state that dims both |
| No horizon, so the ground filled the frame | A sky plane behind, a camera pulled back to 10.5 × 24, and fog |

### Verified

- Rendered in headless Chrome with SwiftShader and inspected: buildings on ground, roofs, windows, roads, trees, birds, sky. Night toggled and inspected. No page errors.
- CI found what my local run missed: the new toggle's `aria-label` ("Switch between the flat and 3D city") did not contain its visible text ("Flat city"), which is the same label-content-name-mismatch this project has now fixed four times. The name is set from the visible label and mirrored when the state changes.
- Screenshots `city-3d.webp` and `city-3d-night.webp` are in the repository and in the README gallery.

## 1.27.0 — 2026-11-19

### Added

- **Import another journal.** *Share city → Import another journal* reads two shapes: **Day One's JSON export** (any array of objects with `text` and a `creationDate`/`date`), and **markdown or plain text with a `YYYY-MM-DD` line above each entry**. Everything is read in the page — no upload — dates become moments, text is cut to the app's 500-character limit, and the result goes through the same merge rule as a city file, so importing twice adds nothing.
- The toast reports what happened: *"2 entries imported from dayone.json, 1 skipped."*, and the import can be undone from the same strip as everything else.
- `parseForeignJournal()` in `app/core.js`, with three unit tests: Day One JSON with an empty and an undated entry, markdown with headings, and three kinds of unusable file.

### Verified

- In the browser: a Day One export gave 2 moments and reported 1 skipped; a markdown journal added 2 more; undo took it back to 2; a file with no dates said *"No dated entries found. This reads Day One JSON, or text with a YYYY-MM-DD line above each entry."*
- First wiring attempt attached the listeners to strings that did not exist in `app.js`, so the buttons did nothing and the test caught it immediately — no toast, no moments.

## 1.26.0 — 2026-11-19

### Changed

- **Photos live in their own record.** Every save used to rewrite every photo's bytes inside one JSON string. Now the `moments` record holds text and the `photos` record holds the images, written only when the set of photos changes. Measured against IndexedDB with a 421 KB archive (60 moments, 20 photos of 21 KB): one 421 KB record took **813 ms**, the text record alone takes **11 ms** — a repeat save is 74× cheaper. The first save after adding photos still writes the map (228 ms), which is the honest cost of storing them.
- **`navigator.storage.estimate()` is off the save path.** It measured about **1.8 s** in one browser and was awaited on every save; it is now throttled to at most one call every few seconds and never blocks a save.

### Verified

- Add a moment with a photo → the store holds two records, `moments` with no photo bytes and `photos` with one key; reload re-joins the photo and renders it; editing that moment keeps the photo reference and updates the text. A text-only edit writes 194 bytes where it used to write the whole archive.

### A correction about my own measurements

Two earlier numbers on this project came from harnesses that were measuring the wrong thing, and both are replaced here: the "~2 s per save" I saw was `storage.estimate()`, and the "0 entries after an edit" was a bug in my test helper, not in the app — the record was correct all along.

## 1.25.0 — 2026-11-19

### Fixed

- **A filter change at 5,000 moments took 598 ms.** Not because the filter pass was slow — because while narrowing, *every* matching day was built into the DOM: six hundred day rows with four preview moments each. The list is still counted in full and the status line still says how many days matched; it now builds sixty at a time, with *Show older days* adding sixty more, and `(showing 60)` in the status line when there is more.

### Measured

| Moments | Filter change, before | after |
|---|---|---|
| 100 | 9 ms | 11 ms |
| 500 | 35 ms | 36 ms |
| 2,000 | 130 ms | **73 ms** |
| 5,000 | **598 ms** | **74 ms** |

Flat, because the work no longer depends on how many days matched. Full virtualisation stays on the list — reusing rows while scrolling — but the measured pain is gone, and `docs/performance.md` records both sets of numbers.

## 1.24.0 — 2026-11-19

### Added

- **Your year, on one page.** A button in Discoveries opens a summary of the last twelve months: moments kept, days remembered, districts visited, months with a moment — then four sentences drawn from the archive (where your attention went, your longest run, your fullest month, the longest quiet stretch) and three moments worth looking at again. *Save as a postcard* hands the skyline back as a 1200×630 PNG.
- The quiet stretch is phrased as a fact, not a failure: *"The longest quiet stretch was 48 days. Nothing broke; the city waited."* There are no streaks and nothing to lose.
- An archive with nothing in the last year says so plainly instead of showing four zeroes.

### Verified

- Driven with 40 moments spread across a year: figures 40 / 40 / 6 / 11, the four lines correct against the seeded data (7 of 40 in Everyday detail, a 4-day run, November the fullest month with 13, a 48-day gap), three resurfaced moments, close works, and the empty case renders its own sentence.
- First version said *"November 19 held the most: 1 moment"* — true but useless when every day holds one. It now falls back to the longest run.

## 1.23.0 — 2026-11-19

### Removed

- **The experimental 3D layer.** `app/city3d.js` and the vendored Three.js r128 build are gone: 590 KB of vendor code and 400 lines of scene-building that rendered a white floor with the buildings floating above it on every machine it was tried on. It had been gated behind `?3d=1` since 1.1.0 so it could not reach anyone by accident; that gate was a promise to fix it, and this is the honest alternative.

  A broken opt-in feature is worse than no feature: it costs 590 KB in the repository, an entry in every precache list, a paragraph in five documents, and the reader's trust when they try it. The code is in the git history at `v1.22.0`, and `ENHANCEMENTS.md` records what a real one would need.

- With it went: the `?3d=1` flag, the `cobble-data` event the 3D layer listened for, the `city3d.js` entry in the precache list and the self-test, the Three.js row in the vendor notices, and every mention in the README, the architecture guide, the privacy page, the customising guide and the performance page.

### Result

- App shell **191.0 KB** of a 220 KB budget, down from 209 KB.
- Vendor budget **95.3 KB** of 120 KB, down from 685 KB of 720 KB.
- One fewer script on every page load, and one fewer thing that does not work.

## 1.22.0 — 2026-11-19

### Changed

- **The vault derives its key once, not once per save.** PBKDF2 at 250,000 iterations is meant to be slow; paying it on every write was the cost of the feature, not the point of it. The key is derived at unlock and reused for the session, with a fresh IV on every write and the salt fixed for that session.
- Measured on a 205 KB archive (500 moments, 20 photos): derive-and-encrypt **285 ms**, encrypt with the cached key **91 ms** — a save is 68% cheaper. `docs/performance.md` has the table.
- `core.js` gained `encryptVaultWithKey()` and `decryptVaultWithKey()`, with a test asserting the salt is reused, the IV is not, and the ciphertext differs each time.

### Verified

- The whole lock flow re-run after the refactor: after locking, the store held one `vault` record and no plaintext; reload showed the unlock screen; a wrong passphrase was refused; the right one restored the moment; adding another and reloading gave two moments after a second unlock.

## 1.21.0 — 2026-11-19

### Changed

- **Importing a city merges instead of dropping.** The old rule was skip-by-id, which meant a moment you had edited on one machine silently lost its other version. Now an incoming moment is skipped only when the id *and* the content match; an id that matches but says something different is kept alongside under an id derived from its content, and the toast says how many: *"3 moments merged, 1 kept as a second version."*
- The rule moved to `app/core.js` as `mergeEntries()`, so it is tested without a browser — four new unit tests, including one that imports the same file twice and asserts the second import adds nothing.

### Verified

- A file carrying an identical moment, a new one, and an edit of an existing one: first import took the city from 1 to 4 moments and said *"3 moments merged, 1 kept as a second version."*; importing the same file again said *"Nothing to merge. Every moment in that file is already here, word for word."* and left it at 4.
- The first attempt re-ided the variant with a timestamp, so repeated imports kept adding copies. The id is now derived from the content.

## 1.20.0 — 2026-11-19

The last honest gap in the privacy page, closed.

### Added

- **Lock this city.** One passphrase seals the archive: the plaintext `moments` record is deleted in the same transaction that writes a single `cobble-vault` record — AES-256-GCM, key derived by PBKDF2-SHA-256 at 250,000 iterations, fresh salt and IV on every save. From then on the app opens with an unlock screen, and every save re-encrypts before it reaches the disk.
- **No recovery, stated before it locks.** The confirm text says so, the unlock screen says so, and *Start a new city instead* is offered for the case where the passphrase is gone.
- Five unit tests for the vault: round-trip, no plaintext in the ciphertext, wrong passphrase refused, short passphrase refused, two vaults of the same archive differ.

### Verified

- Locked a real archive in headless Chrome: afterwards the object store held **one record, `vault`**, with no `moments` record and no readable text inside the ciphertext. Reload showed the unlock screen at "0 moments"; a wrong passphrase was refused with *"That passphrase did not open this city."*; the right one restored the moment. Adding a moment while unlocked and reloading again gave two moments, both present after the second unlock.

### Changed

- **The app shell budget moved from 200 KB to 220 KB**, and CI caught it: the shell is 205.6 KB after the dark interface, the heatmap, the filters and the vault. Minifying is still not done on purpose — this repository ships readable source. `docs/performance.md` records what grew and why.
- `PRIVACY.md` and `SECURITY.md` said plainly that the archive was not encrypted at rest. They now describe what the vault does, and what it does not protect against.

## 1.19.0 — 2026-11-19

### Changed

- **Forty-eight near-grey text colours became three tokens.** `--text-strong`, `--text-secondary` and `--text-muted`, across 71 declarations. The values are within a few points of the ones they replace, so nothing looks different — but the stylesheet no longer carries forty-seven ways to write the same grey, and the dark theme has three values to override instead of a list.

  Only near-greys were touched: colours with any real saturation are semantic (a district's own colour), and flattening those would lose meaning.

### Measured

- **How the timeline scales**, in `docs/performance.md`: 9 ms to filter at 100 moments, 35 ms at 500, 130 ms at 2,000, **598 ms at 5,000**. Load time stays flat at about 2 s because it is dominated by the page and the fonts. The virtualisation item now has a real threshold — two thousand moments — instead of a guess.

## 1.18.0 — 2026-11-19

The instrument, and the five defects it found on its first run.

### Added

- **`tools/browser-check.mjs`** — serves the repository locally, drives it in headless Chrome, and fails the build on any of: an axe accessibility violation at serious or critical, a layout shift over 0.1, or a behaviour regression. It runs on every push, in its own CI job with Chrome installed.
- The smoke test inside it: two moments load from storage, `N` opens the form, a save lands, an edit is undone, a delete is undone, search narrows, a filter chip applies, the app reloads with the network off, and no page errors occur.

### Fixed — all found by that check, none by eye

- **Seven footer links and labels on the landing page sat at 4.24:1**, because the footer's paper is darker than the page and the muted token was tuned for the page.
- **Six labels in the app sat between 4.35:1 and 4.47:1** on the sidebar and top-bar tints — the same mistake one surface further in.
- **Three buttons had accessible names that did not contain their visible text.** `#share-button` announced "Share or import a city" while reading "Share city"; the HUD toggle announced "Hide city controls" while reading "Hide controls"; the sample-city toggle announced "Exit sample city and return to my city" while reading "Back to my city".
- The check itself had a bug on its first run: it seeded storage and then reloaded the *sample-city* URL, so the seeded moments were never read. That is the difference between a test that passes and a test that means something.

## 1.17.0 — 2026-11-19

### Added

- **Save a postcard.** A button in the page footer draws the skyline to a 1200×630 PNG and downloads it: the wordmark, the city's level, `19 moments · 19 days · 6 districts`, the districts' colours as bars with windows, and the line *your life, taking shape*. No text from any moment, no dates, no photos — nothing personal leaves the device in a picture someone might post.

### Verified

- Downloaded in headless Chrome: `cobble-postcard-2026-11-19.png`, 123 KB, valid PNG, 1200×630, and inspected by eye — bars, windows, wordmark and level all render.

## 1.16.0 — 2026-11-19

### Added

- **Filters on the timeline**, which compose with the search box: six district chips, "Landmarks only", "With a photo", and a Clear button that appears only when something is active. Chips are `aria-pressed` toggles, so a screen reader hears which are on, and the status line says what is narrowing the list — *"5 moments in 5 days — landmarks · with a photo"*.
- While anything is active, every matching day is shown rather than the first fifty, and the empty state distinguishes "nothing matches that word" from "nothing matches those filters".

### Verified

- Filters alone, in combination, and composed with search: 19 moments → 4 (Nature) → 7 (Nature or Joy) → 9 (landmarks) → 5 (+ photo) → 1 (+ "rain"), then Clear left the search intact and returned 2.
- The chip for Outside & nature now says **Nature**, matching the district's own short name used in the status line.

## 1.15.0 — 2026-11-19

### Added

- **A year heatmap**, in Discoveries: one square per day for the last twelve months, weeks running down the columns, shaded by how many moments that day held (0, 1, 2–3, 4+). Days with moments are buttons — click one and it opens that day in the drawer; days without are inert spans with a title. Every square carries an `aria-label` like "20 November 2025 — 1 moment". Month labels are spaced so they cannot collide, and the whole strip scrolls sideways on a narrow screen.
- The panel hides itself when the archive is empty, like the "on this day" strip.

### Verified

- 369 cells over a seeded year, 14 of them clickable, all four shade levels present, month labels running Nov → Nov, and a click opening the right day (*Thursday, November 20, 2025*).
- First attempt had "NovDec" overlapping where two months started in adjacent weeks; labels now need four columns of room and skip the ones that would collide.

## 1.14.0 — 2026-11-19

A correction, and it matters more than a feature.

### Corrected

- **The layout-shift "defect" was not real.** 1.9.0 reported CLS 0.186 on a cold load and listed six experiments that failed to isolate it. Re-measured with a stated method — six runs in fresh browsers with the cache disabled, plus eight warm and eight with webfonts blocked — CLS is **0.008–0.010**, a fifth of Google's threshold, on every single run. The 0.186 came from the first load in a freshly started environment and never reproduced.

  `docs/performance.md` now says so plainly, keeps the retraction visible rather than deleting the claim, and records the lesson: one sample of a timing metric is noise.

- The enhancement list loses that defect and gains the check it should have had instead: **measure CLS and axe in CI** (item 2.16, rewritten), so the numbers are tracked rather than chased.

## 1.13.0 — 2026-11-19

The contrast sweep finished, measured rather than eyeballed.

### Fixed

- **Seventy-one text colours were below 4.5:1 on the app's own paper.** Not a few stragglers — the stylesheet had accumulated near-duplicate greys (`#929990`, `#929992`, `#929890` and eight more within three points of each other) from years of hand-editing. Each one was darkened along its own hue until it cleared 4.6:1 against `#f6f4ef`, the darkest of the app's light surfaces, and the result was checked by re-rendering every screen: **81 declarations changed, zero text colours left below 4.5:1.**
- The method is repeatable: extract every `color:` hex, skip anything light enough to be text on a dark surface, compute the ratio against the darkest light surface, darken in two-point steps until it passes, then look at the screenshots.

### Known, and worth doing later

- The sweep fixed the values but not the cause. Those 71 colours should be three or four semantic tokens (`--text-secondary`, `--text-muted`, `--text-faint`, `--text-warm`) rather than 71 hand-picked hexes. Recorded in the enhancement list, because a token pass is a redesign of the stylesheet rather than a substitution.

## 1.12.0 — 2026-11-19

### Added

- **A dark interface, and a light one.** A ☾ button in the top bar flips the shell — sidebar, top bar, panels, cards, dialogs, inputs and the drawer — and the choice is remembered in `cobble-shell-theme`. With no choice made, it follows `prefers-color-scheme`, so a dark-mode system gets a dark app on the first visit. The city keeps its own palette and its own Night control; this is the interface around it, not a filter over it.
- **`tools/check-version.mjs`** — fails the build when `sw.js`, the README badge and the newest `CHANGELOG.md` heading disagree. It found one on its first run: the badge had been stuck at 1.5.0 for seven releases.

### Verified

- Contrast measured in the dark palette: body text 16.0:1, panel text 14.65:1, secondary 9.03:1, muted 6.65:1, links 11.04:1, placeholder 5.41:1 — every pair above 4.5:1.
- Driven in headless Chrome across all three views, with the theme following the system preference, toggling by hand, and surviving a reload.

## 1.11.0 — 2026-11-19

Two more off the short list.

### Changed

- **Undo now covers edit and import, not just delete.** One slot, one action: the bar names what it will take back ("Moment updated.", "Moment removed.", "2 moments imported.") and `Ctrl`/`Cmd`+`Z` runs the same thing. Editing parks the previous version and restores it; importing remembers the ids it added and removes exactly those.

### Added

- **A storage guard.** At 80% of the origin quota a warning appears in the Discoveries view, with a one-click readable backup; at 95% the wording changes to say new moments may not save. Past 97% the photo picker refuses a new photo and says why, instead of letting the save fail afterwards. The numbers come from `navigator.storage.estimate()`, and the guard says nothing at all when the browser will not answer.

### Verified

- Three undo paths driven in headless Chrome: edit → undo restored the original text; delete → `Ctrl+Z` restored the moment; import of two moments took the archive from 1 to 3 and undo took it back to 1.
- The guard at 30%, 85% and 97% of quota: silent, warning, urgent.

## 1.10.0 — 2026-11-19

Two items off the short list.

### Added

- **On this day.** A strip under the city that shows moments from the same calendar date in earlier years, newest first, with a "1 yr" / "3 yrs" badge and the district's colour. Click one and it opens that day in the drawer. The panel hides itself entirely when there is nothing to show, so a new city never meets an empty box.
- The sample city now includes one moment dated exactly a year ago today, so the strip has something to show on a first visit. Exact date arithmetic, not "365 days", so it lands on the same month and day across leap years.

### Changed

- **Photos are encoded as WebP when the browser can, and JPEG when it cannot**, keeping whichever is smaller. A 400×200 test JPEG with EXIF orientation 6 now stores as `data:image/webp` at 200×400 — the rotation is applied, so a photo taken sideways on a phone is stored the way it was meant to be seen. The import validator already accepted WebP; nothing else changed.

## 1.9.0 — 2026-11-19

A performance pass, with the numbers written down.

### Added

- **`docs/performance.md`** — requests, transfer sizes, paint timings and CSS coverage for both pages, the fixes that came out of them, and one defect stated plainly rather than buried: the landing page's layout shift is 0.018 warm and 0.186 cold, and six experiments failed to pin the mechanism down. The page lists all six so the next person does not repeat them.

### Changed

- **The two hero fonts are preloaded** on both pages, and **the app's three scripts carry `defer`**. Neither moved the layout-shift number; both are correct regardless.

### Measured

- Landing page: 11 requests, 273 KB, FCP 1.66 s. App: 20 requests, 234 KB, FCP 1.12 s.
- **100% CSS coverage on both pages** — every rule in both stylesheets is used. There is no dead CSS to purge, which is why the size budgets are the guard.

## 1.8.0 — 2026-11-19

### Added

- **An architecture diagram** — `docs/cobble-architecture.excalidraw`, 36 elements, editable in Excalidraw. It answers one question in one look: what is local, what is served, and the two things that ever leave the device. The layout was checked by rendering it and looking, twice, because a diagram that overlaps its own arrows is worse than no diagram.

### Recorded, not resolved

- **The name is contested.** A search for "Cobble" turns up a funded group-planning app (trycobble.com), an audio walking-tour app from Cobble Media Limited, and a Pebble watch app. None of them is a journalling tool, and this project is non-commercial, so the practical cost is findability and confusion rather than a legal risk. It is written into [ENHANCEMENTS.md](ENHANCEMENTS.md) as a decision to make rather than a task to do.

## 1.7.0 — 2026-11-19

Performance and handover.

### Changed

- **Every screenshot is WebP.** Fourteen images went from **2,406 KB to 502 KB**, a 79% cut, with no visible difference at the sizes they are displayed. The landing page's gallery is the heaviest thing on it, and it is now a fifth of what it was. `og:image` and the README point at the WebP files; the PNGs are gone rather than kept "just in case", because a repository that ships both ships the wrong one eventually.
- **`AGENTS.md`** — a short file for whoever works on this next: the six invariants that are bugs if broken (no CDN, relative paths inside `app/`, escape everything that reaches `innerHTML`, data-touching code lives in `core.js`, bump the cache, add new files to three lists), where things are, and the checks to run before saying a change is done.

### Added

- **A GitHub release** for 1.6.0, with the notes the changelog already carried: https://github.com/drsamonline/Cobble/releases

## 1.6.0 — 2026-11-19

An audit pass with four skills, and the fixes it turned up.

### Added

- **`PRIVACY.md`** — what is stored, in which browser store, what leaves the device, how to delete it, and the three requests that do leave. Every claim names the file that proves it, so a reader can check rather than trust.
- **`SECURITY.md`** — how to report a vulnerability, what is in scope (a malicious `.cobble` file is the real surface), and the limitations listed rather than buried: no encryption at rest, no CSP header, no `frame-ancestors`, six-digit PINs are guessable offline.
- Both are linked from the README, the docs hub and the landing footer. There is still no terms-of-service file, and the README now says why: no service, no accounts, nothing to buy.

### Fixed

- **Muted text failed contrast.** Measured, not guessed: the app's muted grey was 3.02:1 on its own card and the landing page's was 3.4:1 on paper, against the 4.5:1 that small text needs. Both tokens are now `#66726c`, which measures 4.56–4.97:1 across every surface they sit on, and the landing page's section numbers moved from the decorative apricot (1.93:1) to a darkened `#8f6130` (4.87:1).
- **A cancelled edit left `editingId` set**, so a later save could have overwritten the moment you had been editing instead of adding a new one. `closeEntry()` now clears it, and the save path clears it too if the moment has vanished.
- **The service worker cached every stylesheet and script twice** — once under its bare path and once under a `?v=` URL it never matched, because lookups use `ignoreSearch`. The versioned list is gone.
- **Copy.** Thirteen em dashes in the landing page, five now; the hero lede, the three rule cards and the privacy paragraph were rewritten to state things rather than stage them. Every claim was kept.

### Known, measured, and not fixed

- Roughly forty distinct small-text colours in `app/styles.css` still sit between 2.5:1 and 4.4:1. They are mostly chip labels and one-off captions; fixing them is a visual redesign rather than a find-and-replace, so it is an enhancement item with the measurements attached rather than a silent half-fix.

## 1.5.0 — 2026-11-19

The share format and the import validator moved into `app/core.js`, and got a test suite.

### Changed

- **`app/core.js`** now holds the things that do not need a browser: the bundle format, `deriveKey`, `encryptEntries`, `decryptBundle`, and `normaliseEntry` (the import validator). `app.js` calls it. Same behaviour, one copy of the rules instead of two.
- The app shell budget went from 190 KB to 200 KB to cover the extra file; it currently sits at 162 KB.

### Added

- **`tests/core.test.mjs`** — 24 tests, no dependencies, `node --test tests/`. They cover: a city round-tripping through the encrypted bundle; two exports of the same city producing different salt, IV and ciphertext; a wrong PIN failing; a flipped ciphertext byte being detected rather than decrypted; malformed bundles refused before any crypto runs; weights clamped rather than trusted; unknown fields dropped; and a table of eleven malformed moments (bad ids, empty text, impossible dates, unknown districts, a `javascript:` photo, an SVG data URL) each rejected for its own reason.
- **A hostile-file test**: a bundle carrying two good moments and three broken ones imports exactly the two good ones.
- **CI runs the tests** — `node --test tests/` sits beside the link check and the size budget.

The validator's constants now have one home. `docs/data-model.md` points at `core.js` for the limits rather than repeating them from memory.

## 1.4.0 — 2026-11-19

**Search.** The most-requested missing feature, and the last of the app's obvious absences.

- **One box over the whole archive**, in the timeline. Results keep their day grouping; the matching run of characters is marked in every card and in the day drawer.
- **Folded matching.** Case and accents are stripped on both sides, so `cafe` finds `café`, `sebastien` finds `Sébastien`, `crepe` finds `crêpe`. Plain substring — no stemming, no ranking, no fuzzy distance, because an archive of a few thousand moments does not need any of that.
- **It searches three things**: what you wrote, the district name ("nature" finds every outside moment), and the date (`2026-11` finds a month).
- **Honest states.** A query with no hits says so and suggests a shorter word; the count line changes from "18 moments · 18 days" to "1 found"; the clear button appears only when there is something to clear; `Esc` in the box clears it.
- While a search is active, every matching day is shown, not just the first fifty of the archive.

Also in this release: an empty archive now carries one line about the city living in this browser, and points at **Share city → Export readable backup** — the answer to the most common support question.

## 1.3.0 — 2026-11-19

The top of the [enhancement list](ENHANCEMENTS.md) — the things a journalling app needs before anything else.

### Added

- **Edit a moment.** Every card in the day drawer now has an **Edit** button that reopens the entry form pre-filled — text, date, district, weight and photo. The dialog title becomes "Change a moment" and the button reads "Save changes". The id and creation time are preserved.
- **Delete a moment**, with **Undo**: a strip appears for twenty seconds with an Undo button, and `Ctrl`/`Cmd`+`Z` works too.
- **A readable backup.** "Export readable backup" writes every moment to `cobble-backup-YYYY-MM-DD.json` — plain, unencrypted, with a note in the file saying so. The encrypted `.cobble` export stays the default for sending a city to someone; this one is for keeping it.
- **The atmosphere is remembered.** Theme, mood, weather and day/night are stored in `cobble-atmosphere-v1` and restored on the next visit.
- **Keyboard.** `N` opens a new moment from anywhere outside a text field; `Ctrl`/`Cmd`+`Z` undoes a delete; `Esc` already closed overlays.
- **A print stylesheet.** Printing the timeline now drops the sidebar, the controls and every overlay, and prints the days with their moments, page-break-safe.

### Accessibility

- **The toast announces itself** — `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. Every save, every failure and every undo now reaches a screen reader.
- **Focus is trapped in dialogs** and returned to whatever opened them on `Esc`.
- **A skip link** ("Skip to your city") is the first thing in the tab order, and the sidebar has a name.
- **All four overlays are labelled dialogs** (`role="dialog"`, `aria-modal`, `aria-labelledby`/`aria-label`). One nested duplicate was removed.
- **The help panel links to the source, the licence and the docs.**

### Fixed

- **"Edit" opened the form behind the drawer.** All four backdrops shared `z-index: 20` and the drawer comes later in the DOM, so the entry modal painted underneath the panel it was opened from. The entry modal now sits at 30.

### Changed

- The landing page's service-worker registration moved out of an inline `<script>` into `assets/landing.js`. It was the last inline script on the site, so a `script-src 'self'` policy no longer needs an exception.
- Service worker `CACHE_VERSION` v2, `ASSET_VERSION` 1.3.0.

## 1.2.0 — 2026-11-19

Renamed, before the first release, from *Elsewhere* to **Cobble**. Nothing had shipped and nobody had an archive, which is the only cheap moment to change a name that is baked into storage keys, a file extension and a URL.

- **Name.** *To cobble* is to make something out of whatever is at hand; a cobble is the stone underfoot. The tagline becomes "a city made of small things", and "your life, taking shape" stays as the emotional line.
- **Storage keys** are now `cobble-archive` (IndexedDB) and `cobble-moments-v1` (the localStorage fallback).
- **The share format** is `cobble-pincode`, and exported files end in `.cobble`.
- **Every URL, badge, manifest field, service-worker cache name and screenshot** was regenerated to match.
- The icon set is unchanged: three bars, a skyline, in the same palette.

## 1.1.0 — 2026-11-18

The app becomes genuinely self-contained: no CDN at runtime, works with the network off, installable, and checked in CI. Everything in this release was adapted from the other repositories in the same collection — see [Built on the fleet](README.md#built-on-the-fleet).

### Added

- **A service worker** (`sw.js`) at the site root. Network-first for navigations, cache-first for same-origin assets, cross-origin requests untouched. One versioned cache covers the landing page, the app, the fonts, the icons and the docs hub; the old cache is deleted on activate.
- **A web app manifest** (`manifest.json`) with a maskable icon, a standalone display mode and two shortcuts — "My city" and "Sample city". The site is installable from the address bar.
- **An icon set** (`icons/`) generated from the site's own three-bar mark: 192, 512, maskable 512 and a 180 px apple-touch icon, plus `favicon.svg`.
- **`selftest.html`** — loads every precached file and reports, per file, whether it came from the cache or the network. The offline claim now has a button behind it.
- **Self-hosted fonts** (`fonts/`): Manrope, DM Sans and IBM Plex Mono as woff2, latin subset, 118 KB total. Manrope and DM Sans arrive from Google as one variable file each, so each is declared once with a weight range instead of five times.
- **Vendored libraries** (`app/vendor/`): JSZip 3.10.1 and Three.js r128, unmodified, with their licence headers and a README recording version, licence and upstream.
- **Two checks and a workflow** — `tools/check-links.mjs` resolves every local reference including the service-worker precache list and the manifest, and fails if any page points at a CDN again; `tools/check-size.mjs` holds four size budgets; `.github/workflows/check.yml` runs both plus `node --check` on the four scripts.

### Changed

- **The 3D layer is now opt-in** and labelled experimental. It renders a white floor and floats its buildings above it on the machines it was tested on; with Three.js served locally that would have become the default view for everyone. It is now behind `app/?3d=1` (or `#3d`), and Three.js is not downloaded unless you ask for it. The camera in `city3d.js` also now corrects for the viewport aspect ratio, which it never did. Repairing the scene is [item 6.1](ENHANCEMENTS.md#6-the-3d-layer) on the enhancement list.
- **Tailwind is gone.** It was loaded from a CDN to provide exactly two utility classes on `<body>`; those two rules are now in `theme.css`.
- **`app/styles.css` no longer `@import`s Google Fonts** — the `@import` had been duplicating the `<link>` in the HTML and blocking the first paint.
- **The service worker is registered from both pages**, and from `app/app.js` rather than inline, so a strict `script-src 'self'` policy is now feasible for the app.

### Verified

- Fonts resolve from the local files (`document.fonts.check` true for all three families).
- With the network switched off, `/app/` reloads and renders from the cache.
- "Download app package" still produces a zip, now using the vendored JSZip.
- A page load makes no request to any host but its own — the only external request in the whole app is the sample city's Unsplash photographs.

## 1.0.0 — 2026-11-18

The first public release: the app as it was written, plus the four fixes it needed to be a repository rather than a folder of files.

### Added

- **Landing page** (`index.html`, `assets/`) — a survey-sheet design in the app's own palette, with a skyline generated from a seed rather than an image, a day/night switch, a six-button "grow a block" demo, and the support block.
- **Documentation** (`docs/`) — getting started, how the city works, architecture, data model, privacy and security, customising, deploying, and an FAQ.
- **Enhancement list** (`ENHANCEMENTS.md`) — every idea, ordered by effort, quick wins first.
- **Screenshots** (`screenshots/`) — twelve real renders of this repository at 1440×900, 1440×1000 and 390×844, produced with headless Chrome against the sample city.
- **Deep link into the sample city** — `app/?demo=1` and `app/#demo` open it directly. The landing page's "Wander a sample city" button uses it.
- **`aria-label` on the share button**, which previously relied on `title` alone.

### Fixed

- **The achievements grid rendered as plain stacked text.** `app.js` generated `.achievement-card`, `.achievement-icon`, `.achievement-copy`, `.achievement-progress` and `.achievement-status`, and `styles.css` contained no rules for any of them. The Discoveries view now shows a proper grid, with earned states, icons and progress bars.
- **The mobile share button was an empty pill.** It hides its label with `font-size: 0`, which also hid the `↗` glyph. The glyph is restored with a `::before`.
- **The add button showed a tofu box.** It used the fullwidth plus `＋` (U+FF0B), which DM Sans does not carry, so "Add a moment" rendered as a missing-glyph square on systems without a fallback for that codepoint. Replaced with an ordinary `+`.
- **The app assumed a domain root.** `downloadAppPackage()` fetched `/index.html` and its siblings, which fails on a project page such as `drsamonline.github.io/Cobble/app/`. All paths are now relative, and the brand link points at `../`.
### Moved

- The app now lives in `app/`, with the landing page at the root. Every reference inside the app was already relative except the brand link and the package downloader, both fixed above.

### Known gaps

These are the top of the [enhancement list](ENHANCEMENTS.md), and they are stated here rather than hidden:

- No delete or edit for a saved moment — the entry modal only adds.
- No service worker and no manifest, so the app is not installable and not offline on a cold load.
- The toast has no `aria-live`, so save confirmations are silent to a screen reader.
- No search.
- Three dependencies still come from public CDNs: Google Fonts, Tailwind's Play CDN (two classes), and optionally Three.js and JSZip.
