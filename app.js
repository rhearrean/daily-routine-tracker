const APP_META={
  version:"12.0.5",
  build:"2026.09.15.sequential-routine-focus",
  schemaVersion:8,
  releaseDate:"September 15, 2026",
  releaseNotes:[
    "Rebuilds Today around ordered routines instead of clock-based time blocks.",
    "Each routine contains ordered steps, including duplicate step names.",
    "Routines use weekday schedules and a saved display order.",
    "Optional step locking requires completing or skipping the active step before the next unlocks.",
    "Retires repeat counters; repeated actions are added as separate ordered steps.",
    "Migrates existing habits, steps, progress, pause settings, and history without deleting the v11 data.",
    "Replaces the Today-only time-block switch with a Today-only routine switch.",
    "Makes steps compact with a visible checkbox and small Skip control.",
    "Tapping a completed checkbox clears that step without a separate Undo button.",
    "Fixes confirmation dialogs so their explanatory text appears on a new line.",
    "Lets a completed duplicate step replace every remaining pending match for today only.",
    "Temporary replacement names return to their original names the next day.",
    "Keeps only the first unresolved routine open and locks later routines until it is finished.",
    "Completing a routine collapses it and automatically opens the next routine."
  ]
};

const ROUTINES_KEY="dailyRoutineRoutines.v12";
const PROGRESS_KEY="dailyRoutineProgress.v12";
const STEP_STATE_KEY="dailyRoutineStepState.v12";
const STEP_OVERRIDE_KEY="dailyRoutineStepOverrides.v12";
const SETTINGS_KEY="dailyRoutineSettings.v12";
const LEGACY_HABITS_KEY="dailyRoutineHabits.v10_1";
const LEGACY_COMPLETIONS_KEY="dailyRoutineCompletions.v10_1";
const LEGACY_BLOCKS_KEY="dailyRoutineTimeBlocks.v10_1";
const LEGACY_SETTINGS_KEY="dailyRoutineSettings.v10_3";
const LEGACY_STEPS_KEY="dailyRoutineSteps.v10_8_8";
const DAY_LABELS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const $=id=>document.getElementById(id);
const E={
  todayTitle:$("todayTitle"),dateText:$("dateText"),headerVersionBadge:$("headerVersionBadge"),
  openAddRoutineBtn:$("openAddRoutineBtn"),openStatsBtn:$("openStatsBtn"),openSettingsBtn:$("openSettingsBtn"),
  skipReviewCard:$("skipReviewCard"),skipReviewToggle:$("skipReviewToggle"),skipReviewCount:$("skipReviewCount"),
  skipReviewMessage:$("skipReviewMessage"),skipReviewChevron:$("skipReviewChevron"),skipReviewDetails:$("skipReviewDetails"),
  endOfDayCard:$("endOfDayCard"),endOfDayMessage:$("endOfDayMessage"),endOfDaySummary:$("endOfDaySummary"),
  endOfDayReviewBtn:$("endOfDayReviewBtn"),endOfDayRoutineBtn:$("endOfDayRoutineBtn"),
  todayRoutineCard:$("todayRoutineCard"),todayProgressText:$("todayProgressText"),resetTodayBtn:$("resetTodayBtn"),
  routineList:$("routineList"),emptyTodayText:$("emptyTodayText"),
  statsPanel:$("statsPanel"),closeStatsBtn:$("closeStatsBtn"),streakText:$("streakText"),weekText:$("weekText"),
  recentDays:$("recentDays"),routineStats:$("routineStats"),
  settingsPanel:$("settingsPanel"),closeSettingsBtn:$("closeSettingsBtn"),
  todayRoutineSwitchFrom:$("todayRoutineSwitchFrom"),todayRoutineSwitchTo:$("todayRoutineSwitchTo"),
  applyTodayRoutineSwitchBtn:$("applyTodayRoutineSwitchBtn"),clearTodayRoutineSwitchBtn:$("clearTodayRoutineSwitchBtn"),
  todayRoutineSwitchStatus:$("todayRoutineSwitchStatus"),settingsAddRoutineBtn:$("settingsAddRoutineBtn"),
  allRoutines:$("allRoutines"),autoCollapseRoutines:$("autoCollapseRoutines"),
  exportBtn:$("exportBtn"),importBtn:$("importBtn"),backupBox:$("backupBox"),backupMessage:$("backupMessage"),
  recoveryStatus:$("recoveryStatus"),restoreRecoveryBtn:$("restoreRecoveryBtn"),appInfo:$("appInfo"),
  routineEditorSheet:$("routineEditorSheet"),closeRoutineEditorBtn:$("closeRoutineEditorBtn"),
  routineForm:$("routineForm"),formModeLabel:$("formModeLabel"),formTitle:$("formTitle"),
  routineName:$("routineName"),routineSchedule:$("routineSchedule"),customDays:$("customDays"),
  lockSteps:$("lockSteps"),routineSnoozeUntil:$("routineSnoozeUntil"),addStepBtn:$("addStepBtn"),
  stepsEditorList:$("stepsEditorList"),saveRoutineBtn:$("saveRoutineBtn"),cancelEditBtn:$("cancelEditBtn"),
  updateSheet:$("updateSheet"),updateExportBtn:$("updateExportBtn"),updateBackupConfirmed:$("updateBackupConfirmed"),
  installUpdateBtn:$("installUpdateBtn"),laterUpdateBtn:$("laterUpdateBtn"),updateStatus:$("updateStatus"),
  updateReleaseSummary:$("updateReleaseSummary"),updateReleaseVersion:$("updateReleaseVersion"),
  updateReleaseNotes:$("updateReleaseNotes"),backupFileInput:$("backupFileInput")
};

let selectedDays=[];
let selectedSteps=[];
let editingRoutineId=null;
let manuallyCollapsed={};
let skipReviewExpanded=false;
let endOfDayRoutineExpanded=false;
let recoveryTimer=null;
let waitingServiceWorker=null;
let updateReadyShown=false;

function safeParse(value,fallback){
  try{return JSON.parse(value)||fallback}catch{return fallback}
}
function escapeHtml(value){
  return String(value||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function makeId(prefix){
  const slug=String(prefix||"item").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
  return (slug||"item")+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
}
function getLocalDateKey(date=new Date()){
  return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");
}
function getTodayKey(){return getLocalDateKey(new Date())}
function dateFromOffset(offset=0){
  const date=new Date();
  date.setHours(12,0,0,0);
  date.setDate(date.getDate()+offset);
  return date;
}
function rawLocal(key,fallback){return safeParse(localStorage.getItem(key),fallback)}
function uniqueDays(days){
  return [...new Set((Array.isArray(days)?days:[]).map(Number).filter(day=>day>=0&&day<=6))].sort();
}
function normalizeStep(step,index=0){
  if(typeof step==="string")return{id:makeId("step-"+index),text:step.trim(),createdAt:""};
  return{
    id:String(step&&step.id||makeId("step-"+index)),
    text:String(step&&step.text||"").trim(),
    createdAt:String(step&&step.createdAt||"")
  };
}
function normalizeRoutine(routine,index=0){
  const steps=(Array.isArray(routine.steps)?routine.steps:Array.isArray(routine.routineSteps)?routine.routineSteps:[])
    .map(normalizeStep).filter(step=>step.text);
  return{
    id:String(routine.id||makeId(routine.name||"routine")),
    name:String(routine.name||"Routine").trim()||"Routine",
    schedule:["daily","weekdays","weekends","custom"].includes(routine.schedule)?routine.schedule:"daily",
    days:uniqueDays(routine.days),
    order:Number.isFinite(Number(routine.order))?Number(routine.order):(index+1)*10,
    lockSteps:routine.lockSteps!==false,
    paused:routine.paused===true,
    pausePeriods:Array.isArray(routine.pausePeriods)?routine.pausePeriods.map(period=>({
      start:String(period&&period.start||""),end:String(period&&period.end||"")
    })).filter(period=>period.start):[],
    snoozeUntil:String(routine.snoozeUntil||""),
    steps
  };
}
function sortRoutines(routines){
  return [...routines].map(normalizeRoutine).sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name));
}
function loadSettings(){
  return{autoCollapseCompletedRoutines:true,...rawLocal(SETTINGS_KEY,{})};
}
function saveSettings(settings){
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  scheduleRecoverySnapshot("settings changed");
}
function loadRoutines(){
  const stored=rawLocal(ROUTINES_KEY,null);
  return Array.isArray(stored)?sortRoutines(stored):[];
}
function saveRoutines(routines){
  localStorage.setItem(ROUTINES_KEY,JSON.stringify(sortRoutines(routines)));
  scheduleRecoverySnapshot("routines changed");
}
function loadProgress(){return rawLocal(PROGRESS_KEY,{})}
function saveProgress(progress){
  localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));
  scheduleRecoverySnapshot("routine progress changed");
}
function loadStepState(){return rawLocal(STEP_STATE_KEY,{})}
function saveStepState(state){
  localStorage.setItem(STEP_STATE_KEY,JSON.stringify(state));
  scheduleRecoverySnapshot("step progress changed");
}
function loadStepOverrides(){return rawLocal(STEP_OVERRIDE_KEY,{})}
function saveStepOverrides(overrides){
  localStorage.setItem(STEP_OVERRIDE_KEY,JSON.stringify(overrides));
  scheduleRecoverySnapshot("temporary steps changed");
}
function clearExpiredStepOverrides(){
  const all=loadStepOverrides();
  const dateKey=getTodayKey();
  const current=all[dateKey]&&typeof all[dateKey]==="object"?{[dateKey]:all[dateKey]}:{};
  if(JSON.stringify(all)!==JSON.stringify(current))localStorage.setItem(STEP_OVERRIDE_KEY,JSON.stringify(current));
}
function normalizeLegacyCompletion(entry){
  if(entry===true)return{state:"done",completedAt:""};
  if(!entry||typeof entry!=="object")return null;
  const state=entry.state||(entry.skipped?"skipped":entry.done===false?"pending":"done");
  return{...entry,state,completedAt:String(entry.completedAt||entry.skippedAt||"")};
}
function legacyBlockDetails(){
  const blocks=rawLocal(LEGACY_BLOCKS_KEY,[]);
  const map={};
  (Array.isArray(blocks)?blocks:[]).forEach((block,index)=>{
    map[block.id]={label:String(block.label||block.id||"Routine"),order:index};
  });
  return map;
}
function migrateLegacyData(){
  if(localStorage.getItem(ROUTINES_KEY)!==null)return;
  const legacyHabits=rawLocal(LEGACY_HABITS_KEY,[]);
  if(!Array.isArray(legacyHabits)||legacyHabits.length===0){
    const routine=normalizeRoutine({
      id:"morning-routine",name:"Morning Routine",schedule:"daily",order:10,lockSteps:true,
      steps:[{id:"morning-first-step",text:"Add your first morning step",createdAt:""}]
    });
    localStorage.setItem(ROUTINES_KEY,JSON.stringify([routine]));
    localStorage.setItem(PROGRESS_KEY,JSON.stringify({}));
    localStorage.setItem(STEP_STATE_KEY,JSON.stringify({}));
    localStorage.setItem(SETTINGS_KEY,JSON.stringify({autoCollapseCompletedRoutines:true}));
    return;
  }
  const blocks=legacyBlockDetails();
  const mappings=[];
  const migrated=[];
  legacyHabits.forEach((habit,habitIndex)=>{
    const occurrences=Array.isArray(habit.occurrences)&&habit.occurrences.length
      ?habit.occurrences
      :[{id:String(habit.id||makeId("habit"))+"-"+String(habit.block||"anytime"),block:habit.block||"anytime"}];
    occurrences.forEach((occurrence,occurrenceIndex)=>{
      const multiple=occurrences.length>1;
      const block=blocks[occurrence.block]||{label:String(occurrence.block||"Routine"),order:99};
      const routineId=multiple?String(habit.id||makeId("habit"))+"--"+String(occurrence.id):String(habit.id||makeId("routine"));
      const legacySteps=Array.isArray(habit.routineSteps)&&habit.routineSteps.length
        ?habit.routineSteps
        :[{id:routineId+"-step",text:String(habit.name||"Complete routine"),createdAt:""}];
      migrated.push(normalizeRoutine({
        id:routineId,
        name:multiple?String(habit.name||"Routine")+" — "+String(block.label||"Routine"):String(habit.name||"Routine"),
        schedule:habit.schedule||"daily",
        days:habit.days||[],
        order:(Number(block.order)||0)*1000+habitIndex*10+occurrenceIndex,
        lockSteps:legacySteps.length>1,
        paused:habit.paused===true,
        pausePeriods:habit.pausePeriods||[],
        snoozeUntil:habit.snoozeUntil||"",
        steps:legacySteps
      },migrated.length));
      mappings.push({habitId:String(habit.id||""),occurrenceId:String(occurrence.id||""),routineId});
    });
  });
  const ordered=sortRoutines(migrated).map((routine,index)=>({...routine,order:(index+1)*10}));
  const progress={};
  const stepState={};
  const legacyCompletions=rawLocal(LEGACY_COMPLETIONS_KEY,{});
  const legacySteps=rawLocal(LEGACY_STEPS_KEY,{});
  const legacyDates=[...new Set([...Object.keys(legacyCompletions||{}),...Object.keys(legacySteps||{})])];
  legacyDates.forEach(dateKey=>{
    mappings.forEach(mapping=>{
      const day=legacyCompletions[dateKey]||{};
      const entry=normalizeLegacyCompletion(day[mapping.occurrenceId]||day[mapping.habitId]);
      const oldStates=legacySteps&&legacySteps[dateKey]&&legacySteps[dateKey][mapping.occurrenceId];
      const routine=ordered.find(item=>item.id===mapping.routineId);
      if(oldStates&&routine){
        stepState[dateKey]=stepState[dateKey]||{};
        stepState[dateKey][routine.id]=stepState[dateKey][routine.id]||{};
        routine.steps.forEach(step=>{if(oldStates[step.id]===true)stepState[dateKey][routine.id][step.id]="done"});
      }
      if(!entry||entry.state==="pending"||!routine)return;
      progress[dateKey]=progress[dateKey]||{};
      if(entry.state==="skipped"){
        progress[dateKey][routine.id]={state:"skipped",skippedAt:entry.completedAt||"",migrated:true};
        return;
      }
      progress[dateKey][routine.id]={state:"done",completedAt:entry.completedAt||"",migrated:true};
      stepState[dateKey]=stepState[dateKey]||{};
      stepState[dateKey][routine.id]=stepState[dateKey][routine.id]||{};
      routine.steps.forEach(step=>{
        if(!stepState[dateKey][routine.id][step.id])stepState[dateKey][routine.id][step.id]="done";
      });
    });
  });
  localStorage.setItem(ROUTINES_KEY,JSON.stringify(ordered));
  localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));
  localStorage.setItem(STEP_STATE_KEY,JSON.stringify(stepState));
  const legacySettings=rawLocal(LEGACY_SETTINGS_KEY,{});
  localStorage.setItem(SETTINGS_KEY,JSON.stringify({
    autoCollapseCompletedRoutines:legacySettings.autoCollapseCompletedBlocks!==false
  }));
}

function scheduleMatches(routine,date){
  const day=date.getDay();
  if(routine.schedule==="daily")return true;
  if(routine.schedule==="weekdays")return day>=1&&day<=5;
  if(routine.schedule==="weekends")return day===0||day===6;
  if(routine.schedule==="custom")return routine.days.includes(day);
  return true;
}
function isRoutineSnoozed(routine,date=new Date()){
  return Boolean(routine.snoozeUntil&&getLocalDateKey(date)<routine.snoozeUntil);
}
function isRoutinePausedOn(routine,date=new Date()){
  const dateKey=getLocalDateKey(date);
  if(routine.paused&&routine.pausePeriods.length===0)return true;
  return routine.pausePeriods.some(period=>period.start&&dateKey>=period.start&&(!period.end||dateKey<period.end));
}
function routineAvailable(routine,date){
  return !isRoutinePausedOn(routine,date)&&!isRoutineSnoozed(routine,date);
}
function activeTodayRoutineSwitch(date=new Date()){
  const value=loadSettings().todayRoutineSwitch;
  return value&&value.date===getLocalDateKey(date)&&value.fromRoutineId&&value.toRoutineId&&value.fromRoutineId!==value.toRoutineId?value:null;
}
function clearExpiredTodayRoutineSwitch(){
  const settings=loadSettings();
  if(!settings.todayRoutineSwitch||settings.todayRoutineSwitch.date===getTodayKey())return false;
  delete settings.todayRoutineSwitch;
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  return true;
}
function dueRoutinesOn(date=new Date()){
  const all=loadRoutines();
  let due=all.filter(routine=>routineAvailable(routine,date)&&scheduleMatches(routine,date));
  const switched=activeTodayRoutineSwitch(date);
  if(switched){
    const source=due.find(routine=>routine.id===switched.fromRoutineId);
    const replacement=all.find(routine=>routine.id===switched.toRoutineId&&routineAvailable(routine,date));
    if(source&&replacement){
      due=due.filter(routine=>routine.id!==source.id&&routine.id!==replacement.id);
      due.push({...replacement,order:source.order,effectiveOrder:source.order});
    }
  }
  return sortRoutines(due);
}
function progressEntry(dateKey,routineId){return loadProgress()[dateKey]&&loadProgress()[dateKey][routineId]||null}
function isRoutineDone(dateKey,routineId){return progressEntry(dateKey,routineId)?.state==="done"}
function isRoutineSkipped(dateKey,routineId){return progressEntry(dateKey,routineId)?.state==="skipped"}
function isRoutineResolved(dateKey,routineId){return isRoutineDone(dateKey,routineId)||isRoutineSkipped(dateKey,routineId)}
function getStepState(dateKey,routineId,stepId){
  const value=loadStepState()[dateKey]&&loadStepState()[dateKey][routineId]&&loadStepState()[dateKey][routineId][stepId];
  return value===true?"done":value||"pending";
}
function applyStepOverrides(routine,steps,dateKey){
  const overrides=loadStepOverrides()[dateKey]&&loadStepOverrides()[dateKey][routine.id]||{};
  return steps.map(step=>{
    const replacement=typeof overrides[step.id]==="string"?overrides[step.id].trim():"";
    return replacement?{...step,originalText:step.text,text:replacement,temporary:true}:step;
  });
}
function visibleStepsForDate(routine,dateKey){
  const entry=progressEntry(dateKey,routine.id);
  let steps=routine.steps;
  if(entry&&entry.state==="done"){
    if(!entry.completedAt)steps=routine.steps.filter(step=>!step.createdAt);
    else steps=routine.steps.filter(step=>!step.createdAt||step.createdAt<=entry.completedAt);
  }
  return applyStepOverrides(routine,steps,dateKey);
}
function stepSummary(routine,dateKey){
  const steps=visibleStepsForDate(routine,dateKey);
  let done=0,skipped=0;
  steps.forEach(step=>{
    const state=getStepState(dateKey,routine.id,step.id);
    if(state==="done")done++;
    if(state==="skipped")skipped++;
  });
  return{steps,done,skipped,resolved:done+skipped,total:steps.length};
}
function syncRoutineProgress(routine,dateKey){
  const summary=stepSummary(routine,dateKey);
  const progress=loadProgress();
  progress[dateKey]=progress[dateKey]||{};
  const current=progress[dateKey][routine.id];
  if(current&&current.state==="skipped")return;
  if(summary.total>0&&summary.resolved===summary.total){
    progress[dateKey][routine.id]={
      state:"done",
      completedAt:current&&current.completedAt||new Date().toISOString(),
      skippedSteps:summary.skipped
    };
  }else{
    delete progress[dateKey][routine.id];
    if(Object.keys(progress[dateKey]).length===0)delete progress[dateKey];
  }
  saveProgress(progress);
}
function firstPendingIndex(routine,dateKey){
  return visibleStepsForDate(routine,dateKey).findIndex(step=>getStepState(dateKey,routine.id,step.id)==="pending");
}
function lastResolvedIndex(routine,dateKey){
  const steps=visibleStepsForDate(routine,dateKey);
  let last=-1;
  for(let index=0;index<steps.length;index++){
    if(getStepState(dateKey,routine.id,steps[index].id)==="pending")break;
    last=index;
  }
  return last;
}
function setStepStatus(routine,stepId,status){
  const dateKey=getTodayKey();
  const steps=visibleStepsForDate(routine,dateKey);
  const index=steps.findIndex(step=>step.id===stepId);
  if(index<0)return;
  const current=getStepState(dateKey,routine.id,stepId);
  if(status==="pending"){
    if(routine.lockSteps&&index!==lastResolvedIndex(routine,dateKey))return;
  }else{
    if(current!=="pending")return;
    if(routine.lockSteps&&index!==firstPendingIndex(routine,dateKey))return;
  }
  const all=loadStepState();
  all[dateKey]=all[dateKey]||{};
  all[dateKey][routine.id]=all[dateKey][routine.id]||{};
  if(status==="pending")delete all[dateKey][routine.id][stepId];
  else all[dateKey][routine.id][stepId]=status;
  saveStepState(all);
  syncRoutineProgress(routine,dateKey);
  manuallyCollapsed[routine.id]=isRoutineResolved(dateKey,routine.id);
  render();
}
function pendingMatchingSteps(routine,sourceStepId,dateKey=getTodayKey()){
  const source=routine.steps.find(step=>step.id===sourceStepId);
  if(!source||getStepState(dateKey,routine.id,sourceStepId)!=="done")return[];
  const sourceName=source.text.trim().toLocaleLowerCase();
  const visibleIds=new Set(visibleStepsForDate(routine,dateKey).map(step=>step.id));
  return routine.steps.filter(step=>
    step.id!==sourceStepId&&visibleIds.has(step.id)&&step.text.trim().toLocaleLowerCase()===sourceName&&getStepState(dateKey,routine.id,step.id)==="pending"
  );
}
function applyTodayStepReplacement(routine,sourceStepId,replacementText,dateKey=getTodayKey()){
  const text=String(replacementText||"").trim();
  if(!text)return 0;
  const matches=pendingMatchingSteps(routine,sourceStepId,dateKey);
  if(!matches.length)return 0;
  const all=loadStepOverrides();
  all[dateKey]=all[dateKey]||{};
  all[dateKey][routine.id]=all[dateKey][routine.id]||{};
  matches.forEach(step=>all[dateKey][routine.id][step.id]=text);
  saveStepOverrides(all);
  return matches.length;
}
function replaceRemainingStepsForToday(routine,sourceStepId){
  const source=routine.steps.find(step=>step.id===sourceStepId);
  const matches=pendingMatchingSteps(routine,sourceStepId);
  if(!source||!matches.length)return;
  const replacement=prompt('Replace the remaining "'+source.text+'" steps with what for today?');
  if(replacement===null)return;
  const text=replacement.trim();
  if(!text){alert("Enter a replacement step first.");return}
  if(text.toLocaleLowerCase()===source.text.trim().toLocaleLowerCase()){alert("Choose a different replacement step.");return}
  const count=matches.length;
  const label=count===1?"step":"steps";
  if(!confirm('Replace '+count+' remaining "'+source.text+'" '+label+' with "'+text+'" for today only?\n\nThe original '+label+' will return tomorrow.'))return;
  if(applyTodayStepReplacement(routine,sourceStepId,text)!==count)return;
  render();
}
function clearRoutineForToday(routineId){
  const dateKey=getTodayKey();
  const progress=loadProgress();
  const states=loadStepState();
  if(progress[dateKey])delete progress[dateKey][routineId];
  if(states[dateKey])delete states[dateKey][routineId];
  const overrides=loadStepOverrides();
  if(overrides[dateKey])delete overrides[dateKey][routineId];
  saveProgress(progress);
  saveStepState(states);
  saveStepOverrides(overrides);
  manuallyCollapsed[routineId]=false;
  render();
}
function getDayProgress(date=new Date()){
  const dateKey=getLocalDateKey(date);
  const due=dueRoutinesOn(date);
  const completed=due.filter(routine=>isRoutineDone(dateKey,routine.id)).length;
  const skipped=due.filter(routine=>isRoutineSkipped(dateKey,routine.id)).length;
  const resolved=completed+skipped;
  let skippedSteps=0;
  due.forEach(routine=>{skippedSteps+=stepSummary(routine,dateKey).skipped});
  return{due,total:due.length,completed,skipped,resolved,skippedSteps,percent:due.length?Math.round(resolved/due.length*100):0};
}
function currentRoutineForDate(routines,dateKey){
  return routines.find(routine=>!isRoutineResolved(dateKey,routine.id))||null;
}

function formatDateLabel(){
  const date=new Date();
  E.todayTitle.textContent=date.toLocaleDateString(undefined,{weekday:"long"});
  E.dateText.textContent=date.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"});
  E.headerVersionBadge.textContent="v"+APP_META.version;
}
function scheduleLabel(routine){
  if(routine.schedule==="daily")return"Every day";
  if(routine.schedule==="weekdays")return"Weekdays";
  if(routine.schedule==="weekends")return"Weekends";
  return routine.days.map(day=>DAY_LABELS[day]).join(", ")||"Custom";
}
function snoozeLabel(routine){
  if(!routine.snoozeUntil)return"";
  const parts=routine.snoozeUntil.split("-").map(Number);
  return new Date(parts[0],parts[1]-1,parts[2]).toLocaleDateString(undefined,{month:"short",day:"numeric"});
}
function renderStepRow(routine,step,index,dateKey){
  const state=getStepState(dateKey,routine.id,step.id);
  const pendingIndex=firstPendingIndex(routine,dateKey);
  const lastResolved=lastResolvedIndex(routine,dateKey);
  const locked=routine.lockSteps&&state==="pending"&&index!==pendingIndex;
  const canUndo=state!=="pending"&&(!routine.lockSteps||index===lastResolved);
  const row=document.createElement("div");
  row.className="routine-step-row "+state+(locked?" locked":"");
  const checkEnabled=(state==="pending"&&!locked)||(state==="done"&&canUndo);
  const skipEnabled=(state==="pending"&&!locked)||(state==="skipped"&&canUndo);
  const checkIcon=state==="done"?"✓":state==="skipped"?"—":locked?"🔒":"";
  const checkLabel=state==="done"?"Uncheck "+step.text:state==="pending"&&!locked?"Complete "+step.text:state==="skipped"?"Skipped "+step.text:"Locked "+step.text;
  const replaceCount=state==="done"&&!step.temporary?pendingMatchingSteps(routine,step.id,dateKey).length:0;
  row.innerHTML=
    '<button class="routine-step-check" type="button" '+(checkEnabled?"":"disabled")+' aria-label="'+escapeHtml(checkLabel)+'"><span aria-hidden="true">'+checkIcon+'</span></button>'+
    '<div class="routine-step-copy"><span class="routine-step-number">'+String(index+1)+'.</span><span class="routine-step-text">'+escapeHtml(step.text)+'</span>'+(step.temporary?'<span class="temporary-step-pill">Today</span>':"")+'</div>'+
    ((state==="pending"&&!locked)||state==="skipped"
      ?'<button class="step-skip-btn '+(state==="skipped"?"active":"")+'" type="button" '+(skipEnabled?"":"disabled")+' aria-label="'+(state==="skipped"?"Clear skipped ":"Skip ")+escapeHtml(step.text)+'">Skip</button>'
      :replaceCount?'<button class="step-replace-btn" type="button" aria-label="Replace '+replaceCount+' remaining '+escapeHtml(step.text)+' '+(replaceCount===1?'step':'steps')+' for today">Replace</button>'
      :'<span class="routine-step-control-spacer" aria-hidden="true"></span>');
  row.querySelector(".routine-step-check").addEventListener("click",()=>{
    if(state==="pending")setStepStatus(routine,step.id,"done");
    else if(state==="done"&&canUndo)setStepStatus(routine,step.id,"pending");
  });
  row.querySelector(".step-skip-btn")?.addEventListener("click",()=>{
    if(state==="pending")setStepStatus(routine,step.id,"skipped");
    else if(state==="skipped"&&canUndo)setStepStatus(routine,step.id,"pending");
  });
  row.querySelector(".step-replace-btn")?.addEventListener("click",()=>replaceRemainingStepsForToday(routine,step.id));
  return row;
}
function renderRoutineList(){
  const dateKey=getTodayKey();
  const due=dueRoutinesOn(new Date());
  const currentRoutine=currentRoutineForDate(due,dateKey);
  E.routineList.innerHTML="";
  E.emptyTodayText.classList.toggle("hidden",due.length>0);
  const day=getDayProgress();
  E.todayProgressText.textContent=due.length?day.resolved+" of "+day.total+" routines resolved":"Today";
  due.forEach((routine,index)=>{
    const summary=stepSummary(routine,dateKey);
    const done=isRoutineDone(dateKey,routine.id);
    const skipped=isRoutineSkipped(dateKey,routine.id);
    const complete=done||skipped;
    const isCurrent=Boolean(currentRoutine&&routine.id===currentRoutine.id);
    const routineLocked=Boolean(currentRoutine&&!complete&&!isCurrent);
    const defaultCollapsed=complete&&loadSettings().autoCollapseCompletedRoutines!==false;
    const collapsed=routineLocked?true:isCurrent?false:manuallyCollapsed[routine.id]===undefined?defaultCollapsed:manuallyCollapsed[routine.id];
    const card=document.createElement("article");
    card.className="routine-card "+(complete?"completed-routine ":"")+(isCurrent?"current-routine ":"")+(routineLocked?"locked-routine ":"")+(collapsed?"collapsed":"");
    const status=routineLocked?"Locked · Finish "+currentRoutine.name+" first":skipped?"Skipped":summary.resolved+"/"+summary.total+" steps"+(summary.skipped?" · "+summary.skipped+" skipped":"");
    card.innerHTML=
      '<button class="routine-card-header" type="button" aria-expanded="'+String(!collapsed)+'" '+(routineLocked?'disabled aria-label="Locked routine '+escapeHtml(routine.name)+'"':isCurrent?'aria-disabled="true"':"")+'>'+
        '<span class="routine-order">'+(routineLocked?"🔒":String(index+1))+'</span>'+
        '<span class="routine-card-copy"><strong>'+escapeHtml(routine.name)+(complete?" ✓":"")+'</strong><small>'+escapeHtml(status)+(routine.lockSteps?" · In order":" · Any order")+'</small></span>'+
        '<span class="routine-chevron">'+(collapsed?"▶":"▼")+'</span>'+
      '</button>'+
      '<div class="routine-card-body"></div>';
    if(complete)card.querySelector(".routine-card-header").addEventListener("click",()=>{
        manuallyCollapsed[routine.id]=!collapsed;
        render();
      });
    const body=card.querySelector(".routine-card-body");
    if(skipped){
      body.innerHTML='<p class="helper-text">This routine was skipped before the v12 migration.</p><button class="small-btn clear-routine-btn" type="button">Clear Skipped Routine</button>';
      body.querySelector(".clear-routine-btn").addEventListener("click",()=>clearRoutineForToday(routine.id));
    }else{
      summary.steps.forEach((step,stepIndex)=>body.appendChild(renderStepRow(routine,step,stepIndex,dateKey)));
    }
    E.routineList.appendChild(card);
  });
}
function getSkippedItems(){
  const dateKey=getTodayKey();
  const items=[];
  dueRoutinesOn(new Date()).forEach(routine=>{
    if(isRoutineSkipped(dateKey,routine.id)){
      items.push({routine:routine.name,step:"Entire routine"});
      return;
    }
    visibleStepsForDate(routine,dateKey).forEach(step=>{
      if(getStepState(dateKey,routine.id,step.id)==="skipped")items.push({routine:routine.name,step:step.text});
    });
  });
  return items;
}
function renderSkipReview(){
  const items=getSkippedItems();
  E.skipReviewCount.textContent=items.length?items.length+" skipped "+(items.length===1?"step":"steps"):"Nothing Skipped Today";
  E.skipReviewMessage.textContent=items.length?"Review anything you intentionally passed.":"Keep it up!";
  E.skipReviewCard.classList.toggle("skip-review-clear",items.length===0);
  E.skipReviewToggle.setAttribute("aria-expanded",String(skipReviewExpanded));
  E.skipReviewChevron.textContent=skipReviewExpanded?"⌄":"›";
  E.skipReviewDetails.classList.toggle("hidden",!skipReviewExpanded||items.length===0);
  E.skipReviewDetails.innerHTML=items.map(item=>'<div class="skip-review-item"><strong>'+escapeHtml(item.step)+'</strong><small>'+escapeHtml(item.routine)+'</small></div>').join("");
}
function renderEndOfDay(){
  const progress=getDayProgress();
  const finished=progress.total>0&&progress.resolved===progress.total;
  E.endOfDayCard.classList.toggle("hidden",!finished);
  E.todayRoutineCard.classList.toggle("hidden",finished&&!endOfDayRoutineExpanded);
  E.endOfDayRoutineBtn.textContent=endOfDayRoutineExpanded?"Hide Today's Routines":"Show Today's Routines";
  const skipped=getSkippedItems().length;
  E.endOfDayMessage.textContent=skipped?"You're finished. Some steps were skipped.":"You're all done for today.";
  E.endOfDaySummary.textContent=progress.completed+" routines complete"+(skipped?" · "+skipped+" skipped":"");
  E.endOfDayReviewBtn.classList.toggle("hidden",skipped===0);
}
function renderRecentDays(){
  E.recentDays.innerHTML="";
  for(let offset=-6;offset<=0;offset++){
    const date=dateFromOffset(offset);
    const progress=getDayProgress(date);
    const pill=document.createElement("div");
    pill.className="day-pill "+(progress.total>0&&progress.resolved===progress.total?"done":"");
    pill.textContent=date.toLocaleDateString(undefined,{weekday:"short"});
    E.recentDays.appendChild(pill);
  }
}
function routineStats(routine,days=30){
  let due=0,completed=0,skippedSteps=0;
  for(let offset=-days+1;offset<=0;offset++){
    const date=dateFromOffset(offset);
    if(!routineAvailable(routine,date)||!scheduleMatches(routine,date))continue;
    const dateKey=getLocalDateKey(date);
    due++;
    if(isRoutineResolved(dateKey,routine.id))completed++;
    skippedSteps+=stepSummary(routine,dateKey).skipped;
  }
  return{due,completed,skippedSteps,percent:due?Math.round(completed/due*100):0};
}
function currentStreak(){
  let streak=0;
  for(let offset=0;offset>-365;offset--){
    const progress=getDayProgress(dateFromOffset(offset));
    if(progress.total===0)continue;
    if(progress.resolved===progress.total)streak++;
    else if(offset===0)continue;
    else break;
  }
  return streak;
}
function renderStats(){
  const streak=currentStreak();
  E.streakText.textContent=streak+" "+(streak===1?"day":"days");
  let resolvedDays=0,scheduledDays=0;
  for(let offset=-6;offset<=0;offset++){
    const progress=getDayProgress(dateFromOffset(offset));
    if(progress.total===0)continue;
    scheduledDays++;
    if(progress.resolved===progress.total)resolvedDays++;
  }
  E.weekText.textContent=resolvedDays+"/"+(scheduledDays||7);
  renderRecentDays();
  E.routineStats.innerHTML="";
  loadRoutines().forEach(routine=>{
    const stats=routineStats(routine);
    const card=document.createElement("div");
    card.className="habit-stat-card";
    card.innerHTML='<strong>'+escapeHtml(routine.name)+'</strong><small>'+escapeHtml(scheduleLabel(routine))+' · '+routine.steps.length+' steps</small><div class="metric-row"><div class="metric"><b>'+stats.percent+'%</b><span>30 Days</span></div><div class="metric"><b>'+stats.completed+'</b><span>Resolved</span></div><div class="metric"><b>'+stats.skippedSteps+'</b><span>Skipped</span></div></div>';
    E.routineStats.appendChild(card);
  });
}
function renderAppInfo(){
  E.appInfo.innerHTML='<div class="info-row"><strong>Version '+APP_META.version+'</strong><small>Build '+APP_META.build+'</small><small>Schema '+APP_META.schemaVersion+'</small><small>Released '+APP_META.releaseDate+'</small></div><div class="release-note"><strong>Release Notes</strong><ul>'+APP_META.releaseNotes.map(note=>'<li>'+escapeHtml(note)+'</li>').join("")+'</ul></div>';
}

function moveRoutine(id,direction){
  const routines=sortRoutines(loadRoutines());
  const index=routines.findIndex(routine=>routine.id===id);
  const target=index+direction;
  if(index<0||target<0||target>=routines.length)return;
  [routines[index],routines[target]]=[routines[target],routines[index]];
  routines.forEach((routine,routineIndex)=>routine.order=(routineIndex+1)*10);
  saveRoutines(routines);
  render();
}
function pauseRoutine(id){
  const routines=loadRoutines();
  const index=routines.findIndex(routine=>routine.id===id);
  if(index<0)return;
  const routine=routines[index];
  if(!confirm('Pause "'+routine.name+'"?\n\nIt will be hidden from Today until you resume it.'))return;
  const periods=routine.pausePeriods.map(period=>({...period}));
  if(!periods.some(period=>!period.end))periods.push({start:getTodayKey(),end:""});
  routines[index]={...routine,paused:true,pausePeriods:periods,snoozeUntil:""};
  saveRoutines(routines);
  render();
}
function resumeRoutine(id){
  const routines=loadRoutines();
  const index=routines.findIndex(routine=>routine.id===id);
  if(index<0)return;
  const routine=routines[index];
  if(!confirm('Resume "'+routine.name+'"?\n\nIt will return on its scheduled days.'))return;
  const periods=routine.pausePeriods.map(period=>period.end?period:{...period,end:getTodayKey()});
  routines[index]={...routine,paused:false,pausePeriods:periods,snoozeUntil:""};
  saveRoutines(routines);
  render();
}
function deleteRoutine(id){
  const routine=loadRoutines().find(item=>item.id===id);
  if(!routine||!confirm('Delete "'+routine.name+'"?\n\nIts routine history will also be removed.'))return;
  saveRoutines(loadRoutines().filter(item=>item.id!==id));
  const progress=loadProgress();
  const states=loadStepState();
  const overrides=loadStepOverrides();
  Object.keys(progress).forEach(dateKey=>{if(progress[dateKey])delete progress[dateKey][id]});
  Object.keys(states).forEach(dateKey=>{if(states[dateKey])delete states[dateKey][id]});
  Object.keys(overrides).forEach(dateKey=>{if(overrides[dateKey])delete overrides[dateKey][id]});
  saveProgress(progress);
  saveStepState(states);
  saveStepOverrides(overrides);
  render();
}
function renderAllRoutines(){
  const routines=loadRoutines();
  E.allRoutines.innerHTML="";
  if(!routines.length){
    E.allRoutines.innerHTML='<p class="empty-text">No routines yet.</p>';
    return;
  }
  routines.forEach((routine,index)=>{
    const inactive=routine.paused||isRoutineSnoozed(routine);
    const row=document.createElement("div");
    row.className="habit-row compact-habit-row "+(inactive?"snoozed-habit":"");
    const stepCount=routine.steps.length+' '+(routine.steps.length===1?'step':'steps');
    row.innerHTML=
      '<div class="habit-row-main"><div class="compact-habit-title"><strong>'+escapeHtml(routine.name)+'</strong>'+(inactive?'<span class="habit-status-pill">'+(routine.paused?"Paused":"Until "+snoozeLabel(routine))+'</span>':"")+'</div><small>#'+(index+1)+' · '+escapeHtml(scheduleLabel(routine))+' · '+stepCount+' · '+(routine.lockSteps?"In order":"Any order")+'</small></div>'+
      '<div class="habit-actions compact-habit-actions"><div class="reorder-actions"><button class="reorder-btn move-up-btn" type="button" '+(index===0?"disabled":"")+'>↑</button><button class="reorder-btn move-down-btn" type="button" '+(index===routines.length-1?"disabled":"")+'>↓</button></div><button class="small-btn pause-toggle-btn" type="button">'+(inactive?"Resume":"Pause")+'</button><button class="edit-btn" type="button">Edit</button><button class="danger-btn compact-delete-btn" type="button">✕</button></div>';
    row.querySelector(".move-up-btn").addEventListener("click",()=>moveRoutine(routine.id,-1));
    row.querySelector(".move-down-btn").addEventListener("click",()=>moveRoutine(routine.id,1));
    row.querySelector(".pause-toggle-btn").addEventListener("click",()=>inactive?resumeRoutine(routine.id):pauseRoutine(routine.id));
    row.querySelector(".edit-btn").addEventListener("click",()=>startEditRoutine(routine.id));
    row.querySelector(".compact-delete-btn").addEventListener("click",()=>deleteRoutine(routine.id));
    E.allRoutines.appendChild(row);
  });
}
function renderRoutineSwitch(){
  const all=loadRoutines();
  const scheduled=all.filter(routine=>routineAvailable(routine,new Date())&&scheduleMatches(routine,new Date()));
  const active=activeTodayRoutineSwitch();
  E.todayRoutineSwitchFrom.innerHTML=scheduled.map(routine=>'<option value="'+escapeHtml(routine.id)+'">'+escapeHtml(routine.name)+'</option>').join("");
  const sourceId=active&&active.fromRoutineId||E.todayRoutineSwitchFrom.value||scheduled[0]?.id||"";
  E.todayRoutineSwitchFrom.value=sourceId;
  const targets=all.filter(routine=>routineAvailable(routine,new Date())&&routine.id!==sourceId);
  E.todayRoutineSwitchTo.innerHTML=targets.map(routine=>'<option value="'+escapeHtml(routine.id)+'">'+escapeHtml(routine.name)+'</option>').join("");
  if(active&&targets.some(routine=>routine.id===active.toRoutineId))E.todayRoutineSwitchTo.value=active.toRoutineId;
  E.applyTodayRoutineSwitchBtn.disabled=!sourceId||targets.length===0;
  E.clearTodayRoutineSwitchBtn.classList.toggle("hidden",!active);
  if(active){
    const from=all.find(routine=>routine.id===active.fromRoutineId);
    const to=all.find(routine=>routine.id===active.toRoutineId);
    E.todayRoutineSwitchStatus.textContent=from&&to?'Today: "'+to.name+'" replaces "'+from.name+'".':"";
  }else E.todayRoutineSwitchStatus.textContent="";
}
function applyTodayRoutineSwitch(){
  const fromRoutineId=E.todayRoutineSwitchFrom.value;
  const toRoutineId=E.todayRoutineSwitchTo.value;
  const all=loadRoutines();
  const from=all.find(routine=>routine.id===fromRoutineId);
  const to=all.find(routine=>routine.id===toRoutineId);
  if(!from||!to||from.id===to.id)return;
  if(!confirm('Use "'+to.name+'" instead of "'+from.name+'" for Today only?\n\nYour normal schedule returns tomorrow.'))return;
  saveSettings({...loadSettings(),todayRoutineSwitch:{date:getTodayKey(),fromRoutineId,toRoutineId}});
  manuallyCollapsed={};
  endOfDayRoutineExpanded=false;
  render();
}
function clearTodayRoutineSwitch(){
  const settings=loadSettings();
  delete settings.todayRoutineSwitch;
  saveSettings(settings);
  manuallyCollapsed={};
  endOfDayRoutineExpanded=false;
  render();
}

function setSelectedDays(days){
  selectedDays=uniqueDays(days);
  E.customDays.querySelectorAll("button").forEach(button=>button.classList.toggle("selected",selectedDays.includes(Number(button.dataset.day))));
}
function renderStepsEditor(){
  E.stepsEditorList.innerHTML="";
  if(!selectedSteps.length){
    E.stepsEditorList.innerHTML='<p class="helper-text no-top">Add at least one step.</p>';
    return;
  }
  selectedSteps.forEach((step,index)=>{
    const row=document.createElement("div");
    row.className="routine-step-editor-row";
    row.innerHTML='<input type="text" value="'+escapeHtml(step.text)+'" aria-label="Routine step '+(index+1)+'" /><div class="routine-step-reorder"><button type="button" class="reorder-btn step-up" '+(index===0?"disabled":"")+'>↑</button><button type="button" class="reorder-btn step-down" '+(index===selectedSteps.length-1?"disabled":"")+'>↓</button></div><button type="button" class="danger-btn remove-step-btn">✕</button>';
    row.querySelector("input").addEventListener("input",event=>selectedSteps[index].text=event.target.value);
    row.querySelector(".step-up").addEventListener("click",()=>moveEditorStep(index,-1));
    row.querySelector(".step-down").addEventListener("click",()=>moveEditorStep(index,1));
    row.querySelector(".remove-step-btn").addEventListener("click",()=>{selectedSteps.splice(index,1);renderStepsEditor()});
    E.stepsEditorList.appendChild(row);
  });
}
function moveEditorStep(index,direction){
  const target=index+direction;
  if(target<0||target>=selectedSteps.length)return;
  [selectedSteps[index],selectedSteps[target]]=[selectedSteps[target],selectedSteps[index]];
  renderStepsEditor();
  E.stepsEditorList.querySelectorAll("input")[target]?.focus();
}
function addEditorStep(){
  selectedSteps.push({id:makeId("step"),text:"",createdAt:new Date().toISOString()});
  renderStepsEditor();
  const inputs=E.stepsEditorList.querySelectorAll("input");
  inputs[inputs.length-1]?.focus();
}
function resetRoutineForm(){
  editingRoutineId=null;
  E.formModeLabel.textContent="Manage Routines";
  E.formTitle.textContent="Add Routine";
  E.saveRoutineBtn.textContent="Add Routine";
  E.cancelEditBtn.classList.add("hidden");
  E.routineName.value="";
  E.routineSchedule.value="daily";
  E.lockSteps.checked=true;
  E.routineSnoozeUntil.value="";
  E.customDays.classList.add("hidden");
  setSelectedDays([]);
  selectedSteps=[];
  renderStepsEditor();
}
function openRoutineEditor(){
  E.routineEditorSheet.classList.remove("hidden");
  document.body.style.overflow="hidden";
}
function closeRoutineEditor(){
  E.routineEditorSheet.classList.add("hidden");
  document.body.style.overflow=E.settingsPanel.classList.contains("hidden")?"":"hidden";
}
function openAddRoutine(){resetRoutineForm();openRoutineEditor()}
function startEditRoutine(id){
  const routine=loadRoutines().find(item=>item.id===id);
  if(!routine)return;
  editingRoutineId=id;
  E.formModeLabel.textContent="Editing Routine";
  E.formTitle.textContent="Edit Routine";
  E.saveRoutineBtn.textContent="Save Changes";
  E.cancelEditBtn.classList.remove("hidden");
  E.routineName.value=routine.name;
  E.routineSchedule.value=routine.schedule;
  E.lockSteps.checked=routine.lockSteps;
  E.routineSnoozeUntil.value=routine.snoozeUntil||"";
  E.customDays.classList.toggle("hidden",routine.schedule!=="custom");
  setSelectedDays(routine.days);
  selectedSteps=routine.steps.map(step=>({...step}));
  renderStepsEditor();
  openRoutineEditor();
}
function saveRoutineFromForm(event){
  event.preventDefault();
  const name=E.routineName.value.trim();
  const schedule=E.routineSchedule.value;
  const steps=selectedSteps.map(normalizeStep).filter(step=>step.text);
  if(!name){alert("Add a routine name first.");return}
  if(schedule==="custom"&&selectedDays.length===0){alert("Choose at least one day.");return}
  if(steps.length===0){alert("Add at least one routine step.");return}
  const routines=loadRoutines();
  if(editingRoutineId){
    const index=routines.findIndex(routine=>routine.id===editingRoutineId);
    if(index>=0)routines[index]={...routines[index],name,schedule,days:schedule==="custom"?selectedDays:[],lockSteps:E.lockSteps.checked,snoozeUntil:E.routineSnoozeUntil.value,steps};
  }else{
    routines.push(normalizeRoutine({id:makeId(name),name,schedule,days:schedule==="custom"?selectedDays:[],order:(routines.length+1)*10,lockSteps:E.lockSteps.checked,snoozeUntil:E.routineSnoozeUntil.value,steps}));
  }
  saveRoutines(routines);
  resetRoutineForm();
  closeRoutineEditor();
  render();
}
function openPanel(panel){panel.classList.remove("hidden");document.body.style.overflow="hidden"}
function closePanel(panel){panel.classList.add("hidden");document.body.style.overflow=""}
function resetToday(){
  if(!confirm("Reset all routine progress and temporary step replacements for today?"))return;
  const dateKey=getTodayKey();
  const progress=loadProgress();
  const states=loadStepState();
  const overrides=loadStepOverrides();
  delete progress[dateKey];
  delete states[dateKey];
  delete overrides[dateKey];
  saveProgress(progress);
  saveStepState(states);
  saveStepOverrides(overrides);
  manuallyCollapsed={};
  skipReviewExpanded=false;
  endOfDayRoutineExpanded=false;
  render();
}

function legacyArchive(){
  return{
    habits:rawLocal(LEGACY_HABITS_KEY,[]),
    completions:rawLocal(LEGACY_COMPLETIONS_KEY,{}),
    timeBlocks:rawLocal(LEGACY_BLOCKS_KEY,[]),
    settings:rawLocal(LEGACY_SETTINGS_KEY,{}),
    routineStepState:rawLocal(LEGACY_STEPS_KEY,{})
  };
}
function makeBackupPayload(){
  return{
    schemaVersion:APP_META.schemaVersion,
    appVersion:APP_META.version,
    build:APP_META.build,
    exportedAt:new Date().toISOString(),
    routines:loadRoutines(),
    routineProgress:loadProgress(),
    stepState:loadStepState(),
    stepOverrides:loadStepOverrides(),
    settings:loadSettings(),
    legacyArchive:legacyArchive()
  };
}
function importBackupPayload(parsed){
  if(!parsed||typeof parsed!=="object")throw new Error("Backup file is empty or invalid.");
  if(Array.isArray(parsed.routines)){
    localStorage.setItem(ROUTINES_KEY,JSON.stringify(sortRoutines(parsed.routines)));
    localStorage.setItem(PROGRESS_KEY,JSON.stringify(parsed.routineProgress&&typeof parsed.routineProgress==="object"?parsed.routineProgress:{}));
    localStorage.setItem(STEP_STATE_KEY,JSON.stringify(parsed.stepState&&typeof parsed.stepState==="object"?parsed.stepState:{}));
    localStorage.setItem(STEP_OVERRIDE_KEY,JSON.stringify(parsed.stepOverrides&&typeof parsed.stepOverrides==="object"?parsed.stepOverrides:{}));
    localStorage.setItem(SETTINGS_KEY,JSON.stringify(parsed.settings&&typeof parsed.settings==="object"?parsed.settings:{}));
  }else if(Array.isArray(parsed.habits)){
    localStorage.setItem(LEGACY_HABITS_KEY,JSON.stringify(parsed.habits));
    localStorage.setItem(LEGACY_COMPLETIONS_KEY,JSON.stringify(parsed.completions||{}));
    localStorage.setItem(LEGACY_BLOCKS_KEY,JSON.stringify(parsed.blocks||parsed.timeBlocks||[]));
    localStorage.setItem(LEGACY_SETTINGS_KEY,JSON.stringify(parsed.settings||{}));
    localStorage.setItem(LEGACY_STEPS_KEY,JSON.stringify(parsed.routineStepState||{}));
    localStorage.removeItem(ROUTINES_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(STEP_STATE_KEY);
    localStorage.removeItem(STEP_OVERRIDE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    migrateLegacyData();
  }else throw new Error("Backup is missing routines or legacy habits.");
  clearExpiredStepOverrides();
  manuallyCollapsed={};
  resetRoutineForm();
  render();
  E.backupMessage.textContent="Backup imported. Routines and history were restored.";
}
function downloadBackupFile(){
  const payload=makeBackupPayload();
  const json=JSON.stringify(payload,null,2);
  const blob=new Blob([json],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="daily-routine-backup-"+new Date().toISOString().slice(0,10)+".json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  E.backupBox.value=json;
  E.backupMessage.textContent="Backup file created. Copy/paste backup text is also available.";
  return payload;
}
function chooseBackupFile(){E.backupFileInput.value="";E.backupFileInput.click()}
function setupBackupControls(){
  const importText=document.createElement("button");
  importText.type="button";
  importText.className="small-btn";
  importText.textContent="Import from Text";
  E.importBtn.insertAdjacentElement("afterend",importText);
  E.importBtn.textContent="Import JSON File";
  E.exportBtn.addEventListener("click",downloadBackupFile);
  E.importBtn.addEventListener("click",chooseBackupFile);
  importText.addEventListener("click",()=>{
    try{
      if(!E.backupBox.value.trim())throw new Error("Paste backup text first.");
      importBackupPayload(JSON.parse(E.backupBox.value));
    }catch(error){E.backupMessage.textContent=error.message||"Import failed."}
  });
  E.backupFileInput.addEventListener("change",()=>{
    const file=E.backupFileInput.files&&E.backupFileInput.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{importBackupPayload(JSON.parse(String(reader.result||"")))}
      catch(error){E.backupMessage.textContent=error.message||"Import failed."}
    };
    reader.onerror=()=>E.backupMessage.textContent="Import failed. Could not read the file.";
    reader.readAsText(file);
  });
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
    const store=db.transaction("snapshots","readwrite").objectStore("snapshots");
    snapshots.slice(5).forEach(item=>store.delete(item.createdAt));
  }
  E.recoveryStatus.textContent="Latest snapshot: "+new Date(snapshot.createdAt).toLocaleString()+" ("+snapshot.reason+")";
  E.restoreRecoveryBtn.disabled=false;
}
function scheduleRecoverySnapshot(reason){
  clearTimeout(recoveryTimer);
  recoveryTimer=setTimeout(()=>createRecoverySnapshot(reason).catch(()=>E.recoveryStatus.textContent="Recovery storage is unavailable. Use Export All Data for safety."),400);
}
async function restoreLatestRecovery(){
  const snapshots=await listRecoverySnapshots();
  const latest=snapshots[0];
  if(!latest){E.backupMessage.textContent="No recovery snapshot is available yet.";return}
  if(!confirm("Restore the snapshot from "+new Date(latest.createdAt).toLocaleString()+"? This replaces the current app data."))return;
  importBackupPayload(latest.payload);
}

function showUpdateReleaseInfo(meta){
  if(!meta){
    E.updateReleaseVersion.textContent="What's new";
    E.updateReleaseNotes.innerHTML="<li>Loading update details…</li>";
  }else{
    const notes=Array.isArray(meta.notes)&&meta.notes.length?meta.notes:[meta.summary||"This update improves your routines."];
    E.updateReleaseVersion.textContent=meta.version?"What's new in v"+meta.version:"What's new";
    E.updateReleaseNotes.innerHTML=notes.map(note=>"<li>"+escapeHtml(note)+"</li>").join("");
  }
  E.updateReleaseSummary.classList.remove("hidden");
}
function showWaitingUpdate(worker){
  const sameWaitingUpdate=waitingServiceWorker===worker&&!E.updateSheet.classList.contains("hidden");
  if(sameWaitingUpdate)return;
  waitingServiceWorker=worker;
  updateReadyShown=false;
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
  showUpdateReleaseInfo(null);
  E.updateSheet.classList.remove("hidden");
  worker.postMessage({type:"GET_RELEASE_META"});
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
  E.updateExportBtn.addEventListener("click",()=>{
    E.updateBackupConfirmed.disabled=false;
    E.updateStatus.textContent="Backup export started. Save it to Files or iCloud Drive, then confirm below.";
    downloadBackupFile();
  });
  E.updateBackupConfirmed.addEventListener("change",()=>E.installUpdateBtn.disabled=!E.updateBackupConfirmed.checked);
  E.installUpdateBtn.addEventListener("click",()=>{
    if(!waitingServiceWorker||!E.updateBackupConfirmed.checked)return;
    const worker=waitingServiceWorker;
    setUpdateBusy();
    E.updateStatus.textContent="Installing the update. Controls are locked until it is ready.";
    const check=()=>{if(worker.state==="activated")markUpdateReady()};
    worker.addEventListener("statechange",check);
    worker.postMessage({type:"ACTIVATE_AFTER_BACKUP"});
    setTimeout(check,1500);
    setTimeout(()=>{if(!updateReadyShown)E.updateStatus.textContent="Still installing… Keep the app open a little longer."},12000);
  });
  E.laterUpdateBtn.addEventListener("click",()=>{
    if(E.laterUpdateBtn.dataset.action==="reload")location.reload();
    else E.updateSheet.classList.add("hidden");
  });
  if(!("serviceWorker" in navigator))return;
  navigator.serviceWorker.addEventListener("message",event=>{
    if(event.data&&event.data.type==="RELEASE_META")showUpdateReleaseInfo(event.data.meta||null);
  });
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
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkForUpdate()});
    window.addEventListener("pageshow",checkForUpdate);
    setInterval(checkForUpdate,5*60*1000);
    checkForUpdate();
  }).catch(()=>{});
}

function render(){
  renderRoutineList();
  renderSkipReview();
  renderEndOfDay();
  renderAllRoutines();
  renderRoutineSwitch();
  renderStats();
  renderAppInfo();
  E.autoCollapseRoutines.checked=loadSettings().autoCollapseCompletedRoutines!==false;
}
function wireEvents(){
  E.openAddRoutineBtn.addEventListener("click",openAddRoutine);
  E.settingsAddRoutineBtn.addEventListener("click",openAddRoutine);
  E.closeRoutineEditorBtn.addEventListener("click",()=>{resetRoutineForm();closeRoutineEditor()});
  E.cancelEditBtn.addEventListener("click",()=>{resetRoutineForm();closeRoutineEditor()});
  E.routineEditorSheet.addEventListener("click",event=>{if(event.target===E.routineEditorSheet){resetRoutineForm();closeRoutineEditor()}});
  E.routineForm.addEventListener("submit",saveRoutineFromForm);
  E.routineSchedule.addEventListener("change",()=>E.customDays.classList.toggle("hidden",E.routineSchedule.value!=="custom"));
  E.customDays.querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>{
    const day=Number(button.dataset.day);
    selectedDays=selectedDays.includes(day)?selectedDays.filter(value=>value!==day):[...selectedDays,day];
    setSelectedDays(selectedDays);
  }));
  E.addStepBtn.addEventListener("click",addEditorStep);
  E.openSettingsBtn.addEventListener("click",()=>openPanel(E.settingsPanel));
  E.closeSettingsBtn.addEventListener("click",()=>closePanel(E.settingsPanel));
  E.openStatsBtn.addEventListener("click",()=>openPanel(E.statsPanel));
  E.closeStatsBtn.addEventListener("click",()=>closePanel(E.statsPanel));
  E.resetTodayBtn.addEventListener("click",resetToday);
  E.skipReviewToggle.addEventListener("click",()=>{
    if(getSkippedItems().length===0)return;
    skipReviewExpanded=!skipReviewExpanded;
    render();
  });
  E.endOfDayReviewBtn.addEventListener("click",()=>{skipReviewExpanded=!skipReviewExpanded;render()});
  E.endOfDayRoutineBtn.addEventListener("click",()=>{endOfDayRoutineExpanded=!endOfDayRoutineExpanded;render()});
  E.todayRoutineSwitchFrom.addEventListener("change",renderRoutineSwitch);
  E.applyTodayRoutineSwitchBtn.addEventListener("click",applyTodayRoutineSwitch);
  E.clearTodayRoutineSwitchBtn.addEventListener("click",clearTodayRoutineSwitch);
  E.autoCollapseRoutines.addEventListener("change",()=>{
    saveSettings({...loadSettings(),autoCollapseCompletedRoutines:E.autoCollapseRoutines.checked});
    manuallyCollapsed={};
    render();
  });
  E.restoreRecoveryBtn.addEventListener("click",()=>restoreLatestRecovery().catch(()=>E.backupMessage.textContent="Recovery restore failed."));
}

migrateLegacyData();
clearExpiredTodayRoutineSwitch();
clearExpiredStepOverrides();
formatDateLabel();
resetRoutineForm();
wireEvents();
setupBackupControls();
setupSafeUpdateFlow();
render();
createRecoverySnapshot("app opened").catch(()=>E.recoveryStatus.textContent="Recovery storage is unavailable. Use Export All Data for safety.");
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"){
    clearExpiredTodayRoutineSwitch();
    clearExpiredStepOverrides();
    formatDateLabel();
    render();
  }
});
