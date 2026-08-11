const CACHE_NAME="77-team-manager-v22.8.5-a5";
const APP_SHELL=[
  "./","./index.html","./manifest.json","./css/style.css?v=22.8.5",
  "./js/ui.js?v=22.8.5-a5","./js/main.js?v=22.8.5-a5","./js/firebase-config.js",
  "./icons/icon-192.png","./icons/icon-512.png",
  "./assets/logo-77-team-manager-nova.webp","./assets/logo-77-team-manager-oficial.png",
  "./assets/logo-77-team-vertical.webp","./assets/primetools-labs.png"
];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;
  }).catch(()=>caches.match(event.request).then(response=>response||caches.match("./index.html"))));
});
