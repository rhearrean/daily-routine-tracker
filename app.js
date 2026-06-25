const HABITS_KEY="dailyRoutineHabits.v10";
const COMPLETIONS_KEY="dailyRoutineCompletions.v10";
const TIME_BLOCKS_KEY="dailyRoutineTimeBlocks.v10";
const OLD_KEYS=[
  ["dailyRoutineHabits.v9","dailyRoutineCompletions.v9"],
  ["dailyRoutineHabits.v8","dailyRoutineCompletions.v8"],
  ["dailyRoutineHabits.v7","dailyRoutineCompletions.v7"],
  ["dailyRoutineHabits.v6","dailyRoutineCompletions.v6"],
  ["dailyRoutineHabits.v5","dailyRoutineCompletions.v5"],
  ["dailyRoutineHabits.v4","dailyRoutineCompletions.v4"],
  ["dailyRoutineHabits.v3","dailyRoutineCompletions.v3"],
  ["dailyRoutineHabits.v2","dailyRoutineCompletions.v2"]
];
const OLD_TIME_BLOCK_KEYS=["dailyRoutineTimeBlocks.v9"];

const DEFAULT_TIME_BLOCKS=[
  {id:"early",label:"🌅 Early Morning",start:"05:00",end:"07:59"},
  {id:"morning",label:"☀️ Morning",start:"08:00",end:"11:59"},
  {id:"afternoon",label:"🌤 Afternoon",start:"12:00",end:"15:59"},
  {id:"late_afternoon",label:"🌇 Late Afternoon",start:"16:00",end:"19:59"},
  {id:"evening",label:"🌙 Evening",start:"20:00",end:"23:59"},
  {id:"anytime",label:"Anytime",start:"",end:""}
];
const defaultHabits=[{id:"read-book",name:"Read my book",schedule:"daily",days:[],block:"evening",cutoff:"",allowLate:true}];

const $=id=>document.getElementById(id);
const todayTitle=$("todayTitle"),dateText=$("dateText"),progressText=$("progressText"),progressPercent=$("progressPercent");
const timeBlocks=$("timeBlocks"),emptyTodayText=$("emptyTodayText"),resetTodayBtn=$("resetTodayBtn"),streakText=$("streakText"),weekText=$("weekText"),recentDays=$("recentDays");
const habitForm=$("habitForm"),habitName=$("habitName"),habitSchedule=$("habitSchedule"),customDays=$("customDays"),allHabits=$("allHabits"),habitStats=$("habitStats");
const openSettingsBtn=$("openSettingsBtn"),closeSettingsBtn=$("closeSettingsBtn"),settingsPanel=$("settingsPanel"),exportBtn=$("exportBtn"),importBtn=$("importBtn"),backupBox=$("backupBox"),backupMessage=$("backupMessage");
const formTitle=$("formTitle"),formModeLabel=$("formModeLabel"),saveHabitBtn=$("saveHabitBtn"),cancelEditBtn=$("cancelEditBtn");
const habitBlock=$("habitBlock"),habitCutoff=$("habitCutoff"),habitAllowLate=$("habitAllowLate");
const timeBlockSettings=$("timeBlockSettings"),saveTimeBlocksBtn=$("saveTimeBlocksBtn"),timeBlockMessage=$("timeBlockMessage");
let selectedCustomDays=[],editingHabitId=null;

function safeParse(value,fallback){try{return JSON.parse(value)||fallback}catch{return fallback}}
function getLocalDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function dateFromOffset(offset=0){const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+offset);return date}
function getTodayKey(){return getLocalDateKey(new Date())}
function nowMinutes(){const d=new Date();return d.getHours()*60+d.getMinutes()}
function timeToMinutes(value){if(!value)return null;const [h,m]=value.split(":").map(Number);return h*60+m}
function formatTime(value){if(!value)return "";const [h,m]=value.split(":").map(Number);const d=new Date();d.setHours(h,m,0,0);return d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}
function formatTimeRange(block){return block.start&&block.end?`${formatTime(block.start)} – ${formatTime(block.end)}`:"No set time"}
function makeId(name){const slug=name.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");return `${slug||"habit"}-${Date.now()}`}
function normalizeHabit(h){return{id:h.id||makeId(h.name||"Habit"),name:h.name||"Habit",schedule:h.schedule||"daily",days:Array.isArray(h.days)?h.days:[],block:h.block||"anytime",cutoff:h.cutoff||"",allowLate:h.allowLate!==false}}
function normalizeBlock(block){const fallback=DEFAULT_TIME_BLOCKS.find(b=>b.id===block?.id)||{};return{id:block?.id||fallback.id||makeId("block"),label:block?.label||fallback.label||"Time Block",start:block?.start??fallback.start??"",end:block?.end??fallback.end??""}}
function loadTimeBlocks(){const saved=safeParse(localStorage.getItem(TIME_BLOCKS_KEY),null);if(!Array.isArray(saved)||saved.length===0){saveTimeBlocks(DEFAULT_TIME_BLOCKS);return DEFAULT_TIME_BLOCKS}const merged=DEFAULT_TIME_BLOCKS.map(def=>normalizeBlock(saved.find(b=>b.id===def.id)||def));return merged}
function saveTimeBlocks(blocks){localStorage.setItem(TIME_BLOCKS_KEY,JSON.stringify(blocks.map(normalizeBlock)))}
function blockLabel(id){return loadTimeBlocks().find(b=>b.id===id)?.label||"Anytime"}
function blockRange(id){const block=loadTimeBlocks().find(b=>b.id===id);return block?formatTimeRange(block):"No set time"}

function migrateOldDataOnce(){
  if(!localStorage.getItem(HABITS_KEY)){
    for(const [habitKey] of OLD_KEYS){const oldHabits=safeParse(localStorage.getItem(habitKey),null);if(Array.isArray(oldHabits)&&oldHabits.length>0){localStorage.setItem(HABITS_KEY,JSON.stringify(oldHabits.map(normalizeHabit)));break}}
  }
  if(!localStorage.getItem(COMPLETIONS_KEY)){
    for(const [,completionKey] of OLD_KEYS){const oldCompletions=safeParse(localStorage.getItem(completionKey),null);if(oldCompletions&&typeof oldCompletions==="object"){localStorage.setItem(COMPLETIONS_KEY,JSON.stringify(oldCompletions));break}}
  }
  if(!localStorage.getItem(TIME_BLOCKS_KEY)){
    for(const key of OLD_TIME_BLOCK_KEYS){const oldBlocks=safeParse(localStorage.getItem(key),null);if(Array.isArray(oldBlocks)&&oldBlocks.length>0){saveTimeBlocks(oldBlocks);return}}
    saveTimeBlocks(DEFAULT_TIME_BLOCKS);
  }
}
function loadHabits(){const saved=safeParse(localStorage.getItem(HABITS_KEY),null);if(!saved||!Array.isArray(saved)||saved.length===0){saveHabits(defaultHabits);return defaultHabits}return saved.map(normalizeHabit)}
function saveHabits(habits){localStorage.setItem(HABITS_KEY,JSON.stringify(habits.map(normalizeHabit)))}
function loadCompletions(){return safeParse(localStorage.getItem(COMPLETIONS_KEY),{})}
function saveCompletions(data){localStorage.setItem(COMPLETIONS_KEY,JSON.stringify(data))}
function formatDateLabel(){const date=new Date();todayTitle.textContent=date.toLocaleDateString(undefined,{weekday:"long"});dateText.textContent=date.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})}
function isHabitDue(habit,date){const day=date.getDay();if(habit.schedule==="daily")return true;if(habit.schedule==="weekdays")return day>=1&&day<=5;if(habit.schedule==="weekends")return day===0||day===6;if(habit.schedule==="custom")return habit.days.includes(day);return true}
function habitsDueOn(date){return loadHabits().filter(h=>isHabitDue(h,date))}
function completionEntry(dateKey,habitId){return loadCompletions()[dateKey]?.[habitId]}
function isDone(dateKey,habitId){return Boolean(completionEntry(dateKey,habitId))}
function completionStatus(dateKey,habitId){const entry=completionEntry(dateKey,habitId);return typeof entry==="object"?entry.status:(entry?"done":"")}
function isPastCutoff(habit){const cutoff=timeToMinutes(habit.cutoff);return cutoff!==null&&nowMinutes()>cutoff}
function getCurrentCompletionStatus(habit){return habit.cutoff&&isPastCutoff(habit)?"late":"done"}
function toggleDone(dateKey,habit){const completions=loadCompletions();completions[dateKey]=completions[dateKey]||{};if(completions[dateKey][habit.id]){delete completions[dateKey][habit.id]}else{const status=getCurrentCompletionStatus(habit);if(status==="late"&&habit.allowLate===false){alert("This habit is past its cutoff time.");return}completions[dateKey][habit.id]={done:true,status,completedAt:new Date().toISOString()}}saveCompletions(completions);render()}
function resetToday(){const completions=loadCompletions();delete completions[getTodayKey()];saveCompletions(completions);render()}
function deleteHabit(habitId){saveHabits(loadHabits().filter(h=>h.id!==habitId));const completions=loadCompletions();Object.keys(completions).forEach(dateKey=>{if(completions[dateKey])delete completions[dateKey][habitId]});saveCompletions(completions);if(editingHabitId===habitId)resetFormMode();render()}
function getDailyProgress(date){const dateKey=getLocalDateKey(date),due=habitsDueOn(date),total=due.length,completed=due.filter(h=>isDone(dateKey,h.id)).length;return{completed,total,percent:total===0?100:Math.round(completed/total*100)}}
function getOverallCurrentStreak(){const today=getDailyProgress(new Date());let offset=today.total>0&&today.completed<today.total?-1:0,streak=0;for(;offset>-365;offset--){const p=getDailyProgress(dateFromOffset(offset));if(p.total===0)continue;if(p.completed===p.total)streak++;else break}return streak}
function getHabitCurrentStreak(habit){let offset=isHabitDue(habit,new Date())&&!isDone(getTodayKey(),habit.id)?-1:0,streak=0;for(;offset>-365;offset--){const date=dateFromOffset(offset),key=getLocalDateKey(date);if(!isHabitDue(habit,date))continue;if(isDone(key,habit.id))streak++;else break}return streak}
function getHabitLongestStreak(habit,days=365){let best=0,current=0;for(let offset=-days+1;offset<=0;offset++){const date=dateFromOffset(offset),key=getLocalDateKey(date);if(!isHabitDue(habit,date))continue;if(isDone(key,habit.id)){current++;best=Math.max(best,current)}else current=0}return best}
function getHabitWindowStats(habit,days){let due=0,completed=0,onTime=0,late=0,missed=0;for(let offset=-days+1;offset<=0;offset++){const date=dateFromOffset(offset),key=getLocalDateKey(date);if(!isHabitDue(habit,date))continue;due++;if(isDone(key,habit.id)){completed++;completionStatus(key,habit.id)==="late"?late++:onTime++}else missed++}return{completed,due,missed,onTime,late,percent:due===0?0:Math.round(completed/due*100),onTimePercent:completed===0?0:Math.round(onTime/completed*100)}}
function getHabitTotalStats(habit){const completions=loadCompletions();let completed=0,onTime=0,late=0;Object.keys(completions).forEach(key=>{if(completions[key]?.[habit.id]){completed++;completionStatus(key,habit.id)==="late"?late++:onTime++}});return{completed,onTime,late}}
function getWeekCount(){let completed=0,daysWithHabits=0;for(let offset=0;offset>-7;offset--){const p=getDailyProgress(dateFromOffset(offset));if(p.total===0)continue;daysWithHabits++;if(p.completed===p.total)completed++}return{completed,daysWithHabits}}
function scheduleLabel(habit){if(habit.schedule==="daily")return"Every day";if(habit.schedule==="weekdays")return"Weekdays";if(habit.schedule==="weekends")return"Weekends";const labels=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];return habit.days.map(day=>labels[day]).join(", ")||"Custom"}
function getHabitStats(habit){const last7=getHabitWindowStats(habit,7),last30=getHabitWindowStats(habit,30),total=getHabitTotalStats(habit);return{id:habit.id,name:habit.name,schedule:scheduleLabel(habit),block:blockLabel(habit.block),blockTime:blockRange(habit.block),cutoff:habit.cutoff||"",allowLate:habit.allowLate,currentStreak:getHabitCurrentStreak(habit),longestStreak:getHabitLongestStreak(habit),last7Days:last7,last30Days:last30,totalCompleted:total.completed,totalOnTime:total.onTime,totalLate:total.late}}
function renderTimeBlocks(){timeBlocks.innerHTML="";const due=habitsDueOn(new Date()),dateKey=getTodayKey(),blocks=loadTimeBlocks();emptyTodayText.classList.toggle("hidden",due.length>0);blocks.forEach(block=>{const habits=due.filter(h=>h.block===block.id);if(habits.length===0)return;const completed=habits.filter(h=>isDone(dateKey,h.id)).length;const wrap=document.createElement("div");wrap.className="time-block";wrap.innerHTML=`<div class="time-block-header"><div><h3>${block.label}</h3><span class="time-block-subtitle">${formatTimeRange(block)}</span></div><span class="block-progress">${completed}/${habits.length}</span></div><div class="habit-list"></div>`;const list=wrap.querySelector(".habit-list");habits.forEach(h=>{const button=document.createElement("button"),done=isDone(dateKey,h.id),status=completionStatus(dateKey,h.id),locked=!done&&h.allowLate===false&&isPastCutoff(h);button.className=`habit-button ${done?(status==="late"?"late":"done"):""} ${locked?"locked":""}`;button.type="button";const pill=done?`<span class="status-pill ${status==="late"?"late":"on-time"}">${status==="late"?"Late":"On time"}</span>`:locked?`<span class="status-pill locked">Missed cutoff</span>`:h.cutoff?`<span class="status-pill">Target: ${formatTime(h.cutoff)}</span>`:"";button.innerHTML=`<span class="checkbox" aria-hidden="true"></span><span><strong>${h.name}</strong><small>${h.cutoff?`Target: ${formatTime(h.cutoff)}`:"No target time"}</small>${pill}</span>`;button.addEventListener("click",()=>toggleDone(dateKey,h));list.appendChild(button)});timeBlocks.appendChild(wrap)})}
function renderRecentDays(){recentDays.innerHTML="";for(let offset=-6;offset<=0;offset++){const date=dateFromOffset(offset),p=getDailyProgress(date),el=document.createElement("div");el.className=`day-pill ${p.total>0&&p.completed===p.total?"done":""}`;el.textContent=date.toLocaleDateString(undefined,{weekday:"short"});recentDays.appendChild(el)}}
function renderAllHabits(){allHabits.innerHTML="";const habits=loadHabits();if(habits.length===0){allHabits.innerHTML=`<p class="empty-text">No habits yet. Add one above.</p>`;return}habits.forEach(h=>{const row=document.createElement("div");row.className="habit-row";row.innerHTML=`<div><strong>${h.name}</strong><small>${blockLabel(h.block)} (${blockRange(h.block)}) • ${scheduleLabel(h)} • ${h.cutoff?formatTime(h.cutoff):"No cutoff"}${h.allowLate?"":" • locks after cutoff"}</small></div><div class="habit-actions"><button class="edit-btn" type="button">Edit</button><button class="danger-btn" type="button">Delete</button></div>`;row.querySelector(".edit-btn").addEventListener("click",()=>startEditHabit(h.id));row.querySelector(".danger-btn").addEventListener("click",()=>{if(confirm(`Delete "${h.name}"?`))deleteHabit(h.id)});allHabits.appendChild(row)})}
function renderHabitStats(){habitStats.innerHTML="";const habits=loadHabits();if(habits.length===0){habitStats.innerHTML=`<p class="empty-text">No habit stats yet.</p>`;return}habits.forEach(h=>{const s=getHabitStats(h),card=document.createElement("div");card.className="habit-stat-card";card.innerHTML=`<strong>${s.name}</strong><small>${s.block} • ${s.blockTime} • ${s.schedule} • ${s.cutoff?formatTime(s.cutoff):"No cutoff"}</small><div class="metric-row"><div class="metric"><b>${s.currentStreak}</b><span>Current</span></div><div class="metric"><b>${s.longestStreak}</b><span>Longest</span></div><div class="metric"><b>${s.last30Days.percent}%</b><span>30 Days</span></div><div class="metric"><b>${s.last30Days.onTimePercent}%</b><span>On Time</span></div><div class="metric"><b>${s.totalLate}</b><span>Late</span></div><div class="metric"><b>${s.totalCompleted}</b><span>Total</span></div></div>`;habitStats.appendChild(card)})}
function renderTimeBlockSettings(){if(!timeBlockSettings)return;timeBlockSettings.innerHTML="";loadTimeBlocks().filter(b=>b.id!=="anytime").forEach(block=>{const row=document.createElement("div");row.className="block-setting-row";row.innerHTML=`<strong>${block.label}</strong><div class="block-time-inputs"><label>Start<input type="time" data-block-id="${block.id}" data-field="start" value="${block.start}"></label><label>End<input type="time" data-block-id="${block.id}" data-field="end" value="${block.end}"></label></div>`;timeBlockSettings.appendChild(row)})}
function saveTimeBlockSettings(){const blocks=loadTimeBlocks();document.querySelectorAll("#timeBlockSettings input[data-block-id]").forEach(input=>{const block=blocks.find(b=>b.id===input.dataset.blockId);if(block)block[input.dataset.field]=input.value});saveTimeBlocks(blocks);timeBlockMessage.textContent="Time block settings saved.";render()}
function render(){const p=getDailyProgress(new Date());renderTimeBlocks();progressText.textContent=`${p.completed}/${p.total}`;progressPercent.textContent=`${p.percent}%`;document.documentElement.style.setProperty("--progress",p.percent);const streak=getOverallCurrentStreak();streakText.textContent=`${streak} ${streak===1?"day":"days"}`;const week=getWeekCount();weekText.textContent=`${week.completed}/${week.daysWithHabits||7}`;renderRecentDays();renderAllHabits();renderHabitStats();renderTimeBlockSettings()}
function setSelectedCustomDays(days){selectedCustomDays=[...days];customDays.querySelectorAll("button").forEach(b=>b.classList.toggle("selected",selectedCustomDays.includes(Number(b.dataset.day))))}
function resetFormMode(){editingHabitId=null;habitName.value="";habitSchedule.value="daily";habitBlock.value="evening";habitCutoff.value="";habitAllowLate.checked=true;setSelectedCustomDays([]);customDays.classList.add("hidden");formModeLabel.textContent="Manage Habits";formTitle.textContent="Add Habit";saveHabitBtn.textContent="Add Habit";cancelEditBtn.classList.add("hidden")}
function startEditHabit(id){const h=loadHabits().find(x=>x.id===id);if(!h)return;editingHabitId=id;habitName.value=h.name;habitSchedule.value=h.schedule;habitBlock.value=h.block;habitCutoff.value=h.cutoff||"";habitAllowLate.checked=h.allowLate!==false;setSelectedCustomDays(Array.isArray(h.days)?h.days:[]);customDays.classList.toggle("hidden",h.schedule!=="custom");formModeLabel.textContent="Editing Habit";formTitle.textContent="Edit Habit";saveHabitBtn.textContent="Save Changes";cancelEditBtn.classList.remove("hidden");document.querySelector(".manage-card").scrollIntoView({behavior:"smooth",block:"start"})}
function saveHabitFromForm(e){e.preventDefault();const name=habitName.value.trim(),schedule=habitSchedule.value;if(!name){alert("Add a habit name first.");return}if(schedule==="custom"&&selectedCustomDays.length===0){alert("Choose at least one custom day.");return}const habits=loadHabits(),data={name,schedule,days:schedule==="custom"?[...selectedCustomDays].sort():[],block:habitBlock.value,cutoff:habitCutoff.value,allowLate:habitAllowLate.checked};if(editingHabitId){const i=habits.findIndex(h=>h.id===editingHabitId);if(i>=0)habits[i]={...habits[i],...data}}else habits.push({id:makeId(name),...data});saveHabits(habits);resetFormMode();render()}
function openSettings(){settingsPanel.classList.remove("hidden");document.body.style.overflow="hidden"}
function closeSettings(){settingsPanel.classList.add("hidden");document.body.style.overflow=""}
function getExportPayload(){const habits=loadHabits(),completions=loadCompletions(),timeBlocks=loadTimeBlocks();return{schemaVersion:1,appVersion:"10.0",exportedAt:new Date().toISOString(),settings:{timeBlocks},timeBlocks,habits,completions,stats:{overall:{currentStreak:getOverallCurrentStreak(),thisWeek:getWeekCount(),today:getDailyProgress(new Date())},byHabit:habits.map(getHabitStats)}}}
function exportHabits(){backupBox.value=JSON.stringify(getExportPayload(),null,2);backupBox.focus();backupBox.select();if(navigator.clipboard)navigator.clipboard.writeText(backupBox.value).catch(()=>{});backupMessage.textContent="Backup created with habits, completion history, time blocks, and stats."}
function importHabits(){const text=backupBox.value.trim();if(!text){backupMessage.textContent="Paste your backup first.";return}const parsed=safeParse(text,null),habits=Array.isArray(parsed)?parsed:parsed?.habits;if(!Array.isArray(habits)||habits.length===0){backupMessage.textContent="That backup does not look valid.";return}saveHabits(habits.map(normalizeHabit));const importedBlocks=parsed?.timeBlocks||parsed?.settings?.timeBlocks;if(Array.isArray(importedBlocks))saveTimeBlocks(importedBlocks);if(parsed?.completions&&typeof parsed.completions==="object")saveCompletions(parsed.completions);resetFormMode();backupMessage.textContent="Data imported.";render()}
habitSchedule.addEventListener("change",()=>customDays.classList.toggle("hidden",habitSchedule.value!=="custom"));
customDays.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{const day=Number(b.dataset.day);selectedCustomDays=selectedCustomDays.includes(day)?selectedCustomDays.filter(d=>d!==day):[...selectedCustomDays,day];b.classList.toggle("selected",selectedCustomDays.includes(day))}));
habitForm.addEventListener("submit",saveHabitFromForm);cancelEditBtn.addEventListener("click",resetFormMode);resetTodayBtn.addEventListener("click",resetToday);openSettingsBtn.addEventListener("click",openSettings);closeSettingsBtn.addEventListener("click",closeSettings);exportBtn.addEventListener("click",exportHabits);importBtn.addEventListener("click",importHabits);if(saveTimeBlocksBtn)saveTimeBlocksBtn.addEventListener("click",saveTimeBlockSettings);
if("serviceWorker" in navigator)navigator.serviceWorker.register("service-worker.js");
migrateOldDataOnce();formatDateLabel();render();
