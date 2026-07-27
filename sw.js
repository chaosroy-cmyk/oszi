/* KFZ-Oszilloskop-Kompendium – Service Worker
   App-Shell precache, cache-first für Assets, network-first für Navigation.
   Cache-Version bei jedem Release erhöhen (Datum), damit Clients aktualisieren. */
"use strict";

var CACHE = "kfzoszi-v2-2026-07-16";
// Cache Storage ist ORIGIN-weit, nicht Scope-weit: Unter "/multimeter/" liegt eine
// zweite App auf demselben Origin. Beim Aufräumen darf deshalb nur gelöscht werden,
// was zu dieser App gehört – sonst löschen sich beide gegenseitig den Offline-Cache.
var CACHE_PREFIX = "kfzoszi-";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) {
                                 return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE;
                               })
                              .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // nur eigener Ursprung

  // Navigations-Requests: erst Netz (frisch), sonst gecachte Seite (offline)
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match("./index.html"); });
      })
    );
    return;
  }

  // Übrige GETs: erst Cache, sonst Netz (und cachen)
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
