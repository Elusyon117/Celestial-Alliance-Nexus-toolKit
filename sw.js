/* Celestial Nexus Toolkit service worker — full assets repository update. */
const NEXUS_CACHE_VERSION = 'repo-cargo-onyx-layout-scroll-v153-202607092155';
const APP_CACHE = `celestial-nexus-app-${NEXUS_CACHE_VERSION}`;
const RUNTIME_CACHE = `celestial-nexus-runtime-${NEXUS_CACHE_VERSION}`;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/images/embedded/nexus-embedded-01-64x64-9d447cf933be.png",
  "./assets/images/embedded/nexus-embedded-02-180x180-7d81ee20bc35.png",
  "./assets/images/embedded/nexus-embedded-03-1096x731-44b347223ad8.jpg",
  "./assets/images/embedded/nexus-embedded-04-256x256-495a041511a1.png",
  "./assets/images/embedded/nexus-embedded-05-520x440-953272130c49.png",
  "./assets/images/embedded/nexus-embedded-06-1200x675-5a101457ae78.webp",
  "./assets/images/embedded/nexus-embedded-07-1200x675-b11aa913ca6d.webp",
  "./assets/images/embedded/nexus-embedded-08-1200x675-6575c88751fd.webp",
  "./assets/images/embedded/nexus-embedded-09-1200x675-86c083fb3412.webp",
  "./assets/images/embedded/nexus-embedded-10-1200x675-98be4d8b25fa.webp",
  "./assets/images/embedded/nexus-embedded-11-1200x675-13fe928092ee.webp",
  "./assets/images/embedded/nexus-embedded-12-1200x675-b37a0aea800e.webp",
  "./assets/images/embedded/nexus-embedded-13-1200x675-7fc71078fc64.webp",
  "./assets/images/embedded/nexus-embedded-14-1200x675-c9294c9e8d6c.webp",
  "./assets/images/embedded/nexus-embedded-15-1200x675-584c55391158.webp",
  "./assets/images/embedded/nexus-embedded-16-400x225-cefcf4ecef76.webp",
  "./assets/images/embedded/nexus-embedded-17-1280x720-0fb691dfa4f0.webp",
  "./assets/images/embedded/nexus-embedded-18-1280x720-29ab077b774e.webp",
  "./assets/images/embedded/nexus-embedded-19-1280x720-4abc87736cc6.webp",
  "./assets/images/embedded/nexus-embedded-20-1280x720-af910a51288b.webp",
  "./assets/images/embedded/nexus-embedded-21-1280x720-4e8c6c380c36.webp",
  "./assets/images/embedded/nexus-embedded-22-1280x720-3057d25b7b05.webp",
  "./assets/images/embedded/nexus-embedded-23-3000x1286-99ed52560d7f.webp",
  "./assets/images/embedded/nexus-embedded-24-1500x643-d7154923bda2.webp",
  "./assets/images/embedded/nexus-embedded-25-2715x1527-c75395c283df.webp",
  "./assets/images/embedded/nexus-embedded-26-720x480-659560e75c4f.jpg",
  "./assets/images/embedded/nexus-embedded-27-1400x845-2a21c7439ef6.jpg",
  "./assets/images/embedded/nexus-embedded-28-1400x788-23d561040991.jpg",
  "./assets/images/ships/f7a-hornet-mk-ii-pyam-exec.webp",
  "./assets/images/ships/f8c-lightning-pyam-exec.webp",
  "./assets/images/ships/corsair-pyam-exec.webp",
  "./assets/images/ships/cutlass-black-pyam-exec.webp",
  "./assets/images/ships/syulen-pyam-exec.webp",
  "./assets/images/ships/gladius-pirate-isometric.webp",
  "./assets/images/ships/polaris-wikelo-special.webp",
  "./assets/images/ships/golem-ship-cover.webp",
  "./assets/images/ships/sabre-peregrine-ship-cover.webp",
  "./assets/images/ships/sabre-firebird-ship-cover.webp",
  "./assets/images/ships/asgard-ship-cover.webp",
  "./assets/images/ships/f7c-m-super-hornet-mk-ii-ship-cover.webp",
  "./assets/images/ships/a2-hercules-starlifter-ship-cover.webp",
  "./assets/images/ships/ship-image-manifest.json",
  "./assets/images/locations/onyx-site-b-primary-building.webp",
  "./assets/images/locations/location-image-manifest.json",
  "./assets/images/remote/ExecCorsair-1600x900-5acd0e8830.webp",
  "./assets/images/remote/ExecSyulen-1600x1000-9dcad09bdf.webp",
  "./assets/images/remote/Execcutlassblack-1600x1000-4fc7e7dc81.webp",
  "./assets/images/remote/Execf7a-1600x1000-4a28cb8fe1.webp",
  "./assets/images/remote/Execf8c-1600x1000-ab35b31e86.webp",
  "./assets/images/remote/Wikelo_Polaris_picture_2-1600x900-7fcab3ee75.webp",
  "./assets/images/remote/avatar_default_big-200x200-05348272aa.webp",
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

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
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
  return ['style', 'script', 'font', 'manifest'].includes(request.destination) || /\.(?:css|js|woff2?|json|webmanifest)(?:[?#]|$)/i.test(url.pathname);
}
async function cacheFirst(request) {
  const cached = await caches.match(request, {ignoreSearch: false});
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
  const cached = await cache.match(request, {ignoreSearch: false});
  const network = fetch(request).then(response => {
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone()).catch(() => {});
    return response;
  }).catch(() => cached);
  return cached || network;
}
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    const cached = await cache.match(request, {ignoreSearch: true});
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
    if (isImageLike(request, url) || isStaticLike(request, url)) {
      event.respondWith(cacheFirst(request));
      return;
    }
  }

  if (isImageLike(request, url) || request.destination === 'font') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
