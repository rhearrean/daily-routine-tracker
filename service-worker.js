const CACHE_NAME="daily-routine-v12-0-8";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"12.0.8",summary:"Adds Priority Next Time for individually skipped steps.",notes:["Flag any skipped step as Priority Next Time from its row or Review Skipped.","A temporary extra copy appears first in that same routine's next scheduled occurrence.","Permanent routine steps and duplicate counts remain unchanged.","Multiple flagged steps retain their original relative order.","Clearing a skip or resetting Today also clears the priority created from it.","Completed and skipped priority copies do not repeat unless flagged again.","Priority carryovers are included in backups and recovery snapshots.","No routine, step, history, or schema data is cleared."]};
const FILES_TO_CACHE=["./index.html?v=12.0.8","./style.css?v=12.0.8","./app.js?v=12.0.8","./manifest.json?v=12.0.8","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=12.0.8"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

