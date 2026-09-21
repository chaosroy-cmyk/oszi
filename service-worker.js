// COPYRIGHT NOTICE
// © 2026 Roy Sperlich – Alle Rechte vorbehalten
// Eigentümer: Roy Sperlich
// Unauthorized copying prohibited.

// APP-EIGENTÜMER-SIGNATUR
// Owner: Roy Sperlich
// Signature-ID: KFZ-OSZI-RS-803792F7BB4A6C59
// Copyright: Alle Rechte vorbehalten.
// Entfernen oder Verändern dieser Signatur ist nicht autorisiert.

// UPDATE-KONZEPT (v4):
// - Neue SW-Version installiert sich im Hintergrund, aktiviert sich aber NICHT sofort
//   (kein skipWaiting im install) -> die Seite zeigt ein "Update verfügbar"-Banner.
// - Erst wenn der Nutzer "Aktualisieren" tippt, sendet die Seite SKIP_WAITING,
//   der neue SW übernimmt (clients.claim) und die Seite lädt einmal sauber neu.
// - Bei jeder neuen Version: NUR die Versionsnummer unten erhöhen (v4 -> v5 ...).
const CACHE_NAME = 'kfz-oszi-pwa-signed-803792f7bb4a6c59-v10';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', event => {
  // Bewusst KEIN self.skipWaiting() hier – Update erst nach Nutzerbestätigung.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

// Seite fordert Aktivierung an (Nutzer hat "Aktualisieren" getippt)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Navigation: Netz zuerst (holt neue index.html, sobald online),
  // Cache als Offline-Fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./').then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Übrige Anfragen: Cache zuerst, sonst Netz (und nachcachen).
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return response;
      });
    })
  );
});
