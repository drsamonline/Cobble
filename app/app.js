(() => {
  const STORE = 'cobble-moments-v1';
  const districtName = key => {
    const dict = window.CobbleI18n;
    const localised = dict ? dict.t(`district.${key}`) : '';
    return localised || (categories[key] ? categories[key].label : key);
  };

  const word = (key, fallback) => {
    const dict = window.CobbleI18n;
    const localised = dict ? dict.t(key) : '';
    return localised || fallback;
  };

  const say = (key, values) => (window.CobbleI18n ? window.CobbleI18n.say(key, values) : '');

  const categories = {
    everyday: {
      label: 'Everyday detail',
      short: 'Everyday',
      color: '#b59a79',
      icon: '✦'
    },
    people: {
      label: 'People & connection',
      short: 'People',
      color: '#cb8e79',
      icon: '♡'
    },
    nature: {
      label: 'Outside & nature',
      short: 'Nature',
      color: '#82a58a',
      icon: '✿'
    },
    ideas: {
      label: 'Thoughts & ideas',
      short: 'Ideas',
      color: '#8699b8',
      icon: '✧'
    },
    joy: {
      label: 'Small joys',
      short: 'Joy',
      color: '#d5aa64',
      icon: '☀'
    },
    milestone: {
      label: 'Something meaningful',
      short: 'Meaningful',
      color: '#aa86a0',
      icon: '✷'
    }
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [char]));
  const localDate = date => {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const formatDate = (date, options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, options);
  const readEntries = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORE) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const legacyEntries = readEntries();
  let entries = legacyEntries;
  let personalEntries = entries;
  let databasePromise;
  let databaseReady = false;
  let visibleTimelineDays = 50;
  /* How many matching days are drawn while a filter or a search is narrowing
     the list. Every matching day is still *counted*; this only bounds what is
     built, because 600 day rows at 5,000 moments took half a second. */
  let narrowedDays = 60;
  let demoMode = false;
  let cityCenterIndex = 0;
  let saveQueue = Promise.resolve();
  let photoData = '';
  let toastTimer;
  const atmosphere = { theme: 'meadow', mood: 'serene', weather: 'clear', night: false };
  /* When `auto` is on the city follows the clock: dawn, day, dusk, night.
     Any manual press on Theme, Mood, Weather or Night turns it off, because a
     scene that keeps changing under a deliberate choice is a scene fighting
     you. */
  let autoDay = false;
  const AUTO_KEY = 'cobble-auto-day';

  function partOfDay(hour = new Date().getHours()) {
    if (hour < 5) return 'night';
    if (hour < 8) return 'dawn';
    if (hour < 17) return 'day';
    if (hour < 20) return 'dusk';
    return 'night';
  }

  function applyAutoDay(silent = true) {
    if (!autoDay) return;
    const part = partOfDay();
    const preset = {
      dawn: { theme: 'coastal', mood: 'tranquil', weather: 'clear', night: false },
      day: { theme: 'meadow', mood: 'serene', weather: 'clear', night: false },
      dusk: { theme: 'amber', mood: 'dreamy', weather: 'clear', night: false },
      night: { theme: 'midnight', mood: 'tranquil', weather: 'clear', night: true }
    }[part];
    Object.assign(atmosphere, preset);
    applyAtmosphere();
    if (!silent) toast(say('toast.part', { part }));
  }

  function setAutoDay(on) {
    autoDay = !!on;
    try { localStorage.setItem(AUTO_KEY, autoDay ? 'on' : 'off'); } catch {}
    const button = $('#auto-day');
    if (button) button.setAttribute('aria-pressed', String(autoDay));
    if (autoDay) applyAutoDay(false);
  }
  const themes = ['meadow', 'coastal', 'amber', 'lavender', 'midnight'];
  const moods = ['serene', 'curious', 'dreamy', 'festive', 'tranquil'];
  const weatherTypes = ['clear', 'cloudy', 'rain', 'snow'];
  const pickDifferent = (items, current) => {
    const choices = items.filter(item => item !== current);
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const SHELL_KEY = 'cobble-shell-theme';
  const ATMOSPHERE_KEY = 'cobble-atmosphere-v1';

  /* The interface theme: light, dark, or whatever the system says until
     someone chooses. Separate from the city's own Night control. */
  function applyShellTheme(mode) {
    const resolved = mode || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.shell = resolved;
    const button = $('#shell-theme');
    if (button) {
      button.textContent = resolved === 'dark' ? '☀' : '☾';
      button.setAttribute('aria-label', resolved === 'dark' ? 'Switch to light interface' : 'Switch to dark interface');
      button.setAttribute('aria-pressed', String(resolved === 'dark'));
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#10171a' : '#f6f4ef');
  }

  function restoreShellTheme() {
    let stored = null;
    try { stored = localStorage.getItem(SHELL_KEY); } catch {}
    applyShellTheme(stored === 'dark' || stored === 'light' ? stored : null);
  }

  function toggleShellTheme() {
    const next = document.documentElement.dataset.shell === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(SHELL_KEY, next); } catch {}
    applyShellTheme(next);
    toast(next === 'dark' ? 'Dark interface.' : 'Light interface.');
  }

  function saveAtmosphere() {
    try {
      localStorage.setItem(ATMOSPHERE_KEY, JSON.stringify(atmosphere));
    } catch {
      /* A full or blocked store just means the city opens in its default weather. */
    }
  }

  function restoreAtmosphere() {
    try {
      const stored = JSON.parse(localStorage.getItem(ATMOSPHERE_KEY) || 'null');
      if (!stored) return;
      if (themes.includes(stored.theme)) atmosphere.theme = stored.theme;
      if (moods.includes(stored.mood)) atmosphere.mood = stored.mood;
      if (weatherTypes.includes(stored.weather)) atmosphere.weather = stored.weather;
      atmosphere.night = Boolean(stored.night);
    } catch {
      /* Ignore a damaged value rather than fail to start. */
    }
  }

  function applyAtmosphere() {
    const viewport = $('#city-viewport');
    viewport.dataset.theme = atmosphere.theme;
    viewport.dataset.mood = atmosphere.mood;
    viewport.dataset.weather = atmosphere.weather;
    viewport.classList.toggle('is-night', atmosphere.night);
    window.cobbleCity3D?.setAtmosphere(atmosphere);
    const weatherIcon = { clear: '☀', cloudy: '☁', rain: '☂', snow: '❄' }[atmosphere.weather];
    $('.weather-icon').textContent = atmosphere.night ? '☾' : weatherIcon;
    $('#weather-control').querySelector('span').textContent = weatherIcon;
    $('#time-icon').textContent = atmosphere.night ? '☀' : '☾';
    $('#time-label').textContent = atmosphere.night ? 'Day' : 'Night';
    $('#time-control').setAttribute('aria-label', atmosphere.night ? 'Switch to day' : 'Switch to night');
    $('#city-mood').textContent = `${atmosphere.mood[0].toUpperCase()}${atmosphere.mood.slice(1)} ${atmosphere.night ? 'after dark' : 'in the city'}`;
    if (!demoMode) saveAtmosphere();
    window.dispatchEvent(new CustomEvent('cobble-night', { detail: { night: atmosphere.night } }));
  }

  function openDatabase() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is unavailable'));
    if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('cobble-archive', 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('archive')) request.result.createObjectStore('archive', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open archive storage'));
    });
    return databasePromise;
  }

  /* The vault: when set, the archive is written encrypted under this key and
     no plaintext moments record is kept. */
  let vaultKey = null;
  let vaultPassphrase = null;
  /* Derived once per unlock and reused: PBKDF2 at 250,000 iterations is meant
     to be slow, and it should be paid on unlock, not on every save. */
  let vaultSession = null;   // { key, salt }

  function saveVault(vault) {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction('archive', 'readwrite');
      const store = transaction.objectStore('archive');
      store.put({ id: 'vault', value: vault });
      store.delete('moments');
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not save the vault'));
      transaction.onabort = () => reject(transaction.error || new Error('Vault save was interrupted'));
    }));
  }

  function readVault() {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const request = db.transaction('archive', 'readonly').objectStore('archive').get('vault');
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    }));
  }

  /* ── saved cities ──────────────────────────────────────────────────
     Not a live switch between archives — a shelf of named copies. The city you
     are in stays the only live one; a copy is written beside it and loading a
     copy replaces the live archive after saving the current one first. That
     removes every race the three attempts at live switching kept finding: there
     is only ever one archive being written. */
  const SNAPSHOT_PREFIX = 'snapshot:';
  /* Which saved city the live archive belongs to. While this is set, every
     save also updates that city in place, so editing a city you loaded keeps
     it current instead of piling up "Before switching" copies. */
  let activeSnapshot = null;
  let activeSnapshotName = '';
  let snapshotWriteTimer = null;

  function bindCity(id, name) {
    activeSnapshot = id || null;
    activeSnapshotName = name || '';
    const label = $('#city-shelf-name');
    if (label) label.textContent = activeSnapshotName || 'Your cities';
  }

  function scheduleSnapshotWrite() {
    if (!activeSnapshot) return;
    clearTimeout(snapshotWriteTimer);
    snapshotWriteTimer = setTimeout(() => {
      if (!activeSnapshot) return;
      const id = activeSnapshot;
      const name = activeSnapshotName || 'Untitled';
      const copy = entries.slice();
      writeSnapshot(id, name, copy).catch(() => {});
    }, 700);
  }

  function listSnapshots() {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const request = db.transaction('archive', 'readonly').objectStore('archive').getAllKeys();
      request.onsuccess = () => resolve(request.result.filter(key => String(key).startsWith(SNAPSHOT_PREFIX)));
      request.onerror = () => reject(request.error);
    })).then(keys => Promise.all(keys.map(key => new Promise((resolve, reject) => {
      const db = databasePromise;
      db.then(database => {
        const request = database.transaction('archive', 'readonly').objectStore('archive').get(key);
        request.onsuccess = () => {
          const value = request.result?.value || {};
          resolve({
            id: String(key).slice(SNAPSHOT_PREFIX.length),
            name: value.name || 'Untitled',
            savedAt: value.savedAt || '',
            count: (value.entries || []).length,
            counts: value.counts || {}
          });
        };
        request.onerror = () => reject(request.error);
      }).catch(reject);
    }))));
  }

  function writeSnapshot(id, name, list) {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction('archive', 'readwrite');
      transaction.objectStore('archive').put({
        id: `${SNAPSHOT_PREFIX}${id}`,
        value: { name, savedAt: new Date().toISOString(), entries: list, counts: countByCategory(list) }
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    }));
  }

  function deleteSnapshot(id) {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction('archive', 'readwrite');
      transaction.objectStore('archive').delete(`${SNAPSHOT_PREFIX}${id}`);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    }));
  }

  /* The map of your cities: one tile per saved copy, each drawn as a little
     skyline from its own district counts, so a city is recognisable by shape
     before you read its name. The city you are in is the first tile. */
  function skylineBars(counts) {
    const order = Object.keys(categories);
    const peak = Math.max(1, ...order.map(key => counts[key] || 0));
    return order.map(key => {
      const value = counts[key] || 0;
      const height = value ? Math.max(22, Math.round((value / peak) * 100)) : 8;
      const colour = categories[key] ? categories[key].color : '#c9c6b8';
      return `<i style="height:${height}%;background:${colour};opacity:${value ? 0.92 : 0.18}"></i>`;
    }).join('');
  }

  function countByCategory(list) {
    const counts = Object.fromEntries(Object.keys(categories).map(key => [key, 0]));
    for (const entry of list) if (counts[entry.category] !== undefined) counts[entry.category] += 1;
    return counts;
  }

  async function renderCityMap() {
    const grid = $('#city-map-grid');
    if (!grid) return;
    let snapshots = [];
    try { snapshots = await listSnapshots(); } catch {}

    const here = `
      <button class="city-tile" type="button" aria-current="true" data-city-here="1">
        <div class="city-tile-sky">${skylineBars(countByCategory(entries))}</div>
        <div class="city-tile-body">
          <span class="city-tile-here">YOU ARE HERE</span>
          <span class="city-tile-name">This city</span>
          <span class="city-tile-meta">${entries.length} ${entries.length === 1 ? 'moment' : 'moments'}</span>
        </div>
      </button>`;

    const tiles = snapshots.map(snap => `
      <button class="city-tile" type="button" data-city-load="${escapeHTML(snap.id)}">
        <div class="city-tile-sky">${skylineBars(snap.counts || {})}</div>
        <div class="city-tile-body">
          <span class="city-tile-name">${escapeHTML(snap.name)}</span>
          <span class="city-tile-meta">${snap.count} ${snap.count === 1 ? 'moment' : 'moments'} · saved ${escapeHTML((snap.savedAt || '').slice(0, 10))}</span>
        </div>
      </button>`).join('');

    grid.innerHTML = here + tiles + (snapshots.length ? '' : '<p class="city-map-empty">No other cities yet. “Save a copy” puts this one on the map, and you can load it again from here whenever you like.</p>');
    $$('[data-city-load]', grid).forEach(tile => tile.addEventListener('click', () => loadSnapshot(tile.dataset.cityLoad)));
  }

  async function openCityMap() {
    const modal = $('#city-map-modal');
    if (!modal) return;
    /* flush any pending write for the city we are in, so its tile is current
       the moment the map opens rather than 700ms later */
    clearTimeout(snapshotWriteTimer);
    if (activeSnapshot) {
      try { await writeSnapshot(activeSnapshot, activeSnapshotName || 'Untitled', entries.slice()); } catch {}
    }
    modal.classList.remove('hidden');
    renderCityMap();
    $('#close-city-map')?.focus();
  }

  function closeCityMap() {
    $('#city-map-modal')?.classList.add('hidden');
  }

  async function saveSnapshot() {
    const name = prompt('Name this copy. The city you are in stays where it is — this puts a copy on the shelf.');
    if (!name || !name.trim()) return;
    await saveQueue.catch(() => {});
    try {
      const id = `s${Date.now().toString(36)}`;
      await writeSnapshot(id, name.trim().slice(0, 40), entries);
      bindCity(id, name.trim().slice(0, 40));
      await renderCityMap();
      toast(`Saved “${name.trim()}” — ${entries.length} ${entries.length === 1 ? 'moment' : 'moments'}.`);
    } catch {
      toast('Could not save that copy.');
    }
  }

  async function loadSnapshot(id) {
    if (!confirm('Load this city? The one you are in is saved to the shelf first, so nothing is lost.')) return;
    closeCityMap();
    try {
      const snapshots = await listSnapshots();
      const target = snapshots.find(snap => snap.id === id);
      if (!target) return;
      await saveQueue.catch(() => {});
      const db = await openDatabase();
      const record = await new Promise((resolve, reject) => {
        const request = db.transaction('archive', 'readonly').objectStore('archive').get(`${SNAPSHOT_PREFIX}${id}`);
        request.onsuccess = () => resolve(request.result?.value || {});
        request.onerror = () => reject(request.error);
      });
      /* keep the city we are leaving current before we leave it */
      if (activeSnapshot) {
        await writeSnapshot(activeSnapshot, activeSnapshotName || 'Untitled', entries);
      } else if (entries.length) {
        await writeSnapshot(`s${Date.now().toString(36)}`, 'Before switching', entries);
      }
      entries = Array.isArray(record.entries) ? record.entries : [];
      personalEntries = entries;
      bindCity(id, target.name);
      save();
      render();
      await renderCityMap();
      toast(`Now showing “${target.name}”.`);
    } catch {
      toast('Could not load that city.');
    }
  }

  async function removeSnapshot(id) {
    if (!confirm('Delete this saved copy? The city you are in is not affected.')) return;
    try {
      await deleteSnapshot(id);
      if (activeSnapshot === id) bindCity(null, '');
      await renderCityMap();
      toast('Copy deleted.');
    } catch {
      toast('Could not delete that copy.');
    }
  }

  /* Photos live in their own record so the moments record stays small. Every
     save used to rewrite every photo's bytes inside one JSON string; now the
     entries are written as text and the photo map is only rewritten when the
     set of photos actually changes. */
  let lastPhotoKeys = '';

  function splitArchive(list) {
    const photos = {};
    const entries_ = list.map(entry => {
      if (entry.photo) { photos[String(entry.id)] = entry.photo; return { ...entry, photo: '' }; }
      return entry;
    });
    return { entries: entries_, photos };
  }

  function joinArchive(list, photos) {
    if (!photos) return list;
    return list.map(entry => (photos[String(entry.id)] ? { ...entry, photo: photos[String(entry.id)] } : entry));
  }

  function saveArchive(list) {
    const { entries: plain, photos } = splitArchive(list);
    const keys = Object.keys(photos).sort().join(',');
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction('archive', 'readwrite');
      const store = transaction.objectStore('archive');
      store.put({ id: 'moments', value: JSON.stringify(plain) });
      if (keys !== lastPhotoKeys) {
        store.put({ id: 'photos', value: photos });
        lastPhotoKeys = keys;
      }
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not save archive'));
      transaction.onabort = () => reject(transaction.error || new Error('Archive save was interrupted'));
    }));
  }

  function readPhotos() {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const request = db.transaction('archive', 'readonly').objectStore('archive').get('photos');
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    }));
  }

  function saveToDatabase(serialized) {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction('archive', 'readwrite');
      transaction.objectStore('archive').put({ id: 'moments', value: serialized });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not save archive'));
      transaction.onabort = () => reject(transaction.error || new Error('Archive save was interrupted'));
    }));
  }

  let markArchiveReady = () => {};
  const archiveReady = new Promise(resolve => { markArchiveReady = resolve; });

  async function loadArchive() {
    try {
      const vault = await readVault().catch(() => null);
      if (vault) {
        entries = [];
        personalEntries = [];
        databaseReady = true;
        markArchiveReady();
        showLockScreen();
        return;
      }
    } catch {}
    try {
      const db = await openDatabase();
      const stored = await new Promise((resolve, reject) => {
        const request = db.transaction('archive', 'readonly').objectStore('archive').get('moments');
        request.onsuccess = () => resolve(request.result?.value || '');
        request.onerror = () => reject(request.error);
      });
             if (legacyEntries.length) {
         // A fallback save may be newer than a stale IndexedDB copy after a quota error.
         entries = legacyEntries;
         await saveToDatabase(JSON.stringify(legacyEntries));
         try { localStorage.removeItem(STORE); } catch {}
       } else if (stored) {
         const parsed = JSON.parse(stored);
         if (Array.isArray(parsed)) {
           /* If something was added while the archive was still loading, keep
              it: overwriting here is how a first moment used to disappear. */
           if (entries.length) {
             const known = new Set(parsed.map(entry => String(entry.id)));
             entries = [...parsed, ...entries.filter(entry => !known.has(String(entry.id)))];
           } else {
             entries = parsed;
           }
         }
              }
       const photos = await readPhotos().catch(() => null);
       if (photos) {
         entries = joinArchive(entries, photos);
         lastPhotoKeys = Object.keys(photos).sort().join(',');
       }
       personalEntries = entries;
      databaseReady = true;
         } catch {
       databaseReady = false;
       // Restore the most recent fallback copy if IndexedDB is unavailable.
       entries = legacyEntries;
     }
     personalEntries = entries;
     try { navigator.storage?.persist?.(); } catch {}
     markArchiveReady();
   }

   function save() {
    if (demoMode) return;
    personalEntries = entries;
    scheduleSnapshotWrite();
    if (vaultSession) {
      /* Encrypt before anything touches the disk; the plaintext record is
         deleted in the same transaction. */
      window.CobbleCore.encryptVaultWithKey(entries, vaultSession.key, vaultSession.salt)
        .then(vault => saveVault(vault))
        .then(() => updateStorageInfo())
        .catch(() => toast('Could not write the locked archive. Your changes are in memory only.'));
      return;
    }
    const serialized = JSON.stringify(entries);
         if (databaseReady) {
       // Serialize writes so a slower earlier save can never overwrite a newer archive.
       /* the city is captured now, not when the queue drains: switching city
          while a save is pending used to write one city's moments into the
          other's record */
       const snapshot = entries;
       saveQueue = saveQueue.catch(() => {}).then(() => archiveReady).then(() => saveArchive(snapshot));
       saveQueue.then(() => {
         try { localStorage.removeItem(STORE); } catch {}
         scheduleStorageInfo();
       }).catch(() => {
         try {
           localStorage.setItem(STORE, serialized);
           toast('Archive storage is unavailable. A limited backup was saved; export your city soon.');
         } catch {
           toast('Could not save this moment. Export your city or remove a large photo to free space.');
         }
       });
    } else {
      try {
        localStorage.setItem(STORE, serialized);
        toast('Using limited browser storage. Your archive may need more room—export a backup.');
      } catch {
        toast('Could not save this moment. This browser has run out of storage.');
      }
    }
    updateStorageInfo();
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /* Fraction of the origin quota still free, or null when the browser will not
     say. Kept so the photo picker can refuse before a save fails. */
  let storageRoom = null;

  function updateStorageWarning() {
    const banner = $('#storage-warning');
    const text = $('#storage-warning-text');
    if (!banner || !text) return;
    if (storageRoom === null || storageRoom > 0.2) {
      banner.classList.add('hidden');
      return;
    }
    const percent = Math.round((1 - storageRoom) * 100);
    text.textContent = storageRoom <= 0.05
      ? `This browser is ${percent}% full for this site. New moments may not save. Export a backup now.`
      : `This browser is ${percent}% full for this site. Export a backup, or remove a few photos.`;
    banner.classList.remove('hidden');
  }

  /* `navigator.storage.estimate()` is slow — measured at about 1.8 s in one
     browser — so it must not sit on the save path. Throttled to at most once
     every few seconds, and never awaited by a save. */
  let storageInfoTimer = null;
  function scheduleStorageInfo(delay = 400) {
    clearTimeout(storageInfoTimer);
    storageInfoTimer = setTimeout(() => { updateStorageInfo(); }, delay);
  }

  async function updateStorageInfo() {
    const summary = $('#storage-summary');
    const note = $('#storage-note');
    if (!summary || demoMode) return;
    const bytes = new Blob([JSON.stringify(entries)]).size;
    summary.textContent = `${entries.length.toLocaleString()} moments · ${formatBytes(bytes)} of archive data`;
    if (!databaseReady) {
      note.textContent = 'This browser is using its smaller fallback storage. Export a backup regularly; adding photos may fill it sooner.';
      return;
    }
    try {
      const estimate = await navigator.storage?.estimate?.();
      const available = estimate?.quota ? Math.max(0, estimate.quota - (estimate.usage || 0)) : 0;
      storageRoom = estimate?.quota ? 1 - (estimate.usage || 0) / estimate.quota : null;
      note.textContent = available
        ? `Stored in this browser’s expanded archive. Space varies by device; about ${formatBytes(available)} remains available to this site. Export a backup now and then.`
        : 'Stored in this browser’s expanded archive. Text-only memories take little space; photo capacity depends on your device. Export a backup now and then.';
      updateStorageWarning();
    } catch {
      note.textContent = 'Stored in this browser’s expanded archive. Text-only memories take little space; photo capacity depends on your device. Export a backup now and then.';
    }
  }

  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 3000);
  }

  let zipLibraryPromise;
  function loadZipLibrary() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (!zipLibraryPromise) {
      zipLibraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'vendor/jszip.min.js';
        script.onload = () => window.JSZip ? resolve(window.JSZip) : reject(new Error('The ZIP tool did not load.'));
        script.onerror = () => reject(new Error('Could not load the ZIP tool. Check your internet connection and try again.'));
        document.head.appendChild(script);
      });
    }
    return zipLibraryPromise;
  }

  async function downloadAppPackage(button) {
    const buttons = $$('.download-package');
    buttons.forEach(item => {
      item.disabled = true;
      item.textContent = 'Preparing package…';
    });
    try {
      const JSZip = await loadZipLibrary();
      const files = ['index.html', 'theme.css', 'styles.css', 'app.js'];
      const zip = new JSZip();
      const results = await Promise.all(files.map(async name => {
        const response = await fetch(name, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Could not include ${name} in the package.`);
        let content = await response.text();
        if (name === 'index.html') {
          content = content
            .replaceAll('href="/theme.css"', 'href="theme.css"')
            .replaceAll('href="/styles.css"', 'href="styles.css"')
            .replaceAll('src="/app.js"', 'src="app.js"');
        }
        return [name, content];
      }));
      results.forEach(([name, content]) => zip.file(name, content));
      zip.file('README.txt', [
        'COBBLE — COMPLETE APP PACKAGE',
        '',
        'This package contains the complete static app source: HTML, styles, archive logic, and optional 3D city renderer.',
        '',
        'To run it, place these files in a folder and serve that folder from a local web server (for example: python -m http.server 8000), then open http://localhost:8000.',
        'Opening index.html directly as a file may prevent browser storage and encrypted sharing from working correctly.',
        '',
        'The app source package does not include your personal moments or photos. Use Share city inside the app to export those separately in an encrypted city file.',
        'Everything this app needs is in this folder. Nothing is fetched from a CDN.'
      ].join('\n'));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cobble-complete-app.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast('Complete app package downloaded. Your private memories are not included.');
    } catch (error) {
      toast(error.message || 'Could not create the app package.');
    } finally {
      buttons.forEach(item => {
        item.disabled = false;
        item.textContent = '↓ Download app package';
      });
    }
  }

  function groupDays(list = entries) {
    return list.reduce((days, entry) => ((days[entry.date] ||= []).push(entry), days), {});
  }

  function toggleCityHud() {
    const hidden = document.body.classList.toggle('city-immersive');
    const button = $('#hud-toggle');
    button.setAttribute('aria-pressed', String(hidden));
    button.setAttribute('aria-label', `${hidden ? 'Show' : 'Hide'} controls`);
    $('.hud-toggle-label', button).textContent = hidden ? 'Show controls' : 'Hide controls';
    $('.hud-toggle-icon', button).textContent = hidden ? '⤡' : '⤢';
  }

  function setView(name) {
    document.body.classList.remove('city-immersive');
    document.body.classList.toggle('city-view-active', name === 'city');
    $('#hud-toggle').setAttribute('aria-pressed', 'false');
    $('#hud-toggle').setAttribute('aria-label', 'Hide controls');
    $('.hud-toggle-label', $('#hud-toggle')).textContent = 'Hide controls';
    $('.hud-toggle-icon', $('#hud-toggle')).textContent = '⤢';
    $$('.view-section').forEach(view => view.classList.toggle('hidden', view.id !== `${name}-view`));
    $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === name));
    $('#header-section').textContent = name === 'city' ? 'My city' : name === 'timeline' ? 'Timeline' : 'Discoveries';
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function openDay(date) {
    const dayEntries = (groupDays()[date] || []).slice().sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    $('#drawer-content').innerHTML = `<p class="eyebrow">A day in your city</p><h2 class="drawer-title">${escapeHTML(formatDate(date))}</h2><p class="drawer-lede">${dayEntries.length} little ${dayEntries.length === 1 ? 'piece' : 'pieces'} of your story.</p><div class="storyboard">${dayEntries.map((entry, index) => {
      const category = categories[entry.category] || categories.everyday;
      return `<article class="story-card" style="--story-color:${category.color}"><div class="story-meta"><span class="story-icon">${category.icon}</span><span>${escapeHTML(category.label)}</span><span class="story-order">${String(index + 1).padStart(2, '0')}</span></div>${entry.photo ? `<img class="story-photo" src="${entry.photo}" alt="Photo saved with this moment">` : ''}<p>${highlight(entry.text)}</p><div class="story-foot">${'★'.repeat(Math.max(1, Math.min(3, Number(entry.importance) || 1)))}<span>${entry.repeatCount > 1 ? ` · noticed ${entry.repeatCount} times` : ' · a moment kept'}</span><span class="story-actions"><button type="button" class="story-action" data-edit-entry="${escapeHTML(String(entry.id))}">Edit</button><button type="button" class="story-action story-action-quiet" data-delete-entry="${escapeHTML(String(entry.id))}">Delete</button></span></div></article>`;
    }).join('')}</div>`;
    $$('[data-edit-entry]', $('#drawer-content')).forEach(button => button.addEventListener('click', () => {
      const entry = entries.find(item => String(item.id) === button.dataset.editEntry);
      if (entry) openEntry(entry);
    }));
    $$('[data-delete-entry]', $('#drawer-content')).forEach(button => button.addEventListener('click', () => deleteEntry(button.dataset.deleteEntry)));
    $('#day-backdrop').classList.remove('hidden');
  }

  let searchQuery = '';
  const activeCategories = new Set();
  let landmarksOnly = false;
  let withPhotoOnly = false;

  const filtersActive = () => activeCategories.size > 0 || landmarksOnly || withPhotoOnly;

  const matchesFilters = entry => {
    if (activeCategories.size && !activeCategories.has(entry.category)) return false;
    if (landmarksOnly && Number(entry.importance) < 3) return false;
    if (withPhotoOnly && !entry.photo) return false;
    return true;
  };

  const describeFilters = () => {
    const parts = [];
    if (activeCategories.size) {
      parts.push([...activeCategories].map(key => categories[key]?.short || key).join(' or '));
    }
    if (landmarksOnly) parts.push('landmarks');
    if (withPhotoOnly) parts.push('with a photo');
    return parts.join(' · ');
  };

  /* Fold case and accents so "cafe" finds "café", and a plain substring is
     enough — this archive is measured in thousands of moments, not millions. */
  const fold = value => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const matchesQuery = entry => {
    const needle = fold(searchQuery).trim();
    if (!needle) return true;
    return fold(entry.text).includes(needle) ||
      fold(categories[entry.category]?.label || '').includes(needle) ||
      fold(entry.date).includes(needle);
  };

  const highlight = text => {
    const needle = searchQuery.trim();
    if (!needle) return escapeHTML(text);
    const haystack = String(text);
    const at = fold(haystack).indexOf(fold(needle));
    if (at < 0) return escapeHTML(haystack);
    return `${escapeHTML(haystack.slice(0, at))}<mark>${escapeHTML(haystack.slice(at, at + needle.length))}</mark>${escapeHTML(haystack.slice(at + needle.length))}`;
  };

  function renderTimeline() {
    const allDays = groupDays();
    const narrowing = searchQuery.trim() || filtersActive();
    const days = narrowing
      ? groupDays(entries.filter(entry => matchesQuery(entry) && matchesFilters(entry)))
      : allDays;
    const dates = Object.keys(days).sort((a, b) => b.localeCompare(a));
    const cards = (date, items, full = false) => `<button class="${full ? 'full-day' : 'mini-day'}" data-date="${date}"><span class="${full ? 'full-date' : 'mini-date'}">${escapeHTML(formatDate(date, full ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' }))}<small>${items.length} ${items.length === 1 ? 'moment' : 'moments'}</small></span><span class="${full ? 'full-day-entries' : 'mini-day-entries'}">${items.slice(0, full ? 4 : 2).map(entry => `<span class="entry-card"><i class="entry-swatch ${Number(entry.importance) >= 3 ? 'important' : ''}" style="background:${(categories[entry.category] || categories.everyday).color}"></i>${entry.photo ? `<img class="entry-thumb" src="${entry.photo}" alt="">` : ''}<span class="entry-card-text">${highlight(entry.text)}</span></span>`).join('')}${items.length > (full ? 4 : 2) ? `<span class="more-moments">+ ${items.length - (full ? 4 : 2)} more moments</span>` : ''}</span><span class="day-arrow">↗</span></button>`;
    $('#timeline-content').innerHTML = dates.length ? dates.slice(0, 3).map(date => cards(date, days[date])).join('') : `<div class="empty-state"><span class="empty-symbol">☼</span><strong>Your story starts with a small thing.</strong><p>Save one detail from today. Your city will grow around it.</p><button class="text-button" data-open-entry>Save your first moment →</button><p class="empty-hint">Your city lives in this browser only. Moving to another machine, or clearing site data? Use <b>Share city → Export readable backup</b> first.</p></div>`;
    const shownDates = narrowing
      ? dates.slice(0, narrowedDays)
      : dates.slice(0, visibleTimelineDays);
    $('#full-timeline-content').innerHTML = dates.length ? `${shownDates.map(date => cards(date, days[date], true)).join('')}${dates.length > shownDates.length ? `<button class="timeline-load-more" type="button" data-load-older>Show ${Math.min(50, dates.length - shownDates.length)} older days <span>↓</span></button>` : ''}` : narrowing
      ? `<div class="no-search-results"><strong>Nothing matches ${searchQuery.trim() ? `“${escapeHTML(searchQuery.trim())}”` : 'those filters'}.</strong>${searchQuery.trim() ? 'Try a shorter word — the search looks at what you wrote, the district and the date.' : 'Clear a filter to see more.'}</div>`
      : `<div class="empty-full"><strong>No days in the archive yet.</strong>One tiny detail is all it takes to begin.</div>`;
    const status = $('#timeline-search-status');
    if (status) {
      const found = dates.reduce((sum, date) => sum + days[date].length, 0);
      const bits = [];
      if (searchQuery.trim()) bits.push(`matching “${searchQuery.trim()}”`);
      if (filtersActive()) bits.push(describeFilters());
      status.textContent = narrowing
        ? `${found.toLocaleString()} ${found === 1 ? 'moment' : 'moments'} in ${dates.length.toLocaleString()} ${dates.length === 1 ? 'day' : 'days'}${dates.length > shownDates.length ? ` (showing ${shownDates.length})` : ''}${bits.length ? ` — ${bits.join(' · ')}` : ''}`
        : '';
    }
    $('#timeline-query-clear')?.classList.toggle('hidden', !searchQuery.trim());
    $('#filter-reset')?.classList.toggle('hidden', !filtersActive());
    $('#timeline-total').textContent = narrowing
      ? `${dates.reduce((sum, date) => sum + days[date].length, 0).toLocaleString()} found`
      : `${entries.length.toLocaleString()} ${entries.length === 1 ? 'moment' : 'moments'} · ${dates.length.toLocaleString()} days`;
    $$('[data-load-older]').forEach(button => button.addEventListener('click', () => {
      if (narrowing) narrowedDays += 60;
      else visibleTimelineDays += 50;
      renderTimeline();
    }));
    $$('[data-date]').forEach(button => button.addEventListener('click', () => openDay(button.dataset.date)));
    $$('[data-open-entry]').forEach(button => button.addEventListener('click', openEntry));
  }

    function renderCity() {
    const total = entries.length;
    const counts = Object.fromEntries(Object.keys(categories).map(key => [key, 0]));
    let repeated = 0;
    let meaningful = 0;
    for (const entry of entries) {
      if (counts[entry.category] !== undefined) counts[entry.category]++;
      if (Number(entry.repeatCount) > 1) repeated++;
      if (Number(entry.importance) >= 3) meaningful++;
    }
    const level = total < 3 ? 'A new little town' : total < 10 ? 'A village with stories' : total < 25 ? 'A town finding its rhythm' : total < 60 ? 'A city coming alive' : 'A city full of wonder';
    $('#city-level').textContent = level;
    $('#city-count').textContent = `${total.toLocaleString()} ${total === 1 ? 'moment' : 'moments'} collected`;
    $('#city-title').innerHTML = `A place called <span>${total ? 'you' : 'today'}</span>`;
    $('#city-mood').textContent = total ? (repeated ? 'Familiar streets are forming' : 'A world in the making') : 'Quiet beginnings';
    applyAtmosphere();
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).find(([, count]) => count > 0);
    $('#insight-content').innerHTML = total ? `<div class="insight-quote">“${top ? `Your ${categories[top[0]].label.toLowerCase()} district is becoming a favorite place to wander.` : 'Your city is just starting to learn your contours.'}”</div><p>${meaningful ? `${meaningful} moments have become landmarks because you marked them as meaningful.` : 'Keep noticing what feels worth keeping. Patterns emerge gently, over time.'}</p><button class="text-button" data-view-link="insights">See what else is taking shape <span>→</span></button>` : `<div class="insight-quote">A city grows one remembered detail at a time.</div><p>As you collect moments, this space will notice the little patterns that make your days yours.</p>`;
    renderCityScenes(counts, total);
    const pan = $('#city-pan');
    if (!pan.dataset.panReady) {
      pan.dataset.panReady = 'true';
      pan.addEventListener('click', event => {
        const building = event.target.closest('.city-building');
        if (building) {
          setView('timeline');
          toast(`${categories[building.dataset.district]?.label || 'This'} district lives across your timeline.`);
        } else if (event.target.closest('.theatre-building')) openGallery();
        else if (event.target.closest('.city-person')) toast('Little lives, crossing paths in your city.');
      });
      pan.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          if (event.target.closest('.theatre-building')) { event.preventDefault(); openGallery(); }
        }
        if (event.target === pan && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
          pan.dispatchEvent(new CustomEvent('city-pan-key', { detail: event.key }));
        }
      });
    }
  }

  function renderCityScenes(counts, total) {
    const pan = $('#city-pan');
    const active = Object.entries(counts).filter(([, count]) => count).sort((a, b) => b[1] - a[1]);
    const palette = ['#758e87', '#8a9c86', '#bf9878', '#7d8799', '#a88791', '#b0a174'];
    const architectures = ['building-house', 'building-office', 'building-shop', 'building-tower', 'building-stepped', 'building-home'];
    const landscapes = [
      '<div class="park park-left"><i class="tree tree-one"></i><i class="tree tree-two"></i><span class="park-path"></span></div>',
      '<div class="district-water"><i></i><i></i><i></i></div><div class="park park-right"><i class="tree tree-one"></i><i class="tree tree-three"></i></div>',
      '<div class="district-plaza"><i></i><i></i><i></i></div><div class="park park-left"><i class="tree tree-two"></i><i class="tree tree-three"></i></div>',
      '<div class="park park-right"><i class="tree tree-one"></i><i class="tree tree-two"></i><span class="park-path"></span></div>',
      '<div class="district-plaza"><i></i><i></i><i></i></div><div class="district-water"><i></i><i></i><i></i></div>'
    ];
    const scenes = Array.from({ length: 5 }, (_, slot) => {
      const districtIndex = cityCenterIndex + slot - 2;
      const landscapeIndex = (districtIndex % landscapes.length + landscapes.length) % landscapes.length;
      let seed = (Math.abs(districtIndex * 2654435761) + total * 101 + active.reduce((sum, [, count]) => sum + count, 0) * 37) >>> 0;
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      const sceneCount = total ? 2 + Math.floor(random() * 3) : 0;
      const buildings = Array.from({ length: sceneCount }, (_, index) => {
        const pair = active.length ? active[Math.floor(random() * active.length)] : ['everyday', 1];
        const [key, count] = pair;
        const height = 62 + Math.floor(random() * 90);
        const width = 31 + Math.floor(random() * 20);
        const architecture = architectures[Math.floor(random() * architectures.length)];
        const shade = palette[(Math.floor(random() * palette.length) + Object.keys(categories).indexOf(key)) % palette.length];
        const windows = Math.min(12, Math.max(4, Math.floor(count / 2) + 4));
        return `<button class="city-building ${architecture} ${random() > .72 ? 'roof-point' : ''}" style="--building-height:${height}px;--building-width:${width}px;--building-color:${shade};--delay:${index * 90}ms" data-district="${key}" aria-label="${escapeHTML(categories[key].label)} district, ${count} moments"><span class="building-roof"></span><span class="building-windows">${'<i></i>'.repeat(windows)}</span><span class="building-door"></span><span class="building-side" aria-hidden="true"></span>${count > 2 ? '<span class="building-crown" aria-hidden="true">✦</span>' : ''}</button>`;
      }).join('');
      const gallery = total && districtIndex % 9 === 3 ? '<div class="theatre-building" role="button" tabindex="0" aria-label="Open your photo gallery"><span class="theatre-awning"><i></i><i></i><i></i><i></i><i></i></span><span class="theatre-door"></span></div>' : '';
      const animal = landscapeIndex % 2 ? '<span class="city-animal animal-bird" aria-hidden="true">✦</span>' : '<span class="city-animal animal-cat" aria-hidden="true">♡</span>';
      const district = total
        ? `<div class="city-hill hill-back"></div><div class="city-hill hill-front"></div>${landscapes[landscapeIndex]}<div class="city-road"><span class="road-line"></span><span class="city-car car-one"></span><span class="city-car car-two"></span></div>${buildings}${gallery}<span class="city-person person-${landscapeIndex + 1}"><i></i></span>${animal}<span class="streetlamp lamp-${['one', 'two', 'three'][landscapeIndex % 3]}"><i></i></span><div class="city-lights"></div>`
        : `<div class="empty-city-hill hill-back"></div><div class="empty-city-hill hill-front"></div><div class="seed-house"><span></span><i></i><i></i><i></i></div><div class="city-road"><span class="road-line"></span></div><span class="city-animal animal-bird" aria-hidden="true">✦</span>`;
      return `<div class="city-scene district-scene-${landscapeIndex % 3}" role="group" aria-label="District ${districtIndex + 1}">${district}</div>`;
    });
    pan.innerHTML = scenes.join('');
    window.dispatchEvent(new CustomEvent('cobble-data', { detail: { counts, total, centerIndex: cityCenterIndex } }));
  }

  function startCityMotion() {
    const viewport = $('#city-viewport');
    const pan = $('#city-pan');
    let offset = 0;
    let pointerStart = null;
    let lastFrame = 0;
    let pausedUntil = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const renderPosition = () => {
      const tileWidth = viewport.clientWidth || window.innerWidth;
      pan.style.transform = `translate3d(${-2 * tileWidth + offset}px,0,0)`;
      window.cobbleCity3D?.setPan(cityCenterIndex, offset, tileWidth);
    };
    const normalize = () => {
      const tileWidth = viewport.clientWidth || window.innerWidth;
      while (offset >= tileWidth) { offset -= tileWidth; cityCenterIndex--; renderCityScenes(Object.fromEntries(Object.keys(categories).map(key => [key, entries.filter(entry => entry.category === key).length])), entries.length); }
      while (offset <= -tileWidth) { offset += tileWidth; cityCenterIndex++; renderCityScenes(Object.fromEntries(Object.keys(categories).map(key => [key, entries.filter(entry => entry.category === key).length])), entries.length); }
      renderPosition();
    };
    pan.addEventListener('city-pan-key', event => {
      offset += event.detail === 'ArrowRight' ? -viewport.clientWidth * .65 : viewport.clientWidth * .65;
      normalize();
      pausedUntil = performance.now() + 5000;
    });
    viewport.addEventListener('pointerdown', event => {
      if (event.target.closest('button, a, input, .city-control-deck, .hud-toggle, .topbar')) return;
      pointerStart = { id: event.pointerId, x: event.clientX, offset };
      viewport.setPointerCapture(event.pointerId);
      pausedUntil = performance.now() + 5000;
      viewport.classList.add('is-panning');
    });
    viewport.addEventListener('pointermove', event => {
      if (!pointerStart || pointerStart.id !== event.pointerId) return;
      offset = pointerStart.offset + event.clientX - pointerStart.x;
      normalize();
    });
    const finishPan = event => {
      if (!pointerStart || (event.pointerId && pointerStart.id !== event.pointerId)) return;
      pointerStart = null;
      viewport.classList.remove('is-panning');
      pausedUntil = performance.now() + 4000;
    };
    viewport.addEventListener('pointerup', finishPan);
    viewport.addEventListener('pointercancel', finishPan);
    viewport.addEventListener('wheel', event => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      offset -= delta;
      normalize();
      pausedUntil = performance.now() + 3500;
      event.preventDefault();
    }, { passive: false });
    window.addEventListener('resize', renderPosition);
    const animate = time => {
      if (lastFrame && !pointerStart && !reducedMotion.matches && !document.hidden && time > pausedUntil) {
        offset -= Math.min(40, time - lastFrame) * .009;
        normalize();
      }
      lastFrame = time;
      requestAnimationFrame(animate);
    };
    renderPosition();
    requestAnimationFrame(animate);
  }

  function openGallery() {
    const photos = entries.filter(entry => entry.photo);
    $('#drawer-content').innerHTML = `<p class="eyebrow">Your little theatre of memories</p><h2 class="drawer-title">The photo gallery.</h2><p class="drawer-lede">${photos.length ? `${photos.length} little windows into your days.` : 'The theatre is ready for its first picture.'}</p>${photos.length ? `<div class="gallery-grid">${photos.map(entry => `<button class="gallery-tile" data-gallery-date="${escapeHTML(entry.date)}"><img src="${entry.photo}" alt="${escapeHTML(entry.text)}"><span>${escapeHTML(entry.text)}</span><small>${escapeHTML(formatDate(entry.date, { month: 'short', day: 'numeric', year: 'numeric' }))}</small></button>`).join('')}</div>` : `<div class="gallery-empty"><span>✦</span><strong>A stage for the things you want to keep.</strong><p>Add a photo to any moment and it will appear here.</p><button class="add-button" id="gallery-add">+ Add a moment</button></div>`}`;
    $('#day-backdrop').classList.remove('hidden');
    $$('[data-gallery-date]').forEach(tile => tile.addEventListener('click', () => openDay(tile.dataset.galleryDate)));
    const addButton = $('#gallery-add');
    if (addButton) addButton.addEventListener('click', openEntry);
  }

  function renderAchievements(total, activeDays, categoryVariety) {
    const milestones = [
      { icon: '✦', title: 'First light', detail: 'Save your first moment', goal: 1, value: total, unit: 'moment' },
      { icon: '⌂', title: 'A little neighborhood', detail: 'Collect 5 moments', goal: 5, value: total, unit: 'moments' },
      { icon: '🏙', title: 'City taking shape', detail: 'Collect 25 moments', goal: 25, value: total, unit: 'moments' },
      { icon: '◷', title: 'Days remembered', detail: 'Save moments on 7 different days', goal: 7, value: activeDays, unit: 'days' },
      { icon: '✿', title: 'Many sides of you', detail: 'Explore 4 kinds of moments', goal: 4, value: categoryVariety, unit: 'kinds' },
      { icon: '★', title: 'A landmark moment', detail: 'Mark something as very meaningful', goal: 1, value: entries.filter(entry => Number(entry.importance) >= 3).length, unit: 'landmark' }
    ];
    const earned = milestones.filter(item => item.value >= item.goal).length;
    $('#achievement-count').textContent = `${earned} of ${milestones.length} earned`;
    $('#achievement-grid').innerHTML = milestones.map(item => {
      const unlocked = item.value >= item.goal;
      const progress = Math.min(100, Math.round(item.value / item.goal * 100));
      return `<article class="achievement-card ${unlocked ? 'is-earned' : ''}"><span class="achievement-icon" aria-hidden="true">${item.icon}</span><div class="achievement-copy"><strong>${item.title}</strong><span>${unlocked ? 'Milestone reached' : item.detail}</span>${unlocked ? '' : `<div class="achievement-progress"><i style="width:${progress}%"></i></div>`}</div><span class="achievement-status" aria-label="${unlocked ? 'Earned' : `${item.value} of ${item.goal} ${item.unit}`} ">${unlocked ? '✓' : `${item.value}/${item.goal}`}</span></article>`;
    }).join('');
  }

  /* The same calendar date in earlier years — the one thing a list cannot do
     and a city can: put you back in the same day of a different year. */
  function renderOnThisDay() {
    const panel = $('#onthisday-panel');
    const list = $('#onthisday-list');
    const count = $('#onthisday-count');
    if (!panel || !list) return;

    const today = localDate();
    const monthDay = today.slice(5);
    const matches = entries
      .filter(entry => entry.date !== today && entry.date.slice(5) === monthDay)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);

    if (!matches.length) {
      panel.classList.add('hidden');
      list.innerHTML = '';
      if (count) count.textContent = '';
      return;
    }

    panel.classList.remove('hidden');
    if (count) {
      count.textContent = `${matches.length} ${matches.length === 1 ? 'memory' : 'memories'}`;
    }
    list.innerHTML = matches.map(entry => {
      const category = categories[entry.category] || categories.everyday;
      const years = new Date(`${entry.date}T12:00:00`).getFullYear();
      const thisYear = new Date(`${today}T12:00:00`).getFullYear();
      const ago = thisYear - years;
      return `<button type="button" class="onthisday-item" data-onthisday="${escapeHTML(entry.date)}">
        <span class="onthisday-years">${ago === 1 ? '1 yr' : `${ago} yrs`}</span>
        <span class="onthisday-text"><span class="onthisday-dot" style="background:${category.color}"></span>${escapeHTML(entry.text)}</span>
      </button>`;
    }).join('');

    $$('[data-onthisday]', list).forEach(button => button.addEventListener('click', () => {
      setView('timeline');
      openDay(button.dataset.onthisday);
    }));
  }

  /* A square per day for the last twelve months. Weeks run down the columns,
     so the shape of a year is readable without a single number. */
  function renderHeatmap() {
    const panel = $('#heatmap-panel');
    const grid = $('#heatmap-grid');
    const months = $('#heatmap-months');
    if (!panel || !grid) return;

    const days = groupDays();
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay()); // back to Sunday

    const cells = [];
    const labels = [];
    let week = 0;
    let lastMonth = -1;
    let lastLabelWeek = -99;
    for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const iso = localDate(d);
      const count = (days[iso] || []).length;
      const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3;
      const weekday = d.getDay();
      if (weekday === 0) week += 1;
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        /* A label needs about four columns of room; skip the ones that would collide. */
        if (week - lastLabelWeek >= 4) {
          labels.push({ week, text: d.toLocaleDateString(undefined, { month: 'short' }) });
          lastLabelWeek = week;
        }
      }
      const label = `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} — ${count} ${count === 1 ? 'moment' : 'moments'}`;
      cells.push(count
        ? `<button type="button" class="heatmap-cell" data-level="${level}" data-heat-date="${iso}" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}"></button>`
        : `<span class="heatmap-cell" data-level="0" aria-hidden="true" title="${escapeHTML(label)}"></span>`);
    }

    grid.innerHTML = cells.join('');
    if (months) {
      const columns = week + 1;
      const track = new Array(columns).fill('');
      for (const { week: w, text } of labels) {
        if (w < columns && !track[w]) track[w] = text;
      }
      months.innerHTML = track.map(text => `<span>${escapeHTML(text)}</span>`).join('');
      months.style.gridTemplateColumns = `repeat(${columns}, 11px)`;
    }
    panel.classList.toggle('hidden', entries.length === 0);
    $$('[data-heat-date]', grid).forEach(button => button.addEventListener('click', () => {
      setView('timeline');
      openDay(button.dataset.heatDate);
    }));
  }

  function renderInsights() {
    const total = entries.length;
    const activeDays = Object.keys(groupDays()).length;
    const categoryCounts = Object.entries(categories).map(([key, info]) => ({
      key,
      info,
      count: entries.filter(entry => entry.category === key).length
    })).sort((a, b) => b.count - a.count);
    const favorite = categoryCounts[0];
    const cards = [
      ['✧', total, word('stat.moments', 'moments kept'), word('stat.moments.note', 'Every detail adds a little light.')],
      ['◷', activeDays, word('stat.days', 'days remembered'), word('stat.days.note', 'Different days, gathered together.')],
      ['✦', entries.filter(entry => Number(entry.importance) >= 3).length, word('stat.landmarks', 'personal landmarks'), word('stat.landmarks.note', 'The things you said matter.')],
      ['↻', entries.filter(entry => Number(entry.repeatCount) > 1).length, word('stat.themes', 'returning themes'), word('stat.themes.note', 'Familiar things finding their way back.')]
    ];
    $('#stats-grid').innerHTML = cards.map(([icon, value, label, note]) => `<article class="stat-card"><span class="stat-icon">${icon}</span><strong class="stat-value">${value}</strong><span class="stat-label">${label}</span><small>${note}</small></article>`).join('');
    renderAchievements(total, activeDays, categoryCounts.filter(item => item.count > 0).length);
    const discoveries = [];
    if (total && favorite?.count) discoveries.push(`<article class="discovery-item"><span class="discovery-icon">${favorite.info.icon}</span><div><strong>${escapeHTML(say('obs.busiest.title', { label: districtName(favorite.key) }))}</strong><p>${escapeHTML(say('obs.busiest.body', { count: favorite.count, total }))}</p></div></article>`);
    const days = groupDays();
    const busiest = Object.entries(days).sort((a, b) => b[1].length - a[1].length)[0];
    if (busiest && busiest[1].length > 1) discoveries.push(`<article class="discovery-item"><span class="discovery-icon">☼</span><div><strong>${escapeHTML(say('obs.day.title', { date: formatDate(busiest[0], { month: 'long', day: 'numeric' }) }))}</strong><p>${escapeHTML(say('obs.day.body', { count: busiest[1].length }))}</p></div></article>`);
    if (total >= 3) {
      const longest = entries.slice().sort((a, b) => (a.text || '').length - (b.text || '').length)[0];
      discoveries.push(`<article class="discovery-item"><span class="discovery-icon">⌁</span><div><strong>${escapeHTML(say('obs.short.title'))}</strong><p>${escapeHTML(say('obs.short.body', { count: longest.text.trim().split(/\s+/).length }))}</p></div></article>`);
    }
    $('#discovery-list').innerHTML = discoveries.length ? discoveries.join('') : `<div class="no-insights"><strong>Your city is still learning your shape.</strong>Add a few more moments, and gentle observations will begin to appear here. No predictions—just patterns from your own words and choices.</div>`;
    $('#category-bars').innerHTML = categoryCounts.map(({
      info,
      count
    }) => `<div class="category-row"><div><span>${info.icon} &nbsp;${info.label}</span><small>${count}</small></div><div class="bar-track"><i style="width:${total ? Math.max(count ? 5 : 0, count / total * 100) : 0}%;background:${info.color}"></i></div></div>`).join('');
  }

  function render() {
    renderCity();
    renderTimeline();
    renderOnThisDay();
    renderHeatmap();
    renderDistrictPlan();
    renderInsights();
  }

  let editingId = null;
  /* One slot, one action. Delete, edit and import all park a way back here. */
  let undoAction = null;

  function openEntry(entry = null) {
    if (demoMode) exitDemo();
    editingId = entry ? String(entry.id) : null;
    const form = $('#entry-form');
    form.reset();
    photoData = '';
    $('#photo-preview').classList.add('hidden');
    $('#photo-label').textContent = 'Add a photo, if you like';
    if (entry) {
      $('#entry-text').value = entry.text || '';
      $('#entry-date').value = entry.date || localDate();
      $('#entry-category').value = entry.category || 'everyday';
      const weight = String(Math.max(1, Math.min(3, Number(entry.importance) || 1)));
      const radio = form.querySelector(`input[name="importance"][value="${weight}"]`);
      if (radio) radio.checked = true;
      if (entry.photo) {
        photoData = entry.photo;
        $('#photo-preview').innerHTML = `<img src="${entry.photo}" alt="Photo preview">`;
        $('#photo-preview').classList.remove('hidden');
        $('#photo-label').textContent = 'Photo kept with this moment';
      }
      $('#modal-title').innerHTML = 'Change a <em>moment.</em>';
      $('.save-button', form).innerHTML = 'Save changes <span>→</span>';
    } else {
      $('#entry-date').value = localDate();
      $('#modal-title').innerHTML = 'Save a <em>moment.</em>';
      $('.save-button', form).innerHTML = 'Save to my city <span>→</span>';
    }
    $('#entry-modal').classList.remove('hidden');
    setTimeout(() => $('#entry-text').focus(), 50);
  }

  function offerUndo(message, action) {
    undoAction = action;
    const text = $('#undo-text');
    if (text) text.textContent = message;
    showUndo();
  }

  function runUndo() {
    if (!undoAction) return;
    const action = undoAction;
    undoAction = null;
    action();
    hideUndo();
  }

  function deleteEntry(id) {
    const index = entries.findIndex(entry => String(entry.id) === String(id));
    if (index < 0) return;
    const removed = entries[index];
    entries.splice(index, 1);
    save();
    render();
    $('#day-backdrop').classList.add('hidden');
    toast('Moment removed. Press Ctrl+Z, or Undo, to put it back.');
    offerUndo('Moment removed.', () => {
      entries.splice(Math.min(index, entries.length), 0, removed);
      save();
      render();
      toast('Moment restored.');
    });
  }

  /* ── the year, on one page ──────────────────────────────────────── */
  function yearWindow() {
    const end = new Date(); end.setHours(12, 0, 0, 0);
    const start = new Date(end); start.setDate(start.getDate() - 364);
    return { start: localDate(start), end: localDate(end) };
  }

  function openReview() {
    const body = $('#review-body');
    if (!body) return;
    const { start, end } = yearWindow();
    const inYear = entries.filter(entry => entry.date >= start && entry.date <= end);
    const days = groupDays(inYear);
    const dayKeys = Object.keys(days);
    const counts = Object.fromEntries(Object.keys(categories).map(key => [key, 0]));
    for (const entry of inYear) if (counts[entry.category] !== undefined) counts[entry.category] += 1;
    const districts = Object.entries(counts).sort((a, b) => b[1] - a[1]).filter(([, n]) => n);

    if (!inYear.length) {
      body.innerHTML = `<p class="drawer-lede">Nothing in the last twelve months yet. Save a moment and come back — this page is built from what you keep.</p>`;
      $('#review-modal').classList.remove('hidden');
      return;
    }

    const busiestDay = dayKeys.sort((a, b) => days[b].length - days[a].length)[0];
    const months = new Array(12).fill(0);
    for (const key of dayKeys) months[new Date(`${key}T12:00:00`).getMonth()] += days[key].length;
    const busiestMonth = months.indexOf(Math.max(...months));
    const monthName = new Date(2026, busiestMonth, 1).toLocaleDateString(undefined, { month: 'long' });

    /* the longest quiet stretch, which is a fact about a year, not a failure */
    const sorted = dayKeys.slice().sort();
    let gap = 0;
    for (let i = 1; i < sorted.length; i += 1) {
      const days_ = Math.round((new Date(`${sorted[i]}T12:00:00`) - new Date(`${sorted[i - 1]}T12:00:00`)) / 86400000);
      if (days_ > gap) gap = days_;
    }

    /* a run of consecutive days, which is a truer thing to say than "one of
       forty days held one moment" */
    let run = 1, bestRun = 1;
    for (let i = 1; i < sorted.length; i += 1) {
      const diff = Math.round((new Date(`${sorted[i]}T12:00:00`) - new Date(`${sorted[i - 1]}T12:00:00`)) / 86400000);
      run = diff === 1 ? run + 1 : 1;
      if (run > bestRun) bestRun = run;
    }

    const resurfaced = inYear
      .slice()
      .sort((a, b) => (Number(b.importance) - Number(a.importance)) || b.date.localeCompare(a.date))
      .slice(0, 3);

    body.innerHTML = `
      <p class="drawer-lede">${escapeHTML(formatDate(start, { month: 'long', day: 'numeric', year: 'numeric' }))} to ${escapeHTML(formatDate(end, { month: 'long', day: 'numeric', year: 'numeric' }))}.</p>
      <div class="review-figures">
        <div class="review-figure"><b>${inYear.length.toLocaleString()}</b><span>moments kept</span></div>
        <div class="review-figure"><b>${dayKeys.length.toLocaleString()}</b><span>days remembered</span></div>
        <div class="review-figure"><b>${districts.length}</b><span>districts visited</span></div>
        <div class="review-figure"><b>${months.filter(n => n).length}</b><span>months with a moment</span></div>
      </div>
      <ul class="review-lines">
        <li>${districts.length ? `${escapeHTML(categories[districts[0][0]].label)} was where your attention went most — ${districts[0][1]} of ${inYear.length} moments.` : 'No district stands out yet.'}</li>
        ${days[busiestDay].length > 1
          ? `<li>${escapeHTML(formatDate(busiestDay, { month: 'long', day: 'numeric' }))} held the most: ${days[busiestDay].length} moments.</li>`
          : `<li>Your longest run was ${bestRun} ${bestRun === 1 ? 'day' : 'days in a row'}.</li>`}
        <li>${escapeHTML(monthName)} was your fullest month, with ${months[busiestMonth]}.</li>
        <li>${gap > 1 ? `The longest quiet stretch was ${gap} days. Nothing broke; the city waited.` : 'You kept something on most of the days you looked.'}</li>
      </ul>
      <p class="card-kicker">WORTH LOOKING AT AGAIN</p>
      <div class="review-resurfaced">
        ${resurfaced.map(entry => `<article><small>${escapeHTML(formatDate(entry.date, { month: 'short', day: 'numeric' }))}</small>${escapeHTML(entry.text)}</article>`).join('')}
      </div>`;
    $('#review-modal').classList.remove('hidden');
    $('#close-review').focus();
  }

  function closeReview() {
    $('#review-modal')?.classList.add('hidden');
  }

  /* Switching language has to redraw the views whose sentences are built at
     render time — the dictionary alone only reaches the static chrome. */
  window.addEventListener('cobble-lang', () => { try { render(); } catch {} });

  /* The plan of the city: six tiles, one per district, each a way into the
     timeline. It is the same filter the 3D buildings and the chips use. */
  function renderDistrictPlan() {
    const grid = $('#plan-grid');
    if (!grid) return;
    const counts = Object.fromEntries(Object.keys(categories).map(key => [key, 0]));
    for (const entry of entries) if (counts[entry.category] !== undefined) counts[entry.category] += 1;
    const total = entries.length || 1;
    const order = Object.keys(categories).sort((a, b) => counts[b] - counts[a]);

    grid.innerHTML = order.map(key => {
      const info = categories[key];
      const n = counts[key];
      const share = Math.round((n / total) * 100);
      return `
        <button class="plan-tile" type="button" data-plan="${key}" aria-pressed="${activeCategories.has(key)}" style="--tile:${info.color}">
          <b>${n.toLocaleString()}</b>
          <span>${escapeHTML(districtName(key))} · ${share}%</span>
          <span class="plan-bar"><i style="width:${Math.max(2, share)}%"></i></span>
        </button>`;
    }).join('');

    $$('[data-plan]', grid).forEach(tile => tile.addEventListener('click', () => {
      const key = tile.dataset.plan;
      const on = activeCategories.has(key);
      activeCategories.clear();
      if (!on) activeCategories.add(key);
      landmarksOnly = false;
      withPhotoOnly = false;
      $$('[data-filter-category], [data-filter-weight], [data-filter-photo]')
        .forEach(button => button.setAttribute('aria-pressed', String(!on && button.dataset.filterCategory === key)));
      setView('timeline');
      renderTimeline();
    }));

    const foot = $('#plan-foot');
    if (foot) {
      const busiest = order[0];
      foot.textContent = entries.length
        ? say('plan.foot', {
            count: counts[busiest].toLocaleString(),
            total: entries.length.toLocaleString(),
            label: districtName(busiest).toLowerCase()
          })
        : 'Nothing in the plan yet — save a moment and the districts will fill in.';
    }
  }

  /* A building in the 3D city was clicked: open that district in the
     timeline, with the filter chip already pressed so the state matches. */
  window.addEventListener('cobble-building', event => {
    const district = event.detail?.district;
    if (!district || !categories[district]) return;
    activeCategories.clear();
    activeCategories.add(district);
    landmarksOnly = false;
    withPhotoOnly = false;
    $$('[data-filter-category], [data-filter-weight], [data-filter-photo]')
      .forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filterCategory === district)));
    setView('timeline');
    renderTimeline();
    toast(say('toast.district', { label: categories[district].label, count: event.detail.count }));
  });

  /* ── locking the archive ─────────────────────────────────────────── */
  function showLockScreen() {
    const modal = $('#lock-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    $('#lock-status').textContent = '';
    $('#lock-passphrase').value = '';
    setTimeout(() => $('#lock-passphrase').focus(), 60);
  }

  function hideLockScreen() {
    $('#lock-modal')?.classList.add('hidden');
  }

  async function lockCity() {
    if (demoMode) exitDemo();
    if (!entries.length) { toast('Nothing to lock yet.'); return; }
    const passphrase = prompt('Choose a passphrase of at least eight characters.\n\nThere is no recovery: if you forget it, the archive cannot be read again.');
    if (passphrase === null) return;
    if (passphrase.length < 8) { toast('Use at least eight characters.'); return; }
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await window.CobbleCore.deriveKey(passphrase, salt);
      const vault = await window.CobbleCore.encryptVaultWithKey(entries, key, salt);
      await saveVault(vault);
      vaultKey = 'set';
      vaultPassphrase = passphrase;
      vaultSession = { key, salt };
      const badge = $('#lock-badge');
      if (badge) badge.textContent = 'SEALED';
      toast('This city is sealed. Enter the passphrase next time you open it.');
    } catch (error) {
      toast(error.message || 'Could not lock the archive.');
    }
  }

  async function unlockCity() {
    const passphrase = $('#lock-passphrase').value;
    const status = $('#lock-status');
    if (!passphrase) { status.textContent = 'Enter the passphrase.'; return; }
    try {
      const vault = await readVault();
      const salt = new Uint8Array(vault.salt);
      const key = await window.CobbleCore.deriveKey(passphrase, salt);
      const decrypted = await window.CobbleCore.decryptVaultWithKey(vault, key);
      entries = decrypted;
      personalEntries = decrypted;
      vaultKey = 'set';
      vaultPassphrase = passphrase;
      vaultSession = { key, salt };
      hideLockScreen();
      render();
      updateStorageInfo();
      toast(say('toast.unlocked', { count: entries.length }));
    } catch (error) {
      status.textContent = error.message || 'That passphrase did not open this city.';
    }
  }

  async function forgetVault() {
    if (!confirm('Start a new city? The sealed archive will be deleted, and there is no way back.')) return;
    try {
      const db = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('archive', 'readwrite');
        transaction.objectStore('archive').delete('vault');
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      vaultKey = null;
      vaultPassphrase = null;
      entries = [];
      personalEntries = [];
      hideLockScreen();
      render();
      toast('A new city. The sealed archive is gone.');
    } catch {
      toast('Could not clear the sealed archive.');
    }
  }

  function showUndo() {
    const bar = $('#undo-bar');
    if (!bar) return;
    bar.classList.remove('hidden');
    clearTimeout(showUndo.timer);
    showUndo.timer = setTimeout(hideUndo, 20000);
  }

  function hideUndo() {
    $('#undo-bar')?.classList.add('hidden');
    clearTimeout(showUndo.timer);
  }

  function closeEntry() {
    $('#entry-modal').classList.add('hidden');
    editingId = null;
  }

  function openShare() {
    if (demoMode) exitDemo();
    $('#share-status').textContent = '';
    $('#share-pin').value = '';
    $('#share-list').innerHTML = entries.length ? `<label class="share-select-all"><input type="checkbox" id="share-all" checked> Share my whole city <span>${entries.length} moments</span></label><div class="share-entry-list">${entries.slice().sort((a, b) => b.date.localeCompare(a.date)).map(entry => `<label class="share-entry"><input type="checkbox" class="share-check" value="${escapeHTML(entry.id)}" checked><span><small>${escapeHTML(formatDate(entry.date, { month: 'short', day: 'numeric', year: 'numeric' }))} · ${(categories[entry.category] || categories.everyday).label}</small>${escapeHTML(entry.text.slice(0, 100))}</span></label>`).join('')}</div>` : `<div class="share-empty">Your city is waiting for its first memory.</div>`;
    const all = $('#share-all');
    if (all) all.addEventListener('change', () => $$('.share-check').forEach(check => check.checked = all.checked));
    $$('.share-check').forEach(check => check.addEventListener('change', () => {
      const checks = $$('.share-check');
      if (all) all.checked = checks.every(item => item.checked);
    }));
    $('#share-modal').classList.remove('hidden');
  }

  function closeShare() {
    $('#share-modal').classList.add('hidden');
  }

  function getSharePin() {
    const pin = $('#share-pin').value.trim();
    if (!/^\d{6,12}$/.test(pin)) {
      throw new Error('Choose a PIN with 6–12 digits.');
    }
    return pin;
  }
  /* The share format, key derivation and import validator live in core.js so
     the same code can be unit-tested outside a browser. */
  const core = globalThis.CobbleCore;
  async function exportCity() {
    const button = $('#export-city');
    try {
      const pin = getSharePin();
      const selected = $$('.share-check:checked').map(check => check.value);
      if (!selected.length) throw new Error('Choose at least one moment to share.');
      const bundle = await core.encryptEntries(
        entries.filter(entry => selected.includes(String(entry.id))),
        pin
      );
             const blob = new Blob([JSON.stringify(bundle)], {
         type: 'application/json'
       });
       const link = document.createElement('a');
       const objectUrl = URL.createObjectURL(blob);
       link.href = objectUrl;
       link.download = `cobble-${localDate()}.cobble`;
       link.click();
       setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      $('#share-status').textContent = `${selected.length} ${selected.length === 1 ? 'moment' : 'moments'} encrypted and downloaded. Share the file and PIN separately.`;
    } catch (error) {
      $('#share-status').textContent = error.message || 'Could not create your encrypted city file.';
    }
    button.blur();
  }
  /* A picture of the city, drawn on a canvas — no photos, no dates, just the
     skyline, the level and the count. 1200x630, the size a link preview wants. */
  async function savePostcard() {
    const W = 1200, H = 630;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const paper = ctx.createLinearGradient(0, 0, 0, H);
    paper.addColorStop(0, '#f6f4ef');
    paper.addColorStop(1, '#efece4');
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);

    const counts = Object.fromEntries(Object.keys(categories).map(key => [key, 0]));
    for (const entry of entries) if (counts[entry.category] !== undefined) counts[entry.category] += 1;
    const palette = ['#758e87', '#8a9c86', '#bf9878', '#7d8799', '#a88791', '#b0a174'];

    /* skyline: one bar per moment, capped, tallest for the busiest districts */
    const order = Object.entries(counts).sort((a, b) => b[1] - a[1]).filter(([, n]) => n);
    const bars = [];
    for (const [key, count] of order) {
      const shown = Math.min(count, 14);
      for (let i = 0; i < shown; i++) bars.push({ key, count });
    }
    const groundY = 470;
    const gap = 6;
    const barW = bars.length ? Math.min(46, (W - 240) / bars.length - gap) : 0;
    const totalW = bars.length * (barW + gap) - gap;
    let x = (W - totalW) / 2;
    const seedRand = (i => () => {
      i = (Math.imul(i, 1664525) + 1013904223) >>> 0;
      return i / 4294967296;
    })(20261119);
    ctx.fillStyle = 'rgba(71,125,112,.12)';
    ctx.fillRect(0, groundY, W, H - groundY);
    for (const bar of bars) {
      const height = 70 + seedRand() * 220;
      const colour = palette[Object.keys(categories).indexOf(bar.key) % palette.length];
      ctx.fillStyle = colour;
      const y = groundY - height;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, height, [4, 4, 0, 0]);
      ctx.fill();
      /* windows */
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      const cols = Math.max(2, Math.floor(barW / 12));
      const rows = Math.max(2, Math.floor(height / 22));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (seedRand() > 0.55) {
            ctx.fillRect(x + 6 + c * ((barW - 12) / cols), y + 10 + r * ((height - 18) / rows), 4, 6);
          }
        }
      }
      x += barW + gap;
    }
    ctx.strokeStyle = 'rgba(34,48,43,.25)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY + 1); ctx.lineTo(W, groundY + 1); ctx.stroke();

    /* wordmark and the numbers */
    const level = $('#city-level')?.textContent || 'A new little town';
    const days = Object.keys(groupDays()).length;
    ctx.fillStyle = '#22302b';
    ctx.font = '700 44px Manrope, sans-serif';
    ctx.fillText('cobble.', 72, 108);
    ctx.fillStyle = '#477d70';
    ctx.font = '600 30px Manrope, sans-serif';
    ctx.fillText(level, 72, 166);
    ctx.fillStyle = '#5f6d66';
    ctx.font = '400 22px "DM Sans", sans-serif';
    ctx.fillText(`${entries.length.toLocaleString()} ${entries.length === 1 ? 'moment' : 'moments'} · ${days.toLocaleString()} ${days === 1 ? 'day' : 'days'} · ${order.length} ${order.length === 1 ? 'district' : 'districts'}`, 72, 208);
    ctx.fillStyle = '#8d968f';
    ctx.font = '400 18px "IBM Plex Mono", monospace';
    ctx.fillText('your life, taking shape', 72, H - 56);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) { toast('The postcard could not be drawn in this browser.'); return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cobble-postcard-${localDate()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Postcard saved — 1200×630, your skyline, nothing personal.');
  }

  /* Another journal's export: Day One JSON, or markdown with a date above
     each entry. Nothing is sent anywhere — the file is read in the page. */
  async function importJournal(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = window.CobbleCore.parseForeignJournal(text, file.name);
      if (!parsed.moments.length) {
        toast('No dated entries found. This reads Day One JSON, or text with a YYYY-MM-DD line above each entry.');
        return;
      }
      const incoming = parsed.moments.map((row, index) => ({
        id: `foreign-${row.date}-${index}`,
        date: row.date,
        text: row.text.slice(0, 500),
        category: 'everyday',
        importance: 1,
        repeatCount: 1,
        photo: '',
        createdAt: `${row.date}T12:00:00.000Z`
      }));
      const { added, variants } = window.CobbleCore.mergeEntries(entries, incoming);
      if (!added.length) { toast('Nothing new — those entries are already here.'); return; }
      entries = [...entries, ...added];
      save();
      render();
      closeShare();
      const addedIds = new Set(added.map(entry => String(entry.id)));
      offerUndo(`${added.length} ${added.length === 1 ? 'entry' : 'entries'} imported.`, () => {
        entries = entries.filter(entry => !addedIds.has(String(entry.id)));
        save();
        render();
        toast('Import undone.');
      });
      const skipped = parsed.skipped ? `, ${parsed.skipped} skipped` : '';
      toast(`${added.length} ${added.length === 1 ? 'entry' : 'entries'} imported from ${file.name}${skipped}${variants ? `, ${variants} kept as a second version` : ''}.`);
    } catch (error) {
      toast(error.message || 'That file could not be read.');
    }
  }

  function exportJSON() {
    const payload = JSON.stringify({
      app: 'Cobble',
      format: 'cobble-plain',
      version: 1,
      exportedAt: new Date().toISOString(),
      note: 'This file is not encrypted. Anyone who opens it can read every moment in it.',
      entries
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cobble-backup-${localDate()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    $('#share-status').textContent = `${entries.length} ${entries.length === 1 ? 'moment' : 'moments'} saved as a readable JSON file. It is not encrypted — keep it somewhere you trust.`;
  }

  async function importCity(file) {
         try {
       if (!file) return;
       if (file.size > 50 * 1024 * 1024) throw new Error('This city file is larger than the 50 MB safety limit.');
       if (!crypto?.subtle) throw new Error('Secure decryption is not available in this browser.');
       const pin = getSharePin();
       const bundle = JSON.parse(await file.text());
       const shared = await core.decryptBundle(bundle, pin);
       /* The rule lives in core.js so it can be tested without a browser. */
       const { added: imported, variants: secondVersions } = core.mergeEntries(entries, shared);
      if (!imported.length) throw new Error('Nothing to merge. Every moment in that file is already here, word for word.');
      entries = [...entries, ...imported];
      save();
      render();
      closeShare();
      const addedIds = new Set(imported.map(entry => String(entry.id)));
      offerUndo(`${imported.length} ${imported.length === 1 ? 'moment' : 'moments'} imported.`, () => {
        entries = entries.filter(entry => !addedIds.has(String(entry.id)));
        save();
        render();
        toast('Import undone.');
      });
      toast(say('toast.merged', { count: imported.length, variants: secondVersions }));
    } catch (error) {
      $('#share-status').textContent = error.name === 'OperationError' ? 'That PIN did not unlock this city file. Try again.' : (error.message || 'Could not open this city file.');
    }
    $('#import-file').value = '';
  }

  function makeDemoCity() {
    const daysAgo = days => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return localDate(date);
    };
    const photo = id => ({
      'photo-1442512595331-e89e73853f31': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=82',
      'photo-1511988617509-a57c8a288659': 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=82',
      'photo-1470252649378-9c29740c9fa8': 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=82',
      'photo-1509440159596-0249088772ff': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=82',
      'photo-1490474418585-ba9bad8fd0ea': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=82',
      'photo-1470770841072-f978cf4d019e': 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=82',
      'photo-1414235077428-338989a2e8c0': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=82',
      'photo-1490750967868-88aa4486c946': 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=82',
      'photo-1511632765486-a01980e01a18': 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=82',
      'photo-1519608487953-e999c86e7455': 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=82',
      'photo-1517849845537-4d257902454a': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=82',
      'photo-1500530855697-b586d89ba3ee': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82'
    })[id] || '';
    const examples = [
      [0, 'joy', 'The first sip of coffee tasted like the whole morning had finally exhaled.', 2, 1, 'photo-1442512595331-e89e73853f31'],
      [1, 'people', 'Mara said, “You don’t have to make a home all at once.” I wrote it down on the train.', 3, 1, 'photo-1511988617509-a57c8a288659'],
      [2, 'nature', 'The rain stopped just long enough for the light to turn every pavement gold.', 2, 2, 'photo-1470252649378-9c29740c9fa8'],
      [3, 'ideas', 'Maybe a good life is mostly noticing when you are already inside one.', 3, 1, ''],
      [4, 'everyday', 'The corner bakery puts the warm loaves in the window at exactly 4:15.', 1, 3, 'photo-1509440159596-0249088772ff'],
      [5, 'people', 'A stranger held the door, then we both kept walking like tiny kindness was ordinary.', 2, 1, ''],
      [7, 'joy', 'Bought the peach that smelled most like summer. It was the right one.', 2, 2, 'photo-1490474418585-ba9bad8fd0ea'],
      [9, 'nature', 'A little green thing growing through a crack in the wall. Stubborn looks good on it.', 3, 1, 'photo-1470770841072-f978cf4d019e'],
      [11, 'ideas', '“Begin anywhere.” A line in an old book that felt like permission.', 3, 1, ''],
      [14, 'everyday', 'The bus driver waited while someone ran for it. The whole bus cheered.', 2, 2, ''],
      [17, 'milestone', 'First dinner at the new table. Nothing matched, and somehow everything did.', 3, 1, 'photo-1414235077428-338989a2e8c0'],
      [21, 'nature', 'Walked the long way home just to see the magnolia trees again.', 2, 1, 'photo-1490750967868-88aa4486c946'],
      [24, 'people', 'We laughed so hard at dinner that the candle went out. Nobody relit it.', 3, 1, 'photo-1511632765486-a01980e01a18'],
      [29, 'joy', 'A song I loved at seventeen came on in the grocery store. Still knew every word.', 2, 2, ''],
      [34, 'milestone', 'Today I realized this neighborhood has started to feel like mine.', 3, 1, 'photo-1519608487953-e999c86e7455'],
      [40, 'everyday', 'The old dog on Maple Street now recognizes me before I reach the gate.', 2, 3, 'photo-1517849845537-4d257902454a'],
      [48, 'nature', 'Sat outside without checking the time. The clouds did a better job of keeping it.', 1, 1, 'photo-1500530855697-b586d89ba3ee'],
      [60, 'ideas', 'Some things keep returning because they are asking to be noticed.', 3, 1, '']
    ];
    const built = examples.map(([ago, category, text, importance, repeatCount, image], index) => ({
      id: `sample-${index}`,
      date: daysAgo(ago),
      category,
      text,
      importance,
      repeatCount,
      photo: image ? photo(image) : '',
      createdAt: new Date(`${daysAgo(ago)}T12:00:00`).toISOString()
    }));
    /* One moment from the same calendar date last year, so the sample city can
       show what "on this day" is for. Exact, rather than 365 days ago, so it
       lands on the same month and day. */
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    built.push({
      id: 'sample-last-year',
      date: localDate(lastYear),
      category: 'milestone',
      text: 'A year ago today I wrote that the neighbourhood was starting to feel like mine.',
      importance: 3,
      repeatCount: 1,
      photo: '',
      createdAt: new Date(`${localDate(lastYear)}T12:00:00`).toISOString()
    });
    return built;
  }

  function updateDemoButtons() {
    const mainButton = $('#demo-toggle');
    const mobileButton = $('#mobile-demo-toggle');
    if (mainButton) {
      mainButton.innerHTML = demoMode
        ? '<span aria-hidden="true">←</span> Back to my city'
        : '<span aria-hidden="true">✦</span> Explore a sample city <span class="demo-arrow" aria-hidden="true">↗</span>';
    }
    if (mobileButton) {
      $('.mobile-demo-label', mobileButton).textContent = demoMode ? 'Back to my city' : 'Sample city';
      /* The accessible name has to contain the visible words, so it is set from them. */
      mobileButton.setAttribute('aria-label', demoMode ? 'Back to my city' : 'Sample city: explore an example city');
      mobileButton.setAttribute('aria-pressed', String(demoMode));
    }
    $('#demo-note').classList.toggle('hidden', !demoMode);
  }

  function enterDemo() {
    if (demoMode) return;
    personalEntries = entries;
    entries = makeDemoCity();
    demoMode = true;
    updateDemoButtons();
    render();
    setView('city');
    toast('Welcome to a little preview of a grown cobble city.');
  }

  function exitDemo() {
    if (!demoMode) return;
    entries = personalEntries;
    demoMode = false;
    updateDemoButtons();
    render();
    updateStorageInfo();
    setView('city');
  }

     async function init() {
     $('#today-label').textContent = new Date().toLocaleDateString(undefined, {
       weekday: 'short',
       month: 'short',
       day: 'numeric'
     });
     try { autoDay = localStorage.getItem(AUTO_KEY) === 'on'; } catch {}
     $('#auto-day')?.setAttribute('aria-pressed', String(autoDay));
     if (autoDay) applyAutoDay(true);
     setInterval(() => { if (autoDay) applyAutoDay(true); }, 5 * 60 * 1000);
     restoreShellTheme();
     restoreAtmosphere();
     render();
     startCityMotion();
     await loadArchive();
     render();
     updateStorageInfo();
    // Deep link: app/?demo=1 (or #demo) drops a visitor straight into the sample city.
    try {
      if (/[?&]demo=1(&|$)/.test(location.search) || location.hash === '#demo') enterDemo();
    } catch {}
    const toggleDemo = event => {
      event?.preventDefault();
      event?.stopPropagation();
      if (demoMode) exitDemo();
      else enterDemo();
    };
    $('#demo-toggle').addEventListener('click', toggleDemo);
    $('#mobile-demo-toggle').addEventListener('click', toggleDemo);
    $('#hud-toggle').addEventListener('click', toggleCityHud);
    $('#theme-control').addEventListener('click', () => {
      if (autoDay) setAutoDay(false);
      atmosphere.theme = pickDifferent(themes, atmosphere.theme);
      applyAtmosphere();
      toast(say('toast.theme', { theme: (window.CobbleI18n ? window.CobbleI18n.t(`theme.${atmosphere.theme}`) : atmosphere.theme) }));
    });
    $('#mood-control').addEventListener('click', () => {
      if (autoDay) setAutoDay(false);
      atmosphere.mood = pickDifferent(moods, atmosphere.mood);
      applyAtmosphere();
      toast(say('toast.mood', { mood: (window.CobbleI18n ? window.CobbleI18n.t(`mood.${atmosphere.mood}`) : atmosphere.mood) }));
    });
    $('#weather-control').addEventListener('click', () => {
      if (autoDay) setAutoDay(false);
      atmosphere.weather = weatherTypes[(weatherTypes.indexOf(atmosphere.weather) + 1) % weatherTypes.length];
      applyAtmosphere();
      toast(say('toast.weather', { weather: (window.CobbleI18n ? window.CobbleI18n.t(`weather.${atmosphere.weather}`) : atmosphere.weather) }));
    });
    $('#auto-day').addEventListener('click', () => setAutoDay(!autoDay));
    $('#time-control').addEventListener('click', () => {
      if (autoDay) setAutoDay(false);
      atmosphere.night = !atmosphere.night;
      applyAtmosphere();
    });
    $$('.nav-item[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
    $$('[data-view-link]').forEach(button => button.addEventListener('click', () => setView(button.dataset.viewLink)));
    $('#save-city')?.addEventListener('click', saveSnapshot);
    $('#open-city-menu')?.addEventListener('click', openCityMap);
    $('#close-city-map')?.addEventListener('click', closeCityMap);
    $('#close-city-map-button')?.addEventListener('click', closeCityMap);
    $('#add-entry').addEventListener('click', openEntry);
    $('#add-entry-timeline').addEventListener('click', openEntry);
    const queryInput = $('#timeline-query');
    if (queryInput) {
      let searchTimer;
      queryInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchQuery = queryInput.value;
          renderTimeline();
        }, 120);
      });
      queryInput.addEventListener('keydown', event => {
        if (event.key === 'Escape' && queryInput.value) {
          event.stopPropagation();
          queryInput.value = '';
          searchQuery = '';
          renderTimeline();
        }
      });
    }
    $$('[data-filter-category]').forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.filterCategory;
      if (activeCategories.has(key)) activeCategories.delete(key);
      else activeCategories.add(key);
      button.setAttribute('aria-pressed', String(activeCategories.has(key)));
      renderTimeline();
    }));
    $$('[data-filter-weight]').forEach(button => button.addEventListener('click', () => {
      landmarksOnly = !landmarksOnly;
      button.setAttribute('aria-pressed', String(landmarksOnly));
      renderTimeline();
    }));
    $$('[data-filter-photo]').forEach(button => button.addEventListener('click', () => {
      withPhotoOnly = !withPhotoOnly;
      button.setAttribute('aria-pressed', String(withPhotoOnly));
      renderTimeline();
    }));
    $('#filter-reset')?.addEventListener('click', () => {
      activeCategories.clear();
      landmarksOnly = false;
      withPhotoOnly = false;
      $$('[data-filter-category], [data-filter-weight], [data-filter-photo]').forEach(button => button.setAttribute('aria-pressed', 'false'));
      renderTimeline();
    });

    $('#timeline-query-clear')?.addEventListener('click', () => {
      const input = $('#timeline-query');
      if (input) input.value = '';
      searchQuery = '';
      renderTimeline();
      input?.focus();
    });

    $('#entry-form').addEventListener('submit', event => {
      event.preventDefault();
      const text = $('#entry-text').value.trim();
      if (!text) return;
      const category = $('#entry-category').value;
      const duplicate = entries.filter(entry => entry.category === category).length;
      const date = $('#entry-date').value || localDate();
      const importance = $('input[name="importance"]:checked').value;
      if (editingId) {
        const existing = entries.find(entry => String(entry.id) === editingId);
        if (!existing) editingId = null;
        if (existing) {
          const previous = { ...existing };
          Object.assign(existing, { text, date, category, importance, photo: photoData });
          offerUndo('Moment updated.', () => {
            Object.assign(existing, previous);
            save();
            render();
            toast('Change undone.');
          });
          editingId = null;
          save();
          render();
          event.target.reset();
          photoData = '';
          $('#photo-preview').classList.add('hidden');
          $('#photo-label').textContent = 'Add a photo, if you like';
          closeEntry();
          toast('Moment updated.');
          return;
        }
      }
      entries.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        text,
        date: $('#entry-date').value || localDate(),
        category,
        importance: $('input[name="importance"]:checked').value,
        photo: photoData,
        repeatCount: duplicate >= 2 ? Math.min(5, duplicate) : 1,
        createdAt: new Date().toISOString()
      });
      save();
      render();
      event.target.reset();
      photoData = '';
      $('#photo-preview').classList.add('hidden');
      $('#photo-label').textContent = 'Add a photo, if you like';
      closeEntry();
      toast('A new little piece of your city has arrived.');
    });
    $('#entry-photo').addEventListener('change', async event => {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 12 * 1024 * 1024) {
        toast('Choose a photo smaller than 12 MB; it will be resized before saving.');
        event.target.value = '';
        return;
      }
      if (storageRoom !== null && storageRoom <= 0.03) {
        toast('This browser is nearly full for this site. Export a backup, then remove a photo or two.');
        event.target.value = '';
        return;
      }
      try {
        if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
        /* `from-image` honours the EXIF orientation, so a photo taken sideways
           on a phone is stored the way it was meant to be seen. */
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
          .catch(() => createImageBitmap(file));
        const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        /* WebP first, JPEG as the fallback, and keep whichever is smaller.
           A browser that cannot encode WebP returns a PNG data URL, which the
           prefix check rejects. */
        const webp = canvas.toDataURL('image/webp', 0.76);
        const jpeg = canvas.toDataURL('image/jpeg', 0.76);
        photoData = webp.startsWith('data:image/webp') && webp.length < jpeg.length ? webp : jpeg;
        $('#photo-preview').innerHTML = `<img src="${photoData}" alt="Photo preview">`;
        $('#photo-preview').classList.remove('hidden');
        $('#photo-label').textContent = `${file.name} · resized`;
        updateStorageInfo();
      } catch {
        toast('This photo could not be prepared. Try another image.');
        event.target.value = '';
      }
    });
    $('#close-modal').addEventListener('click', closeEntry);
    $('#cancel-modal').addEventListener('click', closeEntry);
    $('#entry-modal').addEventListener('click', event => {
      if (event.target === event.currentTarget) closeEntry();
    });
    $('#drawer-close').addEventListener('click', () => $('#day-backdrop').classList.add('hidden'));
    $('#day-backdrop').addEventListener('click', event => {
      if (event.target === event.currentTarget) $('#day-backdrop').classList.add('hidden');
    });
    $('#help-button').addEventListener('click', () => $('#help-modal').classList.remove('hidden'));
    $('#close-help').addEventListener('click', () => $('#help-modal').classList.add('hidden'));
    $('#got-it').addEventListener('click', () => $('#help-modal').classList.add('hidden'));
    $('.more-button').addEventListener('click', () => $('#help-modal').classList.remove('hidden'));
         $('#share-button').addEventListener('click', openShare);
     $$('.download-package').forEach(button => button.addEventListener('click', () => downloadAppPackage(button)));
    $$('#postcard').forEach(button => button.addEventListener('click', savePostcard));
     $('#share-close').addEventListener('click', closeShare);
    $('#share-modal').addEventListener('click', event => {
      if (event.target === event.currentTarget) closeShare();
    });
    $('#export-city').addEventListener('click', exportCity);
    $('#import-city').addEventListener('click', () => $('#import-file').click());
    $('#import-journal').addEventListener('click', () => $('#journal-file').click());
    $('#journal-file').addEventListener('change', event => {
      const file = event.target.files[0];
      event.target.value = '';
      importJournal(file);
    });
    $('#import-file').addEventListener('change', event => importCity(event.target.files[0]));
    // ── focus management ──────────────────────────────────────────
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const openDialog = () => $$('[role="dialog"]').find(dialog => !dialog.closest('.hidden'));
    let openerElement = null;

    document.addEventListener('keydown', event => {
      const dialog = openDialog();
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = $$(FOCUSABLE, dialog).filter(node => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Remember what opened a dialog, so closing it puts focus back there.
    document.addEventListener('click', event => {
      const trigger = event.target.closest('button, a');
      if (trigger) openerElement = trigger;
    }, true);

    $('#undo-button')?.addEventListener('click', runUndo);
    $('#export-json')?.addEventListener('click', exportJSON);
    $('#shell-theme')?.addEventListener('click', toggleShellTheme);
    $('#open-review')?.addEventListener('click', openReview);
    $('#close-review')?.addEventListener('click', closeReview);
    $('#review-close-button')?.addEventListener('click', closeReview);
    $('#review-postcard')?.addEventListener('click', () => { closeReview(); savePostcard(); });
    $('#lock-city')?.addEventListener('click', lockCity);
    $('#unlock-button')?.addEventListener('click', unlockCity);
    $('#lock-passphrase')?.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); unlockCity(); }
    });
    $('#lock-forget')?.addEventListener('click', forgetVault);
    $('#storage-export')?.addEventListener('click', () => {
      setView('insights');
      exportJSON();
    });
    $('#share-button')?.addEventListener('click', () => {
      if (!entries.length) $('#share-status').textContent = 'Add a moment first — there is nothing to export yet.';
    });

    document.addEventListener('keydown', event => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !typing && undoAction) {
        event.preventDefault();
        runUndo();
        return;
      }
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === 'n' && $('#entry-modal').classList.contains('hidden')) {
        event.preventDefault();
        openEntry();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeEntry();
        closeShare();
        $('#help-modal').classList.add('hidden');
        $('#day-backdrop').classList.add('hidden');
        if (document.body.classList.contains('city-immersive')) toggleCityHud();
        if (openerElement && document.contains(openerElement)) {
          openerElement.focus();
          openerElement = null;
        }
      }
    });
  }
  init();

  // The worker lives at the site root so one cache covers the landing page and
  // the app. Registration is silent: no worker, no problem.
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => {
      navigator.serviceWorker.register('../sw.js').catch(() => {});
    });
  }
})();
