const cacheName = 'classroom-v3';
const staticAssets = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', async el => {
  const cache = await caches.open(cacheName);
  await cache.addAll(staticAssets);
});

self.addEventListener('fetch', el => {
  const req = el.request;
  el.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  return cached || fetch(req);
}
// This event triggers when the new service worker takes over
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // If the cache name isn't our current version, delete it!
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache...', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});