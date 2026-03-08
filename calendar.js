import { auth, db } from "./firebase.js"

import {
addXP,
addFocusScore,
addDisciplineXP
} from "./profile.js"

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"

import {
doc,
getDoc,
updateDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"


const envelopes = document.querySelectorAll(".envelope")

/* =========================
   RANDOM REWARD
========================= */

function randomReward(){
return Math.floor(Math.random()*300)+1
}


/* =========================
   DAILY LIMIT
========================= */

const LIMIT = 4

function getToday(){
return new Date().toDateString()
}

function resetIfNewDay(){

const savedDay = localStorage.getItem("rewardDay")

if(savedDay !== getToday()){

localStorage.setItem("rewardDay",getToday())
localStorage.setItem("rewardCount",0)

}

}

function getCount(){
return Number(localStorage.getItem("rewardCount")) || 0
}

function increaseCount(){

const c = getCount() + 1

localStorage.setItem("rewardCount",c)

}


/* =========================
   MIDNIGHT TIMER
========================= */

function timeToMidnight(){

const now = new Date()
const midnight = new Date()

midnight.setHours(24,0,0,0)

const diff = midnight - now

const h = Math.floor(diff/1000/60/60)
const m = Math.floor(diff/1000/60)%60
const s = Math.floor(diff/1000)%60

return `${h}h ${m}m ${s}s`

}


/* =========================
   STREAK SYSTEM
========================= */

async function updateStreak(user){

const userRef = doc(db,"users",user.uid)
const snap = await getDoc(userRef)

if(!snap.exists()) return

const data = snap.data()

const today = new Date()
today.setHours(0,0,0,0)

const last = data.lastCheckIn ? new Date(data.lastCheckIn) : null
let streak = data.checkInStreak || 0

if(last){
last.setHours(0,0,0,0)
}

if(!last){
streak = 1
}

else{

const diffDays = (today - last) / (1000*60*60*24)

if(diffDays === 1){
streak++
}

else if(diffDays > 1){
streak = 1
}

else{
return
}

}

await updateDoc(userRef,{
checkInStreak: streak,
lastCheckIn: today.toDateString()
})

}

/* =========================
   MAIN
========================= */

onAuthStateChanged(auth,(user)=>{

if(!user) return

resetIfNewDay()

envelopes.forEach(env=>{

env.onclick = async ()=>{

if(env.classList.contains("opened")) return

const count = getCount()

/* ===== LIMIT CHECK ===== */

if(count >= LIMIT){

Swal.fire({
icon:"warning",
title:"🚫 Hết lượt hôm nay",
text:`Bạn đã mở tối đa ${LIMIT} bao.`,
footer:`Reset sau: ${timeToMidnight()}`
})

return

}


/* ===== OPEN ANIMATION ===== */

env.classList.add("opening")

setTimeout(async ()=>{

env.classList.remove("opening")
env.classList.add("opened")


/* ===== REWARD ===== */

const xp = randomReward()
const focus = randomReward()
const discipline = randomReward()

await addXP(xp)
await addFocusScore(focus)
await addDisciplineXP(discipline)

await updateStreak(user)

increaseCount()


/* ===== UPDATE UI ===== */

env.innerHTML = `
<div class="rewardBox">
<div>⭐ XP +${xp}</div>
<div>🎯 Focus +${focus}</div>
<div>🔥 Discipline +${discipline}</div>
</div>
`


Swal.fire({
title:"🎉 Bạn đã mở bao!",
html:`
<b>XP:</b> +${xp}<br>
<b>Focus:</b> +${focus}<br>
<b>Discipline:</b> +${discipline}
`,
icon:"success"
})

},600)

}

})

})