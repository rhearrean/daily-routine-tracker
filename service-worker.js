const CACHE_NAME="daily-routine-v11-1-6";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"11.1.6",summary:"Adds a temporary Today-only switch between two time blocks.",notes:["Choose the normally scheduled block and the replacement block in Settings.","Today uses the replacement block and its assigned habits without changing either block's active days.","Clear the switch early if needed, or let the normal schedule return automatically tomorrow.","Saved completion history and the data schema are unchanged."]};
const FILES_TO_CACHE=["./index.html?v=11.1.6","./style.css?v=11.1.6","./app.js?v=11.1.6","./manifest.json?v=11.1.6","./icons/icon-192.png","./icons/icon-512.png"];

// A newly installed worker waits until the user has exported a backup and
// explicitly approves the update from inside the app.
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES_TO_CACHE)));
  if(UPDATE_GATE_BOOTSTRAP)self.skipWaiting();
});

self.addEventListener("message",event=>{
  if(event.data?.type==="ACTIVATE_AFTER_BACKUP")event.waitUntil(self.skipWaiting());
  if(event.data?.type==="GET_RELEASE_META"&&event.source)event.source.postMessage({type:"RELEASE_META",meta:RELEASE_META});
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put("./index.html",copy));
      return response;
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=11.1.6"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

