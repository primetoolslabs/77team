const CACHE_NAME="77-team-manager-v22.9.34";
const FIREBASE_SDK=[
  "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js"
];
const APP_SHELL=[
  "./","./index.html","./manifest.json","./css/style.css?v=22.9.34",
  "./js/ui.js?v=22.9.34","./js/main.js?v=22.9.34","./js/firebase-config.js","./js/pdf-generator.js?v=22.9.34",
  "./icons/icon-192.png","./icons/icon-512.png",
  "./assets/logo-77-team-manager-nova.webp","./assets/logo-77-team-manager-oficial.png",
  "./assets/logo-77-team-vertical.webp","./assets/primetools-labs.png"
];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
  await cache.addAll(APP_SHELL);
  await Promise.allSettled(FIREBASE_SDK.map(url=>cache.add(url)));
}).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url),sameOrigin=url.origin===self.location.origin,isFirebase=FIREBASE_SDK.includes(url.href);
  if(!sameOrigin&&!isFirebase)return;
  if(isFirebase){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response})));
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;
  }).catch(()=>caches.match(event.request).then(response=>response||(event.request.mode==="navigate"?caches.match("./index.html"):Response.error()))));
});
