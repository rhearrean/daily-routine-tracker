const STORAGE_KEY = "dailyRoutineReadingTracker.v1";

const habits = [
  {
    id: "read-book",
    name: "Read my book",
    schedule: "daily"
  }
];

const todayTitle = document.getElementById("todayTitle");
const dateText = document.getElementById("dateText");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const readingHabit = document.getElementById("readingHabit");
const resetTodayBtn = document.getElementById("resetTodayBtn");
const streakText = document.getElementById("streakText");
const weekText = document.getElementById("weekText");
const recentDays = document.getElementById("recentDays");

function getTodayKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function formatDateLabel() {
  const date = new Date();
  todayTitle.textContent = date.toLocaleDateString(undefined, { weekday: "long" });
  dateText.textContent = date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function isDone(dateKey, habitId) {
  const data = loadData();
  return Boolean(data[dateKey]?.[habitId]);
}

function setDone(dateKey, habitId, value) {
  const data = loadData();
  data[dateKey] = data[dateKey] || {};
  data[dateKey][habitId] = value;

  if (!value) {
    delete data[dateKey][habitId];
  }

  saveData(data);
  render();
}

function getDailyProgress(dateKey) {
  const completed = habits.filter(habit => isDone(dateKey, habit.id)).length;
  return {
    completed,
    total: habits.length,
    percent: Math.round((completed / habits.length) * 100)
  };
}

function getCurrentStreak() {
  let streak = 0;

  for (let offset = 0; offset > -365; offset--) {
    const dateKey = getTodayKey(offset);
    const progress = getDailyProgress(dateKey);

    if (progress.completed === progress.total) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getWeekCount() {
  let completed = 0;

  for (let offset = 0; offset > -7; offset--) {
    const dateKey = getTodayKey(offset);
    const progress = getDailyProgress(dateKey);
    if (progress.completed === progress.total) completed++;
  }

  return completed;
}

function renderRecentDays() {
  recentDays.innerHTML = "";

  for (let offset = -6; offset <= 0; offset++) {
    const date = new Date();
    date.setDate(date.getDate() + offset);

    const dateKey = date.toISOString().slice(0, 10);
    const day = document.createElement("div");
    const done = getDailyProgress(dateKey).completed === habits.length;

    day.className = `day-pill ${done ? "done" : ""}`;
    day.textContent = date.toLocaleDateString(undefined, { weekday: "short" });

    recentDays.appendChild(day);
  }
}

function render() {
  const todayKey = getTodayKey();
  const progress = getDailyProgress(todayKey);
  const completedToday = isDone(todayKey, "read-book");

  readingHabit.classList.toggle("done", completedToday);

  progressText.textContent = `${progress.completed}/${progress.total}`;
  progressPercent.textContent = `${progress.percent}%`;
  document.documentElement.style.setProperty("--progress", progress.percent);

  const streak = getCurrentStreak();
  streakText.textContent = `${streak} ${streak === 1 ? "day" : "days"}`;

  weekText.textContent = `${getWeekCount()}/7`;

  renderRecentDays();
}

readingHabit.addEventListener("click", () => {
  const todayKey = getTodayKey();
  setDone(todayKey, "read-book", !isDone(todayKey, "read-book"));
});

resetTodayBtn.addEventListener("click", () => {
  setDone(getTodayKey(), "read-book", false);
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

formatDateLabel();
render();
