
const CACHE = "mixblueprint_pro_v2_shell_v1";
const SHELL = [
  "./",
  "./index.html",
  "./admin.html",
  "./styles/app.css",
  "./styles/admin.css",
  "./js/app.js",
  "./js/ui.js",
  "./js/store.js",
  "./js/content.js",
  "./js/engine.js",
  "./js/admin.js",
  "./assets/icons/logo.svg",
  "./content/registry.json",
  "./content/core/manifest.json",
  "./content/core/data/genres.json",
  "./content/core/data/instruments.json",
  "./content/core/data/blueprints.json",
  "./content/core/data/masters.json",
  "./content/dlc/lofi/manifest.json",
  "./content/dlc/lofi/data/genres.json",
  "./content/dlc/lofi/data/blueprints.json",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(SHELL)).then(()=> self.skipWaiting()));
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e)=>{
  const req = e.request;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;
  e.respondWith((async ()=>{
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    try{
      const fresh = await fetch(req);
      // update cached
      if(req.method==="GET" && fresh.ok){
        cache.put(req, fresh.clone());
      }
      return fresh;
    }catch{
      return cached || Response.error();
    }
  })());
});
