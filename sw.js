const CACHE = 'gymlog-v1';

// On install: cache the core app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['./', './index.html', './manifest.json', './icon-192.svg', './icon-512.svg'])
    )
  );
  self.skipWaiting();
});

// On activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-origin, network-first with cache fallback for CDN
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Serve from cache if available (works offline)
      if (cached) {
        // Also refresh cache in background (stale-while-revalidate)
        fetch(e.request)
          .then(res => {
            if (res && res.status === 200) {
              caches.open(CACHE).then(c => c.put(e.request, res));
            }
          })
          .catch(() => {});
        return cached;
      }
      // Not in cache: try network, cache successful responses
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Complete offline fallback
        return caches.match('./index.html');
      });
    })
  );
});
