/* KFZ Multimeter Profi – Service Worker
   Precache der App-Shell, network-first für Navigationen (frische index.html),
   cache-first für Assets. CACHE_NAME bei jedem Release erhöhen (passend zu APP_VERSION). */
const CACHE_NAME = 'kfz-multimeter-profi-v7-1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', event => {
  // Kein skipWaiting hier: der neue Worker wartet, bis der Nutzer das Update
  // im Banner bestätigt (SKIP_WAITING-Message) – kein erzwungener Reload mitten in der Arbeit.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  const d = event.data;
  if (d === 'SKIP_WAITING' || (d && d.type === 'SKIP_WAITING')) self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // nur eigener Ursprung cachen

  // Navigationen: network-first (immer möglichst frisch), offline aus dem Cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Assets: cache-first, bei Netz-Antwort Cache auffrischen
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      if (resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }))
  );
});
