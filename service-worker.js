const CACHE_NAME="daily-routine-v11-1-2";
const UPDATE_GATE_BOOTSTRAP=false;
const RELEASE_META={version:"11.1.2",summary:"This intentionally detailed release verifies that the complete update screen scrolls correctly on smaller iPhone screens while simplifying repeatable-habit controls.",notes:["Repeatable habits now provide one clear way to record each completion.","A repeatable habit with routine steps uses its Log 1 Time button.","A repeatable habit without steps uses a single Log Completion button.","The extra +1 button is hidden when the habit already has a step-based log button.","Tapping the main card no longer creates a second completion for a habit without steps.","The −1 Undo button has been removed from Today.","Each recorded repeat is locked to prevent accidental changes from the main screen.","The current count remains visible beside the habit name.","Optional targets still determine when the occurrence is complete for Today.","Counts may still continue beyond a target by logging another completion.","Repeatable settings and targets remain editable from Settings.","This longer list is included specifically so the update card must scroll.","Backup confirmation and installation safeguards remain unchanged.","Saved habits, completion history, settings, and the data schema remain unchanged."]};
const FILES_TO_CACHE=["./index.html?v=11.1.2","./style.css?v=11.1.2","./app.js?v=11.1.2","./manifest.json?v=11.1.2","./icons/icon-192.png","./icons/icon-512.png"];

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
    }).catch(()=>caches.match("./index.html").then(response=>response||caches.match("./index.html?v=11.1.2"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)));
});

