# Security policy

**Version 1.0 · 19 November 2026**

## Reporting a vulnerability

Email **sohilmomin2000@gmail.com** with the words *Cobble security* in the subject. If you would rather not use email, open a GitHub issue that says only "security report — please contact me", with no details, and the same address will reply.

Please include: what you did, what happened, what you expected, and the browser and version. A proof of concept helps enormously — a `.cobble` file that misbehaves is worth a paragraph of description.

There is no bug bounty. There is one person, who will reply, fix it, and credit you in the changelog unless you would rather not be named.

**Please do not open a public issue containing a working exploit** before there is a fix. If the issue is already public elsewhere, say so in your email and it will be handled as urgent.

## Supported versions

The published site tracks `main`. Only the current minor version (1.5.x at the time of writing) is supported — this is a single-maintainer project with no backport branch.

## What is in scope

- **The import path.** A malicious `.cobble` file is the most likely attack surface: it is the only untrusted input the app accepts. Relevant: decryption, the entry validator in `app/core.js`, and any way to make imported text or a photo escape its escaping and execute.
- **Cross-site scripting** through anything the app renders: moment text, dates, ids, photo data URLs, or the day drawer.
- **The share format.** Weakness in the PBKDF2/AES-GCM use, a way to derive the PIN from the file, or a way to make a file decrypt to something the app then trusts.
- **The service worker.** Cache poisoning, a way to serve stale or attacker-controlled files, or scope confusion between the app and the landing page.
- **Storage handling.** A path where one user's archive can be read by another origin, or where a failed save silently destroys data.

## What is out of scope

- Someone with physical access to an unlocked device, or with the browser profile. The archive is not encrypted at rest; that is a documented gap, and [ENHANCEMENTS.md](ENHANCEMENTS.md) tracks it.
- Browser extensions with permission to read pages.
- A passphrase being brute-forced from a locked vault, or from a `.cobble` file. A six-digit PIN is deliberately weak against an offline attacker with hardware; the docs say so, and the fix is a longer PIN.
- Denial of service by filling your own storage quota.
- Anything in GitHub Pages' hosting, TLS or CDN behaviour.
- The experimental 3D layer, which is off by default and behind `?3d=1`.

## Threat model, stated plainly

The app protects your moments from: other websites (same-origin policy), a person who receives your `.cobble` file without the PIN, and anyone who does not have your device. It does not protect against: malware on the device, someone using your unlocked browser, a determined attacker guessing a short PIN, or the loss of the browser profile.

## Known limitations, listed rather than buried

- **Encryption at rest is opt-in.** Locked cities store a single encrypted `vault` record and no plaintext; unlocked cities store readable JSON, because that is what makes a forgotten passphrase survivable. The choice is yours and the app states the trade-off before locking.
- **No Content-Security-Policy header.** The app has no inline scripts and no third-party origins left, so a strict policy is now feasible — `docs/deploying.md` has a draft — but the published copy does not send one. A meta-tag CSP is a small next step.
- **No `X-Frame-Options` / `frame-ancestors`.** The page could be framed by another site. Nothing in the app is clickjackable in a harmful way, but it is not asserted either.
- **Six-digit PINs are guessable offline** given a GPU and patience. Use twelve.
- **Clearing site data deletes the archive.** There is no server copy, by design.

## How the code is verified

`node --test tests/` runs 24 tests over the share format and the import validator. `.github/workflows/check.yml` runs those tests, a local-link check that also forbids CDN references, a size budget, and `node --check` on every script. Both run on every push to `main`.

That is not a security audit. It is the floor: the crypto round-trips, a wrong PIN fails, a flipped ciphertext byte is rejected, and eleven classes of malformed moment are refused. The rest is readable source, which is the point.
