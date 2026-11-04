/**
 * Service Worker — Pașaportul Runcului
 * App-shell cache-first, stale-while-revalidate for data, cache limit on photos.
 */

const CACHE_NAME = 'pasaport-runcu-v2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/topography-contours.svg',
  './assets/guilloche-pattern.svg',
  './fonts/plus-jakarta-sans-600-latin.woff2',
  './fonts/plus-jakarta-sans-400-latin.woff2',
  './fonts/cormorant-garamond-700-latin.woff2',
  './fonts/cormorant-garamond-600-latin.woff2',
  './data/stamps.json',
  './data/stories.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW] Pre-caching partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Stale-while-revalidate for stamps.json & stories.json
  if (url.pathname.endsWith('/data/stamps.json') || url.pathname.endsWith('/data/stories.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((cachedRes) => {
          const fetchPromise = fetch(req).then((networkRes) => {
            if (networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
            return networkRes;
          }).catch(() => cachedRes);

          return cachedRes || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache-first for scripts, styles, fonts, and images
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) return cachedRes;

      return fetch(req).then((networkRes) => {
        if (networkRes.status === 200 && url.origin === self.location.origin) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
