import { auth, db } from "./firebase.js"
import { addXP, addMinute, addFocusScore, addDisciplineXP } from "./profile.js"

import {
  doc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

/* ---------- TAB SWITCH ---------- */

const tabs = document.querySelectorAll(".tab")
const pages = document.querySelectorAll(".page")
const slider = document.getElementById("slider")

tabs.forEach((tab,i)=>{

tab.onclick = ()=>{

tabs.forEach(t=>t.classList.remove("active"))
pages.forEach(p=>p.classList.remove("active"))

tab.classList.add("active")

document.getElementById(tab.dataset.page).classList.add("active")

slider.style.left = (i*50) + "%"

localStorage.setItem("lastTab",tab.dataset.page)

}

})

const lastTab = localStorage.getItem("lastTab")

if(lastTab){
tabs.forEach(tab=>{
if(tab.dataset.page === lastTab){
tab.click()
}
})
}

/* ---------- LOAD VIDEO ---------- */

const loadBtn = document.getElementById("loadBtn")
const frame = document.getElementById("frame")
const linkInput = document.getElementById("linkInput")

loadBtn.onclick = ()=>{

let link = linkInput.value

if(link.includes("<iframe")){
let src = link.split('src="')[1].split('"')[0]
frame.src = src
}else{
frame.src = link
}

localStorage.setItem("studyLink",link)

}

const savedLink = localStorage.getItem("studyLink")

if(savedLink){
linkInput.value = savedLink
loadBtn.click()
}

/* ---------- TIMER VARIABLES ---------- */

let timer
let stageSeconds
let remaining
let currentStage = 0

const progressBar = document.getElementById("progressBar")
const claimBtns = document.querySelectorAll(".claimBtn")
const startBtn = document.getElementById("startBtn")
const minutesInput = document.getElementById("minutesInput")

/* ---------- FORMAT TIME ---------- */

function format(sec){

sec = Math.floor(sec)

let m = Math.floor(sec/60)
let s = sec%60

if(m<10) m="0"+m
if(s<10) s="0"+s

return m+":"+s

}

/* ---------- START SESSION ---------- */

startBtn.onclick = () => {

let minutes = Number(minutesInput.value)

if(!minutes || minutes < 10){

showPopup(
"Focus Requirement",
"Minimum focus time is 10 minutes"
)

return
}

let totalSeconds = minutes * 60

stageSeconds = totalSeconds / 4
remaining = stageSeconds
currentStage = 0

/* reset UI */

for(let i=0;i<4;i++){
document.getElementById("time"+i).innerText = format(stageSeconds)
}

/* create session */

const session = {

minutes: minutes,
stage: 0,
remaining: stageSeconds,
claimed: [false,false,false,false]

}

localStorage.setItem("studySession", JSON.stringify(session))

progressBar.style.width = "100%"

runTimer()

}

/* ---------- TIMER ---------- */

function runTimer(){

clearInterval(timer)

timer = setInterval(()=>{

if(document.hidden) return

remaining--

let percent = (remaining / stageSeconds) * 100

progressBar.style.width = percent + "%"

/* update stage time */

const timeBox = document.getElementById("time"+currentStage)

if(timeBox){
timeBox.innerText = format(remaining)
}

if(remaining <= 0){

remaining = 0

clearInterval(timer)

enableClaim(currentStage)

}

saveSession()

},1000)

}

/* ---------- ENABLE CLAIM ---------- */

function enableClaim(stage){

const btn = claimBtns[stage]

btn.disabled = false
btn.classList.add("active")

}

/* ---------- CLAIM ---------- */

claimBtns.forEach(btn=>{

btn.onclick = ()=>{

const stage = Number(btn.dataset.stage)

let session = JSON.parse(localStorage.getItem("studySession"))

if(!session) return
if(session.claimed[stage]) return

session.claimed[stage] = true

btn.disabled = true
btn.innerText = "Claimed"
btn.classList.remove("active")

addXP(25)
showXP(25)

/* next stage */

if(stage < 3){

currentStage++

remaining = stageSeconds

progressBar.style.width="100%"

runTimer()

}else{

let session = JSON.parse(localStorage.getItem("studySession"))

addMinute(session.minutes)   // update firestore

showXP(100)

localStorage.removeItem("studySession")

showPopup(
"Session Complete",
"You finished the study session. Great discipline!"
)

}

saveSession()

}

})

/* ---------- FINISH SESSION ---------- */

async function finishExam(){

clearInterval(examTimer)

examRunning = false
localStorage.removeItem("examSession")

const focusReward = Math.floor(Math.random()*900)+1
const xpReward = Math.floor(Math.random()*900)+1

try{

await addFocusScore(focusReward)
await addDisciplineXP(xpReward)

}catch(e){

console.error("Firebase error:",e)
showPopup("Database Error", e.message)
return

}

showPopup(
"Exam Complete 🎉",
"+"+focusReward+" Focus Score\n+"+xpReward+" Discipline XP"
)

}

/* ---------- SAVE SESSION ---------- */

function saveSession(){

let session = JSON.parse(localStorage.getItem("studySession"))

if(!session) return

session.remaining = remaining
session.stage = currentStage

localStorage.setItem("studySession",JSON.stringify(session))

}

/* ---------- RESTORE SESSION ---------- */

window.addEventListener("load",()=>{

const saved = localStorage.getItem("studySession")

if(!saved) return

const session = JSON.parse(saved)

currentStage = session.stage

stageSeconds = (session.minutes * 60) / 4

remaining = session.remaining

session.claimed.forEach((c,i)=>{

if(c){

claimBtns[i].disabled = true
claimBtns[i].innerText = "Claimed"

}

})

runTimer()

})

/* ---------- TIMER PAUSE ---------- */

document.addEventListener("visibilitychange",()=>{

if(document.hidden){
clearInterval(timer)
}else{
runTimer()
}

})

/* ---------- XP POPUP ---------- */

function showXP(xp){

const div = document.createElement("div")

div.className = "xpPopup"

div.innerText = "+" + xp + " XP"

document.body.appendChild(div)

setTimeout(()=>{

div.remove()

},2000)

}

/* ---------- NOTES ---------- */

const noteArea = document.getElementById("noteArea")

if(noteArea){

noteArea.oninput = ()=>{

localStorage.setItem("studyNote",noteArea.value)

}

const savedNote = localStorage.getItem("studyNote")

if(savedNote){
noteArea.value = savedNote
}

}

/* ---------- POPUP ---------- */

const popupOverlay = document.getElementById("popupOverlay")
const popupTitle = document.getElementById("popupTitle")
const popupText = document.getElementById("popupText")
const popupBtn = document.getElementById("popupBtn")

function showPopup(title,message){

popupTitle.innerText = title
popupText.innerText = message

popupOverlay.classList.add("show")

}

popupBtn.onclick = ()=>{

popupOverlay.classList.remove("show")

}


// EXAM MODE VARIABLES

/* =========================================================
   EXAM MODE
========================================================= */

/* =========================
   EXAM MODE
========================= */

/* ============================= */
/* EXAM MODE */
/* ============================= */

const examMinutesInput = document.getElementById("examMinutes")
const examTime = document.getElementById("examTime")
const examViolations = document.getElementById("examViolations")

if(examMinutesInput && examTime){

let examSeconds = 0
let examTotal = 0
let examTimer = null
let examRunning = false
let violations = 0
let suspended = false

/* ---------- FORMAT ---------- */

function formatExam(sec){

let m = Math.floor(sec/60)
let s = sec%60

if(m<10) m="0"+m
if(s<10) s="0"+s

return m+":"+s
}

/* ---------- START EXAM ---------- */

window.startExam = async function(){

if(suspended){

showPopup(
"Suspended",
"You must wait until suspension ends."
)

return
}

let minutes = Number(examMinutesInput.value)

if(!minutes || minutes < 1){

showPopup(
"INVALID TIME",
"Minimum exam time is 5 minutes"
)

return
}

examSeconds = minutes * 60
examTotal = examSeconds
violations = 0

await document.documentElement.requestFullscreen()

examRunning = true

updateExamUI()
saveExamSession()

runExamTimer()
}

/* ---------- TIMER ---------- */

function runExamTimer(){

clearInterval(examTimer)

examTimer = setInterval(()=>{

if(!examRunning) return

examSeconds--

updateExamUI()
saveExamSession()

if(examSeconds <= 0){
finishExam()
}

},1000)
}

/* ---------- UPDATE UI ---------- */

function updateExamUI(){

examTime.innerText = formatExam(examSeconds)

if(examViolations){
examViolations.innerText = "Violations: " + violations
}

}

/* ---------- STOP ---------- */

window.stopExam = function(){

clearInterval(examTimer)

examRunning = false

localStorage.removeItem("examSession")

showPopup(
"Exam Stopped",
"Focus session cancelled"
)

}

/* ---------- FINISH ---------- */

async function finishExam(){

clearInterval(examTimer)
examRunning = false
localStorage.removeItem("examSession")

const focusReward = Math.floor(Math.random()*200)+1
const xpReward = Math.floor(Math.random()*200)+1

const user = auth.currentUser

console.log("USER:", user)

if(!user){
showPopup("Error","User not logged in")
return
}

try{

const userRef = doc(db,"users",user.uid)

console.log("Updating user:", user.uid)

await setDoc(userRef,{
focusScore: increment(focusReward),
disciplineXP: increment(xpReward)
},{
merge:true
})

console.log("Reward added")

showPopup(
"Exam Complete 🎉",
"+"+focusReward+" Focus Score\n+"+xpReward+" Discipline XP"
)

}catch(e){

console.error("FIREBASE ERROR FULL:", e)

showPopup(
"Database Error",
e.message
)

}

}

/* ---------- SAVE SESSION ---------- */

function saveExamSession(){

localStorage.setItem("examSession",JSON.stringify({

seconds: examSeconds,
total: examTotal,
violations: violations,
running: examRunning

}))

}

/* ---------- RESTORE AFTER RELOAD ---------- */

window.addEventListener("load",()=>{

const saved = localStorage.getItem("examSession")

if(saved){

const session = JSON.parse(saved)

examSeconds = session.seconds
examTotal = session.total
violations = session.violations
examRunning = session.running

updateExamUI()

if(examRunning){
runExamTimer()
}

}

/* restore suspension */

const suspend = localStorage.getItem("examSuspend")

if(suspend){

const data = JSON.parse(suspend)

const now = Date.now()

if(now < data.end){

suspended = true

startSuspendCountdown(data.end)

}

}

})

/* ---------- VIOLATION ---------- */

function addViolation(reason){

if(!examRunning) return

violations++

updateExamUI()

showPopup(
"Focus Warning",
reason
)

saveExamSession()

if(violations >= 3){

suspendExam()

}

}

/* ---------- SUSPEND ---------- */

function suspendExam(){

clearInterval(examTimer)

examRunning = false

const endTime = Date.now() + (5 * 60 * 1000)

localStorage.setItem("examSuspend", JSON.stringify({
end:endTime
}))

localStorage.removeItem("examSession")

suspended = true

penaltyExam()

startSuspendCountdown(endTime)

}

/* ---------- SUSPEND COUNTDOWN ---------- */

function startSuspendCountdown(endTime){

let interval = setInterval(()=>{

let remaining = Math.floor((endTime - Date.now())/1000)

if(remaining <= 0){

clearInterval(interval)

popupOverlay.classList.remove("show")

suspended = false

localStorage.removeItem("examSuspend")

return
}

showPopup(
"Suspended",
"You must wait " + formatExam(remaining) + " to use it again"
)

},1000)

}

/* ---------- TAB SWITCH ---------- */

document.addEventListener("visibilitychange",()=>{

if(!examRunning) return

if(document.hidden){
addViolation("Tab switching detected")
}

})

/* ---------- EXIT FULLSCREEN ---------- */

document.addEventListener("fullscreenchange",()=>{

if(!examRunning) return

if(!document.fullscreenElement){
addViolation("Exited fullscreen")
}

})

/* ---------- PENALTY ---------- */

async function penaltyExam(){

const user = auth.currentUser
if(!user) return

const userRef = doc(db,"users",user.uid)

try{

await updateDoc(userRef,{
focusScore: increment(-10)
})

}catch(e){
console.error(e)
}

}

}

