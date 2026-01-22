/* MixBlueprint Service Worker — cache-first for app shell/assets, network-first for JSON content */
const CACHE = "mbp-cache-v1.0.0";
const CORE = [
  "./",
  "./index.html",
  "./admin.html",
  "./styles/app.css",
  "./styles/admin.css",
  "./src/app.js",
  "./src/admin.js",
  "./src/router.js",
  "./src/content/manager.js",
  "./src/content/store.js",
  "./src/ui/icons.js",
  "./src/ui/render.js",
  "./src/ui/toast.js",
  "./src/utils/dom.js",
  "./src/utils/storage.js",
  "./src/utils/format.js",
  "./src/pwa/register.js",
  "./content/registry.json",
  "./content/core/manifest.json",
  "./content/core/data/genres.json",
  "./content/core/data/chains.json",
  "./content/dlc/lofi_pack/manifest.json",
  "./content/dlc/lofi_pack/data/genres.json",
  "./content/dlc/lofi_pack/data/chains.json",
  "./assets/textures/noise.png",
  "./assets/pwa/icon-192.png",
  "./assets/pwa/icon-512.png",
  "./assets/brand/favicon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

function isJSON(req){
  const url = new URL(req.url);
  return url.pathname.endsWith(".json");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // SPA navigation: serve app shell (index) for navigations
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match("./index.html");
      try{
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      }catch{
        return cached || fetch("./index.html");
      }
    })());
    return;
  }

  // JSON: network-first (so DLC edits via GitHub updates are picked up)
  if (isJSON(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try{
        const fresh = await fetch(req, { cache: "no-store" });
        cache.put(req, fresh.clone());
        return fresh;
      }catch{
        const cached = await cache.match(req);
        return cached || new Response(JSON.stringify({error:"offline"}), { status: 503, headers: {"content-type":"application/json"} });
      }
    })());
    return;
  }

  // Everything else: cache-first
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    cache.put(req, res.clone());
    return res;
  })());
});
