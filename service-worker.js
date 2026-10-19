const CACHE_NAME="daily-routine-v12-6-0";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"12.6.0",summary:"Adds unscheduled routines to Today without replacing scheduled routines.",notes:["Today Only now adds a selected routine instead of switching one routine for another.","All normally scheduled routines stay in place, including Lunch and Evening.","Added routines use their normal saved order and disappear automatically tomorrow.","More than one routine can be added for Today, and Clear Added Routines removes the temporary additions early.","An active old-style switch is converted into an addition so its selected replacement is preserved.","No routine schedules, progress, history, or schema 8 data are changed."]};
const FILES_TO_CACHE=["./index.html?v=12.6.0","./style.css?v=12.6.0","./app.js?v=12.6.0","./manifest.json?v=12.6.0","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=12.6.0"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

