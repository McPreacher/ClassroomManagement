const cacheName = 'classroom-v6'; // Bumping to v6
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
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cName) => {
                    if (cName !== cacheName) {
                        return caches.delete(cName);
                    }
                })
            );
        })
    );
});

// The FIX: Only intercept requests for YOUR site, not Google Scripts
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // If the request is for Google Scripts, let it go straight to the internet
  if (url.hostname.includes('script.google.com')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});