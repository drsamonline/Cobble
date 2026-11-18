# Data model

Everything Elsewhere knows about you is one array of objects. This guide is the exact shape of that array, where it is stored, and the file format used to move it.

## The moment

```js
{
  id: 'k3f9x2m1q8',            // string, unique, ≤ 120 chars
  date: '2026-11-18',          // YYYY-MM-DD, local calendar date, no time, no zone
  text: 'The corner bakery puts the warm loaves in the window at exactly 4:15.',  // 1–500 chars
  category: 'everyday',        // one of: everyday | people | nature | ideas | joy | milestone
  importance: 2,               // 1 = a detail, 2 = something that mattered, 3 = a landmark
  repeatCount: 3,              // 1–5; above 1 the moment counts as a returning theme
  photo: 'data:image/jpeg;base64,…',  // '' or a data URL, already resized
  createdAt: '2026-11-18T12:04:51.220Z'  // ISO 8601, informational
}
```

Notes that matter in practice:

- **`date` is a string, not a Date.** It is a calendar date in your local time, computed by `localDate()`, so a moment saved at 23:50 on the 18th stays on the 18th even if you fly somewhere. Every render parses it as `new Date(date + 'T12:00:00')` — noon, to stay clear of DST edges.
- **`photo` is a data URL**, not a Blob and not a filename. Photos are downscaled to at most 1280 px on the long edge, drawn to a canvas, and re-encoded as `image/jpeg` at quality 0.76. A 12 MB input usually lands between 80 KB and 250 KB. This is why the archive is one self-contained JSON document and why the export needs no extra files.
- **`id` is generated client-side** and is the only key used for de-duplication on import.
- **Unknown fields are dropped** on import rather than stored. The importer is a whitelist, not a passthrough.

## Where it lives

### IndexedDB (primary)

```
database:  elsewhere-archive        version 1
store:     archive                  keyPath: 'id'
record:    { id: 'moments', value: '<JSON.stringify(entries)>' }
```

One record holds the whole archive as a JSON string. This is a deliberate simplification: a single record makes every write atomic, so a crash mid-save leaves either the old city or the new one, never half of each. The trade-off is that saving rewrites the whole document — fine at a few thousand moments, worth revisiting at tens of thousands.

Writes are serialised through a promise queue:

```js
saveQueue = saveQueue.catch(() => {}).then(() => saveToDatabase(serialized));
```

so a slow earlier save can never land after a newer one.

### localStorage (fallback)

```
key: elsewhere-moments-v1
```

Used when IndexedDB is missing or a write fails (private windows, restricted profiles, quota exhaustion). It is roughly a 5 MB budget, so photos fill it fast — the app says so in the UI when it is on this path. On the next load, `loadArchive()` prefers whichever copy is newer: if the localStorage copy is non-empty it wins, is written back into IndexedDB, and the localStorage copy is removed. This is what stops a quota failure from silently reverting your archive to a stale IndexedDB snapshot.

The app also calls `navigator.storage.persist()` where it is offered, asking the browser not to evict the archive under pressure.

### What is never stored

- No user id, no device id, no session token — there is no account.
- No analytics, no event log, no error reports.
- No settings. Atmosphere, view and scroll position reset on reload; only moments are persisted.

## The `.elsewhere` file

A single JSON document, produced by **Share city** and read by **Open a city file**.

```json
{
  "format": "elsewhere-pincode",
  "version": 1,
  "salt": [ 16 integers, 0–255 ],
  "iv":   [ 12 integers, 0–255 ],
  "data": [ n integers, 0–255 ]
}
```

`data` is the AES-256-GCM ciphertext of this plaintext:

```json
{
  "app": "Elsewhere",
  "version": 1,
  "exportedAt": "2026-11-18T12:10:02.441Z",
  "entries": [ /* only the moments you ticked */ ]
}
```

The key is derived from your PIN:

```
PBKDF2-SHA-256(pin, salt, iterations = 250000)  →  AES-GCM 256-bit key
AES-GCM encrypt(iv = random 12 bytes)           →  ciphertext + auth tag
```

Because the tag is part of `data`, a wrong PIN and a corrupted file fail identically — the browser throws `OperationError`, and the app says "That PIN did not unlock this city file."

### Import validation

Before a single moment is added, `importCity()` checks:

| Check | Failure |
|---|---|
| `format === 'elsewhere-pincode'`, `version === 1` | "That does not look like an Elsewhere city file." |
| `salt` is 16 bytes, `iv` is 12 bytes, `data` is ≥ 16 and ≤ 38 MB | "The city file is damaged or uses an unsupported format." |
| Every byte is an integer 0–255 | same as above |
| File is ≤ 50 MB on disk | "This city file is larger than the 50 MB safety limit." |
| `crypto.subtle` exists | "Secure decryption is not available in this browser." |
| Plaintext has an `entries` array of ≤ 100,000 items | "The city file is incomplete or too large." |
| Per moment: `id` string ≤ 120; `text` non-empty ≤ 500; `date` matches `YYYY-MM-DD` **and** round-trips through a real Date; `category` is one of the six; `photo` (if present) is a `data:image/(jpeg|png|webp|gif);base64,…` string ≤ 16 MB | the moment is skipped |
| `id` not already in the archive | the moment is skipped |

Then `importance` is clamped to 1–3 and `repeatCount` to 1–5. If nothing survives, the app says so instead of pretending.

## Writing your own tool

Two honest routes:

1. **Unencrypted, in the browser.** Open the app's DevTools console on your own device and read `JSON.parse(localStorage.getItem('elsewhere-moments-v1') || '[]')` — or, on the IndexedDB path, the `moments` record. This is your data; there is no protection to bypass.
2. **Encrypted, anywhere.** Read the `.elsewhere` file and do the same PBKDF2 + AES-GCM derivation. In Python:

```python
import json, base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

bundle = json.load(open('elsewhere-city-2026-11-18.elsewhere'))
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32,
                 salt=bytes(bundle['salt']), iterations=250000
                 ).derive(open('pin.txt','rb').read().strip())
clear = AESGCM(key).decrypt(bytes(bundle['iv']), bytes(bundle['data']), None)
print(json.dumps(json.loads(clear), indent=2, ensure_ascii=False))
```

`iterations` is a constant in `app.js` (`deriveKey`). If it ever changes, the `version` field must change with it, because old files would otherwise become unreadable.
