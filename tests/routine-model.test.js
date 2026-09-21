const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.resolve(__dirname,"..","app.js"),"utf8");
const bootIndex=source.lastIndexOf("\nmigrateLegacyData();");
assert.ok(bootIndex>0,"App boot marker should exist");

class MemoryStorage{
  constructor(){this.values=new Map()}
  getItem(key){return this.values.has(key)?this.values.get(key):null}
  setItem(key,value){this.values.set(key,String(value))}
  removeItem(key){this.values.delete(key)}
  clear(){this.values.clear()}
}

const localStorage=new MemoryStorage();
const sandbox={
  console,
  localStorage,
  document:{getElementById:()=>({})},
  navigator:{},
  location:{reload(){}},
  indexedDB:{},
  Blob:class{},
  URL:{createObjectURL(){return""},revokeObjectURL(){}},
  FileReader:class{},
  confirm:()=>true,
  prompt:()=>null,
  alert:()=>{},
  setTimeout:()=>0,
  clearTimeout:()=>{},
  setInterval:()=>0,
  Date
};
vm.createContext(sandbox);
const expose="\nrender=()=>{};\nglobalThis.testApi={migrateLegacyData,loadRoutines,loadProgress,loadStepState,loadStepOverrides,loadPriorityCarryovers,savePriorityCarryovers,loadRotations,saveRotations,loadRoutineStarts,saveRoutineStarts,clearExpiredRoutineStarts,isRoutineStarted,startRoutineForToday,loadStepRepeats,saveStepRepeats,clearExpiredStepRepeats,visibleRepeatStepsForDate,repeatStepForToday,routineReadyToComplete,completeRoutineForToday,orderedRotationItems,rotateSubstep,normalizedStepName,saveRoutines,saveSettings,dueRoutinesOn,setStepStatus,getStepState,isRoutineDone,normalizeRoutine,scheduleMatches,stepRunsOn,claimPriorityCarryoversForDate,visibleStepsForDate,togglePriorityNextTime,pendingMatchingSteps,applyTodayStepReplacement,currentRoutineForDate,makeBackupPayload};";
vm.runInContext(source.slice(0,bootIndex)+expose,sandbox);
const api=sandbox.testApi;

localStorage.setItem("dailyRoutineHabits.v10_1",JSON.stringify([{
  id:"morning",
  name:"Morning Routine",
  schedule:"daily",
  occurrences:[{id:"morning-occurrence",block:"morning"}],
  routineSteps:[
    {id:"water-1",text:"Drink water",createdAt:""},
    {id:"baby",text:"Feed baby",createdAt:""},
    {id:"water-2",text:"Drink water",createdAt:""}
  ]
}]));
localStorage.setItem("dailyRoutineTimeBlocks.v10_1",JSON.stringify([
  {id:"morning",label:"Morning",start:"05:00",end:"11:59"}
]));
localStorage.setItem("dailyRoutineCompletions.v10_1",JSON.stringify({
  "2026-09-13":{"morning-occurrence":{state:"done",completedAt:"2026-09-13T12:00:00.000Z"}}
}));
localStorage.setItem("dailyRoutineSteps.v10_8_8",JSON.stringify({
  "2026-09-14":{"morning-occurrence":{"water-1":true}}
}));

api.migrateLegacyData();
const routines=api.loadRoutines();
assert.equal(routines.length,1);
assert.equal(routines[0].name,"Morning Routine");
assert.equal(routines[0].lockSteps,true);
assert.deepEqual(JSON.parse(JSON.stringify(routines[0].steps.map(step=>step.text))),["Drink water","Feed baby","Drink water"]);
assert.equal(new Set(routines[0].steps.map(step=>step.id)).size,3);
assert.equal(routines[0].steps.every(step=>step.days===null),true,"Existing steps must keep running on every routine day");
assert.equal(api.loadProgress()["2026-09-13"].morning.state,"done");
assert.equal(api.loadStepState()["2026-09-14"].morning["water-1"],"done","Partial legacy step state should migrate even without a completion entry");

const locked=api.normalizeRoutine({
  id:"locked",name:"Locked",schedule:"daily",order:20,lockSteps:true,
  steps:[
    {id:"one",text:"One",createdAt:""},
    {id:"two",text:"Two",createdAt:""},
    {id:"three",text:"Three",createdAt:""}
  ]
});
api.saveRoutines([locked]);
const today=new Date();
const todayKey=today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");

const repeatRoutine=api.normalizeRoutine({
  id:"cleanup",name:"Cleanup",schedule:"daily",lockSteps:true,
  steps:[
    {id:"dishes-1",text:"Dishes",createdAt:""},
    {id:"dishes-skipped",text:"Dishes",createdAt:""},
    {id:"middle",text:"Feed baby",createdAt:""},
    {id:"dishes-2",text:"Dishes",createdAt:""},
    {id:"dishes-3",text:"Dishes",createdAt:""}
  ]
});
api.saveRoutines([repeatRoutine]);
api.setStepStatus(repeatRoutine,"dishes-1","done");
api.setStepStatus(repeatRoutine,"dishes-skipped","skipped");
assert.equal(api.pendingMatchingSteps(repeatRoutine,"dishes-1",todayKey).length,2);
assert.equal(api.applyTodayStepReplacement(repeatRoutine,"dishes-1","Clean bathroom counter",todayKey),2);
assert.deepEqual(
  JSON.parse(JSON.stringify(api.visibleStepsForDate(repeatRoutine,todayKey).map(step=>step.text))),
  ["Dishes","Dishes","Feed baby","Clean bathroom counter","Clean bathroom counter"]
);
assert.equal(api.getStepState(todayKey,"cleanup","dishes-skipped"),"skipped","A skipped matching step must remain unchanged");
assert.equal(api.getStepState(todayKey,"cleanup","dishes-2"),"pending","Replacement must not resolve or skip a matching step");
const tomorrow=new Date(today);
tomorrow.setDate(tomorrow.getDate()+1);
const tomorrowKey=tomorrow.getFullYear()+"-"+String(tomorrow.getMonth()+1).padStart(2,"0")+"-"+String(tomorrow.getDate()).padStart(2,"0");
assert.deepEqual(
  JSON.parse(JSON.stringify(api.visibleStepsForDate(repeatRoutine,tomorrowKey).map(step=>step.text))),
  ["Dishes","Dishes","Feed baby","Dishes","Dishes"],
  "Temporary replacement names must not carry into the next day"
);

api.saveRoutines([locked]);
api.setStepStatus(locked,"two","done");
assert.equal(api.getStepState(todayKey,"locked","two"),"pending","A later locked step cannot complete early");
api.setStepStatus(locked,"one","skipped");
assert.equal(api.getStepState(todayKey,"locked","one"),"skipped");
api.setStepStatus(locked,"two","done");
assert.equal(api.getStepState(todayKey,"locked","two"),"done");
api.setStepStatus(locked,"one","pending");
assert.equal(api.getStepState(todayKey,"locked","one"),"skipped","Only the latest resolved locked step can be undone");
api.setStepStatus(locked,"two","pending");
assert.equal(api.getStepState(todayKey,"locked","two"),"pending");
api.setStepStatus(locked,"two","done");
api.setStepStatus(locked,"three","done");
assert.equal(api.routineReadyToComplete(locked,todayKey),true,"Resolving all steps should wait for routine confirmation");
assert.equal(api.isRoutineDone(todayKey,"locked"),false,"The last step must not auto-complete the routine");
api.completeRoutineForToday("locked");
assert.equal(api.isRoutineDone(todayKey,"locked"),true);

assert.equal(api.scheduleMatches(api.normalizeRoutine({name:"Sat",schedule:"custom",days:[6],steps:[{text:"x"}]}),new Date(2026,8,12)),true);
assert.equal(api.scheduleMatches(api.normalizeRoutine({name:"Sat",schedule:"custom",days:[6],steps:[{text:"x"}]}),new Date(2026,8,13)),false);

const mondayKey="2026-09-14";
const tuesdayKey="2026-09-15";
const scheduledSteps=api.normalizeRoutine({
  id:"scheduled",name:"Scheduled Steps",schedule:"daily",order:10,lockSteps:true,
  steps:[
    {id:"every",text:"Every routine day",createdAt:""},
    {id:"duplicate-mon",text:"Duplicate",createdAt:"",days:[1]},
    {id:"duplicate-tue",text:"Duplicate",createdAt:"",days:[2]}
  ]
});
assert.deepEqual(JSON.parse(JSON.stringify(api.visibleStepsForDate(scheduledSteps,mondayKey).map(step=>step.id))),["every","duplicate-mon"]);
assert.deepEqual(JSON.parse(JSON.stringify(api.visibleStepsForDate(scheduledSteps,tuesdayKey).map(step=>step.id))),["every","duplicate-tue"]);
assert.equal(api.stepRunsOn(scheduledSteps.steps[1],mondayKey),true);
assert.equal(api.stepRunsOn(scheduledSteps.steps[1],tuesdayKey),false);

localStorage.clear();
const onlyMonday=api.normalizeRoutine({id:"monday-only",name:"Monday Only",schedule:"daily",steps:[{id:"monday-step",text:"Monday",days:[1]}]});
api.saveRoutines([onlyMonday]);
assert.equal(api.dueRoutinesOn(new Date(2026,8,14,12)).length,1,"A routine is due when at least one step runs that day");
assert.equal(api.dueRoutinesOn(new Date(2026,8,15,12)).length,0,"A routine with no steps today must not block Today");

localStorage.clear();
const currentDay=today.getDay();
const anotherDay=(currentDay+1)%7;
const hiddenLockStep=api.normalizeRoutine({
  id:"hidden-lock",name:"Hidden Lock",schedule:"daily",lockSteps:true,
  steps:[
    {id:"hidden-first",text:"Not today",days:[anotherDay]},
    {id:"visible-second",text:"Visible today",days:[currentDay]}
  ]
});
api.saveRoutines([hiddenLockStep]);
api.setStepStatus(hiddenLockStep,"visible-second","done");
assert.equal(api.getStepState(todayKey,"hidden-lock","visible-second"),"done","A hidden earlier step must not keep today's visible step locked");
assert.equal(api.routineReadyToComplete(hiddenLockStep,todayKey),true,"Hidden steps must not prevent routine confirmation");
api.completeRoutineForToday("hidden-lock");
assert.equal(api.isRoutineDone(todayKey,"hidden-lock"),true);

localStorage.clear();
const carryRoutine=api.normalizeRoutine({
  id:"home",name:"Home",schedule:"daily",lockSteps:false,
  steps:[
    {id:"dishes-a",text:"Dishes",createdAt:""},
    {id:"dishes-b",text:"Dishes",createdAt:""},
    {id:"dishes-c",text:"Dishes",createdAt:""}
  ]
});
api.saveRoutines([carryRoutine]);
api.setStepStatus(carryRoutine,"dishes-a","skipped");
api.togglePriorityNextTime(carryRoutine,carryRoutine.steps[0],todayKey);
assert.equal(api.loadPriorityCarryovers().length,1,"Only the exact skipped instance should be queued");
assert.equal(api.loadPriorityCarryovers()[0].sourceStepId,"dishes-a");
assert.equal(api.getStepState(todayKey,"home","dishes-a"),"skipped","Flagging must not rewrite the original skip");
api.togglePriorityNextTime(carryRoutine,carryRoutine.steps[0],todayKey);
assert.equal(api.loadPriorityCarryovers().length,0,"The priority flag should toggle off without changing the skip");
api.togglePriorityNextTime(carryRoutine,carryRoutine.steps[0],todayKey);
const yesterday=new Date(today);
yesterday.setDate(yesterday.getDate()-1);
const yesterdayKey=yesterday.getFullYear()+"-"+String(yesterday.getMonth()+1).padStart(2,"0")+"-"+String(yesterday.getDate()).padStart(2,"0");
const queued=api.loadPriorityCarryovers();
queued[0].sourceDate=yesterdayKey;
queued.push({...queued[0],id:"priority-second",sourceStepId:"dishes-c",sourceOrder:2,queuedAt:"2026-09-17T02:00:00.000Z"});
queued[0].sourceOrder=0;
api.savePriorityCarryovers(queued);
localStorage.setItem("dailyRoutineStepState.v12",JSON.stringify({}));
api.claimPriorityCarryoversForDate(today);
const carriedSteps=api.visibleStepsForDate(carryRoutine,todayKey);
assert.equal(carriedSteps.length,5,"Two priorities should be temporary extras in addition to three permanent duplicates");
assert.deepEqual(JSON.parse(JSON.stringify(carriedSteps.slice(0,2).map(step=>step.sourceStepId))),["dishes-a","dishes-c"],"Multiple priorities retain their original relative order");
assert.equal(carriedSteps[0].priority,true);
assert.equal(carriedSteps[0].id===carryRoutine.steps[0].id,false,"A priority copy needs an independent occurrence ID");
api.setStepStatus(carryRoutine,carriedSteps[0].id,"done");
assert.equal(api.loadPriorityCarryovers().find(item=>item.id===carriedSteps[0].id).completedDate,todayKey,"Resolving a priority must prevent automatic repetition");
assert.equal(api.makeBackupPayload().stepPriorities.length,2,"Priority carryovers must be included in backups");

localStorage.clear();
const weeklyHome=api.normalizeRoutine({id:"weekly-home",name:"Weekly Home",schedule:"custom",days:[1],steps:[{id:"room",text:"Clean room"}]});
api.saveRoutines([weeklyHome]);
api.savePriorityCarryovers([{id:"waiting-priority",routineId:"weekly-home",sourceStepId:"room",text:"Clean room",sourceDate:"2026-09-13",sourceOrder:0}]);
api.claimPriorityCarryoversForDate(new Date(2026,8,15,12));
assert.equal(api.loadPriorityCarryovers()[0].claimedDate,"","A priority must not move into a day when its routine is not scheduled");
api.claimPriorityCarryoversForDate(new Date(2026,8,21,12));
assert.equal(api.loadPriorityCarryovers()[0].claimedDate,"2026-09-21","A priority waits for the same routine's next scheduled occurrence");

localStorage.clear();
const routineSet=[
  api.normalizeRoutine({id:"morning",name:"Morning",schedule:"daily",order:10,steps:[{id:"m",text:"Morning",createdAt:""}]}),
  api.normalizeRoutine({id:"office",name:"Office",schedule:"daily",order:20,steps:[{id:"o",text:"Office",createdAt:""}]}),
  api.normalizeRoutine({id:"wfh",name:"WFH",schedule:"custom",days:[],order:30,steps:[{id:"w",text:"WFH",createdAt:""}]}),
  api.normalizeRoutine({id:"evening",name:"Evening",schedule:"daily",order:40,steps:[{id:"e",text:"Evening",createdAt:""}]})
];
api.saveRoutines(routineSet);
api.saveSettings({todayRoutineSwitch:{date:todayKey,fromRoutineId:"office",toRoutineId:"wfh"}});
const switchedDue=api.dueRoutinesOn(today);
assert.deepEqual(JSON.parse(JSON.stringify(switchedDue.map(routine=>routine.name))),["Morning","WFH","Evening"]);
assert.equal(api.currentRoutineForDate(switchedDue,todayKey).name,"Morning");

localStorage.setItem("dailyRoutineProgress.v12",JSON.stringify({
  [todayKey]:{morning:{state:"done",completedAt:""}}
}));
assert.equal(api.currentRoutineForDate(api.dueRoutinesOn(today),todayKey).name,"WFH","Finishing the first routine should activate the next due routine");
const completedRoutine=api.normalizeRoutine({
  id:"morning",name:"Morning",schedule:"daily",steps:[
    {id:"old",text:"Old step",createdAt:""},
    {id:"new",text:"New step",createdAt:"2026-09-14T20:00:00.000Z"}
  ]
});
assert.deepEqual(JSON.parse(JSON.stringify(api.visibleStepsForDate(completedRoutine,todayKey).map(step=>step.id))),["old"],"A new step stays hidden from a legacy completion without a timestamp");

localStorage.clear();
api.saveRotations({shared:{id:"shared",items:[{id:"kitchen",text:"Kitchen"},{id:"bedroom",text:"Bedroom"},{id:"garage",text:"Garage"}],queue:["kitchen","bedroom","garage"]}});
const rotatingRoutine=api.normalizeRoutine({id:"declutter",name:"Declutter",schedule:"daily",steps:[
  {id:"declutter-a",text:"Declutter House",rotationGroupId:"shared"},
  {id:"declutter-b",text:"Declutter House",rotationGroupId:"shared"}
]});
api.saveRoutines([rotatingRoutine]);
assert.equal(rotatingRoutine.steps[0].rotationGroupId,"shared","A normalized step must preserve its shared rotation reference");
api.rotateSubstep("shared","kitchen");
assert.deepEqual(JSON.parse(JSON.stringify(api.orderedRotationItems(api.loadRotations().shared).map(item=>item.id))),["bedroom","garage","kitchen"],"Tapping a rotating item must move it to the back of the shared FIFO queue");
assert.equal(api.loadRoutines()[0].steps[1].rotationGroupId,"shared","A duplicate can reference the same shared queue");
assert.equal(api.normalizedStepName("  Declutter   HOUSE "),"declutter house","Exact-name matching ignores case and repeated spaces");
assert.notEqual(api.normalizedStepName("Declutter Garage"),api.normalizedStepName("Declutter House"));
const rotationBackup=api.makeBackupPayload();
assert.equal(rotationBackup.rotations.shared.queue[2],"kitchen","Rotating queues must be included in backups");

localStorage.clear();
const startRoutines=[
  api.normalizeRoutine({id:"auto-first",name:"Morning",schedule:"daily",order:10,startMode:"automatic",steps:[{id:"morning-step",text:"Morning step"}]}),
  api.normalizeRoutine({id:"manual-next",name:"Home",schedule:"daily",order:20,startMode:"manual",steps:[{id:"home-step",text:"Home step"}]}),
  api.normalizeRoutine({id:"manual-last",name:"Evening",schedule:"daily",order:30,startMode:"manual",steps:[{id:"evening-step",text:"Evening step"}]})
];
api.saveRoutines(startRoutines);
assert.equal(startRoutines[0].startMode,"automatic","Existing behavior stays automatic by default");
assert.equal(startRoutines[1].startMode,"manual");
assert.equal(api.isRoutineStarted(startRoutines[1],todayKey),false,"A manual routine waits until explicitly started");
api.setStepStatus(startRoutines[0],"morning-step","done");
assert.equal(api.currentRoutineForDate(api.dueRoutinesOn(today),todayKey).id,"auto-first","Resolving steps alone must keep the current routine active");
api.completeRoutineForToday("auto-first");
assert.equal(api.currentRoutineForDate(api.dueRoutinesOn(today),todayKey).id,"manual-next","The next unresolved manual routine becomes available in order");
api.startRoutineForToday("manual-next");
assert.equal(api.isRoutineStarted(startRoutines[1],todayKey),true,"Start Routine activates the available manual routine");
assert.ok(api.loadRoutineStarts()[todayKey]["manual-next"],"Manual starts are stored for the current day");
assert.equal(api.isRoutineStarted(startRoutines[2],todayKey),false,"A later manual routine remains unstarted");
api.setStepStatus(startRoutines[1],"home-step","done");
api.completeRoutineForToday("manual-next");
assert.equal(api.currentRoutineForDate(api.dueRoutinesOn(today),todayKey).id,"manual-last","Resolving a started routine makes the next routine available");
assert.equal(api.isRoutineStarted(startRoutines[2],todayKey),false);
api.saveRoutineStarts({...api.loadRoutineStarts(),"2000-01-01":{"manual-last":"old"}});
api.clearExpiredRoutineStarts();
assert.equal(api.loadRoutineStarts()["2000-01-01"],undefined,"Manual-start state must expire after its day");
assert.ok(api.makeBackupPayload().routineStarts[todayKey]["manual-next"],"Manual-start state must be included in backups");

localStorage.clear();
const repeatAtBottom=api.normalizeRoutine({id:"repeat-bottom",name:"Busy Day",schedule:"daily",lockSteps:true,steps:[
  {id:"dishes",text:"Dishes",repeatable:true,rotationGroupId:"shared"},
  {id:"tidy",text:"Tidy counter"}
]});
api.saveRoutines([repeatAtBottom]);
api.repeatStepForToday(repeatAtBottom,"dishes");
assert.equal(api.loadStepRepeats().length,0,"A pending repeatable step cannot repeat before it is completed");
api.setStepStatus(repeatAtBottom,"dishes","done");
api.repeatStepForToday(repeatAtBottom,"dishes");
let repeatSteps=api.visibleStepsForDate(repeatAtBottom,todayKey);
assert.equal(api.getStepState(todayKey,"repeat-bottom","dishes"),"done","Repeat leaves the completed source checked");
assert.equal(repeatSteps.length,3,"Repeat adds exactly one temporary occurrence");
assert.equal(repeatSteps[2].temporaryRepeat,true,"The temporary repeat is appended after permanent steps");
assert.equal(repeatSteps[2].rotationGroupId,"shared","Temporary repeats preserve the shared rotation group");
assert.equal(api.isRoutineDone(todayKey,"repeat-bottom"),false,"A pending repeat keeps the routine unresolved");
api.setStepStatus(repeatAtBottom,"tidy","done");
api.setStepStatus(repeatAtBottom,repeatSteps[2].id,"done");
api.repeatStepForToday(repeatAtBottom,repeatSteps[2].id);
repeatSteps=api.visibleStepsForDate(repeatAtBottom,todayKey);
assert.equal(api.loadStepRepeats().length,2,"A temporary repeat can repeat again when unlocked");
assert.equal(repeatSteps.at(-1).temporaryRepeat,true);
assert.equal(repeatSteps.at(-1).text,"Dishes");
api.setStepStatus(repeatAtBottom,repeatSteps.at(-1).id,"done");
assert.equal(api.routineReadyToComplete(repeatAtBottom,todayKey),true,"Normal completion ends the repeat chain and offers routine confirmation");
assert.equal(api.isRoutineDone(todayKey,"repeat-bottom"),false,"A resolved repeat chain must still wait for Complete Routine");
api.completeRoutineForToday("repeat-bottom");
assert.equal(api.isRoutineDone(todayKey,"repeat-bottom"),true,"Complete Routine finalizes the routine");
api.repeatStepForToday(repeatAtBottom,"dishes");
assert.equal(api.loadStepRepeats().length,2,"A finalized routine cannot add another repeat");
assert.equal(api.visibleStepsForDate(repeatAtBottom,tomorrowKey).length,2,"Temporary repeats disappear the next day");
assert.equal(api.makeBackupPayload().stepRepeats.length,2,"Temporary repeats are included in backups");
api.saveStepRepeats([...api.loadStepRepeats(),{id:"old-repeat",date:"2000-01-01",routineId:"repeat-bottom",sourceStepId:"dishes",text:"Dishes"}]);
api.clearExpiredStepRepeats();
assert.equal(api.loadStepRepeats().some(item=>item.id==="old-repeat"),false,"Expired temporary repeats are removed");

console.log("Routine migration, rotation, duplicate step, schedule, lock, and repeat assertions passed");
