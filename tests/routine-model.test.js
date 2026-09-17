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
const expose="\nrender=()=>{};\nglobalThis.testApi={migrateLegacyData,loadRoutines,loadProgress,loadStepState,loadStepOverrides,saveRoutines,saveSettings,dueRoutinesOn,setStepStatus,getStepState,isRoutineDone,normalizeRoutine,scheduleMatches,stepRunsOn,visibleStepsForDate,pendingMatchingSteps,applyTodayStepReplacement,currentRoutineForDate};";
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
assert.equal(api.isRoutineDone(todayKey,"hidden-lock"),true,"Hidden steps must not prevent today's routine completion");

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

console.log("Routine migration, duplicate step, schedule, and lock assertions passed");
