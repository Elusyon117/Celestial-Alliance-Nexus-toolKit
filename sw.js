/* Celestial Nexus Toolkit v1.6.0 service worker */
const NEXUS_CACHE = 'celestial-nexus-toolkit-v1.6.0';
const NEXUS_APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(NEXUS_CACHE);
    await Promise.all(NEXUS_APP_SHELL.map(async url => {
      try {
        const request = new Request(url, { cache: 'reload' });
        const response = await fetch(request);
        if (response && response.ok) await cache.put(url, response.clone());
      } catch (_) {
        // Optional shell files may be missing in some repositories; do not fail install.
      }
    }));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== NEXUS_CACHE && key.startsWith('celestial-nexus-toolkit-')).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(NEXUS_CACHE);
    try {
      const response = await fetch(event.request);
      if (response && response.ok) cache.put(event.request, response.clone());
      return response;
    } catch (_) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return cache.match('./index.html');
      throw _;
    }
  })());
});
