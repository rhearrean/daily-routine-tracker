const APP_META={version:"10.10.6",build:"2026.08.18.locked-update-flow",schemaVersion:7,releaseDate:"August 18, 2026",releaseNotes:["Fixed the Update Approved screen getting stuck before Update Ready.","Backup confirmation now becomes available after a single export attempt on iPhone.","All update controls are locked and a progress indicator is shown during activation."]};
const HABITS_KEY="dailyRoutineHabits.v10_1",COMPLETIONS_KEY="dailyRoutineCompletions.v10_1",BLOCKS_KEY="dailyRoutineTimeBlocks.v10_1",SETTINGS_KEY="dailyRoutineSettings.v10_3",ROUTINE_STEPS_KEY="dailyRoutineSteps.v10_8_8";
const OLD_KEYS=[["dailyRoutineHabits.v10","dailyRoutineCompletions.v10","dailyRoutineTimeBlocks.v10"],["dailyRoutineHabits.v9","dailyRoutineCompletions.v9",null],["dailyRoutineHabits.v8","dailyRoutineCompletions.v8",null],["dailyRoutineHabits.v7","dailyRoutineCompletions.v7",null],["dailyRoutineHabits.v6","dailyRoutineCompletions.v6",null],["dailyRoutineHabits.v5","dailyRoutineCompletions.v5",null],["dailyRoutineHabits.v4","dailyRoutineCompletions.v4",null],["dailyRoutineHabits.v3","dailyRoutineCompletions.v3",null],["dailyRoutineHabits.v2","dailyRoutineCompletions.v2",null]];
const DEFAULT_BLOCKS=[{id:"early",label:"🌅 Early Morning",start:"05:00",end:"07:59"},{id:"morning",label:"☀️ Morning",start:"08:00",end:"11:59"},{id:"afternoon",label:"🌤 Afternoon",start:"12:00",end:"15:59"},{id:"late-afternoon",label:"🌇 Late Afternoon",start:"16:00",end:"19:59"},{id:"evening",label:"🌙 Evening",start:"20:00",end:"23:59"},{id:"anytime",label:"Anytime",start:"",end:""}],defaultHabits=[{id:"read-book",name:"Read my book",schedule:"daily",days:[],occurrences:[{id:"read-book-evening",block:"evening"}],cutoff:"",allowLate:true}];
const $=id=>document.getElementById(id);let selectedCustomDays=[],selectedOccurrenceBlocks=[],selectedRoutineSteps=[],selectedBlockDays=[0,1,2,3,4,5,6],editingHabitId=null,editingBlockId=null,pendingDeleteBlockId=null,activeAction=null,expandedCompletedBlocks={},expandedRoutineSteps={},skipReviewExpanded=false,recoveryTimer=null,waitingServiceWorker=null,updateReadyShown=false;
const E={todayTitle:$("todayTitle"),dateText:$("dateText"),mainVersionText:$("mainVersionText"),headerVersionBadge:$("headerVersionBadge"),progressText:$("progressText"),progressPercent:$("progressPercent"),timeBlocks:$("timeBlocks"),emptyTodayText:$("emptyTodayText"),resetTodayBtn:$("resetTodayBtn"),streakText:$("streakText"),weekText:$("weekText"),recentDays:$("recentDays"),habitForm:$("habitForm"),habitName:$("habitName"),habitSchedule:$("habitSchedule"),customDays:$("customDays"),allHabits:$("allHabits"),habitStats:$("habitStats"),openAddHabitBtn:$("openAddHabitBtn"),openStatsBtn:$("openStatsBtn"),closeStatsBtn:$("closeStatsBtn"),statsPanel:$("statsPanel"),openSettingsBtn:$("openSettingsBtn"),closeSettingsBtn:$("closeSettingsBtn"),habitEditorSheet:$("habitEditorSheet"),closeHabitEditorBtn:$("closeHabitEditorBtn"),settingsPanel:$("settingsPanel"),exportBtn:$("exportBtn"),importBtn:$("importBtn"),backupBox:$("backupBox"),backupText:$("backupBox"),backupMessage:$("backupMessage"),recoveryStatus:$("recoveryStatus"),restoreRecoveryBtn:$("restoreRecoveryBtn"),updateSheet:$("updateSheet"),updateExportBtn:$("updateExportBtn"),updateBackupConfirmed:$("updateBackupConfirmed"),installUpdateBtn:$("installUpdateBtn"),laterUpdateBtn:$("laterUpdateBtn"),updateStatus:$("updateStatus"),formTitle:$("formTitle"),formModeLabel:$("formModeLabel"),saveHabitBtn:$("saveHabitBtn"),cancelEditBtn:$("cancelEditBtn"),habitCutoff:$("habitCutoff"),habitAllowLate:$("habitAllowLate"),occurrenceBlocks:$("occurrenceBlocks"),blockSettings:$("blockSettings"),saveBlocksBtn:$("saveBlocksBtn"),appInfo:$("appInfo"),actionSheet:$("actionSheet"),actionTitle:$("actionTitle"),actionCompleteBtn:$("actionCompleteBtn"),actionSkipBtn:$("actionSkipBtn"),actionClearBtn:$("actionClearBtn"),actionCancelBtn:$("actionCancelBtn"),autoCollapseBlocks:$("autoCollapseBlocks"),skipReviewCard:$("skipReviewCard"),skipReviewToggle:$("skipReviewToggle"),skipReviewCount:$("skipReviewCount"),skipReviewMessage:$("skipReviewMessage"),skipReviewChevron:$("skipReviewChevron"),skipReviewDetails:$("skipReviewDetails"),addBlockBtn:$("addBlockBtn"),blockEditorSheet:$("blockEditorSheet"),blockForm:$("blockForm"),blockFormModeLabel:$("blockFormModeLabel"),blockFormTitle:$("blockFormTitle"),blockName:$("blockName"),blockStart:$("blockStart"),blockEnd:$("blockEnd"),blockTimeFields:$("blockTimeFields"),blockConflictMessage:$("blockConflictMessage"),saveBlockBtn:$("saveBlockBtn"),closeBlockEditorBtn:$("closeBlockEditorBtn"),cancelBlockEditBtn:$("cancelBlockEditBtn"),blockActiveDaysWrap:$("blockActiveDaysWrap"),blockActiveDays:$("blockActiveDays"),settingsAddHabitBtn:$("settingsAddHabitBtn"),deleteBlockBtn:$("deleteBlockBtn"),blockDeleteSheet:$("blockDeleteSheet"),blockDeleteTitle:$("blockDeleteTitle"),blockDeleteSummary:$("blockDeleteSummary"),blockDeleteAffected:$("blockDeleteAffected"),blockDeleteMoveTarget:$("blockDeleteMoveTarget"),closeBlockDeleteBtn:$("closeBlockDeleteBtn"),cancelBlockDeleteBtn:$("cancelBlockDeleteBtn"),confirmMoveDeleteBtn:$("confirmMoveDeleteBtn"),confirmRemoveDeleteBtn:$("confirmRemoveDeleteBtn")};
function safeParse(v,f){try{return JSON.parse(v)||f}catch{return f}}function getLocalDateKey(d=new Date()){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}function dateFromOffset(o=0){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+o);return d}function getTodayKey(){return getLocalDateKey(new Date())}function nowMinutes(){const d=new Date();return d.getHours()*60+d.getMinutes()}function timeToMinutes(v){if(!v)return null;const[h,m]=v.split(":").map(Number);return h*60+m}function formatTime(v){if(!v)return"";const[h,m]=v.split(":").map(Number),d=new Date();d.setHours(h,m,0,0);return d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}function blockTimeLabel(b){return b.start&&b.end?`${formatTime(b.start)} – ${formatTime(b.end)}`:"Anytime"}function makeId(name){const slug=String(name||"habit").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");return`${slug||"habit"}-${Date.now()}`}
function loadSettings(){return{autoCollapseCompletedBlocks:true,...safeParse(localStorage.getItem(SETTINGS_KEY),{})}}function saveSettings(settings){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));scheduleRecoverySnapshot("settings changed")}
function normalizeBlock(block){const rawDays=Array.isArray(block.days)&&block.days.length?block.days:[0,1,2,3,4,5,6],days=[...new Set(rawDays.map(Number).filter(day=>day>=0&&day<=6))].sort();return{id:String(block.id||`block-${Date.now()}-${Math.random().toString(36).slice(2,7)}`),label:String(block.label||"New Block").trim()||"New Block",start:block.id==="anytime"?"":String(block.start||""),end:block.id==="anytime"?"":String(block.end||""),days:block.id==="anytime"?[0,1,2,3,4,5,6]:days}}
function sortBlocks(blocks){const normalized=blocks.map(normalizeBlock),anytime=normalized.find(block=>block.id==="anytime")||normalizeBlock(DEFAULT_BLOCKS.find(block=>block.id==="anytime")),timed=normalized.filter(block=>block.id!=="anytime").sort((a,b)=>(blockMinutes(a.start)??9999)-(blockMinutes(b.start)??9999)||a.label.localeCompare(b.label));return[anytime,...timed]}
function loadBlocks(){
  const stored=safeParse(localStorage.getItem(BLOCKS_KEY),null);

  if(!Array.isArray(stored)||stored.length===0){
    const defaults=sortBlocks(DEFAULT_BLOCKS);
    saveBlocks(defaults);
    return defaults;
  }

  const blocks=stored.map(normalizeBlock);

  // Anytime is the only protected block. Do not restore deleted timed blocks.
  if(!blocks.some(block=>block.id==="anytime")){
    const anytimeDefault=DEFAULT_BLOCKS.find(block=>block.id==="anytime")||{id:"anytime",label:"Anytime",start:"",end:"",days:[0,1,2,3,4,5,6]};
    blocks.push(normalizeBlock(anytimeDefault));
    saveBlocks(blocks);
  }

  return sortBlocks(blocks);
}
function saveBlocks(blocks){localStorage.setItem(BLOCKS_KEY,JSON.stringify(sortBlocks(blocks)));scheduleRecoverySnapshot("time blocks changed")}function blockOrderMap(){const m={};loadBlocks().forEach((b,i)=>m[b.id]=i);return m}function sortOccurrences(occ){const o=blockOrderMap();return[...occ].sort((a,b)=>(o[a.block]??999)-(o[b.block]??999))}
function orderedTodayBlocks(){return loadBlocks().filter(block=>blockIsActiveOn(block,new Date()))}


function currentMinutes(){
  const d=new Date();
  return d.getHours()*60+d.getMinutes();
}
function blockMinutes(value){
  if(!value)return null;
  const parts=value.split(":").map(Number);
  return parts[0]*60+parts[1];
}
function isCurrentTimedBlock(block){
  if(block.id==="anytime"||!block.start||!block.end)return false;
  const now=currentMinutes();
  const start=blockMinutes(block.start);
  const end=blockMinutes(block.end);
  if(start===null||end===null)return false;
  return now>=start&&now<=end;
}
function getBlockVisualClass(block,completed,eligible){
  const classes=[];
  if(block.id==="anytime")classes.push("anytime-block");
  if(isCurrentTimedBlock(block))classes.push("current-block");
  if(block.id!=="anytime"&&eligible>0&&completed>=eligible)classes.push("completed-block");
  return classes.join(" ");
}

function blockById(id){return loadBlocks().find(b=>b.id===id)||DEFAULT_BLOCKS.find(b=>b.id==="anytime")}function blockLabel(id){return blockById(id)?.label||"Anytime"}
function normalizeCompletionEntry(e){if(e===true)return{state:"done",done:true,status:"done",completedAt:""};if(e&&typeof e==="object"){const state=e.state||(e.skipped?"skipped":(e.done!==false?"done":"pending"));return{...e,state,done:state==="done",status:e.status||state}}return null}function normalizeHabit(h){const oldBlock=h.block||"anytime";let occ=Array.isArray(h.occurrences)&&h.occurrences.length>0?h.occurrences:[{id:`${h.id||makeId(h.name||"habit")}-${oldBlock}`,block:oldBlock}];occ=occ.map((o,i)=>({id:o.id||`${h.id||makeId(h.name||"habit")}-${o.block||oldBlock}-${i}`,block:o.block||oldBlock}));const routineSteps=Array.isArray(h.routineSteps)?h.routineSteps.map((s,i)=>typeof s==="string"?{id:`step-${i}-${makeId(s)}`,text:s}:{id:s.id||`step-${i}-${makeId(s.text||"step")}`,text:String(s.text||"").trim()}).filter(s=>s.text):[];return{id:h.id||makeId(h.name||"Habit"),name:h.name||"Habit",schedule:h.schedule||"daily",days:Array.isArray(h.days)?h.days:[],occurrences:sortOccurrences(occ),cutoff:h.cutoff||"",allowLate:h.allowLate!==false,snoozeUntil:h.snoozeUntil||"",routineSteps}}
function migrateOldDataOnce(){if(!localStorage.getItem(BLOCKS_KEY)){for(const[,,bk]of OLD_KEYS){if(bk){const ob=safeParse(localStorage.getItem(bk),null);if(Array.isArray(ob)&&ob.length>0){saveBlocks(ob);break}}}if(!localStorage.getItem(BLOCKS_KEY))saveBlocks(DEFAULT_BLOCKS)}if(!localStorage.getItem(HABITS_KEY)){for(const[hk]of OLD_KEYS){const oh=safeParse(localStorage.getItem(hk),null);if(Array.isArray(oh)&&oh.length>0){saveHabits(oh.map(normalizeHabit));break}}}if(!localStorage.getItem(COMPLETIONS_KEY)){for(const[,ck]of OLD_KEYS){const old=safeParse(localStorage.getItem(ck),null);if(old&&typeof old==="object"){const habits=loadHabits(),converted={};Object.keys(old).forEach(dateKey=>{converted[dateKey]={};Object.keys(old[dateKey]||{}).forEach(key=>{const habit=habits.find(h=>h.id===key);if(habit)converted[dateKey][habit.occurrences[0].id]=normalizeCompletionEntry(old[dateKey][key]);else converted[dateKey][key]=normalizeCompletionEntry(old[dateKey][key])})});saveCompletions(converted);break}}}}
function formatDateLabel(){const d=new Date();E.todayTitle.textContent=d.toLocaleDateString(undefined,{weekday:"long"});E.dateText.textContent=d.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"});if(E.mainVersionText)E.mainVersionText.textContent="";if(E.headerVersionBadge)E.headerVersionBadge.textContent=`v${APP_META.version}`}function loadHabits(){const s=safeParse(localStorage.getItem(HABITS_KEY),null);if(!s||!Array.isArray(s)||s.length===0){saveHabits(defaultHabits);return defaultHabits}return s.map(normalizeHabit)}function saveHabits(h){localStorage.setItem(HABITS_KEY,JSON.stringify(h.map(normalizeHabit)));scheduleRecoverySnapshot("habits changed")}function loadCompletions(){return safeParse(localStorage.getItem(COMPLETIONS_KEY),{})}function saveCompletions(d){localStorage.setItem(COMPLETIONS_KEY,JSON.stringify(d));scheduleRecoverySnapshot("routine progress changed")}

function loadRoutineStepState(){return safeParse(localStorage.getItem(ROUTINE_STEPS_KEY),{})}
function saveRoutineStepState(d){localStorage.setItem(ROUTINE_STEPS_KEY,JSON.stringify(d));scheduleRecoverySnapshot("routine steps changed")}
function getRoutineStepState(dateKey,occurrenceId){return loadRoutineStepState()[dateKey]?.[occurrenceId]||{}}
function isRoutineStepDone(dateKey,occurrenceId,stepId){return getRoutineStepState(dateKey,occurrenceId)[stepId]===true}
function toggleRoutineStep(dateKey,occurrenceId,stepId){
  const all=loadRoutineStepState();
  all[dateKey]=all[dateKey]||{};
  all[dateKey][occurrenceId]=all[dateKey][occurrenceId]||{};
  all[dateKey][occurrenceId][stepId]=!all[dateKey][occurrenceId][stepId];
  saveRoutineStepState(all);
  render();
}
function clearRoutineStepsForOccurrence(dateKey,occurrenceId){
  const all=loadRoutineStepState();
  if(all[dateKey])delete all[dateKey][occurrenceId];
  saveRoutineStepState(all);
}
function routineStepProgress(h,dateKey,occurrenceId){
  const steps=h.routineSteps||[],done=steps.filter(s=>isRoutineStepDone(dateKey,occurrenceId,s.id)).length;
  return{done,total:steps.length};
}
function renderRoutineStepsEditor(){
  if(!E.routineStepsList)return;
  E.routineStepsList.innerHTML="";
  if(!selectedRoutineSteps.length){
    E.routineStepsList.innerHTML='<p class="helper-text no-top">No steps added. The habit will work normally.</p>';
    return;
  }
  selectedRoutineSteps.forEach((step,index)=>{
    const row=document.createElement("div");
    row.className="routine-step-editor-row";
    row.innerHTML=`<input type="text" value="${String(step.text).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}" aria-label="Routine step ${index+1}"/><button type="button" class="danger-btn remove-step-btn" aria-label="Remove step">✕</button>`;
    row.querySelector("input").addEventListener("input",e=>{selectedRoutineSteps[index].text=e.target.value});
    row.querySelector(".remove-step-btn").addEventListener("click",()=>{selectedRoutineSteps.splice(index,1);renderRoutineStepsEditor()});
    E.routineStepsList.appendChild(row);
  });
}
function addRoutineStep(){
  selectedRoutineSteps.push({id:`step-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,text:""});
  renderRoutineStepsEditor();
  const inputs=E.routineStepsList.querySelectorAll("input");
  if(inputs.length)inputs[inputs.length-1].focus();
}
function setupRoutineStepsField(){
  if(E.routineStepsList)return;
  const cutoffLabel=E.habitCutoff?.closest("label");
  if(!cutoffLabel)return;
  const wrap=document.createElement("div");
  wrap.className="routine-steps-editor";
  wrap.innerHTML='<div class="routine-steps-editor-header"><div><label class="standalone-label">Routine Steps <span class="optional-text">(optional)</span></label><p class="helper-text no-top">These steps reset separately for each time-block occurrence.</p></div><button id="addRoutineStepBtn" class="small-btn" type="button">＋ Add Step</button></div><div id="routineStepsList"></div>';
  cutoffLabel.parentNode.insertBefore(wrap,cutoffLabel);
  E.routineStepsList=document.getElementById("routineStepsList");
  E.addRoutineStepBtn=document.getElementById("addRoutineStepBtn");
  E.addRoutineStepBtn.addEventListener("click",addRoutineStep);
  renderRoutineStepsEditor();
}

function clearExpiredSnoozes(){
  const today=getLocalDateKey(new Date());
  const habits=loadHabits();
  let changed=false;
  const cleaned=habits.map(habit=>{
    if(habit.snoozeUntil&&habit.snoozeUntil<today){
      changed=true;
      return{...habit,snoozeUntil:""};
    }
    return habit;
  });
  if(changed)saveHabits(cleaned);
  return changed;
}
function isHabitSnoozed(h,d=new Date()){return !!(h.snoozeUntil&&getLocalDateKey(d)<h.snoozeUntil)}
function snoozeLabel(h){if(!h.snoozeUntil)return"";const parts=h.snoozeUntil.split("-").map(Number);const d=new Date(parts[0],parts[1]-1,parts[2]);return d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}
function resumeHabit(id){const habits=loadHabits();const i=habits.findIndex(h=>h.id===id);if(i>=0){habits[i]={...habits[i],snoozeUntil:""};saveHabits(habits);render()}}
function setupSnoozeField(){if(E.habitSnoozeUntil)return;const cutoff=E.habitCutoff;if(!cutoff)return;const label=document.createElement("label");label.innerHTML='Snooze until <input id="habitSnoozeUntil" type="date"/><small class="helper-text no-top">Leave blank to keep habit active.</small>';const allowLateLabel=E.habitAllowLate?E.habitAllowLate.closest("label"):null;if(allowLateLabel&&allowLateLabel.parentNode)allowLateLabel.parentNode.insertBefore(label,allowLateLabel);else cutoff.closest("label").after(label);E.habitSnoozeUntil=document.getElementById("habitSnoozeUntil")}
function isHabitDue(h,d){if(isHabitSnoozed(h,d))return false;const day=d.getDay();if(h.schedule==="daily")return true;if(h.schedule==="weekdays")return day>=1&&day<=5;if(h.schedule==="weekends")return day===0||day===6;if(h.schedule==="custom")return h.days.includes(day);return true}function dueOccurrencesOn(d){return loadHabits().filter(h=>isHabitDue(h,d)).flatMap(h=>h.occurrences.map(o=>({habit:h,occurrence:o})))}function completionEntry(k,id){return normalizeCompletionEntry(loadCompletions()[k]?.[id])}function stateOf(k,id){return completionEntry(k,id)?.state||"pending"}function isDone(k,id){return stateOf(k,id)==="done"}function isSkipped(k,id){return stateOf(k,id)==="skipped"}function isResolved(k,id){return isDone(k,id)||isSkipped(k,id)}function completionStatus(k,id){return completionEntry(k,id)?.status||""}function isPastCutoff(h){const c=timeToMinutes(h.cutoff);return c!==null&&nowMinutes()>c}function getCurrentCompletionStatus(h){return!h.cutoff?"done":isPastCutoff(h)?"late":"done"}
function setOccurrenceState(k,h,o,state){const c=loadCompletions();c[k]=c[k]||{};if(state==="clear")delete c[k][o.id];else if(state==="skipped")c[k][o.id]={state:"skipped",done:false,status:"skipped",skippedAt:new Date().toISOString(),habitId:h.id,occurrenceId:o.id,block:o.block};else{const s=getCurrentCompletionStatus(h);if(s==="late"&&h.allowLate===false){alert("This occurrence is past its cutoff time.");return}c[k][o.id]={state:"done",done:true,status:s,completedAt:new Date().toISOString(),habitId:h.id,occurrenceId:o.id,block:o.block}}saveCompletions(c);render()}function toggleDone(k,h,o){isResolved(k,o.id)?setOccurrenceState(k,h,o,"clear"):setOccurrenceState(k,h,o,"done")}function openActionMenu(k,h,o){activeAction={dateKey:k,habit:h,occurrence:o};E.actionTitle.textContent=h.name;E.actionSheet.classList.remove("hidden")}function closeActionMenu(){activeAction=null;E.actionSheet.classList.add("hidden")}function resetToday(){skipReviewExpanded=false;const k=getTodayKey(),c=loadCompletions();delete c[k];saveCompletions(c);const steps=loadRoutineStepState();delete steps[k];saveRoutineStepState(steps);expandedRoutineSteps={};render()}
function deleteHabit(id){const h=loadHabits().find(x=>x.id===id);saveHabits(loadHabits().filter(x=>x.id!==id));if(h){const ids=h.occurrences.map(o=>o.id),c=loadCompletions();Object.keys(c).forEach(k=>ids.forEach(id=>{if(c[k])delete c[k][id]}));saveCompletions(c);const steps=loadRoutineStepState();Object.keys(steps).forEach(k=>ids.forEach(id=>{if(steps[k])delete steps[k][id]}));saveRoutineStepState(steps)}if(editingHabitId===id)resetFormMode();render()}
function getDailyProgress(d){const k=getLocalDateKey(d),due=dueOccurrencesOn(d),total=due.length,completed=due.filter(i=>isDone(k,i.occurrence.id)).length,skipped=due.filter(i=>isSkipped(k,i.occurrence.id)).length,eligible=total-skipped;return{completed,total,skipped,eligible,percent:eligible===0?100:Math.round(completed/eligible*100)}}function getOverallCurrentStreak(){const t=getDailyProgress(new Date());let o=(t.eligible>0&&t.completed<t.eligible)?-1:0,s=0;for(;o>-365;o--){const p=getDailyProgress(dateFromOffset(o));if(p.total===0||p.eligible===0)continue;if(p.completed===p.eligible)s++;else break}return s}function getHabitCurrentStreak(h){const k=getTodayKey();let eligible=h.occurrences.filter(o=>!isSkipped(k,o.id)),complete=eligible.length>0&&eligible.every(o=>isDone(k,o.id)),offset=(isHabitDue(h,new Date())&&eligible.length>0&&!complete)?-1:0,s=0;for(;offset>-365;offset--){const d=dateFromOffset(offset),key=getLocalDateKey(d);if(!isHabitDue(h,d))continue;const e=h.occurrences.filter(o=>!isSkipped(key,o.id));if(e.length===0)continue;if(e.every(o=>isDone(key,o.id)))s++;else break}return s}function getHabitLongestStreak(h,days=365){let b=0,c=0;for(let o=-days+1;o<=0;o++){const d=dateFromOffset(o),k=getLocalDateKey(d);if(!isHabitDue(h,d))continue;const e=h.occurrences.filter(x=>!isSkipped(k,x.id));if(e.length===0)continue;if(e.every(x=>isDone(k,x.id))){c++;b=Math.max(b,c)}else c=0}return b}function getHabitWindowStats(h,days){let due=0,completed=0,onTime=0,late=0,missed=0,skipped=0;for(let o=-days+1;o<=0;o++){const d=dateFromOffset(o),k=getLocalDateKey(d);if(!isHabitDue(h,d))continue;h.occurrences.forEach(x=>{due++;if(isSkipped(k,x.id))skipped++;else if(isDone(k,x.id)){completed++;completionStatus(k,x.id)==="late"?late++:onTime++}else missed++})}const eligible=due-skipped;return{completed,due,eligible,missed,onTime,late,skipped,percent:eligible===0?100:Math.round(completed/eligible*100),onTimePercent:completed===0?0:Math.round(onTime/completed*100)}}function getHabitTotalStats(h){const c=loadCompletions();let completed=0,onTime=0,late=0,skipped=0;const ids=h.occurrences.map(o=>o.id);Object.keys(c).forEach(k=>ids.forEach(id=>{if(c[k]?.[id]){if(stateOf(k,id)==="skipped")skipped++;else{completed++;completionStatus(k,id)==="late"?late++:onTime++}}}));return{completed,onTime,late,skipped}}function getWeekCount(){let completed=0,daysWithHabits=0;for(let o=0;o>-7;o--){const p=getDailyProgress(dateFromOffset(o));if(p.total===0||p.eligible===0)continue;daysWithHabits++;if(p.completed===p.eligible)completed++}return{completed,daysWithHabits}}
function scheduleLabel(h){if(h.schedule==="daily")return"Every day";if(h.schedule==="weekdays")return"Weekdays";if(h.schedule==="weekends")return"Weekends";const labels=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];return h.days.map(d=>labels[d]).join(", ")||"Custom"}function getHabitStats(h){const l7=getHabitWindowStats(h,7),l30=getHabitWindowStats(h,30),t=getHabitTotalStats(h);return{id:h.id,name:h.name,schedule:scheduleLabel(h),occurrences:h.occurrences.map(o=>({id:o.id,block:o.block,label:blockLabel(o.block)})),cutoff:h.cutoff||"",allowLate:h.allowLate,currentStreak:getHabitCurrentStreak(h),longestStreak:getHabitLongestStreak(h),last7Days:l7,last30Days:l30,totalCompleted:t.completed,totalOnTime:t.onTime,totalLate:t.late,totalSkipped:t.skipped}}
function isPastTimedBlock(block){if(!block||block.id==="anytime"||!block.end)return false;const end=blockMinutes(block.end);if(end===null)return false;return currentMinutes()>end}
function shouldCollapseBlock(block,blockComplete){if(blockComplete)return true;if(block.id==="anytime")return false;if(isCurrentTimedBlock(block))return false;if(isPastTimedBlock(block)&&!blockComplete)return false;return true}

function getTodaySkipReviewItems(){
  const date=new Date(),dateKey=getTodayKey();
  return dueOccurrencesOn(date).map(({habit,occurrence})=>{
    if(isSkipped(dateKey,occurrence.id)){
      return{habit,occurrence,type:"skipped"};
    }
    if(!isResolved(dateKey,occurrence.id)&&habit.allowLate===false&&isPastCutoff(habit)){
      return{habit,occurrence,type:"missed"};
    }
    return null;
  }).filter(Boolean);
}

function skipReviewOccurrenceLabel(habit,occurrence){
  if(habit.occurrences.length<=1)return habit.name;
  const sorted=sortOccurrences(habit.occurrences);
  const index=sorted.findIndex(item=>item.id===occurrence.id);
  return`${habit.name} (${index+1} of ${habit.occurrences.length})`;
}

function renderSkipReview(){
  if(!E.skipReviewCard)return;
  const items=getTodaySkipReviewItems(),count=items.length;
  E.skipReviewCard.classList.toggle("skip-review-clear",count===0);
  E.skipReviewCard.classList.toggle("skip-review-attention",count>0);
  E.skipReviewToggle.setAttribute("aria-expanded",String(skipReviewExpanded));

  if(count===0){
    E.skipReviewCount.textContent="Nothing Skipped Today";
    E.skipReviewMessage.textContent="Keep it up!";
    E.skipReviewChevron.textContent="✓";
    E.skipReviewDetails.classList.add("hidden");
    E.skipReviewDetails.innerHTML="";
    return;
  }

  E.skipReviewCount.textContent=`${count} ${count===1?"Habit":"Habits"}`;
  E.skipReviewMessage.textContent=skipReviewExpanded?"Hide Review":"Tap to Review";
  E.skipReviewChevron.textContent=skipReviewExpanded?"⌃":"⌄";

  if(!skipReviewExpanded){
    E.skipReviewDetails.classList.add("hidden");
    E.skipReviewDetails.innerHTML="";
    return;
  }

  E.skipReviewDetails.innerHTML="";
  const blocks=orderedTodayBlocks();
  blocks.forEach(block=>{
    const blockItems=items.filter(item=>item.occurrence.block===block.id);
    if(!blockItems.length)return;

    const group=document.createElement("div");
    group.className="skip-review-group";
    group.innerHTML=`<h3>${block.label}</h3>`;

    const list=document.createElement("div");
    list.className="skip-review-list";

    blockItems.forEach(({habit,occurrence,type})=>{
      const row=document.createElement("div");
      row.className="skip-review-item";
      row.innerHTML=`<span class="skip-review-item-name">${skipReviewOccurrenceLabel(habit,occurrence)}</span><span class="skip-review-item-status ${type}">${type==="missed"?"Missed cutoff":"Skipped"}</span>`;
      list.appendChild(row);
    });

    group.appendChild(list);
    E.skipReviewDetails.appendChild(group);
  });

  E.skipReviewDetails.classList.remove("hidden");
}

function blockSummaryText(completed,skipped,eligible){const total=eligible+skipped;let text=`${completed}/${total}`;if(skipped)text+=` · ${skipped} skip`;return text}function renderTimeBlocks(){E.timeBlocks.innerHTML="";const due=dueOccurrencesOn(new Date()),k=getTodayKey(),settings=loadSettings();E.emptyTodayText.classList.toggle("hidden",due.length>0);orderedTodayBlocks().forEach(block=>{const items=due.filter(i=>i.occurrence.block===block.id);if(!items.length)return;const completed=items.filter(i=>isDone(k,i.occurrence.id)).length,skipped=items.filter(i=>isSkipped(k,i.occurrence.id)).length,eligible=items.length-skipped,remaining=Math.max(eligible-completed,0),blockComplete=items.length>0&&remaining===0,autoCollapse=settings.autoCollapseCompletedBlocks!==false,collapsed=autoCollapse&&shouldCollapseBlock(block,blockComplete)&&!expandedCompletedBlocks[block.id],w=document.createElement("div");w.className=`time-block ${collapsed?"collapsed":""} ${blockComplete?"completed-block":""} ${isCurrentTimedBlock(block)?"current-block":""}`;const summary=blockComplete?blockSummaryText(completed,skipped,eligible):`${remaining} remaining`;w.innerHTML=`<div class="time-block-header"><div><h3>${collapsed?"▶":"▼"} ${block.label}${blockComplete?" ✓":""}</h3><small>${blockTimeLabel(block)} ${isCurrentTimedBlock(block)?`<span class="current-badge"><span class="current-dot"></span>Current</span>`:""}</small>${collapsed?`<div class="block-summary">${summary}</div>`:""}</div><span class="block-progress">${blockComplete?summary:`${completed}/${eligible}${skipped?` • ${skipped} skipped`:""}`}</span></div><div class="habit-list"></div>`;w.querySelector(".time-block-header").addEventListener("click",e=>{if(e.target.closest("button"))return;expandedCompletedBlocks[block.id]=collapsed;render()});const list=w.querySelector(".habit-list");items.forEach(({habit,occurrence})=>{const done=isDone(k,occurrence.id),skipped=isSkipped(k,occurrence.id),status=completionStatus(k,occurrence.id),locked=!done&&!skipped&&habit.allowLate===false&&isPastCutoff(habit),hasSteps=Array.isArray(habit.routineSteps)&&habit.routineSteps.length>0,expanded=!!expandedRoutineSteps[occurrence.id],progress=routineStepProgress(habit,k,occurrence.id),card=document.createElement("div");card.className=`habit-with-steps habit-card-shell ${hasSteps?"has-routine-steps":""} ${expanded?"steps-expanded":""}`;const row=document.createElement("div");row.className="habit-card-row";const b=document.createElement("button");b.className=`habit-button ${done?(status==="late"?"late":"done"):""} ${skipped?"skipped":""} ${locked?"locked":""}`;b.type="button";const sorted=sortOccurrences(habit.occurrences),num=habit.occurrences.length>1?` (${sorted.findIndex(o=>o.id===occurrence.id)+1} of ${habit.occurrences.length})`:"";const pill=skipped?`<span class="status-pill skipped">Skipped</span>`:done&&status==="late"&&habit.cutoff?`<span class="status-pill late">Late</span>`:locked?`<span class="status-pill locked">Missed cutoff</span>`:hasSteps?`<span class="status-pill routine-step-pill">${progress.done}/${progress.total} steps • ${expanded?"hide":"show"}</span>`:!done&&habit.cutoff?`<span class="status-pill">Target: ${formatTime(habit.cutoff)}</span>`:"";b.innerHTML=`<span class="checkbox"></span><span class="habit-button-content"><strong>${habit.name}${num}</strong>${pill}</span>${hasSteps?`<span class="steps-chevron">${expanded?"▲":"▼"}</span>`:""}`;b.addEventListener("click",e=>{e.stopPropagation();if(hasSteps){expandedRoutineSteps[occurrence.id]=!expanded;render()}else toggleDone(k,habit,occurrence)});row.appendChild(b);if(!done&&!skipped&&!locked){const skipBtn=document.createElement("button");skipBtn.type="button";skipBtn.className="habit-skip-btn";skipBtn.textContent="Skip";skipBtn.setAttribute("aria-label",`Skip ${habit.name}`);skipBtn.addEventListener("click",e=>{e.stopPropagation();setOccurrenceState(k,habit,occurrence,"skipped")});row.appendChild(skipBtn)}card.appendChild(row);if(hasSteps&&expanded){const panel=document.createElement("div");panel.className="routine-steps-panel";habit.routineSteps.forEach(step=>{const label=document.createElement("label");label.className="routine-step-check";label.innerHTML=`<input type="checkbox" ${isRoutineStepDone(k,occurrence.id,step.id)?"checked":""}/><span>${String(step.text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>`;label.querySelector("input").addEventListener("change",()=>toggleRoutineStep(k,occurrence.id,step.id));panel.appendChild(label)});const actions=document.createElement("div");actions.className="routine-step-actions";actions.innerHTML=`<span class="routine-step-count">${progress.done}/${progress.total} complete</span><button type="button" class="primary-btn inline routine-complete-btn">${done?"Clear Habit":"Complete Habit"}</button>`;actions.querySelector(".routine-complete-btn").addEventListener("click",()=>toggleDone(k,habit,occurrence));panel.appendChild(actions);card.appendChild(panel)}list.appendChild(card)});E.timeBlocks.appendChild(w)})}

function renderRecentDays(){E.recentDays.innerHTML="";for(let o=-6;o<=0;o++){const d=dateFromOffset(o),p=getDailyProgress(d),el=document.createElement("div");el.className=`day-pill ${p.eligible>0&&p.completed===p.eligible?"done":""}`;el.textContent=d.toLocaleDateString(undefined,{weekday:"short"});E.recentDays.appendChild(el)}}function occurrenceLabel(h){return sortOccurrences(h.occurrences).map(o=>blockLabel(o.block).replace(/^[^\w]+ /,"")).join(", ")}function moveHabit(id,direction){const habits=loadHabits();const index=habits.findIndex(h=>h.id===id);if(index<0)return;const target=index+direction;if(target<0||target>=habits.length)return;[habits[index],habits[target]]=[habits[target],habits[index]];saveHabits(habits);render()}
function renderAllHabits(){E.allHabits.innerHTML="";const habits=loadHabits();if(!habits.length){E.allHabits.innerHTML=`<p class="empty-text">No habits yet. Add one from Today.</p>`;return}habits.forEach((h,index)=>{const snoozed=isHabitSnoozed(h),row=document.createElement("div");row.className=`habit-row compact-habit-row ${snoozed?"snoozed-habit":""}`;const blocks=[...new Set(h.occurrences.map(o=>blockById(o.block).label))];let blockSummary="No block";if(blocks.length===1)blockSummary=blocks[0];else if(blocks.length<=3)blockSummary=blocks.join(" • ");else blockSummary=`${blocks.length} blocks`;row.innerHTML=`<div class="habit-row-main"><div class="compact-habit-title"><strong>${h.name}</strong></div><small>${blockSummary}</small></div><div class="habit-actions compact-habit-actions"><div class="reorder-actions"><button class="reorder-btn move-up-btn" type="button" aria-label="Move ${h.name} up" ${index===0?"disabled":""}>↑</button><button class="reorder-btn move-down-btn" type="button" aria-label="Move ${h.name} down" ${index===habits.length-1?"disabled":""}>↓</button></div>${snoozed?`<button class="small-btn resume-btn" type="button">Resume</button>`:""}<button class="edit-btn" type="button">Edit</button><button class="danger-btn compact-delete-btn" type="button" aria-label="Delete ${h.name}">✕</button></div>`;row.querySelector(".move-up-btn").addEventListener("click",()=>moveHabit(h.id,-1));row.querySelector(".move-down-btn").addEventListener("click",()=>moveHabit(h.id,1));const resume=row.querySelector(".resume-btn");if(resume)resume.addEventListener("click",()=>resumeHabit(h.id));row.querySelector(".edit-btn").addEventListener("click",()=>startEditHabit(h.id));row.querySelector(".compact-delete-btn").addEventListener("click",()=>{if(confirm(`Delete "${h.name}"?`))deleteHabit(h.id)});E.allHabits.appendChild(row)})}function renderHabitStats(){E.habitStats.innerHTML="";const habits=loadHabits();if(!habits.length){E.habitStats.innerHTML=`<p class="empty-text">No habit stats yet.</p>`;return}habits.forEach(h=>{const s=getHabitStats(h),card=document.createElement("div");card.className="habit-stat-card";card.innerHTML=`<strong>${s.name}</strong><small>${s.occurrences.map(o=>o.label).join(", ")} • ${s.schedule} • ${s.cutoff?formatTime(s.cutoff):"No cutoff"}</small><div class="metric-row"><div class="metric"><b>${s.currentStreak}</b><span>Current</span></div><div class="metric"><b>${s.longestStreak}</b><span>Longest</span></div><div class="metric"><b>${s.last30Days.percent}%</b><span>30 Days</span></div><div class="metric"><b>${s.totalSkipped}</b><span>Skipped</span></div><div class="metric"><b>${s.totalLate}</b><span>Late</span></div><div class="metric"><b>${s.totalCompleted}</b><span>Total</span></div></div>`;E.habitStats.appendChild(card)})}
const BLOCK_DAY_LABELS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function blockIsActiveOn(block,date=new Date()){return block.id==="anytime"||!Array.isArray(block.days)||block.days.includes(date.getDay())}
function formatBlockDays(block){if(block.id==="anytime"||!Array.isArray(block.days)||block.days.length===7)return"Every day";if(block.days.length===5&&[1,2,3,4,5].every(day=>block.days.includes(day)))return"Weekdays";if(block.days.length===2&&[0,6].every(day=>block.days.includes(day)))return"Weekends";return block.days.map(day=>BLOCK_DAY_LABELS[day]).join(" • ")}
function renderBlockActiveDays(){E.blockActiveDays.innerHTML="";BLOCK_DAY_LABELS.forEach((label,day)=>{const button=document.createElement("button");button.type="button";button.textContent=label;button.className=selectedBlockDays.includes(day)?"selected":"";button.addEventListener("click",()=>{selectedBlockDays=selectedBlockDays.includes(day)?selectedBlockDays.filter(value=>value!==day):[...selectedBlockDays,day].sort();button.classList.toggle("selected",selectedBlockDays.includes(day));clearBlockConflict()});E.blockActiveDays.appendChild(button)})}
function formatBlockRange(block){if(block.id==="anytime")return"No set time";return`${formatTime(block.start)} – ${formatTime(block.end)}`}
function clearBlockConflict(){if(!E.blockConflictMessage)return;E.blockConflictMessage.textContent="";E.blockConflictMessage.classList.add("hidden")}
function showBlockConflict(message){E.blockConflictMessage.textContent=message;E.blockConflictMessage.classList.remove("hidden")}
function openBlockEditor(blockId=null){editingBlockId=blockId;clearBlockConflict();if(blockId){const block=loadBlocks().find(item=>item.id===blockId);if(!block)return;E.blockFormTitle.textContent="Edit Block";E.blockName.value=block.label;E.blockStart.value=block.start||"";E.blockEnd.value=block.end||"";const isAnytime=block.id==="anytime";selectedBlockDays=isAnytime?[0,1,2,3,4,5,6]:(Array.isArray(block.days)?[...block.days]:[0,1,2,3,4,5,6]);E.blockTimeFields.classList.toggle("hidden",isAnytime);E.blockActiveDaysWrap.classList.toggle("hidden",isAnytime);E.blockForm.dataset.anytime=String(isAnytime);E.saveBlockBtn.textContent="Save Changes";E.deleteBlockBtn.classList.toggle("hidden",isAnytime)}else{E.blockFormTitle.textContent="Add Block";E.blockName.value="";E.blockStart.value="";E.blockEnd.value="";selectedBlockDays=[0,1,2,3,4,5,6];E.blockTimeFields.classList.remove("hidden");E.blockActiveDaysWrap.classList.remove("hidden");E.blockForm.dataset.anytime="false";E.saveBlockBtn.textContent="Add Block";E.deleteBlockBtn.classList.add("hidden")}renderBlockActiveDays();E.blockEditorSheet.classList.remove("hidden");setTimeout(()=>E.blockName.focus(),50)}
function closeBlockEditor(){editingBlockId=null;clearBlockConflict();E.blockEditorSheet.classList.add("hidden")}
function validateBlockDraft(draft,blocks){if(!draft.label)return"Enter a block name.";if(draft.id==="anytime")return"";if(!draft.start||!draft.end)return"Choose both a start and end time.";if(!Array.isArray(draft.days)||draft.days.length===0)return"Choose at least one active day.";const start=blockMinutes(draft.start),end=blockMinutes(draft.end);if(start===null||end===null)return"Choose valid start and end times.";if(start>=end)return"End time must be later than start time. Blocks that cross midnight are not supported yet.";const conflict=blocks.find(other=>{if(other.id===draft.id||other.id==="anytime"||!other.start||!other.end)return false;const otherDays=Array.isArray(other.days)&&other.days.length?other.days:[0,1,2,3,4,5,6];if(!otherDays.some(day=>draft.days.includes(day)))return false;const otherStart=blockMinutes(other.start),otherEnd=blockMinutes(other.end);return start<otherEnd&&end>otherStart});if(conflict){const otherDays=Array.isArray(conflict.days)&&conflict.days.length?conflict.days:[0,1,2,3,4,5,6],shared=otherDays.filter(day=>draft.days.includes(day)).map(day=>BLOCK_DAY_LABELS[day]).join(", ");return`Time conflict: this overlaps with ${conflict.label} (${formatBlockRange(conflict)}) on ${shared}. Change one of the time ranges or active days before saving.`}return""}
function saveBlockFromEditor(event){event.preventDefault();const blocks=loadBlocks(),existing=editingBlockId?blocks.find(block=>block.id===editingBlockId):null,isAnytime=existing?.id==="anytime",draft={id:existing?.id||`block-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,label:E.blockName.value.trim(),start:isAnytime?"":E.blockStart.value,end:isAnytime?"":E.blockEnd.value,days:isAnytime?[0,1,2,3,4,5,6]:[...selectedBlockDays].sort()},error=validateBlockDraft(draft,blocks);if(error){showBlockConflict(error);return}const next=existing?blocks.map(block=>block.id===existing.id?draft:block):[...blocks,draft];saveBlocks(next);closeBlockEditor();render();E.backupMessage.textContent=existing?"Time block updated.":"Time block added."}

function getBlockUsage(blockId){
  const usages=[];
  loadHabits().forEach(habit=>{
    habit.occurrences.forEach(occurrence=>{
      if(occurrence.block===blockId)usages.push({habitId:habit.id,habitName:habit.name,occurrenceId:occurrence.id});
    });
  });
  return usages;
}

function closeBlockDeleteSheet(){
  pendingDeleteBlockId=null;
  E.blockDeleteSheet.classList.add("hidden");
}

function deleteUnusedBlock(blockId){
  const block=loadBlocks().find(item=>item.id===blockId);
  if(!block||block.id==="anytime")return;
  if(!confirm(`Delete "${block.label}"?`))return;
  saveBlocks(loadBlocks().filter(item=>item.id!==blockId));
  if(editingBlockId===blockId)closeBlockEditor();
  render();
  E.backupMessage.textContent="Time block deleted.";
}

function openBlockDeleteReview(blockId){
  const block=loadBlocks().find(item=>item.id===blockId);
  if(!block||block.id==="anytime")return;

  const usages=getBlockUsage(blockId);
  if(!usages.length){deleteUnusedBlock(blockId);return}

  pendingDeleteBlockId=blockId;
  E.blockDeleteTitle.textContent=`Delete ${block.label}?`;
  E.blockDeleteSummary.textContent=`${usages.length} habit ${usages.length===1?"occurrence uses":"occurrences use"} this block. Choose what should happen before deleting it.`;

  E.blockDeleteAffected.innerHTML="";
  const counts={};
  usages.forEach(item=>{counts[item.habitName]=(counts[item.habitName]||0)+1});
  Object.entries(counts).forEach(([name,count])=>{
    const row=document.createElement("div");
    row.className="block-delete-item";
    row.innerHTML=`<strong>${name}</strong><small>${count>1?`${count} occurrences`:"1 occurrence"}</small>`;
    E.blockDeleteAffected.appendChild(row);
  });

  const targets=loadBlocks().filter(item=>item.id!==blockId);
  E.blockDeleteMoveTarget.innerHTML="";
  targets.forEach(target=>{
    const option=document.createElement("option");
    option.value=target.id;
    option.textContent=target.label;
    E.blockDeleteMoveTarget.appendChild(option);
  });

  E.confirmMoveDeleteBtn.disabled=targets.length===0;
  E.blockDeleteSheet.classList.remove("hidden");
}

function cleanupOccurrenceState(occurrenceIds){
  const completions=loadCompletions();
  Object.keys(completions).forEach(dateKey=>{
    occurrenceIds.forEach(id=>{
      if(completions[dateKey])delete completions[dateKey][id];
    });
  });
  saveCompletions(completions);

  const steps=loadRoutineStepState();
  Object.keys(steps).forEach(dateKey=>{
    occurrenceIds.forEach(id=>{
      if(steps[dateKey])delete steps[dateKey][id];
    });
  });
  saveRoutineStepState(steps);
}

function moveDeleteBlock(){
  const blockId=pendingDeleteBlockId;
  const targetId=E.blockDeleteMoveTarget.value;
  if(!blockId||!targetId||blockId===targetId)return;

  const habits=loadHabits().map(habit=>{
    const mapped=habit.occurrences.map(occurrence=>occurrence.block===blockId?{...occurrence,block:targetId}:occurrence);
    const seen=new Set(),deduped=[];
    mapped.forEach(occurrence=>{
      if(seen.has(occurrence.block))return;
      seen.add(occurrence.block);
      deduped.push(occurrence);
    });
    return{...habit,occurrences:sortOccurrences(deduped)};
  });

  saveHabits(habits);
  saveBlocks(loadBlocks().filter(item=>item.id!==blockId));
  closeBlockDeleteSheet();
  if(editingBlockId===blockId)closeBlockEditor();
  render();
  E.backupMessage.textContent="Habit occurrences moved and time block deleted.";
}

function removeOccurrencesDeleteBlock(){
  const blockId=pendingDeleteBlockId;
  if(!blockId)return;

  const removedIds=[];
  const nextHabits=loadHabits().map(habit=>{
    const removed=habit.occurrences.filter(occurrence=>occurrence.block===blockId);
    const remaining=habit.occurrences.filter(occurrence=>occurrence.block!==blockId);
    removed.forEach(occurrence=>removedIds.push(occurrence.id));
    if(!removed.length)return habit;
    if(remaining.length)return{...habit,occurrences:sortOccurrences(remaining)};
    return{...habit,occurrences:[{id:`${habit.id}-anytime-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,block:"anytime"}]};
  });

  saveHabits(nextHabits);
  cleanupOccurrenceState(removedIds);
  saveBlocks(loadBlocks().filter(item=>item.id!==blockId));
  closeBlockDeleteSheet();
  if(editingBlockId===blockId)closeBlockEditor();
  render();
  E.backupMessage.textContent="Affected occurrences removed and time block deleted.";
}
function renderBlockSettings(){E.blockSettings.innerHTML="";loadBlocks().forEach(block=>{const row=document.createElement("div");row.className=`compact-setting-row ${block.id==="anytime"?"protected-block-row":""}`;const details=block.id==="anytime"?`${formatBlockRange(block)} • Pinned`:`${formatBlockRange(block)} • ${formatBlockDays(block)}`;row.innerHTML=`<div class="compact-setting-copy"><strong>${block.label}</strong><small>${details}</small></div><button class="edit-btn block-edit-btn" type="button">Edit</button>`;row.querySelector(".block-edit-btn").addEventListener("click",()=>openBlockEditor(block.id));E.blockSettings.appendChild(row)})}
function renderOccurrenceButtons(){E.occurrenceBlocks.innerHTML="";loadBlocks().forEach(block=>{const b=document.createElement("button");b.type="button";b.dataset.block=block.id;b.className=selectedOccurrenceBlocks.includes(block.id)?"selected":"";b.textContent=block.label;b.addEventListener("click",()=>{selectedOccurrenceBlocks=selectedOccurrenceBlocks.includes(block.id)?selectedOccurrenceBlocks.filter(id=>id!==block.id):[...selectedOccurrenceBlocks,block.id];b.classList.toggle("selected",selectedOccurrenceBlocks.includes(block.id))});E.occurrenceBlocks.appendChild(b)})}function renderDisplaySettings(){if(E.autoCollapseBlocks)E.autoCollapseBlocks.checked=loadSettings().autoCollapseCompletedBlocks!==false}function renderAppInfo(){E.appInfo.innerHTML=`<div class="info-row"><strong>Version ${APP_META.version}</strong><small>Build ${APP_META.build}</small><small>Schema ${APP_META.schemaVersion}</small><small>Released ${APP_META.releaseDate}</small></div><div class="release-note"><strong>Release Notes</strong><ul>${APP_META.releaseNotes.map(n=>`<li>${n}</li>`).join("")}</ul></div>`}
function makeBackupPayload(){
  return {
    schemaVersion:APP_META.schemaVersion,
    exportedAt:new Date().toISOString(),
    appVersion:APP_META.version,
    habits:loadHabits(),
    completions:loadCompletions(),
    routineStepState:loadRoutineStepState(),
    blocks:loadBlocks(),
    settings:loadSettings()
  };
}
function openRecoveryDb(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open("dailyRoutineRecovery",1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains("snapshots"))db.createObjectStore("snapshots",{keyPath:"createdAt"});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function listRecoverySnapshots(){
  const db=await openRecoveryDb();
  return new Promise((resolve,reject)=>{
    const request=db.transaction("snapshots","readonly").objectStore("snapshots").getAll();
    request.onsuccess=()=>resolve(request.result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
    request.onerror=()=>reject(request.error);
  });
}
async function createRecoverySnapshot(reason="app opened"){
  const snapshot={createdAt:new Date().toISOString(),reason,payload:makeBackupPayload()};
  const db=await openRecoveryDb();
  await new Promise((resolve,reject)=>{
    const request=db.transaction("snapshots","readwrite").objectStore("snapshots").put(snapshot);
    request.onsuccess=resolve;
    request.onerror=()=>reject(request.error);
  });
  const snapshots=await listRecoverySnapshots();
  if(snapshots.length>5){
    const tx=db.transaction("snapshots","readwrite"),store=tx.objectStore("snapshots");
    snapshots.slice(5).forEach(item=>store.delete(item.createdAt));
  }
  updateRecoveryStatus(snapshot);
  return snapshot;
}
function scheduleRecoverySnapshot(reason){
  clearTimeout(recoveryTimer);
  recoveryTimer=setTimeout(()=>createRecoverySnapshot(reason).catch(showRecoveryError),400);
}
function showRecoveryError(){
  if(E.recoveryStatus)E.recoveryStatus.textContent="Recovery storage is unavailable. Use Export All Data for safety.";
}
function updateRecoveryStatus(snapshot){
  if(!snapshot)return;
  if(E.recoveryStatus)E.recoveryStatus.textContent=`Latest snapshot: ${new Date(snapshot.createdAt).toLocaleString()} (${snapshot.reason})`;
  if(E.restoreRecoveryBtn)E.restoreRecoveryBtn.disabled=false;
}
async function restoreLatestRecovery(){
  const [latest]=await listRecoverySnapshots();
  if(!latest){if(E.backupMessage)E.backupMessage.textContent="No recovery snapshot is available yet.";return;}
  if(!confirm(`Restore the snapshot from ${new Date(latest.createdAt).toLocaleString()}? This replaces the current app data.`))return;
  importBackupPayload(latest.payload);
  if(E.backupMessage)E.backupMessage.textContent="Latest recovery snapshot restored.";
}
function downloadBackupFile(){
  const payload=makeBackupPayload();
  const json=JSON.stringify(payload,null,2);
  const stamp=new Date().toISOString().slice(0,10);
  const blob=new Blob([json],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`daily-routine-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  if(E.backupText)E.backupText.value=json;
  if(E.backupMessage)E.backupMessage.textContent="Backup file created. Copy/paste backup text is still available below.";
  return payload;
}

function showWaitingUpdate(worker){
  waitingServiceWorker=worker;
  updateReadyShown=false;
  if(!E.updateSheet)return;
  E.updateSheet.classList.remove("is-updating");
  E.updateSheet.setAttribute("aria-busy","false");
  E.updateExportBtn.disabled=false;
  E.updateBackupConfirmed.checked=false;
  E.updateBackupConfirmed.disabled=true;
  E.installUpdateBtn.disabled=true;
  E.installUpdateBtn.textContent="2. Install Update";
  E.laterUpdateBtn.textContent="Remind Me Later";
  E.laterUpdateBtn.dataset.action="later";
  E.laterUpdateBtn.className="small-btn";
  E.laterUpdateBtn.disabled=false;
  E.updateStatus.textContent="The current version remains active until you finish these steps.";
  E.updateSheet.classList.remove("hidden");
}
function setUpdateBusy(){
  E.updateSheet.classList.add("is-updating");
  E.updateSheet.setAttribute("aria-busy","true");
  E.updateExportBtn.disabled=true;
  E.updateBackupConfirmed.disabled=true;
  E.installUpdateBtn.disabled=true;
  E.installUpdateBtn.textContent="Installing Update…";
  E.installUpdateBtn.classList.add("updating");
  E.laterUpdateBtn.disabled=true;
}
function markUpdateReady(){
  if(updateReadyShown)return;
  updateReadyShown=true;
  waitingServiceWorker=null;
  E.updateSheet.classList.remove("is-updating");
  E.updateSheet.setAttribute("aria-busy","false");
  E.installUpdateBtn.classList.remove("updating");
  E.installUpdateBtn.textContent="Update Ready";
  E.updateStatus.textContent="Update ready. Open the updated version when you are ready.";
  E.laterUpdateBtn.textContent="Open Updated Version";
  E.laterUpdateBtn.dataset.action="reload";
  E.laterUpdateBtn.className="primary-btn";
  E.laterUpdateBtn.disabled=false;
}
function setupSafeUpdateFlow(){
  if(E.updateExportBtn)E.updateExportBtn.addEventListener("click",()=>{
    E.updateBackupConfirmed.disabled=false;
    E.updateStatus.textContent="Backup export started. Save it to Files or iCloud Drive, then confirm below.";
    downloadBackupFile();
  });
  if(E.updateBackupConfirmed)E.updateBackupConfirmed.addEventListener("change",()=>{
    E.installUpdateBtn.disabled=!E.updateBackupConfirmed.checked;
  });
  if(E.installUpdateBtn)E.installUpdateBtn.addEventListener("click",()=>{
    if(!waitingServiceWorker||!E.updateBackupConfirmed.checked)return;
    const worker=waitingServiceWorker;
    setUpdateBusy();
    E.updateStatus.textContent="Installing the update. Controls are locked until it is ready.";
    const checkWorkerState=()=>{if(worker.state==="activated")markUpdateReady();};
    worker.addEventListener("statechange",checkWorkerState);
    worker.postMessage({type:"ACTIVATE_AFTER_BACKUP"});
    setTimeout(checkWorkerState,1500);
    setTimeout(()=>{if(!updateReadyShown)E.updateStatus.textContent="Still installing… Keep the app open a little longer.";},12000);
  });
  if(E.laterUpdateBtn)E.laterUpdateBtn.addEventListener("click",()=>{
    if(E.laterUpdateBtn.dataset.action==="reload")location.reload();
    else E.updateSheet.classList.add("hidden");
  });
  if(!("serviceWorker" in navigator))return;
  navigator.serviceWorker.addEventListener("controllerchange",markUpdateReady);
  navigator.serviceWorker.register("service-worker.js",{updateViaCache:"none"}).then(registration=>{
    const checkForUpdate=()=>{
      if(registration.waiting)showWaitingUpdate(registration.waiting);
      registration.update().catch(()=>{});
    };
    if(registration.waiting)showWaitingUpdate(registration.waiting);
    registration.addEventListener("updatefound",()=>{
      const worker=registration.installing;
      if(!worker)return;
      worker.addEventListener("statechange",()=>{
        if(worker.state==="installed"&&navigator.serviceWorker.controller)showWaitingUpdate(worker);
      });
    });
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkForUpdate();});
    window.addEventListener("pageshow",checkForUpdate);
    setInterval(checkForUpdate,5*60*1000);
    checkForUpdate();
  }).catch(()=>{});
}


function validateBackupPayload(parsed){
  if(!parsed||typeof parsed!=="object")throw new Error("Backup file is empty or invalid.");
  if(!Array.isArray(parsed.habits))throw new Error("Backup is missing habits.");
  if(!parsed.completions||typeof parsed.completions!=="object")throw new Error("Backup is missing completion history.");
  if(!Array.isArray(parsed.blocks)&&!Array.isArray(parsed.timeBlocks))throw new Error("Backup is missing time blocks.");
  return parsed;
}
function importBackupPayload(parsed){
  const data=validateBackupPayload(parsed);
  saveHabits(data.habits);
  saveCompletions(data.completions);
  if(data.blocks||data.timeBlocks)saveBlocks(data.blocks||data.timeBlocks);
  if(data.settings)saveSettings(data.settings);
  if(data.routineStepState)saveRoutineStepState(data.routineStepState);
  resetFormMode();
  render();
  if(E.backupMessage)E.backupMessage.textContent="Backup file imported.";
}

function ensureBackupFileInput(){
  let input=document.getElementById("backupFileInput");
  if(!input){
    input=document.createElement("input");
    input.id="backupFileInput";
    input.type="file";
    input.accept="application/json,.json";
    input.className="hidden";
    input.style.display="none";
    document.body.appendChild(input);
  }
  if(E)E.backupFileInput=input;
  return input;
}

function chooseBackupFile(){const input=ensureBackupFileInput();input.value="";input.click();}


function setupBackupActionButtons(){
  ensureBackupFileInput();
  if(!E.importBtn||document.getElementById("importFileBtn"))return;

  const importTextBtn=document.createElement("button");
  importTextBtn.id="importTextBtn";
  importTextBtn.type="button";
  importTextBtn.className="small-btn";
  importTextBtn.textContent="Import from Text";

  const importFileBtn=document.createElement("button");
  importFileBtn.id="importFileBtn";
  importFileBtn.type="button";
  importFileBtn.className="small-btn";
  importFileBtn.textContent="Import JSON File";

  E.importBtn.textContent="Import JSON File";
  E.importBtn.parentNode.insertBefore(importFileBtn,E.importBtn.nextSibling);
  E.importBtn.parentNode.insertBefore(importTextBtn,importFileBtn.nextSibling);

  E.importBtn.style.display="none";

  importFileBtn.addEventListener("click",chooseBackupFile);
  importTextBtn.addEventListener("click",()=>{
    if(!E.backupText||!E.backupText.value.trim()){
      if(E.backupMessage)E.backupMessage.textContent="Paste backup text first, or use Import JSON File.";
      return;
    }
    try{
      importBackupPayload(JSON.parse(E.backupText.value));
    }catch(e){
      if(E.backupMessage)E.backupMessage.textContent=e.message||"Import failed. Check backup text.";
    }
  });
}

function render(){renderTimeBlocks();renderSkipReview();const streak=getOverallCurrentStreak();E.streakText.textContent=`${streak} ${streak===1?"day":"days"}`;const week=getWeekCount();E.weekText.textContent=`${week.completed}/${week.daysWithHabits||7}`;renderRecentDays();renderAllHabits();renderHabitStats();renderBlockSettings();renderOccurrenceButtons();renderDisplaySettings();renderAppInfo()}
function setSelectedCustomDays(days){selectedCustomDays=[...days];E.customDays.querySelectorAll("button").forEach(b=>b.classList.toggle("selected",selectedCustomDays.includes(Number(b.dataset.day))))}function setSelectedOccurrenceBlocks(blocks){selectedOccurrenceBlocks=[...blocks];renderOccurrenceButtons()}function resetFormMode(){editingHabitId=null;selectedRoutineSteps=[];renderRoutineStepsEditor();E.habitName.value="";E.habitSchedule.value="daily";E.habitCutoff.value="";if(E.habitSnoozeUntil)E.habitSnoozeUntil.value="";E.habitAllowLate.checked=true;setSelectedCustomDays([]);setSelectedOccurrenceBlocks(["evening"]);E.customDays.classList.add("hidden");E.formModeLabel.textContent="Manage Habits";E.formTitle.textContent="Add Habit";E.saveHabitBtn.textContent="Add Habit";E.cancelEditBtn.classList.add("hidden")}function openHabitEditor(){E.habitEditorSheet.classList.remove("hidden");document.body.style.overflow="hidden"}function closeHabitEditor(){E.habitEditorSheet.classList.add("hidden");document.body.style.overflow=E.settingsPanel.classList.contains("hidden")?"":"hidden"}function openAddHabit(){resetFormMode();openHabitEditor()}function startEditHabit(id){const h=loadHabits().find(x=>x.id===id);if(!h)return;editingHabitId=id;E.habitName.value=h.name;E.habitSchedule.value=h.schedule;E.habitCutoff.value=h.cutoff||"";if(E.habitSnoozeUntil)E.habitSnoozeUntil.value=h.snoozeUntil||"";E.habitAllowLate.checked=h.allowLate!==false;setSelectedCustomDays(Array.isArray(h.days)?h.days:[]);setSelectedOccurrenceBlocks(h.occurrences.map(o=>o.block));selectedRoutineSteps=(h.routineSteps||[]).map(s=>({...s}));renderRoutineStepsEditor();E.customDays.classList.toggle("hidden",h.schedule!=="custom");E.formModeLabel.textContent="Editing Habit";E.formTitle.textContent="Edit Habit";E.saveHabitBtn.textContent="Save Changes";E.cancelEditBtn.classList.remove("hidden");openHabitEditor()}function saveHabitFromForm(e){e.preventDefault();const name=E.habitName.value.trim(),schedule=E.habitSchedule.value;if(!name){alert("Add a habit name first.");return}if(schedule==="custom"&&selectedCustomDays.length===0){alert("Choose at least one custom day.");return}if(selectedOccurrenceBlocks.length===0){alert("Choose at least one occurrence block.");return}const habits=loadHabits(),oldHabit=editingHabitId?habits.find(h=>h.id===editingHabitId):null,habitId=editingHabitId||makeId(name),oldByBlock={};if(oldHabit)oldHabit.occurrences.forEach(o=>oldByBlock[o.block]=o.id);const occurrences=sortOccurrences(selectedOccurrenceBlocks.map((block,index)=>({id:oldByBlock[block]||`${habitId}-${block}-${Date.now()}-${index}`,block})));const routineSteps=selectedRoutineSteps.map(s=>({id:s.id||`step-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,text:String(s.text||"").trim()})).filter(s=>s.text);const data={name,schedule,days:schedule==="custom"?[...selectedCustomDays].sort():[],occurrences,cutoff:E.habitCutoff.value,allowLate:E.habitAllowLate.checked,snoozeUntil:E.habitSnoozeUntil?E.habitSnoozeUntil.value:"",routineSteps};if(editingHabitId){const i=habits.findIndex(h=>h.id===editingHabitId);if(i>=0)habits[i]={...habits[i],...data}}else habits.push({id:habitId,...data});saveHabits(habits);resetFormMode();closeHabitEditor();render()}function saveBlockSettings(){}function openStats(){E.statsPanel.classList.remove("hidden");document.body.style.overflow="hidden"}function closeStats(){E.statsPanel.classList.add("hidden");document.body.style.overflow=""}function openSettings(){E.settingsPanel.classList.remove("hidden");document.body.style.overflow="hidden"}function closeSettings(){E.settingsPanel.classList.add("hidden");document.body.style.overflow=""}
function getExportPayload(){const habits=loadHabits(),completions=loadCompletions(),timeBlocks=loadBlocks();return{schemaVersion:APP_META.schemaVersion,appVersion:APP_META.version,build:APP_META.build,exportedAt:new Date().toISOString(),timeBlocks,settings:loadSettings(),habits,completions,routineStepState:loadRoutineStepState(),stats:{overall:{currentStreak:getOverallCurrentStreak(),thisWeek:getWeekCount(),today:getDailyProgress(new Date())},byHabit:habits.map(getHabitStats)}}}function exportHabits(){E.backupBox.value=JSON.stringify(getExportPayload(),null,2);E.backupBox.focus();E.backupBox.select();if(navigator.clipboard)navigator.clipboard.writeText(E.backupBox.value).catch(()=>{});E.backupMessage.textContent="Backup created with habits, occurrences, completed/skipped history, time blocks, and stats."}
function normalizeImportedCompletions(rawCompletions){
  if(!rawCompletions||typeof rawCompletions!=="object")return {};
  const habits=loadHabits();
  const habitIdToOccurrences={};
  const occurrenceIds=new Set();
  habits.forEach(h=>{
    habitIdToOccurrences[h.id]=h.occurrences||[];
    (h.occurrences||[]).forEach(o=>occurrenceIds.add(o.id));
  });
  const normalized={};
  Object.keys(rawCompletions).forEach(dateKey=>{
    normalized[dateKey]=normalized[dateKey]||{};
    Object.keys(rawCompletions[dateKey]||{}).forEach(key=>{
      const entry=normalizeCompletionEntry(rawCompletions[dateKey][key]);
      if(!entry)return;
      if(occurrenceIds.has(key)){
        normalized[dateKey][key]=entry;
        return;
      }
      const occurrences=habitIdToOccurrences[key];
      if(Array.isArray(occurrences)&&occurrences.length){
        occurrences.forEach(o=>{normalized[dateKey][o.id]={...entry,occurrenceId:o.id,habitId:key,block:o.block};});
        return;
      }
      normalized[dateKey][key]=entry;
    });
  });
  return normalized;
}
function rebuildAfterImport(){
  expandedCompletedBlocks={};
  formatDateLabel();
  resetFormMode();
  render();
  setTimeout(()=>render(),50);
}
function importHabits(){const text=E.backupBox.value.trim();if(!text){E.backupMessage.textContent="Paste your backup first.";return}const parsed=safeParse(text,null),habits=Array.isArray(parsed)?parsed:parsed?.habits;if(!Array.isArray(habits)||habits.length===0){E.backupMessage.textContent="That backup does not look valid.";return}if(Array.isArray(parsed?.timeBlocks))saveBlocks(parsed.timeBlocks);if(parsed?.settings&&typeof parsed.settings==="object")saveSettings(parsed.settings);saveHabits(habits.map(normalizeHabit));if(parsed?.completions&&typeof parsed.completions==="object")saveCompletions(normalizeImportedCompletions(parsed.completions));if(parsed?.routineStepState&&typeof parsed.routineStepState==="object")saveRoutineStepState(parsed.routineStepState);if(parsed.routineStepState&&typeof parsed.routineStepState==="object")saveRoutineStepState(parsed.routineStepState);rebuildAfterImport();E.backupMessage.textContent="Data imported. Dashboard rebuilt from backup history.";}
E.habitSchedule.addEventListener("change",()=>E.customDays.classList.toggle("hidden",E.habitSchedule.value!=="custom"));E.customDays.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{const day=Number(b.dataset.day);selectedCustomDays=selectedCustomDays.includes(day)?selectedCustomDays.filter(d=>d!==day):[...selectedCustomDays,day];b.classList.toggle("selected",selectedCustomDays.includes(day))}));E.habitForm.addEventListener("submit",saveHabitFromForm);E.cancelEditBtn.addEventListener("click",()=>{resetFormMode();closeHabitEditor()});E.resetTodayBtn.addEventListener("click",resetToday);
E.skipReviewToggle.addEventListener("click",()=>{
  if(getTodaySkipReviewItems().length===0)return;
  skipReviewExpanded=!skipReviewExpanded;
  renderSkipReview();
});E.openAddHabitBtn.addEventListener("click",openAddHabit);E.closeHabitEditorBtn.addEventListener("click",()=>{resetFormMode();closeHabitEditor()});E.habitEditorSheet.addEventListener("click",e=>{if(e.target===E.habitEditorSheet){resetFormMode();closeHabitEditor()}});E.openStatsBtn.addEventListener("click",openStats);E.closeStatsBtn.addEventListener("click",closeStats);E.openSettingsBtn.addEventListener("click",openSettings);E.closeSettingsBtn.addEventListener("click",closeSettings);
E.addBlockBtn.addEventListener("click",()=>openBlockEditor());
E.settingsAddHabitBtn.addEventListener("click",openAddHabit);
E.closeBlockEditorBtn.addEventListener("click",closeBlockEditor);
E.cancelBlockEditBtn.addEventListener("click",closeBlockEditor);
E.deleteBlockBtn.addEventListener("click",()=>{if(editingBlockId)openBlockDeleteReview(editingBlockId)});
E.closeBlockDeleteBtn.addEventListener("click",closeBlockDeleteSheet);
E.cancelBlockDeleteBtn.addEventListener("click",closeBlockDeleteSheet);
E.confirmMoveDeleteBtn.addEventListener("click",moveDeleteBlock);
E.confirmRemoveDeleteBtn.addEventListener("click",removeOccurrencesDeleteBlock);
E.blockDeleteSheet.addEventListener("click",event=>{if(event.target===E.blockDeleteSheet)closeBlockDeleteSheet()});
E.blockForm.addEventListener("submit",saveBlockFromEditor);
E.blockStart.addEventListener("input",clearBlockConflict);
E.blockEnd.addEventListener("input",clearBlockConflict);
E.blockName.addEventListener("input",clearBlockConflict);
E.blockEditorSheet.addEventListener("click",event=>{if(event.target===E.blockEditorSheet)closeBlockEditor()});E.exportBtn.addEventListener("click",exportHabits);E.importBtn.addEventListener("click",importHabits);E.actionCompleteBtn.addEventListener("click",()=>{if(activeAction){setOccurrenceState(activeAction.dateKey,activeAction.habit,activeAction.occurrence,"done");closeActionMenu()}});E.actionSkipBtn.addEventListener("click",()=>{if(activeAction){setOccurrenceState(activeAction.dateKey,activeAction.habit,activeAction.occurrence,"skipped");closeActionMenu()}});E.actionClearBtn.addEventListener("click",()=>{if(activeAction){setOccurrenceState(activeAction.dateKey,activeAction.habit,activeAction.occurrence,"clear");closeActionMenu()}});E.actionCancelBtn.addEventListener("click",closeActionMenu);E.actionSheet.addEventListener("click",e=>{if(e.target===E.actionSheet)closeActionMenu()});if(E.autoCollapseBlocks)E.autoCollapseBlocks.addEventListener("change",()=>{saveSettings({...loadSettings(),autoCollapseCompletedBlocks:E.autoCollapseBlocks.checked});expandedCompletedBlocks={};render()});
if(E.exportBtn)E.exportBtn.addEventListener("click",downloadBackupFile);
if(E.restoreRecoveryBtn)E.restoreRecoveryBtn.addEventListener("click",()=>restoreLatestRecovery().catch(showRecoveryError));

if(E.importBtn)E.importBtn.addEventListener("click",(e)=>{if(E.backupText&&!E.backupText.value.trim()){e.stopImmediatePropagation();chooseBackupFile();}},true);
ensureBackupFileInput();
if(E.backupFileInput){
  E.backupFileInput.addEventListener("change",()=>{
    const file=E.backupFileInput.files&&E.backupFileInput.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const parsed=JSON.parse(String(reader.result||""));
        importBackupPayload(parsed);
      }catch(e){
        if(E.backupMessage)E.backupMessage.textContent=e.message||"Import failed. Choose a valid JSON backup file.";
      }
    };
    reader.onerror=()=>{if(E.backupMessage)E.backupMessage.textContent="Import failed. Could not read file."};
    reader.readAsText(file);
  });
}

setupSnoozeField();setupRoutineStepsField();migrateOldDataOnce();clearExpiredSnoozes();formatDateLabel();resetFormMode();render();setupBackupActionButtons();setupSafeUpdateFlow();createRecoverySnapshot("app opened").catch(showRecoveryError);

