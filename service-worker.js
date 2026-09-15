const CACHE_NAME="daily-routine-v12-0-4";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"12.0.4",summary:"Adds Today-only replacement for repeated routine steps.",notes:["A completed step shows Replace when the same routine still has pending steps with that original name.","Enter one temporary task and every remaining pending match in that routine is replaced after confirmation.","Completed and skipped matches are left unchanged.","Replacement steps keep their original positions and locked-step sequence.","Temporary steps are marked Today and automatically return to their original names tomorrow.","Backups and recovery snapshots include an active Today-only replacement; no permanent routine or history data is cleared."]};
const FILES_TO_CACHE=["./index.html?v=12.0.4","./style.css?v=12.0.4","./app.js?v=12.0.4","./manifest.json?v=12.0.4","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=12.0.4"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

