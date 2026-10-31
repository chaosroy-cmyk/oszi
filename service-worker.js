// © 2026 Roy Sperlich – Alle Rechte vorbehalten.
// Owner: Roy Sperlich · Signature-ID: KFZ-OSZI-RS-803792F7BB4A6C59
// Activation requires the existing update button; never interrupt a measurement.
const BASE = 'kfz-oszi-pwa-signed-803792f7bb4a6c59-';
const ROOT = new URL('./', self.registration.scope);
const PREFIX = BASE + encodeURIComponent(ROOT.pathname) + '-';
const CACHE_NAME = PREFIX + 'v13.6.1';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./icons/icon-192.png',
  './icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});
self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k =>
    k !== CACHE_NAME && (k.startsWith(PREFIX) || (ROOT.pathname==='/' &&
      (new RegExp('^'+BASE+'v[0-9]').test(k) || k.startsWith('kfzoszi-v2-'))))
  ).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==ROOT.origin)return;
  const rel=url.pathname.startsWith(ROOT.pathname)?url.pathname.slice(ROOT.pathname.length):null;
  // Never intercept the sibling PWA, backend files or arbitrary navigation URLs.
  const nav=req.mode==='navigate'&&(rel===''||rel==='index.html');
  const asset=rel==='manifest.webmanifest'||(rel&&rel.startsWith('icons/'));
  if(!nav&&!asset)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const key=nav?new URL('index.html',ROOT).href:new URL(url.pathname,ROOT.origin).href;
    if(!nav){const hit=await cache.match(key);if(hit)return hit;}
    try{
      const response=await fetch(req);
      // A 404/500 must not poison the known-good offline shell.
      if(response.ok && (nav?(response.headers.get('content-type')||'').includes('text/html'):true)){
        try{await cache.put(key,response.clone());}catch(e){/* quota: return the valid network response */}
        return response;
      }
      return nav?(await cache.match(key)||response):response;
    }catch(error){
      const hit=await cache.match(key);if(hit)return hit;
      return new Response('Offline: Ressource nicht gespeichert',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
    }
  })());
});
