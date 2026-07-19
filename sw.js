/* Celestial Alliance Nexus Toolkit v1.8.0 service worker */
const VERSION = '1.8.0-contract-favicon-hotfix-20260718';
const SHELL_CACHE = `celestial-nexus-shell-${VERSION}`;
const DATA_CACHE = `celestial-nexus-data-${VERSION}`;
const IMAGE_CACHE = `celestial-nexus-images-${VERSION}`;
const CACHE_PREFIX = 'celestial-nexus-';
const SHELL = [
  './', './index.html', './404.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icons/icon-192.png', './icons/icon-512.png',
  './assets/wikelo/ana-endro.webp', './assets/wikelo/bokto.webp',
  './assets/wikelo/boomtube-clanguard.webp', './assets/wikelo/geist-snow.webp',
  './assets/wikelo/killshot-dominion-reference.webp', './assets/wikelo/monde-crimson-reference.svg',
  './assets/wikelo/palatino-mark-1.webp', './assets/wikelo/polaris-bit-reference.webp',
  './assets/wikelo/r97-crimson-reference.webp', './assets/wikelo/strata-heatwave.webp',
  './assets/images/locations/onyx-facility.webp',
  './assets/images/events/tactical-strike-groups.webp'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // One missing optional file must never prevent service-worker installation.
    await Promise.allSettled(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, DATA_CACHE, IMAGE_CACHE]);
    await Promise.all((await caches.keys()).filter(k => k.startsWith(CACHE_PREFIX) && !keep.has(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, cacheName, timeoutMs = 7000) {
  const cache = await caches.open(cacheName);
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('network timeout')), timeoutMs));
  try {
    const response = await Promise.race([fetch(request), timeout]);
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (_) {
    return (await cache.match(request)) || (await caches.match('./index.html')) || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fresh = fetch(request).then(response => {
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone()).catch(() => {});
    return response;
  }).catch(() => null);
  return cached || (await fresh) || Response.error();
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone()).catch(() => {});
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE, 5000));
    return;
  }
  if (url.origin === self.location.origin && /\/data\//.test(url.pathname)) {
    event.respondWith(networkFirst(request, DATA_CACHE, 9000));
    return;
  }
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }
  if (url.origin === self.location.origin) event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});
