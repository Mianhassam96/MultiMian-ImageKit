// MultiMian ImageKit — Service Worker v7.0
const CACHE = 'imagekit-v7';
const STATIC = [
  './',
  './index.html',
  './styles.css',
  './styles-phase2.css',
  './styles-phase3.css',
  './styles-phase4.css',
  './styles-phase5.css',
  './styles-premium.css',
  './styles-sprint3.css',
  './styles-phase6.css',
  './script.js',
  './phase2.js',
  './phase3.js',
  './phase4.js',
  './phase5.js',
  './phase6.js',
  './crop.js',
  './tools-sprint4.js',
  './manifest.json',
  './favicon.svg',
  './favicon.png',
  './favicon-32x32.png',
  './favicon-16x16.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Don't cache external CDN or API calls
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
