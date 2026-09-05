/* KFZ Multimeter Profi – Service Worker
   © 2026 R.S. – Alle Rechte vorbehalten.
   Precache der App-Shell, network-first für Navigationen (frische index.html),
   cache-first für Assets. CACHE_NAME bei jedem Release erhöhen (passend zu APP_VERSION). */
const CACHE_NAME = 'kfz-multimeter-profi-v8-6';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './splash-750x1334.png',
  './splash-828x1792.png',
  './splash-1242x2208.png',
  './splash-1125x2436.png',
  './splash-1242x2688.png',
  './splash-1170x2532.png',
  './splash-1284x2778.png',
  './splash-1179x2556.png',
  './splash-1290x2796.png',
  './splash-1620x2160.png',
  './splash-1640x2360.png',
  './splash-1668x2388.png',
  './splash-2048x2732.png',
  './splash-1334x750.png',
  './splash-1792x828.png',
  './splash-2208x1242.png',
  './splash-2436x1125.png',
  './splash-2688x1242.png',
  './splash-2532x1170.png',
  './splash-2778x1284.png',
  './splash-2556x1179.png',
  './splash-2796x1290.png',
  './splash-2160x1620.png',
  './splash-2360x1640.png',
  './splash-2388x1668.png',
  './splash-2732x2048.png'
];

// Kernumfang: muss vollständig gecacht werden, sonst ist die App nicht offlinefähig.
// Optionale Assets (Splashscreens) werden best effort geladen – cache.addAll ist atomar,
// ein einziges fehlendes Bild würde sonst die komplette Installation und damit die
// Offline-Fähigkeit verhindern.
const CORE_ASSETS = ASSETS.filter(u => !u.includes('splash-'));
const OPTIONAL_ASSETS = ASSETS.filter(u => u.includes('splash-'));

self.addEventListener('install', event => {
  // Kein skipWaiting hier: der neue Worker wartet, bis der Nutzer das Update
  // im Banner bestätigt (SKIP_WAITING-Message) – kein erzwungener Reload mitten in der Arbeit.
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(CORE_ASSETS).then(() =>
        Promise.all(OPTIONAL_ASSETS.map(u => cache.add(u).catch(() => {})))
      )
    )
  );
});

// Cache Storage ist ORIGIN-weit, nicht Scope-weit: Auf einem gemeinsamen Origin
// (hier liegt zusätzlich das Oszi-Kompendium unter "/") darf beim Aufräumen nur
// gelöscht werden, was zu dieser App gehört – sonst löschen sich die Apps
// gegenseitig den Offline-Cache.
const CACHE_PREFIX = 'kfz-multimeter-profi-';

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  const d = event.data;
  if (d && d.type === 'GET_VERSION') {
    const reply = { type: 'VERSION', cacheName: CACHE_NAME };
    if (event.ports && event.ports[0]) event.ports[0].postMessage(reply);
    else if (event.source) event.source.postMessage(reply);
    return;
  }
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
