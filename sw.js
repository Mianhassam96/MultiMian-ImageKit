// MultiMian ImageKit — Service Worker v10.0
const CACHE = 'imagekit-v10';
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
  './styles-sprint7.css',
  './script.js',
  './phase2.js',
  './phase3.js',
  './phase4.js',
  './phase5.js',
  './phase6.js',
  './phase7.js',
  './crop.js',
  './tools-sprint4.js',
  './manifest.json',
  './favicon.svg',
  './favicon.png',
  './favicon-32x32.png',
  './favicon-16x16.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './screenshot-wide.png',
  './social-preview.png'
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

  // Skip unsupported schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // Never cache external API endpoints or upload services
  if (url.hostname.includes('api.imgbb.com') || url.hostname.includes('formspree.io')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache successful responses from same-origin or trusted static CDNs
        if (res && res.status === 200 && (
          url.origin === location.origin ||
          url.hostname.includes('cdnjs.cloudflare.com') ||
          url.hostname.includes('cdn.jsdelivr.net') ||
          url.hostname.includes('unpkg.com') ||
          url.hostname.includes('fonts.googleapis.com') ||
          url.hostname.includes('fonts.gstatic.com')
        )) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline navigation fallback to main app shell
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return cached;
      });
    })
  );
});
