const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const app=read("app.js");
const html=read("index.html");
const worker=read("service-worker.js");
const style=read("style.css");

assert.match(app,/version:"11\.1\.1"/);
assert.match(app,/schemaVersion:7/);
assert.match(app,/updateViaCache:"none"/);
assert.match(app,/Installing Update…/);
assert.match(app,/Open Updated Version/);
assert.match(app,/ACTIVATE_AFTER_BACKUP/);
assert.match(app,/const sameWaitingUpdate=waitingServiceWorker===worker&&!E\.updateSheet\.classList\.contains\("hidden"\)/);
assert.match(app,/if\(sameWaitingUpdate\)return/);
assert.match(app,/delete expandedRoutineSteps\[o\.id\]/);
assert.match(app,/function routineStepsForOccurrence/);
assert.match(app,/step\.createdAt<=entry\.completedAt/);
assert.match(app,/createdAt:new Date\(\)\.toISOString\(\)/);
assert.match(app,/routine-step-up/);
assert.match(app,/routine-step-down/);
assert.match(app,/function isHabitPausedOn/);
assert.match(app,/function pauseHabit/);
assert.match(app,/pausePeriods/);
assert.match(app,/paused:false/);
assert.match(app,/function showUpdateReleaseInfo/);
assert.match(app,/GET_RELEASE_META/);
assert.match(app,/event\.data\?\.type==="RELEASE_META"/);
assert.match(app,/function renderEndOfDay/);
assert.match(app,/due\.length>0&&due\.every/);
assert.match(app,/endOfDayRoutineExpanded/);
assert.match(app,/h\.occurrences\.filter\(o=>blockIsActiveOn\(blockById\(o\.block\),d\)\)/);
assert.match(app,/repeatable:h\.repeatable===true/);
assert.match(app,/function addRepeatCompletion/);
assert.match(app,/function removeRepeatCompletion/);
assert.match(app,/repeatCount/);
assert.match(app,/repeatLog/);
assert.match(app,/autoCollapse&&!hasRepeatable/);
assert.match(html,/<div class="brand-row"><p class="eyebrow">Daily Routine<\/p><span id="headerVersionBadge"/);
assert.match(html,/id="endOfDayCard"/);
assert.match(html,/id="todayRoutineCard"/);
assert.match(html,/Review Skipped/);
assert.match(html,/id="updateReleaseSummary"/);
assert.match(html,/id="updateReleaseNotes"/);
assert.match(html,/id="habitRepeatable"/);
assert.match(html,/id="habitRepeatTarget"/);
assert.match(style,/\.brand-row\{/);
assert.match(style,/\.routine-step-reorder\{/);
assert.match(style,/\.habit-status-pill\{/);
assert.match(style,/\.update-release-summary\{/);
assert.match(style,/\.end-of-day-card\{/);
assert.match(style,/\.repeat-actions\{/);
assert.match(style,/max-height:calc\(100dvh - 36px\)/);
assert.match(style,/overflow-y:auto/);

for(const asset of ["manifest.json","style.css","app.js"]){
  assert.match(html,new RegExp(`${asset.replace(".","\\.")}[?]v=11\\.1\\.1`));
}

assert.match(worker,/CACHE_NAME="daily-routine-v11-1-1"/);
assert.match(worker,/const RELEASE_META=\{version:"11\.1\.1"/);
assert.match(worker,/UPDATE_GATE_BOOTSTRAP=false/);
assert.match(worker,/if\(UPDATE_GATE_BOOTSTRAP\)self\.skipWaiting\(\)/);
assert.match(worker,/ACTIVATE_AFTER_BACKUP/);
assert.match(worker,/event\.request\.mode==="navigate"/);
assert.match(worker,/fetch\(event\.request,\{cache:"no-store"\}\)/);
assert.match(worker,/GET_RELEASE_META/);
assert.match(worker,/RELEASE_META/);
assert.doesNotMatch(worker,/11\.1\.0/);

console.log("Safe update assertions passed for v11.1.1");
