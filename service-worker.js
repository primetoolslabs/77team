const CACHE_NAME="77-team-manager-v22.9.32-homepresence1";
const STATIC_ASSETS=[
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/logo-77-team-manager-nova.webp",
  "./assets/logo-77-team-manager-oficial.png",
  "./assets/logo-77-team-vertical.webp",
  "./assets/primetools-labs.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>Promise.allSettled(STATIC_ASSETS.map(url=>cache.add(url))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  // HTML, CSS and JS are always network-first and are never allowed
  // to fall back to an obsolete app shell.
  if(
    event.request.mode==="navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ){
    event.respondWith(
      fetch(event.request,{cache:"no-store"})
        .catch(()=>new Response("Offline",{status:503,statusText:"Offline"}))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response && response.ok){
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }))
  );
});
