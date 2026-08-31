const CACHE='cf-installer-v6';
const ASSETS=['/cf-installer/','/cf-installer/index.html','/cf-installer/manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('fetch',e=>{
  // Network-first for HTML/JS (ensures updates), cache-first for static assets
  const url=new URL(e.request.url);
  if(url.pathname.endsWith('.html')||url.pathname.endsWith('/')||e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
  }else{
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
  }
});
