import {
collection,
query,
where,
getDocs,
doc,
getDoc,
orderBy,
limit
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"
import { getAuth, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import { db } from "./firebase.js"


/* ELEMENTS */
const auth = getAuth()
let currentUser = null

onAuthStateChanged(auth, (user)=>{
currentUser = user
loadLeaderboard()
})
const searchInput = document.getElementById("searchEmail")
const resultBox = document.getElementById("searchResult")

const modal = document.getElementById("profileModal")
const closeModal = document.getElementById("closeProfileModal")

const avatarEl = document.getElementById("modalAvatar")
const nameEl = document.getElementById("modalName")
const emailEl = document.getElementById("modalEmail")
const levelEl = document.getElementById("modalLevel")
const xpEl = document.getElementById("modalXP")
const streakEl = document.getElementById("profileStreak")


/* SEARCH PANEL */

const searchPanel = document.getElementById("userSearchPanel")
const openBtn = document.getElementById("findUserBtn")
const closeBtn = document.getElementById("closeUserSearch")

openBtn.onclick = () => {
searchPanel.classList.add("active")
}

closeBtn.onclick = () => {
searchPanel.classList.remove("active")
resultBox.innerHTML = ""
searchInput.value = ""
}


const ADMIN_EMAILS = [
  "dangcanh13102008@gmail.com"
]



/* AUTO SEARCH */

let searchTimeout

searchInput.addEventListener("input", () => {

clearTimeout(searchTimeout)

searchTimeout = setTimeout(async () => {

const email = searchInput.value.trim().toLowerCase()

if(email.length < 3){
resultBox.innerHTML = ""
return
}

resultBox.innerHTML = "Searching..."

try{

const q = query(
collection(db,"users"),
where("email",">=",email),
where("email","<=",email + "\uf8ff")
)

const snap = await getDocs(q)

resultBox.innerHTML = ""

if(snap.empty){
resultBox.innerHTML = "<div class='no-user'>User not found</div>"
return
}

snap.forEach((docSnap)=>{

const data = docSnap.data()
const uid = docSnap.id

const card = document.createElement("div")
card.className="search-user-card"

card.innerHTML=`
<img src="${data.photoURL || 'default-avatar.png'}">
<div class="search-user-info">
<div class="search-user-name">
${data.name || "No name"}
${ADMIN_EMAILS.includes(data.email) ? '<span class="admin-badge">👑</span>' : ''}
</div>
<div class="search-user-email">${data.email}</div>
</div>
`

card.onclick = ()=>{
openProfile(uid)
}

resultBox.appendChild(card)

})

}catch(err){

console.error(err)
resultBox.innerHTML = "Search error"

}

},300)

})


/* OPEN PROFILE */

async function openProfile(uid){

try{

const ref = doc(db,"users",uid)
const snap = await getDoc(ref)

if(!snap.exists()) return

const data = snap.data()

avatarEl.src = data.photoURL || "default-avatar.png"
nameEl.innerHTML = data.name || "No name"

if(ADMIN_EMAILS.includes(data.email)){
nameEl.innerHTML += `
<span class="admin-badge">
👑 ADMIN
</span>
`
}
emailEl.innerText = data.email
levelEl.innerText = data.level || 1
xpEl.innerText = data.xp || 0

/* FIX STREAK */
streakEl.innerText = data.checkInStreak || 0

modal.classList.add("show")

}catch(err){
console.error(err)
}

}


/* CLOSE PROFILE */

closeModal.onclick = ()=>{
modal.classList.remove("show")
}

// =================================================== neww========================================
const tabButtons = document.querySelectorAll(".tab-btn")
const tabPanels = document.querySelectorAll(".tab-panel")

tabButtons.forEach(btn => {

btn.addEventListener("click", () => {

tabButtons.forEach(b => b.classList.remove("active"))
tabPanels.forEach(p => p.classList.remove("active"))

btn.classList.add("active")

const tab = btn.dataset.tab
document.getElementById(tab).classList.add("active")

})

})




/* ============================= */
/* LEADERBOARD SYSTEM */
/* ============================= */

const leaderboardList = document.getElementById("leaderboardList")

async function loadLeaderboard(){

try{

const q = query(
collection(db,"users"),
orderBy("checkInStreak","desc"),
orderBy("xp","desc"),
limit(50)
)

const snap = await getDocs(q)

leaderboardList.innerHTML=""

let rank = 1

snap.forEach((docSnap)=>{

const data = docSnap.data()
const isCurrentUser = currentUser && currentUser.email === data.email

const isAdmin = ADMIN_EMAILS.includes(data.email)

const row = document.createElement("div")
row.className = "leaderboard-row"

if(isCurrentUser){
row.classList.add("my-rank")

setTimeout(()=>{
row.scrollIntoView({
behavior:"smooth",
block:"center"
})
},300)

}

row.innerHTML = `

<div class="leader-rank">#${rank}</div>

<img class="leader-avatar"
src="${data.photoURL || 'default-avatar.png'}">

<div class="leader-info">

<div class="leader-name">
${data.name || "No name"}
${isAdmin ? '<span class="admin-badge">👑</span>' : ''}
</div>

<div class="leader-stats">
🔥 ${data.checkInStreak || 0} streak • XP ${data.xp || 0}
</div>

</div>

`

leaderboardList.appendChild(row)

rank++

})

}catch(err){
console.error("Leaderboard error",err)
}

}

