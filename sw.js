/* Celestial Nexus Toolkit service worker — v1.9.0 visual and creator studio release. */
const NEXUS_CACHE_VERSION = 'v1.9.0-visual-creator-performance-20260723';
const APP_CACHE = `celestial-nexus-app-${NEXUS_CACHE_VERSION}`;
const RUNTIME_CACHE = `celestial-nexus-runtime-${NEXUS_CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/wikelo/ana-endro.webp',
  './assets/wikelo/bokto.webp',
  './assets/wikelo/boomtube-clanguard.webp',
  './assets/wikelo/geist-snow.webp',
  './assets/wikelo/killshot-dominion-reference.webp',
  './assets/wikelo/monde-crimson-reference.svg',
  './assets/wikelo/palatino-mark-1.webp',
  './assets/wikelo/polaris-bit-reference.webp',
  './assets/wikelo/r97-crimson-reference.webp',
  './assets/wikelo/strata-heatwave.webp',
  './assets/images/locations/onyx-facility.webp',
  './assets/images/events/tactical-strike-groups.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([APP_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.map(key => keep.has(key) ? undefined : caches.delete(key)));
    await self.clients.claim();
  })());
});

function isImageLike(request, url) {
  return request.destination === 'image' || /\.(?:png|jpe?g|webp|gif|svg|avif)(?:[?#]|$)/i.test(url.pathname);
}

function isStaticLike(request, url) {
  return ['style', 'script', 'font', 'manifest'].includes(request.destination) ||
    /\.(?:css|js|woff2?|json|webmanifest)(?:[?#]|$)/i.test(url.pathname);
}

function isMrKrakenMirror(url) {
  return /\/data\/mrkraken-(?:global\.ini|release\.json)$/i.test(url.pathname);
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: false });
  if (cached) return cached;

  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreSearch: false });
  const network = fetch(request)
    .then(response => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/index.html') || url.pathname === new URL(self.registration.scope).pathname) {
      event.respondWith(networkFirst(request));
      return;
    }
    if (isMrKrakenMirror(url)) {
      event.respondWith(networkFirst(request));
      return;
    }
    if (url.pathname.includes('/data/')) {
      event.respondWith(staleWhileRevalidate(request));
      return;
    }
    if (isImageLike(request, url) || isStaticLike(request, url)) {
      event.respondWith(cacheFirst(request));
      return;
    }
  }

  if (isImageLike(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
