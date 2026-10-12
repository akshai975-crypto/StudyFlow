const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORAGE_KEY = "studyflow-v1";
const todayKey = () => new Date().toISOString().slice(0, 10);
const starterData = { tasks: [], exams: [], sessions: {} };
let data = loadData();
let filter = "all";
let timerSeconds = 25 * 60;
let timerTotal = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let currentMode = "focus";
let toastTimeout;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.tasks) && Array.isArray(saved.exams)
      ? { ...starterData, ...saved } : structuredClone(starterData);
  } catch { return structuredClone(starterData); }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[ch]));
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2300);
}
function dateLabel() {
  $("#today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function renderStats() {
  const total = data.tasks.length;
  const completed = data.tasks.filter(t => t.done).length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  $("#completed-stat").innerHTML = `${completed} <small>/ ${total}</small>`;
  $("#task-progress-bar").style.width = percent + "%";
  $("#task-progress-text").textContent = percent + "% done";
  $("#study-minutes").innerHTML = `${data.sessions[todayKey()] || 0} <small>min</small>`;
  $("#exam-stat").textContent = data.exams.filter(e => daysUntil(e.date) >= 0).length;
  $("#nav-task-count").textContent = data.tasks.filter(t => !t.done).length;
  $("#task-heading-count").textContent = total;
  $("#task-footer-text").textContent = total ? `${total - completed} task${total-completed===1?"":"s"} left to go.` : "You're ready to get started.";
}
function renderTasks() {
  const list = $("#task-list");
  const tasks = data.tasks.filter(t => filter === "all" || (filter === "completed" ? t.done : !t.done));
  list.innerHTML = tasks.map(task => `
    <div class="task-item ${task.done ? "is-complete" : ""}" data-id="${task.id}">
      <button class="task-check" data-action="toggle" aria-label="${task.done ? "Mark incomplete" : "Mark complete"}">${task.done ? "✓" : ""}</button>
      <div class="task-copy"><div class="task-title">${escapeHTML(task.title)}</div><div class="task-subject">${escapeHTML(task.subject || "Personal task")}</div></div>
      <span class="priority ${task.priority}">${task.priority[0].toUpperCase()+task.priority.slice(1)}</span>
      <button class="delete-task" data-action="delete" aria-label="Delete task">×</button>
    </div>`).join("");
  $("#task-empty").classList.toggle("hidden", tasks.length > 0);
  list.classList.toggle("hidden", tasks.length === 0);
  $("#clear-completed").classList.toggle("hidden", !data.tasks.some(t => t.done));
  renderStats();
}
function daysUntil(dateString) {
  const now = new Date(); now.setHours(0,0,0,0);
  const date = new Date(dateString + "T00:00:00");
  return Math.round((date - now) / 86400000);
}
function renderExams() {
  const exams = [...data.exams].sort((a,b) => a.date.localeCompare(b.date));
  $("#exam-list").innerHTML = exams.map(exam => {
    const d = new Date(exam.date + "T00:00:00");
    const days = daysUntil(exam.date);
    const dayText = days < 0 ? "Passed" : days === 0 ? "Today" : "days left";
    return `<div class="exam-item" data-id="${exam.id}">
      <div class="exam-date-box"><strong>${d.toLocaleDateString(undefined,{day:"2-digit"})}</strong><span>${d.toLocaleDateString(undefined,{month:"short"})}</span></div>
      <div class="exam-info"><strong>${escapeHTML(exam.name)}</strong><span>${escapeHTML(exam.subject || "Exam")}</span></div>
      <div class="exam-days"><strong>${days < 0 ? Math.abs(days) : days}</strong>${dayText}</div>
      <button class="exam-delete" data-action="delete-exam" aria-label="Delete exam">×</button>
    </div>`;
  }).join("");
  $("#exam-empty").classList.toggle("hidden", exams.length > 0);
  $("#exam-list").classList.toggle("hidden", exams.length === 0);
  renderStats();
}
function toggleTaskForm(show) {
  $("#task-form").classList.toggle("hidden", !show);
  if (show) $("#task-title").focus();
}
function toggleExamForm(show) {
  $("#exam-form").classList.toggle("hidden", !show);
  if (show) $("#exam-name").focus();
}
$("#open-task-form").addEventListener("click", () => toggleTaskForm($("#task-form").classList.contains("hidden")));
$("#empty-add").addEventListener("click", () => toggleTaskForm(true));
$("#cancel-task").addEventListener("click", () => toggleTaskForm(false));
$("#task-form").addEventListener("submit", e => {
  e.preventDefault();
  const title = $("#task-title").value.trim();
  if (!title) return;
  data.tasks.unshift({ id: crypto.randomUUID(), title, subject: $("#task-subject").value.trim(), priority: $("#task-priority").value, done: false });
  saveData(); renderTasks(); toggleTaskForm(false); e.target.reset(); showToast("Task added. You've got this!");
});
$("#task-list").addEventListener("click", e => {
  const button = e.target.closest("[data-action]");
  if (!button) return;
  const row = button.closest("[data-id]");
  const task = data.tasks.find(t => t.id === row.dataset.id);
  if (!task) return;
  if (button.dataset.action === "toggle") {
    task.done = !task.done;
    showToast(task.done ? "Nice work — task completed!" : "Task moved back to to-do.");
  } else if (button.dataset.action === "delete") {
    data.tasks = data.tasks.filter(t => t.id !== task.id);
    showToast("Task removed.");
  }
  saveData(); renderTasks();
});
$$(".filter").forEach(btn => btn.addEventListener("click", () => {
  filter = btn.dataset.filter;
  $$(".filter").forEach(b => b.classList.toggle("active", b === btn));
  renderTasks();
}));
$("#clear-completed").addEventListener("click", () => {
  data.tasks = data.tasks.filter(t => !t.done);
  saveData(); renderTasks(); showToast("Completed tasks cleared.");
});
$("#open-exam-form").addEventListener("click", () => toggleExamForm($("#exam-form").classList.contains("hidden")));
$("#cancel-exam").addEventListener("click", () => toggleExamForm(false));
$("#exam-date").min = todayKey();
$("#exam-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#exam-name").value.trim(), date = $("#exam-date").value;
  if (!name || !date) return;
  if (daysUntil(date) < 0) { showToast("Choose today or a future date."); return; }
  data.exams.push({ id: crypto.randomUUID(), name, date, subject: $("#exam-subject").value.trim() });
  saveData(); renderExams(); toggleExamForm(false); e.target.reset(); $("#exam-date").min = todayKey(); showToast("Exam added to your planner.");
});
$("#exam-list").addEventListener("click", e => {
  const btn = e.target.closest('[data-action="delete-exam"]');
  if (!btn) return;
  const row = btn.closest("[data-id]");
  data.exams = data.exams.filter(exam => exam.id !== row.dataset.id);
  saveData(); renderExams(); showToast("Exam removed.");
});

function renderTimer() {
  const mins = Math.floor(timerSeconds / 60), secs = timerSeconds % 60;
  $("#timer-display").textContent = `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  $("#timer-mode").textContent = currentMode === "focus" ? "FOCUS SESSION" : "SHORT BREAK";
  $("#timer-progress").style.width = Math.max(0, Math.min(100, ((timerTotal-timerSeconds)/timerTotal)*100)) + "%";
  $("#timer-start").textContent = timerRunning ? "Ⅱ Pause session" : timerSeconds === 0 ? "↻ Start again" : "▶ Start focus";
}
function stopTimer() { clearInterval(timerInterval); timerInterval = null; timerRunning = false; }
function startTimer() {
  if (timerSeconds <= 0) timerSeconds = timerTotal;
  timerRunning = true;
  $("#timer-start").textContent = "Ⅱ Pause session";
  timerInterval = setInterval(() => {
    timerSeconds--;
    if (timerSeconds <= 0) {
      timerSeconds = 0; stopTimer();
      if (currentMode === "focus") {
        data.sessions[todayKey()] = (data.sessions[todayKey()] || 0) + Math.round(timerTotal/60);
        saveData(); renderStats(); showToast("Focus session complete — take a break!");
      } else showToast("Break finished — ready for another round?");
      $("#timer-start").textContent = "↻ Start again";
    }
    renderTimer();
  }, 1000);
}
$("#timer-start").addEventListener("click", () => {
  if (timerRunning) { stopTimer(); renderTimer(); }
  else startTimer();
});
$("#timer-reset").addEventListener("click", () => {
  stopTimer(); timerSeconds = timerTotal; renderTimer(); showToast("Timer reset.");
});
$$(".preset").forEach(btn => btn.addEventListener("click", () => {
  stopTimer();
  $$(".preset").forEach(b => b.classList.toggle("active", b === btn));
  currentMode = btn.dataset.mode; timerTotal = Number(btn.dataset.minutes) * 60; timerSeconds = timerTotal;
  renderTimer();
}));
$("#theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("studyflow-theme", document.body.classList.contains("light") ? "light" : "dark");
});
$$(".nav-item").forEach(btn => btn.addEventListener("click", () => {
  $$(".nav-item").forEach(b => b.classList.toggle("active", b === btn));
  const target = document.getElementById(btn.dataset.scroll);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}));
if (localStorage.getItem("studyflow-theme") === "light") document.body.classList.add("light");
dateLabel(); renderTasks(); renderExams(); renderTimer();
