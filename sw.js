const CACHE='cf-installer-v9';
const ASSETS=['./index.html','./dashboard.html','./manifest.json','./sw.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
const url=new URL(e.request.url);
if(url.pathname.endsWith('.html')||url.pathname.endsWith('/')||e.request.mode==='navigate'||url.pathname.endsWith('.js')||url.pathname.endsWith('.css')){
e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c))}return r}).catch(()=>caches.match(e.request)));
}else{
e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(rr=>{if(rr.ok){const c=rr.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c))}return rr})));
}
});
