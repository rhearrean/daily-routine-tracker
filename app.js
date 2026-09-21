const APP_META={
  version:"12.4.0",
  build:"2026.09.21.manual-routine-finalize",
  schemaVersion:8,
  releaseDate:"September 21, 2026",
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
    "Completing a routine collapses it and automatically opens the next routine.",
    "Lets each step run on every routine day or only on selected weekdays.",
    "Steps not scheduled today stay hidden and do not block step locking or routine completion.",
    "Keeps duplicate steps independently schedulable, even when their names match.",
    "Keeps weekday buttons hidden until a step is changed from Every routine day.",
    "Lets an individually skipped step be flagged as Priority Next Time.",
    "Adds a temporary extra copy at the top of that same routine's next scheduled occurrence.",
    "Leaves permanent duplicate steps, weekday schedules, and the original skipped history unchanged.",
    "Adds optional rotating substeps that move to the end of a shared FIFO list when tapped.",
    "Duplicates a step with its schedule and shared rotating list, without copying progress.",
    "Offers This Step or All Exact Matches when renaming, linking rotations, or deleting matching steps.",
    "Includes rotating lists in backups and recovery snapshots without changing schema 8.",
    "Lets each routine start automatically or wait, collapsed, until Start Routine is pressed.",
    "Keeps later routines locked until the available routine has started and been resolved.",
    "Resets manual-start choices the following day without changing routine schedules.",
    "Lets completed selected steps add one temporary repeat to the bottom of the routine.",
    "Allows each temporary repeat to repeat again without creating permanent duplicates.",
    "Removes temporary repeats the following day and includes them in backups and recovery snapshots.",
    "Keeps temporary repeat names clearly visible in the dark Today screen.",
    "Shows Repeat only after a repeatable step is completed.",
    "Waits for Complete Routine before collapsing the routine and unlocking the next one."
  ]
};

const ROUTINES_KEY="dailyRoutineRoutines.v12";
const PROGRESS_KEY="dailyRoutineProgress.v12";
const STEP_STATE_KEY="dailyRoutineStepState.v12";
const STEP_OVERRIDE_KEY="dailyRoutineStepOverrides.v12";
const PRIORITY_KEY="dailyRoutineStepPriorities.v12";
const ROTATIONS_KEY="dailyRoutineRotations.v12";
const ROUTINE_STARTS_KEY="dailyRoutineStarts.v12";
const STEP_REPEATS_KEY="dailyRoutineStepRepeats.v12";
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
  lockSteps:$("lockSteps"),routineStartMode:$("routineStartMode"),routineSnoozeUntil:$("routineSnoozeUntil"),addStepBtn:$("addStepBtn"),
  stepsEditorList:$("stepsEditorList"),saveRoutineBtn:$("saveRoutineBtn"),cancelEditBtn:$("cancelEditBtn"),
  matchActionSheet:$("matchActionSheet"),matchActionTitle:$("matchActionTitle"),matchActionMessage:$("matchActionMessage"),
  matchActionOneBtn:$("matchActionOneBtn"),matchActionAllBtn:$("matchActionAllBtn"),matchActionCancelBtn:$("matchActionCancelBtn"),
  updateSheet:$("updateSheet"),updateExportBtn:$("updateExportBtn"),updateBackupConfirmed:$("updateBackupConfirmed"),
  installUpdateBtn:$("installUpdateBtn"),laterUpdateBtn:$("laterUpdateBtn"),updateStatus:$("updateStatus"),
  updateReleaseSummary:$("updateReleaseSummary"),updateReleaseVersion:$("updateReleaseVersion"),
  updateReleaseNotes:$("updateReleaseNotes"),backupFileInput:$("backupFileInput")
};

let selectedDays=[];
let selectedSteps=[];
let selectedRotations={};
let pendingDeleteStepIds=new Set();
let expandedRotationRows=new Set();
let matchActionResolver=null;
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
  if(typeof step==="string")return{id:makeId("step-"+index),text:step.trim(),createdAt:"",days:null,rotationGroupId:"",repeatable:false};
  const days=uniqueDays(step&&step.days);
  return{
    id:String(step&&step.id||makeId("step-"+index)),
    text:String(step&&step.text||"").trim(),
    createdAt:String(step&&step.createdAt||""),
    days:days.length?days:null,
    rotationGroupId:String(step&&step.rotationGroupId||""),
    repeatable:step&&step.repeatable===true
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
    startMode:routine.startMode==="manual"?"manual":"automatic",
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
function loadRoutineStarts(){
  const stored=rawLocal(ROUTINE_STARTS_KEY,{});
  return stored&&typeof stored==="object"&&!Array.isArray(stored)?stored:{};
}
function saveRoutineStarts(starts){
  localStorage.setItem(ROUTINE_STARTS_KEY,JSON.stringify(starts&&typeof starts==="object"?starts:{}));
  scheduleRecoverySnapshot("routine start changed");
}
function clearExpiredRoutineStarts(){
  const all=loadRoutineStarts();
  const dateKey=getTodayKey();
  const current=all[dateKey]&&typeof all[dateKey]==="object"?{[dateKey]:all[dateKey]}:{};
  if(JSON.stringify(all)!==JSON.stringify(current))localStorage.setItem(ROUTINE_STARTS_KEY,JSON.stringify(current));
}
function normalizeStepRepeat(item,index=0){
  if(!item||typeof item!=="object")return null;
  const date=String(item.date||"");
  const routineId=String(item.routineId||"");
  const text=String(item.text||"").trim();
  if(!date||!routineId||!text)return null;
  return{
    id:String(item.id||makeId("repeat-"+index)),date,routineId,
    sourceStepId:String(item.sourceStepId||""),text,
    rotationGroupId:String(item.rotationGroupId||""),
    createdAt:String(item.createdAt||new Date().toISOString())
  };
}
function loadStepRepeats(){
  const stored=rawLocal(STEP_REPEATS_KEY,[]);
  return(Array.isArray(stored)?stored:[]).map(normalizeStepRepeat).filter(Boolean);
}
function saveStepRepeats(items){
  localStorage.setItem(STEP_REPEATS_KEY,JSON.stringify((Array.isArray(items)?items:[]).map(normalizeStepRepeat).filter(Boolean)));
  scheduleRecoverySnapshot("temporary step repeat changed");
}
function clearExpiredStepRepeats(){
  const dateKey=getTodayKey();
  const all=loadStepRepeats();
  const current=all.filter(item=>item.date===dateKey);
  if(current.length!==all.length)localStorage.setItem(STEP_REPEATS_KEY,JSON.stringify(current));
}
function normalizeRotationGroup(group,id=""){
  const items=(Array.isArray(group&&group.items)?group.items:[]).map((item,index)=>({
    id:String(item&&item.id||makeId("rotation-item-"+index)),text:String(item&&item.text||"").trim()
  })).filter(item=>item.text);
  const validIds=new Set(items.map(item=>item.id));
  const queue=[...new Set((Array.isArray(group&&group.queue)?group.queue:[]).map(String).filter(itemId=>validIds.has(itemId)))];
  items.forEach(item=>{if(!queue.includes(item.id))queue.push(item.id)});
  return{id:String(group&&group.id||id||makeId("rotation")),items,queue};
}
function loadRotations(){
  const stored=rawLocal(ROTATIONS_KEY,{});
  const result={};
  if(stored&&typeof stored==="object"&&!Array.isArray(stored))Object.entries(stored).forEach(([id,group])=>{
    const normalized=normalizeRotationGroup(group,id);
    if(normalized.items.length)result[id]=normalized;
  });
  return result;
}
function saveRotations(rotations){
  const result={};
  Object.entries(rotations&&typeof rotations==="object"?rotations:{}).forEach(([id,group])=>{
    const normalized=normalizeRotationGroup(group,id);
    if(normalized.items.length)result[id]=normalized;
  });
  localStorage.setItem(ROTATIONS_KEY,JSON.stringify(result));
  scheduleRecoverySnapshot("rotating substeps changed");
}
function orderedRotationItems(group){
  if(!group)return[];
  const byId=new Map(group.items.map(item=>[item.id,item]));
  return group.queue.map(id=>byId.get(id)).filter(Boolean);
}
function rotateSubstep(groupId,itemId){
  const rotations=loadRotations();
  const group=rotations[groupId];
  if(!group||!group.queue.includes(itemId))return;
  group.queue=group.queue.filter(id=>id!==itemId);
  group.queue.push(itemId);
  saveRotations(rotations);
  render();
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
function normalizePriorityCarryover(item,index=0){
  if(!item||typeof item!=="object")return null;
  const routineId=String(item.routineId||"");
  const text=String(item.text||"").trim();
  const sourceDate=String(item.sourceDate||"");
  if(!routineId||!text||!sourceDate)return null;
  return{
    id:String(item.id||makeId("priority-"+index)),
    routineId,
    sourceStepId:String(item.sourceStepId||""),
    rotationGroupId:String(item.rotationGroupId||""),
    repeatable:item.repeatable===true,
    text,
    sourceDate,
    sourceOrder:Number.isFinite(Number(item.sourceOrder))?Number(item.sourceOrder):index,
    queuedAt:String(item.queuedAt||""),
    claimedDate:String(item.claimedDate||""),
    completedDate:String(item.completedDate||"")
  };
}
function loadPriorityCarryovers(){
  const stored=rawLocal(PRIORITY_KEY,[]);
  return(Array.isArray(stored)?stored:[]).map(normalizePriorityCarryover).filter(Boolean);
}
function savePriorityCarryovers(items){
  localStorage.setItem(PRIORITY_KEY,JSON.stringify(items.map(normalizePriorityCarryover).filter(Boolean)));
  scheduleRecoverySnapshot("step priority changed");
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
function scheduledRoutinesOn(date=new Date()){
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
function dueRoutinesOn(date=new Date()){
  const dateKey=getLocalDateKey(date);
  return scheduledRoutinesOn(date).filter(routine=>visibleStepsForDate(routine,dateKey).length>0);
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
function weekdayFromDateKey(dateKey){
  const parts=String(dateKey||"").split("-").map(Number);
  if(parts.length!==3||parts.some(value=>!Number.isFinite(value)))return new Date().getDay();
  return new Date(parts[0],parts[1]-1,parts[2],12,0,0,0).getDay();
}
function stepRunsOn(step,dateKey){
  return !Array.isArray(step.days)||step.days.length===0||step.days.includes(weekdayFromDateKey(dateKey));
}
function claimPriorityCarryoversForDate(date=new Date()){
  const dateKey=getLocalDateKey(date);
  const scheduledIds=new Set(scheduledRoutinesOn(date).map(routine=>routine.id));
  const items=loadPriorityCarryovers();
  let changed=false;
  items.forEach(item=>{
    if(item.completedDate)return;
    if(item.claimedDate&&item.claimedDate<dateKey){item.claimedDate="";changed=true}
    if(!item.claimedDate&&item.sourceDate<dateKey&&scheduledIds.has(item.routineId)){
      item.claimedDate=dateKey;
      changed=true;
    }
  });
  if(changed)savePriorityCarryovers(items);
  return items;
}
function visiblePriorityStepsForDate(routine,dateKey){
  return loadPriorityCarryovers()
    .filter(item=>item.routineId===routine.id&&item.claimedDate===dateKey)
    .sort((a,b)=>a.sourceDate.localeCompare(b.sourceDate)||a.sourceOrder-b.sourceOrder||a.queuedAt.localeCompare(b.queuedAt))
    .map(item=>({
      id:item.id,text:item.text,createdAt:"",days:null,priority:true,
      prioritySourceDate:item.sourceDate,sourceStepId:item.sourceStepId,rotationGroupId:item.rotationGroupId||"",repeatable:item.repeatable===true
    }));
}
function visibleRepeatStepsForDate(routine,dateKey){
  return loadStepRepeats()
    .filter(item=>item.date===dateKey&&item.routineId===routine.id)
    .sort((a,b)=>a.createdAt.localeCompare(b.createdAt))
    .map(item=>({
      id:item.id,text:item.text,createdAt:item.createdAt,days:null,
      sourceStepId:item.sourceStepId,rotationGroupId:item.rotationGroupId||"",
      repeatable:true,temporaryRepeat:true
    }));
}
function visibleStepsForDate(routine,dateKey){
  const prioritySteps=visiblePriorityStepsForDate(routine,dateKey);
  const entry=progressEntry(dateKey,routine.id);
  let steps=routine.steps;
  if(entry&&entry.state==="done"){
    if(!entry.completedAt)steps=routine.steps.filter(step=>!step.createdAt);
    else steps=routine.steps.filter(step=>!step.createdAt||step.createdAt<=entry.completedAt);
  }
  const scheduledSteps=applyStepOverrides(routine,steps.filter(step=>stepRunsOn(step,dateKey)),dateKey);
  const repeatSteps=visibleRepeatStepsForDate(routine,dateKey);
  return[...prioritySteps,...scheduledSteps,...repeatSteps];
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
  if(current&&current.state==="done"&&(summary.total===0||summary.resolved!==summary.total)){
    delete progress[dateKey][routine.id];
    if(Object.keys(progress[dateKey]).length===0)delete progress[dateKey];
  }
  saveProgress(progress);
}
function routineReadyToComplete(routine,dateKey=getTodayKey()){
  const summary=stepSummary(routine,dateKey);
  return !isRoutineResolved(dateKey,routine.id)&&summary.total>0&&summary.resolved===summary.total;
}
function completeRoutineForToday(routineId){
  const dateKey=getTodayKey();
  const routine=dueRoutinesOn(new Date()).find(item=>item.id===routineId);
  const current=currentRoutineForDate(dueRoutinesOn(new Date()),dateKey);
  if(!routine||!current||current.id!==routine.id||!routineReadyToComplete(routine,dateKey))return;
  const summary=stepSummary(routine,dateKey);
  const progress=loadProgress();
  progress[dateKey]=progress[dateKey]||{};
  progress[dateKey][routine.id]={state:"done",completedAt:new Date().toISOString(),skippedSteps:summary.skipped};
  saveProgress(progress);
  manuallyCollapsed[routine.id]=true;
  render();
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
function queuedPriorityForStep(routineId,stepId,dateKey=getTodayKey()){
  return loadPriorityCarryovers().find(item=>item.routineId===routineId&&item.sourceStepId===stepId&&item.sourceDate===dateKey)||null;
}
function removeQueuedPriority(routineId,stepId,dateKey=getTodayKey()){
  const items=loadPriorityCarryovers();
  const remaining=items.filter(item=>!(item.routineId===routineId&&item.sourceStepId===stepId&&item.sourceDate===dateKey));
  if(remaining.length!==items.length)savePriorityCarryovers(remaining);
}
function togglePriorityNextTime(routine,step,dateKey=getTodayKey()){
  if(getStepState(dateKey,routine.id,step.id)!=="skipped")return;
  const items=loadPriorityCarryovers();
  const existingIndex=items.findIndex(item=>item.routineId===routine.id&&item.sourceStepId===step.id&&item.sourceDate===dateKey);
  if(existingIndex>=0)items.splice(existingIndex,1);
  else{
    const sourceOrder=visibleStepsForDate(routine,dateKey).findIndex(item=>item.id===step.id);
    items.push(normalizePriorityCarryover({
      id:makeId("priority"),routineId:routine.id,sourceStepId:step.id,text:step.text,
      rotationGroupId:step.rotationGroupId||"",
      repeatable:step.repeatable===true,
      sourceDate:dateKey,sourceOrder:sourceOrder<0?routine.steps.length:sourceOrder,
      queuedAt:new Date().toISOString(),claimedDate:"",completedDate:""
    }));
  }
  savePriorityCarryovers(items);
  render();
}
function updatePriorityCompletion(step,dateKey,status){
  if(!step.priority)return;
  const items=loadPriorityCarryovers();
  const item=items.find(candidate=>candidate.id===step.id);
  if(!item)return;
  item.completedDate=status==="pending"?"":dateKey;
  savePriorityCarryovers(items);
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
  if(status==="pending"&&current==="skipped")removeQueuedPriority(routine.id,stepId,dateKey);
  updatePriorityCompletion(steps[index],dateKey,status);
  syncRoutineProgress(routine,dateKey);
  manuallyCollapsed[routine.id]=isRoutineResolved(dateKey,routine.id);
  render();
}
function repeatStepForToday(routine,stepId){
  const dateKey=getTodayKey();
  const steps=visibleStepsForDate(routine,dateKey);
  const index=steps.findIndex(step=>step.id===stepId);
  const step=steps[index];
  if(!step||!step.repeatable||getStepState(dateKey,routine.id,stepId)!=="done"||isRoutineResolved(dateKey,routine.id))return;
  const repeats=loadStepRepeats();
  repeats.push(normalizeStepRepeat({
    id:makeId("repeat"),date:dateKey,routineId:routine.id,
    sourceStepId:step.sourceStepId||step.id,text:step.text,
    rotationGroupId:step.rotationGroupId||"",createdAt:new Date().toISOString()
  }));
  saveStepRepeats(repeats);
  syncRoutineProgress(routine,dateKey);
  manuallyCollapsed[routine.id]=false;
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
  const priorities=loadPriorityCarryovers()
    .filter(item=>!(item.routineId===routineId&&item.sourceDate===dateKey))
    .map(item=>item.routineId===routineId&&item.claimedDate===dateKey?{...item,completedDate:""}:item);
  if(overrides[dateKey])delete overrides[dateKey][routineId];
  saveProgress(progress);
  saveStepState(states);
  saveStepOverrides(overrides);
  savePriorityCarryovers(priorities);
  saveStepRepeats(loadStepRepeats().filter(item=>!(item.date===dateKey&&item.routineId===routineId)));
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
function routineHasActivity(routine,dateKey){
  const entry=progressEntry(dateKey,routine.id);
  return Boolean(entry)||visibleStepsForDate(routine,dateKey).some(step=>getStepState(dateKey,routine.id,step.id)!=="pending");
}
function isRoutineStarted(routine,dateKey=getTodayKey()){
  if(routine.startMode!=="manual")return true;
  return Boolean(loadRoutineStarts()[dateKey]?.[routine.id])||routineHasActivity(routine,dateKey);
}
function startRoutineForToday(routineId){
  const dateKey=getTodayKey();
  const due=dueRoutinesOn(new Date());
  const next=currentRoutineForDate(due,dateKey);
  if(!next||next.id!==routineId||next.startMode!=="manual")return;
  const starts=loadRoutineStarts();
  starts[dateKey]=starts[dateKey]||{};
  starts[dateKey][routineId]=new Date().toISOString();
  saveRoutineStarts(starts);
  manuallyCollapsed[routineId]=false;
  render();
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
  row.className="routine-step-row "+state+(locked?" locked":"")+(step.priority?" priority-step":"")+(step.temporaryRepeat?" temporary-repeat-step":"");
  const checkEnabled=(state==="pending"&&!locked)||(state==="done"&&canUndo);
  const skipEnabled=(state==="pending"&&!locked)||(state==="skipped"&&canUndo);
  const checkIcon=state==="done"?"✓":state==="skipped"?"—":locked?"🔒":"";
  const checkLabel=state==="done"?"Uncheck "+step.text:state==="pending"&&!locked?"Complete "+step.text:state==="skipped"?"Skipped "+step.text:"Locked "+step.text;
  const replaceCount=state==="done"&&!step.temporary&&!step.priority?pendingMatchingSteps(routine,step.id,dateKey).length:0;
  const priorityQueued=state==="skipped"&&Boolean(queuedPriorityForStep(routine.id,step.id,dateKey));
  const skipButton='<button class="step-skip-btn '+(state==="skipped"?"active":"")+'" type="button" '+(skipEnabled?"":"disabled")+' aria-label="'+(state==="skipped"?"Clear skipped ":"Skip ")+escapeHtml(step.text)+'">Skip</button>';
  const repeatButton=step.repeatable&&state==="done"&&!isRoutineResolved(dateKey,routine.id)?'<button class="step-repeat-btn" type="button" aria-label="Repeat '+escapeHtml(step.text)+' at the bottom" title="Repeat at bottom">↻</button>':"";
  const priorityButton=state==="skipped"&&!step.temporaryRepeat?'<button class="step-priority-btn '+(priorityQueued?"active":"")+'" type="button" aria-label="'+(priorityQueued?"Remove priority next time for ":"Priority next time for ")+escapeHtml(step.text)+'" title="Priority Next Time">'+(priorityQueued?"⚑":"⚐")+'</button>':"";
  row.innerHTML=
    '<button class="routine-step-check" type="button" '+(checkEnabled?"":"disabled")+' aria-label="'+escapeHtml(checkLabel)+'"><span aria-hidden="true">'+checkIcon+'</span></button>'+
    '<div class="routine-step-copy"><span class="routine-step-number">'+String(index+1)+'.</span><span class="routine-step-text">'+escapeHtml(step.text)+'</span>'+(step.priority?'<span class="priority-step-pill">Priority</span>':step.temporaryRepeat?'<span class="repeat-step-pill">Repeat</span>':step.temporary?'<span class="temporary-step-pill">Today</span>':"")+'</div>'+
    ((state==="pending"&&!locked)||state==="skipped"
      ?'<div class="step-actions">'+skipButton+priorityButton+'</div>'
      :repeatButton||replaceCount?'<div class="step-actions">'+repeatButton+(replaceCount?'<button class="step-replace-btn" type="button" aria-label="Replace '+replaceCount+' remaining '+escapeHtml(step.text)+' '+(replaceCount===1?'step':'steps')+' for today">Replace</button>':"")+'</div>'
      :'<span class="routine-step-control-spacer" aria-hidden="true"></span>');
  row.querySelector(".routine-step-check").addEventListener("click",()=>{
    if(state==="pending")setStepStatus(routine,step.id,"done");
    else if(state==="done"&&canUndo)setStepStatus(routine,step.id,"pending");
  });
  row.querySelector(".step-skip-btn")?.addEventListener("click",()=>{
    if(state==="pending")setStepStatus(routine,step.id,"skipped");
    else if(state==="skipped"&&canUndo)setStepStatus(routine,step.id,"pending");
  });
  row.querySelector(".step-priority-btn")?.addEventListener("click",()=>togglePriorityNextTime(routine,step,dateKey));
  row.querySelector(".step-repeat-btn")?.addEventListener("click",()=>repeatStepForToday(routine,step.id));
  row.querySelector(".step-replace-btn")?.addEventListener("click",()=>replaceRemainingStepsForToday(routine,step.id));
  const rotation=step.temporary?null:loadRotations()[step.rotationGroupId];
  if(rotation&&rotation.items.length){
    const details=document.createElement("details");
    const rowKey=routine.id+"::"+step.id;
    details.className="step-rotation-today";
    details.open=expandedRotationRows.has(rowKey);
    const items=orderedRotationItems(rotation);
    details.innerHTML='<summary><span>↻ Rotating areas</span><small>Next: '+escapeHtml(items[0]?.text||"")+'</small></summary><div class="step-rotation-list">'+items.map((item,itemIndex)=>'<button type="button" data-item-id="'+escapeHtml(item.id)+'" '+(state==="pending"&&!locked?"":"disabled")+'><span>'+escapeHtml(item.text)+'</span><small>'+(itemIndex===0?"Next":"Later")+'</small></button>').join("")+'</div>';
    details.addEventListener("toggle",()=>details.open?expandedRotationRows.add(rowKey):expandedRotationRows.delete(rowKey));
    details.querySelectorAll("button[data-item-id]").forEach(button=>button.addEventListener("click",()=>rotateSubstep(step.rotationGroupId,button.dataset.itemId)));
    row.appendChild(details);
  }
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
    const isNext=Boolean(currentRoutine&&routine.id===currentRoutine.id);
    const waitingToStart=Boolean(isNext&&!complete&&!isRoutineStarted(routine,dateKey));
    const isCurrent=Boolean(isNext&&!waitingToStart);
    const routineLocked=Boolean(currentRoutine&&!complete&&!isNext);
    const defaultCollapsed=complete&&loadSettings().autoCollapseCompletedRoutines!==false;
    const collapsed=routineLocked||waitingToStart?true:isCurrent?false:manuallyCollapsed[routine.id]===undefined?defaultCollapsed:manuallyCollapsed[routine.id];
    const card=document.createElement("article");
    card.className="routine-card "+(complete?"completed-routine ":"")+(isCurrent?"current-routine ":"")+(waitingToStart?"waiting-routine ":"")+(routineLocked?"locked-routine ":"")+(collapsed?"collapsed":"");
    const status=routineLocked?"Locked · "+(isRoutineStarted(currentRoutine,dateKey)?"Finish ":"Start ")+currentRoutine.name+" first":waitingToStart?"Ready when you are · Manual start":skipped?"Skipped":summary.resolved+"/"+summary.total+" steps"+(summary.skipped?" · "+summary.skipped+" skipped":"");
    card.innerHTML=
      '<button class="routine-card-header" type="button" aria-expanded="'+String(!collapsed)+'" '+(routineLocked?'disabled aria-label="Locked routine '+escapeHtml(routine.name)+'"':waitingToStart?'disabled aria-label="'+escapeHtml(routine.name)+' is ready to start"':isCurrent?'aria-disabled="true"':"")+'>'+
        '<span class="routine-order">'+(routineLocked?"🔒":waitingToStart?"▶":String(index+1))+'</span>'+
        '<span class="routine-card-copy"><strong>'+escapeHtml(routine.name)+(complete?" ✓":"")+'</strong><small>'+escapeHtml(status)+(routine.lockSteps?" · In order":" · Any order")+'</small></span>'+
        '<span class="routine-chevron">'+(collapsed?"▶":"▼")+'</span>'+
      '</button>'+
      '<div class="routine-start-panel">'+(waitingToStart?'<button class="primary-btn start-routine-btn" type="button">Start Routine</button><small>This routine will open and stay active until it is resolved.</small>':"")+'</div>'+
      '<div class="routine-card-body"></div>';
    if(complete)card.querySelector(".routine-card-header").addEventListener("click",()=>{
        manuallyCollapsed[routine.id]=!collapsed;
        render();
      });
    const body=card.querySelector(".routine-card-body");
    card.querySelector(".start-routine-btn")?.addEventListener("click",()=>startRoutineForToday(routine.id));
    if(skipped){
      body.innerHTML='<p class="helper-text">This routine was skipped before the v12 migration.</p><button class="small-btn clear-routine-btn" type="button">Clear Skipped Routine</button>';
      body.querySelector(".clear-routine-btn").addEventListener("click",()=>clearRoutineForToday(routine.id));
    }else{
      summary.steps.forEach((step,stepIndex)=>body.appendChild(renderStepRow(routine,step,stepIndex,dateKey)));
      if(isCurrent&&routineReadyToComplete(routine,dateKey)){
        const finish=document.createElement("div");
        finish.className="routine-finish-panel";
        finish.innerHTML='<button class="primary-btn complete-routine-btn" type="button">Complete Routine</button><small>Finish this routine and unlock the next one.</small>';
        finish.querySelector(".complete-routine-btn").addEventListener("click",()=>completeRoutineForToday(routine.id));
        body.appendChild(finish);
      }
    }
    E.routineList.appendChild(card);
  });
}
function getSkippedItems(){
  const dateKey=getTodayKey();
  const items=[];
  dueRoutinesOn(new Date()).forEach(routine=>{
    if(isRoutineSkipped(dateKey,routine.id)){
      items.push({routine:routine.name,step:"Entire routine",routineObject:routine,stepObject:null});
      return;
    }
    visibleStepsForDate(routine,dateKey).forEach(step=>{
      if(getStepState(dateKey,routine.id,step.id)==="skipped")items.push({routine:routine.name,step:step.text,routineObject:routine,stepObject:step});
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
  E.skipReviewDetails.innerHTML="";
  items.forEach(item=>{
    const detail=document.createElement("div");
    detail.className="skip-review-item";
    const queued=item.stepObject&&queuedPriorityForStep(item.routineObject.id,item.stepObject.id);
    detail.innerHTML='<div><strong>'+escapeHtml(item.step)+'</strong><small>'+escapeHtml(item.routine)+'</small></div>'+(item.stepObject?'<button class="review-priority-btn '+(queued?"active":"")+'" type="button" aria-label="'+(queued?"Remove priority next time for ":"Priority next time for ")+escapeHtml(item.step)+'">'+(queued?"⚑":"⚐")+' Priority Next Time</button>':"");
    detail.querySelector(".review-priority-btn")?.addEventListener("click",()=>togglePriorityNextTime(item.routineObject,item.stepObject));
    E.skipReviewDetails.appendChild(detail);
  });
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
  const remainingRoutines=loadRoutines().filter(item=>item.id!==id);
  saveRoutines(remainingRoutines);
  const rotations=loadRotations();
  const usedGroups=new Set(remainingRoutines.flatMap(item=>item.steps.map(step=>step.rotationGroupId).filter(Boolean)));
  Object.keys(rotations).forEach(groupId=>{if(!usedGroups.has(groupId))delete rotations[groupId]});
  saveRotations(rotations);
  const progress=loadProgress();
  const states=loadStepState();
  const overrides=loadStepOverrides();
  Object.keys(progress).forEach(dateKey=>{if(progress[dateKey])delete progress[dateKey][id]});
  Object.keys(states).forEach(dateKey=>{if(states[dateKey])delete states[dateKey][id]});
  Object.keys(overrides).forEach(dateKey=>{if(overrides[dateKey])delete overrides[dateKey][id]});
  saveProgress(progress);
  saveStepState(states);
  saveStepOverrides(overrides);
  savePriorityCarryovers(loadPriorityCarryovers().filter(item=>item.routineId!==id));
  saveStepRepeats(loadStepRepeats().filter(item=>item.routineId!==id));
  const starts=loadRoutineStarts();
  Object.keys(starts).forEach(dateKey=>{if(starts[dateKey])delete starts[dateKey][id]});
  saveRoutineStarts(starts);
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
      '<div class="habit-row-main"><div class="compact-habit-title"><strong>'+escapeHtml(routine.name)+'</strong>'+(inactive?'<span class="habit-status-pill">'+(routine.paused?"Paused":"Until "+snoozeLabel(routine))+'</span>':"")+'</div><small>#'+(index+1)+' · '+escapeHtml(scheduleLabel(routine))+' · '+stepCount+' · '+(routine.lockSteps?"In order":"Any order")+' · '+(routine.startMode==="manual"?"Manual start":"Auto start")+'</small></div>'+
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
function normalizedStepName(text){return String(text||"").trim().replace(/\s+/g," ").toLocaleLowerCase()}
function stepRefs(routines,name){
  const key=normalizedStepName(name);
  const refs=[];
  routines.forEach(routine=>routine.steps.forEach(step=>{if(normalizedStepName(step.text)===key)refs.push({routine,step})}));
  return refs;
}
function matchRoutineSummary(refs){
  return[...new Set(refs.map(ref=>ref.routine.name))].join(", ");
}
function finishMatchAction(choice){
  E.matchActionSheet.classList.add("hidden");
  const resolve=matchActionResolver;
  matchActionResolver=null;
  if(resolve)resolve(choice);
}
function askMatchAction({title,message,oneLabel,allLabel,dangerAll=false}){
  E.matchActionTitle.textContent=title;
  E.matchActionMessage.textContent=message;
  E.matchActionOneBtn.textContent=oneLabel;
  E.matchActionAllBtn.textContent=allLabel;
  E.matchActionAllBtn.classList.toggle("danger-btn",dangerAll);
  E.matchActionAllBtn.classList.toggle("primary-btn",!dangerAll);
  E.matchActionSheet.classList.remove("hidden");
  return new Promise(resolve=>{matchActionResolver=resolve});
}
function rotationEditorMarkup(step){
  const group=selectedRotations[step.rotationGroupId];
  if(!group)return'<button type="button" class="small-btn add-rotation-btn">＋ Add Rotating Substeps</button>';
  const items=orderedRotationItems(group);
  return'<details class="rotation-editor" open><summary>↻ Rotating Substeps <span>'+items.length+'</span></summary><p class="helper-text no-top">Optional reminders. Tapping one on Today moves it to the end without completing the parent step.</p><div class="rotation-editor-items">'+items.map((item,itemIndex)=>'<div class="rotation-editor-item"><input type="text" data-rotation-item="'+escapeHtml(item.id)+'" value="'+escapeHtml(item.text)+'" placeholder="Room or area" aria-label="Rotating substep '+(itemIndex+1)+'" /><div><button type="button" class="reorder-btn rotation-up" data-item-id="'+escapeHtml(item.id)+'" '+(itemIndex===0?"disabled":"")+'>↑</button><button type="button" class="reorder-btn rotation-down" data-item-id="'+escapeHtml(item.id)+'" '+(itemIndex===items.length-1?"disabled":"")+'>↓</button><button type="button" class="danger-btn remove-rotation-item" data-item-id="'+escapeHtml(item.id)+'">✕</button></div></div>').join("")+'</div><div class="rotation-editor-actions"><button type="button" class="small-btn add-rotation-item">＋ Area</button><button type="button" class="small-btn unlink-rotation-btn">Remove List From This Step</button></div></details>';
}
function addRotationToStep(index){
  const id=makeId("rotation");
  selectedRotations[id]={id,items:[{id:makeId("rotation-item"),text:""}],queue:[]};
  selectedRotations[id].queue=[selectedRotations[id].items[0].id];
  selectedSteps[index].rotationGroupId=id;
  renderStepsEditor();
}
function updateRotationItem(groupId,itemId,text){
  const item=selectedRotations[groupId]?.items.find(candidate=>candidate.id===itemId);
  if(item)item.text=text;
}
function moveRotationItem(groupId,itemId,direction){
  const group=selectedRotations[groupId];
  const index=group?.queue.indexOf(itemId)??-1;
  const target=index+direction;
  if(!group||index<0||target<0||target>=group.queue.length)return;
  [group.queue[index],group.queue[target]]=[group.queue[target],group.queue[index]];
  renderStepsEditor();
}
function removeRotationItem(groupId,itemId){
  const group=selectedRotations[groupId];
  if(!group)return;
  group.items=group.items.filter(item=>item.id!==itemId);
  group.queue=group.queue.filter(id=>id!==itemId);
  renderStepsEditor();
}
function duplicateEditorStep(index){
  const source=selectedSteps[index];
  selectedSteps.splice(index+1,0,{id:makeId("step"),text:source.text,createdAt:new Date().toISOString(),days:Array.isArray(source.days)?[...source.days]:null,rotationGroupId:source.rotationGroupId||"",repeatable:source.repeatable===true,originalText:"",originalRotationGroupId:""});
  renderStepsEditor();
}
async function requestRemoveEditorStep(index){
  const source=selectedSteps[index];
  const persisted=loadRoutines();
  const existing=persisted.flatMap(routine=>routine.steps.map(step=>({routine,step}))).find(ref=>ref.step.id===source.id);
  if(!existing){selectedSteps.splice(index,1);renderStepsEditor();return}
  const matches=stepRefs(persisted,existing.step.text).filter(ref=>!pendingDeleteStepIds.has(ref.step.id));
  let ids=[source.id];
  if(matches.length>1){
    const choice=await askMatchAction({title:"Delete matching steps?",message:'Found '+matches.length+' exact matches for "'+existing.step.text+'" in '+matchRoutineSummary(matches)+'. Choose what Save Changes should remove.',oneLabel:"Delete Only This Step",allLabel:"Delete All Exact Matches",dangerAll:true});
    if(choice==="cancel")return;
    if(choice==="all")ids=matches.map(ref=>ref.step.id);
  }
  ids.forEach(id=>pendingDeleteStepIds.add(id));
  selectedSteps=selectedSteps.filter(step=>!ids.includes(step.id));
  renderStepsEditor();
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
    const stepDays=uniqueDays(step.days);
    row.innerHTML='<input class="step-name-input" type="text" value="'+escapeHtml(step.text)+'" aria-label="Routine step '+(index+1)+'" /><div class="routine-step-reorder"><button type="button" class="reorder-btn step-up" '+(index===0?"disabled":"")+'>↑</button><button type="button" class="reorder-btn step-down" '+(index===selectedSteps.length-1?"disabled":"")+'>↓</button></div><button type="button" class="small-btn duplicate-step-btn">Copy</button><button type="button" class="danger-btn remove-step-btn" aria-label="Remove step">✕</button><label class="step-repeat-editor"><input class="step-repeatable" type="checkbox" '+(step.repeatable?"checked":"")+' /> Can repeat at the bottom today</label><div class="step-schedule-editor"><label><input class="step-every-day" type="checkbox" '+(stepDays.length?"":"checked")+' /> Every routine day</label><div class="step-day-buttons '+(stepDays.length?"":"hidden")+'">'+[1,2,3,4,5,6,0].map(day=>'<button type="button" data-day="'+day+'" class="'+(stepDays.includes(day)?"selected":"")+'">'+DAY_LABELS[day]+'</button>').join("")+'</div></div><div class="rotation-editor-shell">'+rotationEditorMarkup(step)+'</div>';
    row.querySelector(".step-name-input").addEventListener("input",event=>selectedSteps[index].text=event.target.value);
    row.querySelector(".step-up").addEventListener("click",()=>moveEditorStep(index,-1));
    row.querySelector(".step-down").addEventListener("click",()=>moveEditorStep(index,1));
    row.querySelector(".duplicate-step-btn").addEventListener("click",()=>duplicateEditorStep(index));
    row.querySelector(".remove-step-btn").addEventListener("click",()=>requestRemoveEditorStep(index));
    row.querySelector(".step-repeatable").addEventListener("change",event=>selectedSteps[index].repeatable=event.target.checked);
    row.querySelector(".add-rotation-btn")?.addEventListener("click",()=>addRotationToStep(index));
    row.querySelector(".add-rotation-item")?.addEventListener("click",()=>{
      const group=selectedRotations[step.rotationGroupId];
      const item={id:makeId("rotation-item"),text:""};
      group.items.push(item);group.queue.push(item.id);renderStepsEditor();
    });
    row.querySelector(".unlink-rotation-btn")?.addEventListener("click",()=>{selectedSteps[index].rotationGroupId="";renderStepsEditor()});
    row.querySelectorAll("[data-rotation-item]").forEach(input=>input.addEventListener("input",event=>updateRotationItem(step.rotationGroupId,input.dataset.rotationItem,event.target.value)));
    row.querySelectorAll(".rotation-up").forEach(button=>button.addEventListener("click",()=>moveRotationItem(step.rotationGroupId,button.dataset.itemId,-1)));
    row.querySelectorAll(".rotation-down").forEach(button=>button.addEventListener("click",()=>moveRotationItem(step.rotationGroupId,button.dataset.itemId,1)));
    row.querySelectorAll(".remove-rotation-item").forEach(button=>button.addEventListener("click",()=>removeRotationItem(step.rotationGroupId,button.dataset.itemId)));
    row.querySelector(".step-every-day").addEventListener("change",event=>{
      selectedSteps[index].days=event.target.checked?null:[...selectedDays.length?selectedDays:[new Date().getDay()]];
      renderStepsEditor();
    });
    row.querySelectorAll(".step-day-buttons button").forEach(button=>button.addEventListener("click",()=>{
      const day=Number(button.dataset.day);
      const current=uniqueDays(selectedSteps[index].days);
      if(current.length===1&&current.includes(day))return;
      selectedSteps[index].days=current.includes(day)?current.filter(value=>value!==day):uniqueDays([...current,day]);
      renderStepsEditor();
    }));
    E.stepsEditorList.appendChild(row);
  });
}
function moveEditorStep(index,direction){
  const target=index+direction;
  if(target<0||target>=selectedSteps.length)return;
  [selectedSteps[index],selectedSteps[target]]=[selectedSteps[target],selectedSteps[index]];
  renderStepsEditor();
  E.stepsEditorList.querySelectorAll(".step-name-input")[target]?.focus();
}
function addEditorStep(){
  selectedSteps.push({id:makeId("step"),text:"",createdAt:new Date().toISOString(),days:null,rotationGroupId:"",repeatable:false,originalText:"",originalRotationGroupId:""});
  renderStepsEditor();
  const inputs=E.stepsEditorList.querySelectorAll(".step-name-input");
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
  E.routineStartMode.value="automatic";
  E.routineSnoozeUntil.value="";
  E.customDays.classList.add("hidden");
  setSelectedDays([]);
  selectedSteps=[];
  selectedRotations=JSON.parse(JSON.stringify(loadRotations()));
  pendingDeleteStepIds=new Set();
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
  E.routineStartMode.value=routine.startMode||"automatic";
  E.routineSnoozeUntil.value=routine.snoozeUntil||"";
  E.customDays.classList.toggle("hidden",routine.schedule!=="custom");
  setSelectedDays(routine.days);
  selectedRotations=JSON.parse(JSON.stringify(loadRotations()));
  pendingDeleteStepIds=new Set();
  selectedSteps=routine.steps.map(step=>({...step,days:Array.isArray(step.days)?[...step.days]:null,originalText:step.text,originalRotationGroupId:step.rotationGroupId||""}));
  renderStepsEditor();
  openRoutineEditor();
}
async function saveRoutineFromForm(event){
  event.preventDefault();
  const name=E.routineName.value.trim();
  const schedule=E.routineSchedule.value;
  const steps=selectedSteps.map(normalizeStep).filter(step=>step.text);
  if(!name){alert("Add a routine name first.");return}
  if(schedule==="custom"&&selectedDays.length===0){alert("Choose at least one day.");return}
  if(steps.length===0){alert("Add at least one routine step.");return}
  E.saveRoutineBtn.disabled=true;
  const persisted=loadRoutines();
  let routines=persisted.map(routine=>({...routine,steps:routine.steps.map(step=>({...step}))}));
  const renameAll=[];
  const linkAll=[];
  try{
    for(const selected of selectedSteps){
      if(!selected.originalText||pendingDeleteStepIds.has(selected.id))continue;
      if(normalizedStepName(selected.originalText)!==normalizedStepName(selected.text)){
        const matches=stepRefs(persisted,selected.originalText).filter(ref=>!pendingDeleteStepIds.has(ref.step.id));
        if(matches.length>1){
          const choice=await askMatchAction({title:"Rename matching steps?",message:'Found '+matches.length+' exact matches for "'+selected.originalText+'" in '+matchRoutineSummary(matches)+'.',oneLabel:"Rename Only This Step",allLabel:"Rename All Matches"});
          if(choice==="cancel")return;
          if(choice==="all")renameAll.push({ids:matches.map(ref=>ref.step.id),text:selected.text});
        }
      }
      if(!selected.originalRotationGroupId&&selected.rotationGroupId){
        const matches=stepRefs(persisted,selected.originalText).filter(ref=>ref.step.id!==selected.id&&!pendingDeleteStepIds.has(ref.step.id));
        if(matches.length){
          const conflicts=matches.filter(ref=>ref.step.rotationGroupId&&ref.step.rotationGroupId!==selected.rotationGroupId).length;
          const warning=conflicts?' '+conflicts+' matching '+(conflicts===1?'step already has':'steps already have')+' another rotating list; linking will replace '+(conflicts===1?'it':'them')+'.':'';
          const choice=await askMatchAction({title:"Share this rotating list?",message:'Found '+matches.length+' other exact '+(matches.length===1?'match':'matches')+' in '+matchRoutineSummary(matches)+'.'+warning,oneLabel:"Only This Step",allLabel:"Apply & Link All Matches"});
          if(choice==="cancel")return;
          if(choice==="all")linkAll.push({ids:matches.map(ref=>ref.step.id),groupId:selected.rotationGroupId});
        }
      }
    }
    routines=routines.map(routine=>({...routine,steps:routine.steps.filter(step=>!pendingDeleteStepIds.has(step.id))}));
    if(editingRoutineId){
      const routineIndex=routines.findIndex(routine=>routine.id===editingRoutineId);
      if(routineIndex>=0)routines[routineIndex]={...routines[routineIndex],name,schedule,days:schedule==="custom"?selectedDays:[],lockSteps:E.lockSteps.checked,startMode:E.routineStartMode.value,snoozeUntil:E.routineSnoozeUntil.value,steps};
    }else{
      routines.push(normalizeRoutine({id:makeId(name),name,schedule,days:schedule==="custom"?selectedDays:[],order:(routines.length+1)*10,lockSteps:E.lockSteps.checked,startMode:E.routineStartMode.value,snoozeUntil:E.routineSnoozeUntil.value,steps}));
    }
    renameAll.forEach(operation=>routines.forEach(routine=>routine.steps.forEach(step=>{if(operation.ids.includes(step.id))step.text=operation.text})));
    linkAll.forEach(operation=>routines.forEach(routine=>routine.steps.forEach(step=>{if(operation.ids.includes(step.id))step.rotationGroupId=operation.groupId})));
    const rotations={};
    Object.entries(selectedRotations).forEach(([id,group])=>{const normalized=normalizeRotationGroup(group,id);if(normalized.items.length)rotations[id]=normalized});
    routines.forEach(routine=>routine.steps.forEach(step=>{if(step.rotationGroupId&&!rotations[step.rotationGroupId])step.rotationGroupId=""}));
    const usedGroups=new Set(routines.flatMap(routine=>routine.steps.map(step=>step.rotationGroupId).filter(Boolean)));
    Object.keys(rotations).forEach(id=>{if(!usedGroups.has(id))delete rotations[id]});
    let priorities=loadPriorityCarryovers().filter(item=>!pendingDeleteStepIds.has(item.sourceStepId));
    renameAll.forEach(operation=>priorities.forEach(item=>{if(!item.completedDate&&operation.ids.includes(item.sourceStepId))item.text=operation.text}));
    priorities.forEach(item=>{if(!item.completedDate){const source=routines.flatMap(routine=>routine.steps).find(step=>step.id===item.sourceStepId);if(source)item.rotationGroupId=source.rotationGroupId||""}});
    saveRoutines(routines);
    saveRotations(rotations);
    savePriorityCarryovers(priorities);
    saveStepRepeats(loadStepRepeats().filter(item=>!pendingDeleteStepIds.has(item.sourceStepId)));
    resetRoutineForm();
    closeRoutineEditor();
    render();
  }finally{E.saveRoutineBtn.disabled=false}
}
function openPanel(panel){panel.classList.remove("hidden");document.body.style.overflow="hidden"}
function closePanel(panel){panel.classList.add("hidden");document.body.style.overflow=""}
function resetToday(){
  if(!confirm("Reset all routine progress, manual starts, temporary replacements, temporary repeats, and priority choices for today?"))return;
  const dateKey=getTodayKey();
  const progress=loadProgress();
  const states=loadStepState();
  const overrides=loadStepOverrides();
  delete progress[dateKey];
  delete states[dateKey];
  delete overrides[dateKey];
  const starts=loadRoutineStarts();
  delete starts[dateKey];
  const priorities=loadPriorityCarryovers()
    .filter(item=>item.sourceDate!==dateKey)
    .map(item=>item.claimedDate===dateKey?{...item,completedDate:""}:item);
  saveProgress(progress);
  saveStepState(states);
  saveStepOverrides(overrides);
  savePriorityCarryovers(priorities);
  saveRoutineStarts(starts);
  saveStepRepeats(loadStepRepeats().filter(item=>item.date!==dateKey));
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
    stepPriorities:loadPriorityCarryovers(),
    stepRepeats:loadStepRepeats(),
    rotations:loadRotations(),
    routineStarts:loadRoutineStarts(),
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
    localStorage.setItem(PRIORITY_KEY,JSON.stringify(Array.isArray(parsed.stepPriorities)?parsed.stepPriorities.map(normalizePriorityCarryover).filter(Boolean):[]));
    localStorage.setItem(STEP_REPEATS_KEY,JSON.stringify(Array.isArray(parsed.stepRepeats)?parsed.stepRepeats.map(normalizeStepRepeat).filter(Boolean):[]));
    localStorage.setItem(ROTATIONS_KEY,JSON.stringify(parsed.rotations&&typeof parsed.rotations==="object"&&!Array.isArray(parsed.rotations)?parsed.rotations:{}));
    localStorage.setItem(ROUTINE_STARTS_KEY,JSON.stringify(parsed.routineStarts&&typeof parsed.routineStarts==="object"&&!Array.isArray(parsed.routineStarts)?parsed.routineStarts:{}));
    localStorage.setItem(SETTINGS_KEY,JSON.stringify(parsed.settings&&typeof parsed.settings==="object"?parsed.settings:{}));
  }else if(Array.isArray(parsed.habits)){
    localStorage.setItem(LEGACY_HABITS_KEY,JSON.stringify(parsed.habits));
    localStorage.setItem(LEGACY_COMPLETIONS_KEY,JSON.stringify(parsed.completions||{}));
    localStorage.setItem(LEGACY_BLOCKS_KEY,JSON.stringify(parsed.blocks||parsed.timeBlocks||[]));
    localStorage.setItem(LEGACY_SETTINGS_KEY,JSON.stringify(parsed.settings||{}));
    localStorage.removeItem(ROTATIONS_KEY);
    localStorage.removeItem(ROUTINE_STARTS_KEY);
    localStorage.setItem(LEGACY_STEPS_KEY,JSON.stringify(parsed.routineStepState||{}));
    localStorage.removeItem(ROUTINES_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(STEP_STATE_KEY);
    localStorage.removeItem(STEP_OVERRIDE_KEY);
    localStorage.removeItem(PRIORITY_KEY);
    localStorage.removeItem(STEP_REPEATS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    migrateLegacyData();
  }else throw new Error("Backup is missing routines or legacy habits.");
  clearExpiredStepOverrides();
  clearExpiredRoutineStarts();
  clearExpiredStepRepeats();
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
  claimPriorityCarryoversForDate(new Date());
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
  E.matchActionOneBtn.addEventListener("click",()=>finishMatchAction("one"));
  E.matchActionAllBtn.addEventListener("click",()=>finishMatchAction("all"));
  E.matchActionCancelBtn.addEventListener("click",()=>finishMatchAction("cancel"));
  E.matchActionSheet.addEventListener("click",event=>{if(event.target===E.matchActionSheet)finishMatchAction("cancel")});
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
clearExpiredRoutineStarts();
clearExpiredStepRepeats();
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
    clearExpiredRoutineStarts();
    clearExpiredStepRepeats();
    formatDateLabel();
    render();
  }
});
