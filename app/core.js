/* Cobble — the part that can be tested without a browser.
 *
 * The share format, the key derivation and the import validator live here so
 * that `tests/core.test.mjs` can exercise the same code the app runs, instead
 * of a copy of it. Everything in this file is pure: it takes values, it returns
 * values, and it touches no DOM.
 *
 * Loaded as a plain script before app.js, and imported directly by Node.
 */
(() => {
  const FORMAT = 'cobble-pincode';
  const VERSION = 1;
  const ITERATIONS = 250000;
  const SALT_BYTES = 16;
  const IV_BYTES = 12;
  const MAX_FILE_BYTES = 50 * 1024 * 1024;
  const MAX_CIPHERTEXT_BYTES = 38 * 1024 * 1024;
  const MAX_ENTRIES = 100000;
  const MAX_TEXT = 500;
  const MAX_ID = 120;
  const MAX_PHOTO_CHARS = 16 * 1024 * 1024;
  const PHOTO_PATTERN = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/;
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  const CATEGORIES = ['everyday', 'people', 'nature', 'ideas', 'joy', 'milestone'];

  const subtle = () => {
    const api = globalThis.crypto;
    if (!api || !api.subtle) {
      throw new Error('Secure encryption is not available in this browser. Try the published site or a modern browser.');
    }
    return api;
  };

  async function deriveKey(pin, salt) {
    const api = subtle();
    const base = await api.subtle.importKey(
      'raw',
      new TextEncoder().encode(pin),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return api.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /* Encrypt a list of moments into the on-disk bundle. */
  async function encryptEntries(entries, pin) {
    const api = subtle();
    const payload = JSON.stringify({
      app: 'Cobble',
      version: VERSION,
      exportedAt: new Date().toISOString(),
      entries
    });
    const salt = api.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = api.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(pin, salt);
    const encrypted = await api.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(payload)
    );
    return {
      format: FORMAT,
      version: VERSION,
      salt: [...salt],
      iv: [...iv],
      data: [...new Uint8Array(encrypted)]
    };
  }

  /* Decrypt a bundle back to its moments. Throws with a human sentence. */
  async function decryptBundle(bundle, pin) {
    if (!bundle || bundle.format !== FORMAT || bundle.version !== VERSION) {
      throw new Error('That does not look like a Cobble city file.');
    }
    const bytes = value => Array.isArray(value) && value.every(n => Number.isInteger(n) && n >= 0 && n <= 255);
    if (!bytes(bundle.salt) || bundle.salt.length !== SALT_BYTES ||
        !bytes(bundle.iv) || bundle.iv.length !== IV_BYTES ||
        !bytes(bundle.data) || bundle.data.length < 16 || bundle.data.length > MAX_CIPHERTEXT_BYTES) {
      throw new Error('The city file is damaged or uses an unsupported format.');
    }
    const key = await deriveKey(pin, new Uint8Array(bundle.salt));
    let clear;
    try {
      clear = await subtle().subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(bundle.iv) },
        key,
        new Uint8Array(bundle.data)
      );
    } catch {
      throw new Error('That PIN did not unlock this city file. Try again.');
    }
    const shared = JSON.parse(new TextDecoder().decode(clear));
    if (!Array.isArray(shared.entries) || shared.entries.length > MAX_ENTRIES) {
      throw new Error('The city file is incomplete or too large.');
    }
    return shared.entries;
  }

  /* One imported moment, or null if it cannot be trusted.
     Whitelist, not passthrough: unknown fields are dropped. */
  function normaliseEntry(raw, known) {
    if (!raw || typeof raw !== 'object') return null;
    if (typeof raw.id !== 'string' || !raw.id || raw.id.length > MAX_ID) return null;
    if (typeof raw.text !== 'string' || !raw.text.trim() || raw.text.length > MAX_TEXT) return null;
    if (typeof raw.date !== 'string' || !DATE_PATTERN.test(raw.date)) return null;
    const date = new Date(`${raw.date}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const roundTrip = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (roundTrip !== raw.date) return null;
    if (!CATEGORIES.includes(raw.category)) return null;
    if (known && known.has(raw.id)) return null;
    if (raw.photo) {
      if (typeof raw.photo !== 'string') return null;
      if (raw.photo.length > MAX_PHOTO_CHARS) return null;
      if (!PHOTO_PATTERN.test(raw.photo)) return null;
    }
    return {
      id: raw.id,
      text: raw.text.trim(),
      date: raw.date,
      category: raw.category,
      importance: Math.max(1, Math.min(3, Number(raw.importance) || 1)),
      repeatCount: Math.max(1, Math.min(5, Number(raw.repeatCount) || 1)),
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt.slice(0, 40) : '',
      photo: raw.photo || ''
    };
  }

  /* ── the vault ────────────────────────────────────────────────────
     The archive at rest. Same primitives as the share file, a different
     purpose: this one never leaves the device, and it exists so that a
     stolen browser profile yields ciphertext rather than a diary. */
  const VAULT_FORMAT = 'cobble-vault';
  const VAULT_VERSION = 1;

  async function encryptVault(entries, passphrase) {
    if (typeof passphrase !== 'string' || passphrase.length < 8) {
      throw new Error('Use at least eight characters for the passphrase.');
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const plaintext = new TextEncoder().encode(JSON.stringify(entries));
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    return {
      format: VAULT_FORMAT,
      version: VAULT_VERSION,
      salt: [...salt],
      iv: [...iv],
      data: [...new Uint8Array(data)]
    };
  }

  /* The key, derived once and reused. Deriving it costs ~250,000 PBKDF2
     iterations, which is the point of PBKDF2 — paying it on every save is not.
     The salt is kept for the session and the IV is fresh every time, which is
     what AES-GCM needs. */
  async function encryptVaultWithKey(entries, key, salt) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(entries));
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    return {
      format: VAULT_FORMAT,
      version: VAULT_VERSION,
      salt: [...salt],
      iv: [...iv],
      data: [...new Uint8Array(data)]
    };
  }

  async function decryptVaultWithKey(vault, key) {
    if (!vault || vault.format !== VAULT_FORMAT || vault.version !== VAULT_VERSION) {
      throw new Error('That is not a Cobble vault.');
    }
    let plaintext;
    try {
      plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(vault.iv) }, key, new Uint8Array(vault.data)
      );
    } catch {
      throw new Error('That passphrase did not open this city.');
    }
    const parsed = JSON.parse(new TextDecoder().decode(plaintext));
    return Array.isArray(parsed) ? parsed : [];
  }

  async function decryptVault(vault, passphrase) {
    if (!vault || vault.format !== VAULT_FORMAT || vault.version !== VAULT_VERSION) {
      throw new Error('That is not a Cobble vault.');
    }
    const salt = new Uint8Array(vault.salt);
    const iv = new Uint8Array(vault.iv);
    const key = await deriveKey(passphrase, salt);
    let plaintext;
    try {
      plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, new Uint8Array(vault.data));
    } catch {
      throw new Error('That passphrase did not open this city.');
    }
    const parsed = JSON.parse(new TextDecoder().decode(plaintext));
    return Array.isArray(parsed) ? parsed : [];
  }

  /* Merging one city into another. Pure: it takes two arrays and returns the
     additions plus a count of variants, so the rule can be tested without a
     browser. An incoming moment is skipped only when the id *and* the content
     match; an id that matches but says something different is kept alongside
     under an id derived from its content, so importing twice adds nothing. */
  function contentHash(entry) {
    const text = [entry.id, entry.date, entry.category, entry.importance, entry.text, entry.photo || ''].join('\u0001');
    let hash = 5381;
    for (let i = 0; i < text.length; i += 1) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
    return hash.toString(36);
  }

  function mergeEntries(localEntries, incomingEntries) {
    const known = new Set(localEntries.map(entry => String(entry.id)));
    const local = new Map(localEntries.map(entry => [String(entry.id), entry]));
    const added = [];
    let variants = 0;
    for (const raw of incomingEntries) {
      if (!raw || typeof raw !== 'object') continue;
      const existing = local.get(String(raw.id));
      let candidate = raw;
      if (existing) {
        const same = existing.text === raw.text
          && existing.date === raw.date
          && existing.category === raw.category
          && String(existing.importance) === String(raw.importance)
          && (existing.photo || '') === (raw.photo || '');
        if (same) continue;
        candidate = { ...raw, id: `${raw.id}-v-${contentHash(raw)}` };
      }
      const clean = normaliseEntry(candidate, known);
      if (!clean) continue;
      if (existing) variants += 1;
      known.add(clean.id);
      added.push(clean);
    }
    return { added, variants };
  }

  /* ── importing from another journal ───────────────────────────────
     Two shapes, because they cover most exports people actually have:
     Day One's JSON, and a markdown or text file with a date above each
     entry. Pure: it returns candidate moments and a count of what it could
     not read, and the caller decides what to do with them. */
  const DATE_LINE = /^\s*(?:#{1,6}\s*)?(\d{4}-\d{2}-\d{2})\b[^\n]*$/;

  function parseForeignJournal(text, filename = '') {
    const source = String(text || '');
    const name = String(filename || '').toLowerCase();
    const out = { moments: [], skipped: 0, kind: 'unknown' };

    const looksJson = name.endsWith('.json') || /^\s*[\[{]/.test(source);
    if (looksJson) {
      let parsed;
      try { parsed = JSON.parse(source); } catch { return out; }
      const rows = Array.isArray(parsed) ? parsed
        : Array.isArray(parsed?.entries) ? parsed.entries
        : Array.isArray(parsed?.moments) ? parsed.moments
        : null;
      if (!rows) return out;
      out.kind = 'json';
      for (const row of rows) {
        if (!row || typeof row !== 'object') { out.skipped += 1; continue; }
        const body = row.text ?? row.body ?? row.content ?? row.note ?? '';
        const when = row.creationDate ?? row.date ?? row.createdAt ?? row.timestamp ?? '';
        const day = String(when).slice(0, 10);
        if (!body || !/^\d{4}-\d{2}-\d{2}$/.test(day)) { out.skipped += 1; continue; }
        out.moments.push({ date: day, text: String(body).trim() });
      }
      return out;
    }

    /* markdown or plain text: a date on its own line, then whatever follows */
    out.kind = 'text';
    const lines = source.split(/\r?\n/);
    let current = null;
    let buffer = [];
    const flush = () => {
      if (current && buffer.join(' ').trim()) {
        out.moments.push({ date: current, text: buffer.join(' ').trim() });
      } else if (current) {
        out.skipped += 1;
      }
      buffer = [];
    };
    for (const line of lines) {
      const match = line.match(DATE_LINE);
      if (match) { flush(); current = match[1]; continue; }
      if (current) buffer.push(line.trim());
    }
    flush();
    return out;
  }

  const api = {
    FORMAT,
    VERSION,
    ITERATIONS,
    SALT_BYTES,
    IV_BYTES,
    MAX_FILE_BYTES,
    MAX_ENTRIES,
    MAX_TEXT,
    CATEGORIES,
    deriveKey,
    encryptEntries,
    decryptBundle,
    normaliseEntry,
    VAULT_FORMAT,
    VAULT_VERSION,
    encryptVault,
    decryptVault,
    encryptVaultWithKey,
    decryptVaultWithKey,
    mergeEntries,
    parseForeignJournal
  };

  globalThis.CobbleCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
