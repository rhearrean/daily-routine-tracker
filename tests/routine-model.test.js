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
  alert:()=>{},
  setTimeout:()=>0,
  clearTimeout:()=>{},
  setInterval:()=>0,
  Date
};
vm.createContext(sandbox);
const expose="\nrender=()=>{};\nglobalThis.testApi={migrateLegacyData,loadRoutines,loadProgress,loadStepState,saveRoutines,saveSettings,dueRoutinesOn,setStepStatus,getStepState,isRoutineDone,normalizeRoutine,scheduleMatches,visibleStepsForDate};";
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

localStorage.clear();
const routineSet=[
  api.normalizeRoutine({id:"morning",name:"Morning",schedule:"daily",order:10,steps:[{id:"m",text:"Morning",createdAt:""}]}),
  api.normalizeRoutine({id:"office",name:"Office",schedule:"daily",order:20,steps:[{id:"o",text:"Office",createdAt:""}]}),
  api.normalizeRoutine({id:"wfh",name:"WFH",schedule:"custom",days:[],order:30,steps:[{id:"w",text:"WFH",createdAt:""}]}),
  api.normalizeRoutine({id:"evening",name:"Evening",schedule:"daily",order:40,steps:[{id:"e",text:"Evening",createdAt:""}]})
];
api.saveRoutines(routineSet);
api.saveSettings({todayRoutineSwitch:{date:todayKey,fromRoutineId:"office",toRoutineId:"wfh"}});
assert.deepEqual(JSON.parse(JSON.stringify(api.dueRoutinesOn(today).map(routine=>routine.name))),["Morning","WFH","Evening"]);

localStorage.setItem("dailyRoutineProgress.v12",JSON.stringify({
  [todayKey]:{morning:{state:"done",completedAt:""}}
}));
const completedRoutine=api.normalizeRoutine({
  id:"morning",name:"Morning",schedule:"daily",steps:[
    {id:"old",text:"Old step",createdAt:""},
    {id:"new",text:"New step",createdAt:"2026-09-14T20:00:00.000Z"}
  ]
});
assert.deepEqual(JSON.parse(JSON.stringify(api.visibleStepsForDate(completedRoutine,todayKey).map(step=>step.id))),["old"],"A new step stays hidden from a legacy completion without a timestamp");

console.log("Routine migration, duplicate step, schedule, and lock assertions passed");
