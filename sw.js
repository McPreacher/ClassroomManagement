const cacheName = 'classroom-v4'; // Incremented to v4
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
  self.skipWaiting(); // Forces the new service worker to take over immediately
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cName) => {
                    if (cName !== cacheName) {
                        console.log('Service Worker: Clearing Old Cache...', cName);
                        return caches.delete(cName);
                    }
                })
            );
        })
    );
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