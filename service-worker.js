const CACHE_NAME="daily-routine-v12-5-0";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"12.5.0",summary:"Lets one step move safely from one routine to another.",notes:["Each saved step has a compact Move control in the routine editor.","Choose a destination routine and the step is appended to its bottom when Save Changes is pressed.","Weekday scheduling, Repeat, and shared rotating substeps move with the step.","Undo Move is available before saving, and a routine cannot be left without a step.","Existing history, settings, and schema 8 data remain unchanged."]};
const FILES_TO_CACHE=["./index.html?v=12.5.0","./style.css?v=12.5.0","./app.js?v=12.5.0","./manifest.json?v=12.5.0","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=12.5.0"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

