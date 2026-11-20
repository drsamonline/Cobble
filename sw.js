/* Cobble service worker.
 *
 * Strategy: network-first for same-origin requests, cache as the fallback.
 * The first visit fills the cache; every visit after that works with the
 * network off. Cross-origin requests — the sample city's Unsplash photos —
 * are never touched, so they behave exactly as they would without a worker.
 *
 * The pattern is adapted from the author's Mood Mixer and Planner Pro workers,
 * which use the same versioned-cache and network-first arrangement.
 *
 * To ship a change: bump CACHE_VERSION and ASSET_VERSION together. The old
 * cache is deleted on activate, and the new files are fetched with cache:reload
 * during install so a stale copy cannot win.
 */
const CACHE_VERSION = 'v37';
const CACHE_NAME = `cobble-${CACHE_VERSION}`;
const ASSET_VERSION = '1.39.0';

const PRECACHE = [
  './',
  './index.html',
  './hi.html',
  './gu.html',
  './app/',
  './app/index.html',
  './app/theme.css',
  './app/styles.css',
  './app/app.js',
  './app/core.js',
  './app/i18n.js',
  './app/scene3d.js',
  './app/ambience.js',
  './app/vendor/jszip.min.js',
  './assets/landing.css',
  './assets/landing.js',
  './assets/upi-qr.svg',
  './fonts/fonts.css',
  './fonts/Manrope.woff2',
  './fonts/DMSans.woff2',
  './fonts/IBMPlexMono-400.woff2',
  './fonts/IBMPlexMono-500.woff2',
  './docs/',
  './docs/index.html',
  './docs/assets/support-portrait.jpg',
  './docs/assets/upi-qr.svg',
  './manifest.json',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

const OPTIONAL = [
  './screenshots/landing.webp',
  './screenshots/city.webp',
  './screenshots/dark.webp',
  './screenshots/year-heatmap.webp',
  './screenshots/year-review.webp',
  './screenshots/city-3d.webp'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const add = async path => {
      try {
        const response = await fetch(new Request(path, { cache: 'reload' }));
        if (response.ok) await cache.put(path, response);
      } catch {
        /* One missing file must never abort the install. */
      }
    };
    await Promise.all(PRECACHE.map(add));
    await Promise.all(OPTIONAL.map(add));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Unsplash photos and nothing else

  /* Navigations: try the network, fall back to the cached shell. */
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request)) ||
               (await cache.match('./app/')) ||
               (await cache.match('./index.html')) ||
               new Response('Cobble is offline and this page is not cached yet.', {
                 status: 503,
                 headers: { 'Content-Type': 'text/plain; charset=utf-8' }
               });
      }
    })());
    return;
  }

  /* Everything else: cache first, then network, and keep the cache warm. */
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const fresh = await fetch(request);
      if (fresh.ok && fresh.type === 'basic') cache.put(request, fresh.clone());
      return fresh;
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
