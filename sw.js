const CACHE='cf-installer-v7';
const ASSETS=['/cf-installer/','/cf-installer/index.html','/cf-installer/manifest.json','/cf-installer/sw.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))))});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  // Network-first for HTML/JS/CSS (ensures updates aren't blocked by stale cache)
  if(url.pathname.endsWith('.html')||url.pathname.endsWith('/')||e.request.mode==='navigate'||url.pathname.endsWith('.js')||url.pathname.endsWith('.css')){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
  }else{
    // Cache-first for static assets (images, fonts, etc.)
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
  }
});
