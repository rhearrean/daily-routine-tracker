const CACHE_NAME="daily-routine-v12-0-1";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"12.0.1",summary:"Rebuilds the app around ordered routines and steps instead of clock-based time blocks.",notes:["Existing habits and their checklist steps migrate into ordered routines.","Routines are scheduled by weekday and appear in a saved manual order without start or end times.","Duplicate step names are allowed and remain separate checklist items.","Optional step locking requires completing or skipping the active step before the next step unlocks.","Repeat counters are retired; repeated actions are represented by separate ordered steps.","The Today-only switch now replaces one routine with another, such as Office with WFH.","Skipped details stay closed until Review Skipped is opened.","The original v11 data remains stored as a fallback and is included in v12 backups."]};
const FILES_TO_CACHE=["./index.html?v=12.0.1","./style.css?v=12.0.1","./app.js?v=12.0.1","./manifest.json?v=12.0.1","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=12.0.1"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

