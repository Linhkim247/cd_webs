import { auth, db } from "./firebase.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  increment
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";


// ==========================
// UTIL
// ==========================

function todayString() {
  return new Date().toISOString().split("T")[0];
}


// ==========================
// ADMIN SYSTEM
// ==========================

const ADMIN_EMAILS = [
  "dangcanh13102008@gmail.com"   // đổi thành email Google của bạn
];


// ==========================
// RANK SYSTEM
// ==========================

function calculateRank(xp){

const tiers = [
{ name:"Bronze", min:0 },
{ name:"Silver", min:2000 },
{ name:"Gold", min:5000 },
{ name:"Platinum", min:7000 },
{ name:"Diamond", min:9000 },
{ name:"Master", min:12000 },
{ name:"Legend", min:15000 },
{ name:"Grandmaster", min:18000 },
{ name:"Mythic", min:22000 }
]

const divisions = ["V","IV","III","II","I"]

let tierIndex = 0

for(let i=tiers.length-1;i>=0;i--){
if(xp >= tiers[i].min){
tierIndex = i
break
}
}

const tier = tiers[tierIndex]
const nextTier = tiers[tierIndex+1]

const xpInTier = xp - tier.min

/* ===== MYTHIC STAR SYSTEM ===== */

if(tier.name === "Mythic"){

const starXP = 500
const star = Math.floor(xpInTier / starXP) + 1

return {
tier:"Mythic",
division:`⭐${star}`,
label:`Mythic ⭐${star}`
}

}

/* ===== NORMAL TIERS ===== */

let tierRange

if(nextTier){
tierRange = nextTier.min - tier.min
}else{
tierRange = 500
}

const divisionSize = tierRange / 5

const divisionIndex = 4 - Math.floor(xpInTier / divisionSize)

const division = divisions[Math.max(0,divisionIndex)]

return {
tier: tier.name,
division: division,
label: `${tier.name} ${division}`
}

}


function applyRankStyle(rankEl, rankData){

if(!rankEl) return

const tier = rankData.tier.toLowerCase()

rankEl.className = ""
rankEl.classList.add("rank")
rankEl.classList.add("rank-" + tier)

const icons = {

bronze: ` <svg viewBox="0 0 24 24" fill="#cd7f32"> <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/> </svg>`,

silver: ` <svg viewBox="0 0 24 24" fill="#e5e5e5"> <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/> </svg>`,

gold: ` <svg viewBox="0 0 24 24" fill="#ffd700"> <path d="M3 18h18l-2-10-5 4-4-6-4 6-5-4z"/> </svg>`,

platinum: ` <svg viewBox="0 0 24 24" fill="#7affd4"> <polygon points="12,2 20,8 16,22 8,22 4,8"/> </svg>`,

diamond: ` <svg viewBox="0 0 24 24" fill="#6be0ff"> <polygon points="12,2 22,9 12,22 2,9"/> </svg>`,

master: ` <svg viewBox="0 0 24 24" fill="#b88cff"> <path d="M12 2l2 4h4l-3 4v10h-2V10l-3-4h4z"/> </svg>`,

legend: ` <svg viewBox="0 0 24 24" fill="#ff59e6"> <path d="M3 18h18l-2-10-5 4-4-6-4 6-5-4z"/> </svg>`,

grandmaster: ` <svg viewBox="0 0 24 24" fill="#ff6a6a"> <path d="M7 2h10v4h3v3c0 3-2 5-5 5-1 2-2 3-4 3s-3-1-4-3C4 14 2 12 2 9V6h3z"/> </svg>`,

mythic: ` <svg viewBox="0 0 24 24" fill="#ff4040"> <path d="M3 18h18l-2-10-5 4-4-6-4 6-5-4z"/> <path d="M12 2c1 2-1 3 0 5 2-1 3-3 2-5"/> </svg>`

}

const icon = icons[tier] || ""

rankEl.innerHTML = icon + "<span>" + rankData.label + "</span>"

}


// ==========================
// STYLES của avt theo brand
// ==========================


function applyAvatarFrame(rankData){

const frame = document.getElementById("avatarFrame")
if(!frame) return

frame.className = "avatar-frame"

const tier = rankData.tier.toLowerCase()

frame.classList.add("frame-" + tier)

}

// ==========================
// BADGE SYSTEM
// ==========================

//  danh sách badge và achievement

const ACHIEVEMENTS = [

{
id:"first_session",
name:"📘 First Session",
condition:(d)=> (d.totalStudySessions || 0) >= 1
},

{
id:"study_10_sessions",
name:"📚 Study Apprentice",
condition:(d)=> (d.totalStudySessions || 0) >= 10
},

{
id:"study_50_sessions",
name:"📚 Study Master",
condition:(d)=> (d.totalStudySessions || 0) >= 50
},

{
id:"study_100_sessions",
name:"📚 Study Legend",
condition:(d)=> (d.totalStudySessions || 0) >= 100
},

{
id:"study_10_hours",
name:"⏱ 10 Hours Study",
condition:(d)=> (d.totalStudyMinutes || 0) >= 600
},

{
id:"study_50_hours",
name:"⏱ 50 Hours Study",
condition:(d)=> (d.totalStudyMinutes || 0) >= 3000
},

{
id:"study_100_hours",
name:"⏱ 100 Hours Study",
condition:(d)=> (d.totalStudyMinutes || 0) >= 6000
},

{
id:"task_10",
name:"✅ Task Worker",
condition:(d)=> (d.totalTaskCompleted || 0) >= 10
},

{
id:"task_50",
name:"✅ Task Machine",
condition:(d)=> (d.totalTaskCompleted || 0) >= 50
},

{
id:"task_200",
name:"✅ Task Destroyer",
condition:(d)=> (d.totalTaskCompleted || 0) >= 200
},

{
id:"discipline_100",
name:"💪 Discipline Rookie",
condition:(d)=> (d.disciplineXP || 0) >= 300
},

{
id:"discipline_500",
name:"💪 Discipline Master",
condition:(d)=> (d.disciplineXP || 0) >= 600
},

{
id:"level_10",
name:"⭐ Rising Star",
condition:(d)=> (d.level || 0) >= 10
},

{
id:"level_25",
name:"🌟 Elite Learner",
condition:(d)=> (d.level || 0) >= 25
},

{
id:"level_50",
name:"👑 Grand Scholar",
condition:(d)=> (d.level || 0) >= 50
},
{
id:"xp_50000",
name:"👑 Grand Scholar",
condition:(d)=> (d.xp || 0) >= 50000
}

]
// ====================================================
// dưới đây mới là function update badge và achievement
// =====================================================
function updateBadges(data){

const container = document.getElementById("badgeContainer")
if(!container) return

container.innerHTML = ""

ACHIEVEMENTS.forEach(a=>{

if(a.condition(data)){

const badge = document.createElement("div")

badge.className = "badge"
badge.innerText = a.name

container.appendChild(badge)

}

})

}


// ==========================
// rank progress SYSTEM
// ==========================

function updateRankProgress(xp){

const tiers = [
{ name:"Bronze", min:0 },
{ name:"Silver", min:2000 },
{ name:"Gold", min:5000 },
{ name:"Diamond", min:9000 },
{ name:"Legend", min:15000 },
{ name:"Mythic", min:22000 }
]

let tierIndex = 0

for(let i=tiers.length-1;i>=0;i--){
if(xp >= tiers[i].min){
tierIndex = i
break
}
}

const tier = tiers[tierIndex]
const nextTier = tiers[tierIndex+1]

const xpInTier = xp - tier.min

/* ===== MYTHIC STAR SYSTEM ===== */

if(tier.name === "Mythic"){

const starXP = 500

const current = xpInTier % starXP
const max = starXP

const el = document.getElementById("rankProgress")

if(el)
el.innerText = `${Math.floor(current)} / ${max}`

return

}

/* ===== NORMAL TIERS ===== */

const tierRange = nextTier.min - tier.min
const divisionSize = tierRange / 5

const current = xpInTier % divisionSize
const max = divisionSize

const el = document.getElementById("rankProgress")

if(el)
el.innerText = `${Math.floor(current)} / ${Math.floor(max)}`

}

// ==========================
// LEVEL UP EFFECT
// ==========================

function showLevelUp() {

  const popup = document.createElement("div");

  popup.innerText = "LEVEL UP!";
  popup.style.position = "fixed";
  popup.style.top = "40%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.fontSize = "42px";
  popup.style.color = "#ff9900";
  popup.style.textShadow = "0 0 20px #ff4d00";
  popup.style.zIndex = "9999";

  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 2000);

}


// ==========================
// PROFILE UI
// ==========================

document.addEventListener("DOMContentLoaded", () => {

  const avatar = document.getElementById("profileAvatar");
  const nameEl = document.getElementById("profileName");
  const emailEl = document.getElementById("profileEmail");

  const xpEl = document.getElementById("profileXP");
  const levelEl = document.getElementById("profileLevel");
  const rankEl = document.getElementById("profileRank");

  const sessionEl = document.getElementById("profileSessions");
  const hoursEl = document.getElementById("profileHours");

  const tasksEl = document.getElementById("profileTasks");
  const focusEl = document.getElementById("profileFocus");
  const disciplineEl = document.getElementById("profileDiscipline");

  const xpBar = document.getElementById("xpBar");
  const rankProgressEl = document.getElementById("rankProgress")

  onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const snap = await getDoc(userRef);

    if (!snap.exists()) {

      await setDoc(userRef, {

        name: user.displayName || "User",
        email: user.email || "",
        photoURL: user.photoURL || "",

        xp: 0,
        level: 1,
        rank: "Bronze",

        focusScore: 0,
        disciplineXP: 0,

        // =================
        // SHOP INVENTORY
        // =================

        inventory:{
          xp_boost:0,
          focus_potion:0,
          streak_shield:0,
          legend_boost:0
        },

        // =================
        // STATS
        // =================

        totalTaskCompleted: 0,

        totalStudyMinutes: 0,
        totalStudySessions: 0,

        checkInStreak: 0,
        longestCheckInStreak: 0,
        role: "user",

        createdAt: new Date()

      });
    }

    onSnapshot(userRef, (snap) => {

      const data = snap.data();
      const role = data.role || "user"
      updateRankProgress(data.xp || 0)
      if (!data) return;

      if (avatar) avatar.src = data.photoURL || "default-avatar.png";
      if(nameEl){

        nameEl.innerHTML = data.name

        if(ADMIN_EMAILS.includes(user.email)){

          nameEl.innerHTML += `
          <span class="admin-badge">
            👑 ADMIN
          </span>
          `

        }

        }
      if (emailEl) emailEl.innerText = data.email;

      if (xpEl) xpEl.innerText = data.xp || 0;
      if (levelEl) levelEl.innerText = data.level || 1;

      const rank = calculateRank(data.xp || 0)
        applyRankStyle(rankEl, rank)
        applyAvatarFrame(rank)

      // 🔥 Study sessions
      if (sessionEl)
        sessionEl.innerText = data.totalStudySessions || 0;

      // ⏱ Study hours
      if (hoursEl){
        const minutes = data.totalStudyMinutes || 0;
        const hours = Math.floor(minutes / 60);
        hoursEl.innerText = hours;
      }

      // ✅ tasks
      if (tasksEl)
        tasksEl.innerText = data.totalTaskCompleted || 0;

      // 🎯 focus
      if (focusEl)
        focusEl.innerText = data.focusScore || 0;

      // 💪 discipline
      if (disciplineEl)
        disciplineEl.innerText = data.disciplineXP || 0;

      // XP progress bar
      if (xpBar) {

        const xpInLevel = (data.xp || 0) % 100;
        xpBar.style.width = xpInLevel + "%";

      }

      updateBadges(data);
      updateAchievements(data);

    });

  });

});


// ==========================
// XP SYSTEM
// ==========================

export async function addXP(amount) {

  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  await runTransaction(db, async (transaction) => {

    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    const data = snap.data();

    const oldLevel = data.level || 1;

    /* ===== BOOST CHECK (FIRESTORE) ===== */

    let finalAmount = Number(amount);

    const multi = data.boostMultiplier;
    const end = data.boostEnd;

    if (multi && end && Date.now() < end) {
      finalAmount = Math.floor(finalAmount * multi);
    }

    /* ===== END BOOST CHECK ===== */

    const newXP = (data.xp || 0) + finalAmount;

    const newLevel = Math.floor(newXP / 100) + 1;
    const newRank = calculateRank(newXP);

    transaction.update(ref, {
      xp: newXP,
      level: newLevel,
      rank: newRank
    });

    if (newLevel > oldLevel) {
      showLevelUp();
    }

  });

}


// ========================== 
// focusScore TRACKER
// ==========================

export async function addFocusScore(amount){

const user = auth.currentUser
if(!user) return

const ref = doc(db,"users",user.uid)

await updateDoc(ref,{
focusScore: increment(amount)
})

}

// ==========================
// disciplineXP TRACKER
// ==========================

export async function addDisciplineXP(amount){

const user = auth.currentUser
if(!user) return

const ref = doc(db,"users",user.uid)

await updateDoc(ref,{
disciplineXP: increment(amount)
})

}
// =========================
// Shop item tracker
// =========================


const SHOP_ITEMS = {

xp_boost:{
name:"XP Boost",
price:150,
currency:"focusScore",
type:"boost"
},

focus_potion:{
name:"Focus Potion",
price:100,
currency:"focusScore",
type:"instant"
},

streak_shield:{
name:"Streak Shield",
price:200,
currency:"disciplineXP",
type:"passive"
},

legend_boost:{
name:"Legend Boost",
price:400,
currency:"disciplineXP",
type:"boost"
}

}

// Buy item from shop

export async function buyItem(itemId){

const user = auth.currentUser
if(!user) return

const item = SHOP_ITEMS[itemId]
if(!item) return

const ref = doc(db,"users",user.uid)

await runTransaction(db, async(transaction)=>{

const snap = await transaction.get(ref)
if(!snap.exists()) return

const data = snap.data()

const currency = item.currency
const balance = data[currency] || 0

if(balance < item.price){
alert("Not enough " + currency)
return
}

const inv = data.inventory || {}

inv[itemId] = (inv[itemId] || 0) + 1

transaction.update(ref,{
[currency]: balance - item.price,
inventory: inv
})

})

}

// use item from inventory


export async function useItem(itemId){

const user = auth.currentUser
if(!user) return

const ref = doc(db,"users",user.uid)

await runTransaction(db, async(transaction)=>{

const snap = await transaction.get(ref)
if(!snap.exists()) return

const data = snap.data()

const inv = data.inventory || {}

if(!inv[itemId] || inv[itemId] <= 0){
alert("No item available")
return
}

inv[itemId]--

let updates = { inventory: inv }

if(itemId === "focus_potion"){
updates.xp = increment(100)
}

transaction.update(ref,updates)

})

}

// ==========================
// badge and achievement tracker
// =========================

function updateAchievements(data){

const container = document.getElementById("achievementContainer")
if(!container) return

container.innerHTML = ""

if(data.level >= 10)
container.innerHTML += `<div class="achievement">🏆 Level 10</div>`

if(data.totalStudyMinutes >= 600)
container.innerHTML += `<div class="achievement">⏳ 10 Hours Study</div>`

if(data.totalTaskCompleted >= 100)
container.innerHTML += `<div class="achievement">📋 100 Tasks Done</div>`

}

// ==========================
// TASK TRACKER
// ==========================

export async function recordTaskCompletion() {

  const user = auth.currentUser
  if (!user) return

  const ref = doc(db,"users",user.uid)

  const snap = await getDoc(ref)
  if(!snap.exists()) return

  const data = snap.data()

  const today = todayString()

  let newStreak = data.checkInStreak || 0
  let longest = data.longestCheckInStreak || 0

  if(data.lastActiveDate !== today){
    newStreak += 1
  }

  if(newStreak > longest) longest = newStreak

  await updateDoc(ref,{

    totalTaskCompleted: increment(1),

    checkInStreak: newStreak,
    longestCheckInStreak: longest,

    lastActiveDate: today

  })

}


// ==========================
// STUDY SYSTEM (MINUTES)
// ==========================

export async function addMinute(minutes) {

  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  await updateDoc(ref, {

    totalStudySessions: increment(1),
    totalStudyMinutes: increment(minutes)

  });

}


// ==========================
// CHECK-IN SYSTEM
// ==========================

export async function dailyCheckin(){

const user = auth.currentUser
if(!user) return

const ref = doc(db,"users",user.uid)

const snap = await getDoc(ref)
if(!snap.exists()) return

const data = snap.data()

const today = todayString()

if(data.lastCheckinDate === today) return

let streak = data.checkInStreak || 0
let longest = data.longestCheckInStreak || 0

streak++

if(streak > longest) longest = streak

await updateDoc(ref,{

checkInStreak: streak,
longestCheckInStreak: longest,
lastCheckinDate: today

})

}
