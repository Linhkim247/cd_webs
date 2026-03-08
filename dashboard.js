import { auth, db } from "./firebase.js"
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"


onAuthStateChanged(auth, async (user)=>{

if(!user) return

const ref = doc(db,"users",user.uid)

const snap = await getDoc(ref)

const data = snap.data()


document.getElementById("dashWelcome").innerText =
"Welcome , " + data.name


document.getElementById("dashXP").innerText =
data.xp || 0

document.getElementById("dashSessions").innerText =
data.totalStudySessions || 0

document.getElementById("dashTasks").innerText =
data.totalTaskCompleted || 0

document.getElementById("dashStreak").innerText =
data.checkInStreak || 0


const hours =
Math.floor((data.totalStudyMinutes || 0)/60)

document.getElementById("dashHours").innerText =
hours + "h"


const level =
Math.floor((data.xp || 0)/100)

document.getElementById("dashLevel").innerText =
level

})