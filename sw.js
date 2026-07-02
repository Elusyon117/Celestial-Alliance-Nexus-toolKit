const CACHE_NAME = 'celestial-nexus-v1.3.7-mission-sync-v2';
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./data/roster.json",
  "./data/scmdb-missions-live.json",
  "./data/scmdb-missions-live.js",
  "./assets/wikelo/ana-endro.webp",
  "./assets/wikelo/bokto.webp",
  "./assets/wikelo/boomtube-clanguard.webp",
  "./assets/wikelo/geist-snow.webp",
  "./assets/wikelo/killshot-dominion-reference.webp",
  "./assets/wikelo/monde-crimson-reference.svg",
  "./assets/wikelo/palatino-mark-1.webp",
  "./assets/wikelo/polaris-bit-reference.webp",
  "./assets/wikelo/r97-crimson-reference.webp",
  "./assets/wikelo/strata-heatwave.webp"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', response.clone()));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
