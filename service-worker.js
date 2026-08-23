const CACHE_NAME="daily-routine-v11-1-5";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"11.1.5",summary:"Prevents accidental Pause and Resume taps in Settings.",notes:["Pausing a habit now asks for confirmation first.","Resuming a paused or snoozed habit also asks for confirmation.","The message explains whether the habit will leave or return to Today.","Saved data and the data schema are unchanged."]};
const FILES_TO_CACHE=["./index.html?v=11.1.5","./style.css?v=11.1.5","./app.js?v=11.1.5","./manifest.json?v=11.1.5","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=11.1.5"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

