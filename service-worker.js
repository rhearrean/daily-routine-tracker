const CACHE_NAME="daily-routine-v12-2-0";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"12.2.0",summary:"Adds automatic or manual start behavior for each routine.",notes:["Choose Start automatically or Wait until I start it in each routine's editor.","A manual routine unlocks in sequence but remains collapsed until Start Routine is pressed.","Starting it expands the routine and keeps later routines locked until it is resolved.","Completing or skipping the routine collapses it and makes the next routine available.","Manual-start state resets the following day without changing the saved schedule.","Existing routines continue to start automatically unless changed.","Manual-start state is included in backups and recovery snapshots.","No routines, progress, history, or schema 8 data is cleared."]};
const FILES_TO_CACHE=["./index.html?v=12.2.0","./style.css?v=12.2.0","./app.js?v=12.2.0","./manifest.json?v=12.2.0","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=12.2.0"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

