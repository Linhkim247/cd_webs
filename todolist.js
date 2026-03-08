import { auth, db } from "./firebase.js";
import { addXP } from "./profile.js";

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

let currentUser = null;
let unsubscribeTasks = null;

// =============================
// DATE KEY
// =============================

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// =============================
// COUNTDOWN
// =============================

function getMidnightTime() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

function startCountdown(element) {

  function update() {
    const remaining = getMidnightTime();

    if (remaining <= 0) {
      location.reload();
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    element.innerText = `⏳ ${hours}h ${minutes}m ${seconds}s`;
  }

  update();
  setInterval(update, 1000);
}

// =============================
// TASK REF
// =============================

function getTasksRef() {
  if (!currentUser) return null;

  const todayKey = getTodayKey();
  const dateDocRef = doc(db, "users", currentUser.uid, "dailyTasks", todayKey);
  return collection(dateDocRef, "tasks");
}

// =============================
// LOAD TASKS (Realtime)
// =============================

function loadTasksRealtime() {

  const tasksRef = getTasksRef();
  if (!tasksRef) return;

  const container = document.getElementById("taskList");
  if (!container) return;

  // nếu đã listen rồi thì hủy trước
  if (unsubscribeTasks) unsubscribeTasks();

  unsubscribeTasks = onSnapshot(tasksRef, snapshot => {

    container.innerHTML = "";

    snapshot.forEach(docSnap => {

  const data = docSnap.data();
  const taskId = docSnap.id;

  const taskDiv = document.createElement("div");
  taskDiv.classList.add("task-card");
  taskDiv.classList.add(`xp-${data.xpReward}`);

  if (data.completed) {
    taskDiv.classList.add("completed-card");
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("task-checkbox");
  checkbox.checked = data.completed;

  if (data.completed) checkbox.disabled = true;

  const title = document.createElement("span");
  title.classList.add("task-title");
  title.innerText = `${data.title} (${data.xpReward} XP)`;

  const countdown = document.createElement("span");
  countdown.classList.add("countdown");

  if (data.completed) {
    startCountdown(countdown);
  }

  checkbox.addEventListener("change", async () => {

    if (data.completed) return;

    const tasksRef = getTasksRef();

    await updateDoc(doc(tasksRef, taskId), {
      completed: true
    });

    const userRef = doc(db, "users", currentUser.uid);

    await updateDoc(userRef, {
      totalTaskCompleted: increment(1)
    });

    await addXP(data.xpReward);

    checkbox.disabled = true;
    taskDiv.classList.add("completed-card");

    startCountdown(countdown);

    const completedTasks = snapshot.docs.filter(d => d.data().completed);
    if (completedTasks.length + 1 === 6) {
      await addXP(200);
    }

  });

  taskDiv.appendChild(checkbox);
  taskDiv.appendChild(title);
  taskDiv.appendChild(countdown);

  container.appendChild(taskDiv);
});

  });
}

// =============================
// ADD TASK
// =============================

async function addTask(title, xpReward) {

  const tasksRef = getTasksRef();
  if (!tasksRef) {
    alert("User not authenticated yet.");
    return;
  }

  const snapshot = await new Promise(resolve => {
    onSnapshot(tasksRef, snap => resolve(snap));
  });

  if (snapshot.size >= 6) {
    alert("Only 6 tasks per day.");
    return;
  }

  await setDoc(doc(tasksRef), {
    title,
    completed: false,
    xpReward,
    createdAt: new Date()
  });
}

// =============================
// INIT
// =============================

document.addEventListener("DOMContentLoaded", () => {

  onAuthStateChanged(auth, async (u) => {

    if (!u) {
      console.log("User not logged in");
      return;
    }

    currentUser = u;

    const todayKey = getTodayKey();
    const dateDocRef = doc(db, "users", u.uid, "dailyTasks", todayKey);

    await setDoc(dateDocRef, { createdAt: new Date() }, { merge: true });

    loadTasksRealtime();
  });

  const addBtn = document.getElementById("addTaskBtn");

  if (addBtn) {
    addBtn.addEventListener("click", async () => {

      const titleInput = document.getElementById("taskTitle");
      const difficultySelect = document.getElementById("taskDifficulty");

      const title = titleInput.value.trim();
      if (!title) return;

      let xpReward = 10;
      if (difficultySelect.value === "Medium") xpReward = 30;
      if (difficultySelect.value === "Hard") xpReward = 50;

      await addTask(title, xpReward);

      titleInput.value = "";
    });
  }

});

// =============================
// CUSTOM ALERT
// =============================

document.addEventListener("DOMContentLoaded", () => {

  const overlay = document.getElementById("customAlertOverlay");
  const message = document.getElementById("customAlertMessage");
  const button = document.getElementById("customAlertBtn");

  window.alert = function(text) {
    message.innerText = text;
    overlay.style.display = "flex";
  };

  button.addEventListener("click", () => {
    overlay.style.display = "none";
  });

});