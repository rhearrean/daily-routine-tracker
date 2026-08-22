const CACHE_NAME="daily-routine-v11-1-4";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"11.1.4",summary:"Locks completed repeat cards and restores time-block collapsing.",notes:["A targeted repeatable habit stays checked, shows Target Complete, and its entire card becomes disabled.","Future blocks collapse until their scheduled time begins.","Completed blocks collapse automatically, including those with repeatable habits.","Every time block can again be expanded or collapsed manually.","Saved data and the data schema are unchanged."]};
const FILES_TO_CACHE=["./index.html?v=11.1.4","./style.css?v=11.1.4","./app.js?v=11.1.4","./manifest.json?v=11.1.4","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=11.1.4"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

