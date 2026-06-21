const HABITS_KEY="dailyRoutineHabits.v7";
const COMPLETIONS_KEY="dailyRoutineCompletions.v7";
const OLD_KEYS=[
  ["dailyRoutineHabits.v6","dailyRoutineCompletions.v6"],
  ["dailyRoutineHabits.v5","dailyRoutineCompletions.v5"],
  ["dailyRoutineHabits.v4","dailyRoutineCompletions.v4"],
  ["dailyRoutineHabits.v3","dailyRoutineCompletions.v3"],
  ["dailyRoutineHabits.v2","dailyRoutineCompletions.v2"]
];

const defaultHabits=[{id:"read-book",name:"Read my book",schedule:"daily",days:[]}];

const todayTitle=document.getElementById("todayTitle");
const dateText=document.getElementById("dateText");
const progressText=document.getElementById("progressText");
const progressPercent=document.getElementById("progressPercent");
const todayHabits=document.getElementById("todayHabits");
const emptyTodayText=document.getElementById("emptyTodayText");
const resetTodayBtn=document.getElementById("resetTodayBtn");
const streakText=document.getElementById("streakText");
const weekText=document.getElementById("weekText");
const recentDays=document.getElementById("recentDays");
const habitForm=document.getElementById("habitForm");
const habitName=document.getElementById("habitName");
const habitSchedule=document.getElementById("habitSchedule");
const customDays=document.getElementById("customDays");
const allHabits=document.getElementById("allHabits");
const openSettingsBtn=document.getElementById("openSettingsBtn");
const closeSettingsBtn=document.getElementById("closeSettingsBtn");
const settingsPanel=document.getElementById("settingsPanel");
const exportBtn=document.getElementById("exportBtn");
const importBtn=document.getElementById("importBtn");
const backupBox=document.getElementById("backupBox");
const backupMessage=document.getElementById("backupMessage");
const formTitle=document.getElementById("formTitle");
const formModeLabel=document.getElementById("formModeLabel");
const saveHabitBtn=document.getElementById("saveHabitBtn");
const cancelEditBtn=document.getElementById("cancelEditBtn");

let selectedCustomDays=[];
let editingHabitId=null;

function safeParse(value,fallback){try{return JSON.parse(value)||fallback}catch{return fallback}}

function getLocalDateKey(date=new Date()){
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,"0");
  const day=String(date.getDate()).padStart(2,"0");
  return `${year}-${month}-${day}`;
}

function dateFromOffset(offset=0){
  const date=new Date();
  date.setHours(12,0,0,0);
  date.setDate(date.getDate()+offset);
  return date;
}

function getTodayKey(){return getLocalDateKey(new Date())}

function migrateOldDataOnce(){
  if(!localStorage.getItem(HABITS_KEY)){
    for(const [habitKey] of OLD_KEYS){
      const oldHabits=safeParse(localStorage.getItem(habitKey),null);
      if(Array.isArray(oldHabits)&&oldHabits.length>0){
        localStorage.setItem(HABITS_KEY,JSON.stringify(oldHabits));
        break;
      }
    }
  }
  if(!localStorage.getItem(COMPLETIONS_KEY)){
    for(const [,completionKey] of OLD_KEYS){
      const oldCompletions=safeParse(localStorage.getItem(completionKey),null);
      if(oldCompletions&&typeof oldCompletions==="object"){
        localStorage.setItem(COMPLETIONS_KEY,JSON.stringify(oldCompletions));
        break;
      }
    }
  }
}

function formatDateLabel(){
  const date=new Date();
  todayTitle.textContent=date.toLocaleDateString(undefined,{weekday:"long"});
  dateText.textContent=date.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"});
}

function loadHabits(){
  const saved=safeParse(localStorage.getItem(HABITS_KEY),null);
  if(!saved||!Array.isArray(saved)||saved.length===0){
    saveHabits(defaultHabits);
    return defaultHabits;
  }
  return saved;
}

function saveHabits(habits){localStorage.setItem(HABITS_KEY,JSON.stringify(habits))}
function loadCompletions(){return safeParse(localStorage.getItem(COMPLETIONS_KEY),{})}
function saveCompletions(data){localStorage.setItem(COMPLETIONS_KEY,JSON.stringify(data))}

function makeId(name){
  const slug=name.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
  return `${slug||"habit"}-${Date.now()}`;
}

function isHabitDue(habit,date){
  const day=date.getDay();
  if(habit.schedule==="daily")return true;
  if(habit.schedule==="weekdays")return day>=1&&day<=5;
  if(habit.schedule==="weekends")return day===0||day===6;
  if(habit.schedule==="custom")return habit.days.includes(day);
  return true;
}

function habitsDueOn(date){return loadHabits().filter(habit=>isHabitDue(habit,date))}
function isDone(dateKey,habitId){const completions=loadCompletions();return Boolean(completions[dateKey]?.[habitId])}

function toggleDone(dateKey,habitId){
  const completions=loadCompletions();
  completions[dateKey]=completions[dateKey]||{};
  completions[dateKey][habitId]=!completions[dateKey][habitId];
  if(!completions[dateKey][habitId]) delete completions[dateKey][habitId];
  saveCompletions(completions);
  render();
}

function resetToday(){
  const completions=loadCompletions();
  delete completions[getTodayKey()];
  saveCompletions(completions);
  render();
}

function deleteHabit(habitId){
  const habits=loadHabits().filter(habit=>habit.id!==habitId);
  saveHabits(habits);
  const completions=loadCompletions();
  Object.keys(completions).forEach(dateKey=>{if(completions[dateKey]) delete completions[dateKey][habitId]});
  saveCompletions(completions);
  if(editingHabitId===habitId) resetFormMode();
  render();
}

function getDailyProgress(date){
  const dateKey=getLocalDateKey(date);
  const dueHabits=habitsDueOn(date);
  const total=dueHabits.length;
  const completed=dueHabits.filter(habit=>isDone(dateKey,habit.id)).length;
  const percent=total===0?100:Math.round((completed/total)*100);
  return {completed,total,percent};
}

function getCurrentStreak(){
  const todayProgress=getDailyProgress(new Date());
  let offset=(todayProgress.total>0 && todayProgress.completed<todayProgress.total) ? -1 : 0;
  let streak=0;

  for(; offset>-365; offset--){
    const progress=getDailyProgress(dateFromOffset(offset));
    if(progress.total===0) continue;
    if(progress.completed===progress.total) streak++;
    else break;
  }
  return streak;
}

function getWeekCount(){
  let completed=0,daysWithHabits=0;
  for(let offset=0;offset>-7;offset--){
    const progress=getDailyProgress(dateFromOffset(offset));
    if(progress.total===0) continue;
    daysWithHabits++;
    if(progress.completed===progress.total) completed++;
  }
  return {completed,daysWithHabits};
}

function scheduleLabel(habit){
  if(habit.schedule==="daily")return"Every day";
  if(habit.schedule==="weekdays")return"Weekdays";
  if(habit.schedule==="weekends")return"Weekends";
  const labels=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return habit.days.map(day=>labels[day]).join(", ")||"Custom";
}

function renderTodayHabits(){
  todayHabits.innerHTML="";
  const today=new Date();
  const todayKey=getTodayKey();
  const dueHabits=habitsDueOn(today);
  emptyTodayText.classList.toggle("hidden",dueHabits.length>0);
  dueHabits.forEach(habit=>{
    const button=document.createElement("button");
    const done=isDone(todayKey,habit.id);
    button.className=`habit-button ${done?"done":""}`;
    button.type="button";
    button.innerHTML=`<span class="checkbox" aria-hidden="true"></span><span><strong>${habit.name}</strong><small>Tap when completed</small></span>`;
    button.addEventListener("click",()=>toggleDone(todayKey,habit.id));
    todayHabits.appendChild(button);
  });
}

function renderRecentDays(){
  recentDays.innerHTML="";
  for(let offset=-6;offset<=0;offset++){
    const date=dateFromOffset(offset);
    const progress=getDailyProgress(date);
    const day=document.createElement("div");
    const done=progress.total>0&&progress.completed===progress.total;
    day.className=`day-pill ${done?"done":""}`;
    day.textContent=date.toLocaleDateString(undefined,{weekday:"short"});
    recentDays.appendChild(day);
  }
}

function renderAllHabits(){
  allHabits.innerHTML="";
  const habits=loadHabits();
  if(habits.length===0){
    allHabits.innerHTML=`<p class="empty-text">No habits yet. Add one above.</p>`;
    return;
  }
  habits.forEach(habit=>{
    const row=document.createElement("div");
    row.className="habit-row";
    row.innerHTML=`<div><strong>${habit.name}</strong><small>${scheduleLabel(habit)}</small></div><div class="habit-actions"><button class="edit-btn" type="button">Edit</button><button class="danger-btn" type="button">Delete</button></div>`;
    row.querySelector(".edit-btn").addEventListener("click",()=>startEditHabit(habit.id));
    row.querySelector(".danger-btn").addEventListener("click",()=>{if(confirm(`Delete "${habit.name}"?`)) deleteHabit(habit.id)});
    allHabits.appendChild(row);
  });
}

function render(){
  const progress=getDailyProgress(new Date());
  renderTodayHabits();
  progressText.textContent=`${progress.completed}/${progress.total}`;
  progressPercent.textContent=`${progress.percent}%`;
  document.documentElement.style.setProperty("--progress",progress.percent);
  const streak=getCurrentStreak();
  streakText.textContent=`${streak} ${streak===1?"day":"days"}`;
  const week=getWeekCount();
  weekText.textContent=`${week.completed}/${week.daysWithHabits||7}`;
  renderRecentDays();
  renderAllHabits();
}

function setSelectedCustomDays(days){
  selectedCustomDays=[...days];
  customDays.querySelectorAll("button").forEach(button=>{
    const day=Number(button.dataset.day);
    button.classList.toggle("selected",selectedCustomDays.includes(day));
  });
}

function resetFormMode(){
  editingHabitId=null;
  habitName.value="";
  habitSchedule.value="daily";
  setSelectedCustomDays([]);
  customDays.classList.add("hidden");
  formModeLabel.textContent="Manage Habits";
  formTitle.textContent="Add Habit";
  saveHabitBtn.textContent="Add Habit";
  cancelEditBtn.classList.add("hidden");
}

function startEditHabit(habitId){
  const habit=loadHabits().find(item=>item.id===habitId);
  if(!habit) return;

  editingHabitId=habitId;
  habitName.value=habit.name;
  habitSchedule.value=habit.schedule;
  setSelectedCustomDays(Array.isArray(habit.days)?habit.days:[]);
  customDays.classList.toggle("hidden",habit.schedule!=="custom");

  formModeLabel.textContent="Editing Habit";
  formTitle.textContent="Edit Habit";
  saveHabitBtn.textContent="Save Changes";
  cancelEditBtn.classList.remove("hidden");

  document.querySelector(".manage-card").scrollIntoView({behavior:"smooth",block:"start"});
}

function saveHabitFromForm(event){
  event.preventDefault();
  const name=habitName.value.trim();
  const schedule=habitSchedule.value;

  if(!name){alert("Add a habit name first.");return}
  if(schedule==="custom"&&selectedCustomDays.length===0){alert("Choose at least one custom day.");return}

  const habits=loadHabits();

  if(editingHabitId){
    const index=habits.findIndex(habit=>habit.id===editingHabitId);
    if(index>=0){
      habits[index]={
        ...habits[index],
        name,
        schedule,
        days:schedule==="custom"?[...selectedCustomDays].sort():[]
      };
    }
  }else{
    habits.push({
      id:makeId(name),
      name,
      schedule,
      days:schedule==="custom"?[...selectedCustomDays].sort():[]
    });
  }

  saveHabits(habits);
  resetFormMode();
  render();
}

function openSettings(){settingsPanel.classList.remove("hidden");document.body.style.overflow="hidden"}
function closeSettings(){settingsPanel.classList.add("hidden");document.body.style.overflow=""}

function exportHabits(){
  const backup={version:1,exportedAt:new Date().toISOString(),habits:loadHabits()};
  backupBox.value=JSON.stringify(backup,null,2);
  backupBox.focus();
  backupBox.select();
  if(navigator.clipboard) navigator.clipboard.writeText(backupBox.value).catch(()=>{});
  backupMessage.textContent="Habit backup created. Copy this text into Apple Notes.";
}

function importHabits(){
  const text=backupBox.value.trim();
  if(!text){backupMessage.textContent="Paste your habit backup first.";return}
  const parsed=safeParse(text,null);
  const habits=Array.isArray(parsed)?parsed:parsed?.habits;
  if(!Array.isArray(habits)||habits.length===0){backupMessage.textContent="That backup does not look valid.";return}
  const cleaned=habits.filter(habit=>habit.name&&habit.schedule).map(habit=>({
    id:habit.id||makeId(habit.name),
    name:String(habit.name),
    schedule:habit.schedule,
    days:Array.isArray(habit.days)?habit.days:[]
  }));
  if(cleaned.length===0){backupMessage.textContent="No valid habits found in that backup.";return}
  saveHabits(cleaned);
  resetFormMode();
  backupMessage.textContent="Habits imported.";
  render();
}

habitSchedule.addEventListener("change",()=>customDays.classList.toggle("hidden",habitSchedule.value!=="custom"));

customDays.querySelectorAll("button").forEach(button=>{
  button.addEventListener("click",()=>{
    const day=Number(button.dataset.day);
    if(selectedCustomDays.includes(day)){
      selectedCustomDays=selectedCustomDays.filter(savedDay=>savedDay!==day);
    }else{
      selectedCustomDays.push(day);
    }
    button.classList.toggle("selected",selectedCustomDays.includes(day));
  });
});

habitForm.addEventListener("submit",saveHabitFromForm);
cancelEditBtn.addEventListener("click",resetFormMode);
resetTodayBtn.addEventListener("click",resetToday);
openSettingsBtn.addEventListener("click",openSettings);
closeSettingsBtn.addEventListener("click",closeSettings);
exportBtn.addEventListener("click",exportHabits);
importBtn.addEventListener("click",importHabits);

if("serviceWorker" in navigator){navigator.serviceWorker.register("service-worker.js")}

migrateOldDataOnce();
formatDateLabel();
render();
