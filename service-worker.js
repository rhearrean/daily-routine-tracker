const CACHE_NAME="daily-routine-v12-0-3";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"12.0.3",summary:"Makes routine steps smaller and clearer to complete.",notes:["Each step now has a visible checkbox on the left and a small Skip button on the right.","Tapping an active checkbox completes the step; tapping the completed checkbox again clears it when the sequence allows.","The separate Undo button is removed to reduce card height and scrolling.","Locked steps remain visibly locked until the prior step is completed or skipped.","Pause, Resume, Delete, and Today-only switch confirmations now show their explanation on a new line.","No routine, step, history, or schema data is cleared."]};
const FILES_TO_CACHE=["./index.html?v=12.0.3","./style.css?v=12.0.3","./app.js?v=12.0.3","./manifest.json?v=12.0.3","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=12.0.3"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

