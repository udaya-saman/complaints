// Offline shell. Versioned code avoids mixing old modules with a new index.
const CACHE='ph-complaints-v2.9.1';
const ASSETS=['./','./index.html','./styles-2.9.1.css','./startup-2.9.1.js','./hub-2.9.1.js','./workbook-2.9.1.js','./manifest.webmanifest','./404.html','./update.html','./update-2.9.1.html','./repair-2.9.1.js','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(path=>new Request(path,{cache:'reload'}))))));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();for(const key of keys){if(key.startsWith('ph-complaints-')&&key!==CACHE){const c=await caches.open(key);for(const r of await c.keys())if(r.url.startsWith(self.registration.scope))await c.delete(r);}}await self.clients.claim();})()));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',e=>{
 const r=e.request,url=new URL(r.url);if(r.method!=='GET'||!url.href.startsWith(self.registration.scope))return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);
  if(r.mode==='navigate'){try{const response=await fetch(r,{cache:'no-cache'});if(response.ok)return response;}catch{}return(await cache.match(r))||(url.pathname.endsWith('/update.html')?await cache.match('./update.html'):await cache.match('./index.html'))||Response.error();}
  const stored=await cache.match(r);if(stored)return stored;try{return await fetch(r);}catch{return Response.error();}
 })());
});
