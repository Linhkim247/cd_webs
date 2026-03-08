import { db, auth } from "./firebase.js"

import {
doc,
onSnapshot,
updateDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

let userRef
let userData
let boostTimerInterval=null


/* ================= AUTH ================= */

auth.onAuthStateChanged(user=>{

if(!user) return

userRef=doc(db,"users",user.uid)

onSnapshot(userRef,snap=>{

if(!snap.exists()) return

userData=snap.data()

updateXP()
updateInventory()
updateBoostUI()

})

})


/* ================= XP DISPLAY ================= */

function updateXP(){

document.getElementById("focusXP").textContent=
userData.focusScore || 0

document.getElementById("disciplineXP").textContent=
userData.disciplineXP || 0

}


/* ================= INVENTORY ================= */

function updateInventory(){

const grid=document.getElementById("inventoryGrid")
grid.innerHTML=""

const inv=userData.inventory || {}
let total=0

for(const item in inv){

const qty=inv[item]
if(qty<=0) continue

total+=qty

const card=document.createElement("div")
card.className="inventory-card"

card.innerHTML=`

<div class="item-left">

<span class="item-icon">🎒</span>

<div>
<div class="item-name">${item}</div>
<div class="item-count">x${qty}</div>
</div>

</div>

<button onclick="useItem('${item}')">Use</button>

`

grid.appendChild(card)

}

document.getElementById("bagCount").textContent=total

}


/* ================= BUY ITEM ================= */

window.buyItem=async function(item,price,type){

if(!userData) return

let focus=userData.focusScore||0
let discipline=userData.disciplineXP||0

if(type==="focus"){

if(focus<price){
showPopup("Not enough Focus XP")
return
}

focus-=price

}

if(type==="discipline"){

if(discipline<price){
showPopup("Not enough Discipline XP")
return
}

discipline-=price

}

const inv=userData.inventory||{}

inv[item]=(inv[item]||0)+1

await updateDoc(userRef,{
focusScore:focus,
disciplineXP:discipline,
inventory:inv
})

showPopup("👜Item added to bag👜")

}


/* ================= USE ITEM ================= */

window.useItem=async function(item){

const inv=userData.inventory||{}

if(!inv[item]) return

inv[item]--

if(inv[item]<=0) delete inv[item]


/* SMALL XP BOX */

if(item==="small_box"){

await openXPBox(50,200)

await updateDoc(userRef,{inventory:inv})

return

}


/* LARGE XP BOX */

if(item==="large_box"){

await openXPBox(60,500)

await updateDoc(userRef,{inventory:inv})

return

}


/* LUCKY BOX */

if(item==="lucky_box"){

await openLuckyBox()

await updateDoc(userRef,{inventory:inv})

return

}


/* BOOSTS */

if(item==="xp_boost_30")
await startBoost(2,30)

if(item==="xp_boost_60")
await startBoost(2,60)

if(item==="xp_boost_90")
await startBoost(3,90)


await updateDoc(userRef,{inventory:inv})

showPopup(item+" used")

}


/* ================= XP BOX ================= */

async function openXPBox(min,max){

const xp=Math.floor(Math.random()*(max-min+1))+min

await updateDoc(userRef,{

xp:(userData.xp||0)+xp,
focusScore:(userData.focusScore||0)+xp,
disciplineXP:(userData.disciplineXP||0)+xp

})

showLoot(

`+${xp} XP
+${xp} Focus XP
+${xp} Discipline XP`

)

}


/* ================= LUCKY BOX ================= */

async function openLuckyBox(){

const roll=Math.random()

const box=document.getElementById("lootBox")
const result=document.getElementById("lootResult")

document.getElementById("lootPopup").style.display="flex"

result.classList.remove("show")

box.classList.add("shake")


setTimeout(async()=>{

box.classList.remove("shake")
box.classList.add("open")


/* 1% SUPER RARE */

if(roll<0.01){

await startBoost(10,20)

result.innerText="🔥 JACKPOT\n10x XP for 20 minutes"

}


/* 4% RARE */

else if(roll<0.05){

await startBoost(10,10)

result.innerText="⚡ Rare Boost\n10x XP for 10 minutes"

}


/* NORMAL */

else{

const xp=Math.floor(Math.random()*40)+20
const focus=Math.floor(Math.random()*40)+20
const discipline=Math.floor(Math.random()*40)+20

await updateDoc(userRef,{

xp:(userData.xp||0)+xp,
focusScore:(userData.focusScore||0)+focus,
disciplineXP:(userData.disciplineXP||0)+discipline

})

result.innerText=

`✨ XP Reward

+${xp} XP
+${focus} Focus XP
+${discipline} Discipline XP`

}


setTimeout(()=>{

result.classList.add("show")

},200)

},1200)

}


/* ================= SHOW LOOT ================= */

function showLoot(text){

const box=document.getElementById("lootBox")
const result=document.getElementById("lootResult")

document.getElementById("lootPopup").style.display="flex"

result.innerText=text

result.classList.add("show")

box.classList.add("open")

}


/* ================= BOOST ================= */

async function startBoost(multiplier,minutes){

const end=Date.now()+minutes*60000

await updateDoc(userRef,{

boostMultiplier:multiplier,
boostEnd:end

})

showPopup(multiplier+"x XP activated")

}


/* ================= BOOST TIMER ================= */

function updateBoostUI(){

const timer=document.getElementById("boostTimer")

clearInterval(boostTimerInterval)

const end=userData.boostEnd
const multi=userData.boostMultiplier

if(!end || Date.now()>end){

timer.innerText=""
return

}

boostTimerInterval=setInterval(()=>{

const left=end-Date.now()

if(left<=0){

timer.innerText=""
clearInterval(boostTimerInterval)
return

}

const m=Math.floor(left/60000)
const s=Math.floor((left%60000)/1000)

timer.innerText=`${multi}x XP • ${m}:${s}`

},1000)

}


/* ================= CLOSE LOOT ================= */

window.closeLoot=function(){

document.getElementById("lootPopup").style.display="none"

}


/* ================= POPUP ================= */

function showPopup(text){

const popup=document.getElementById("popup")

popup.textContent=text

popup.classList.add("show")

setTimeout(()=>{

popup.classList.remove("show")

},2000)

}


/* ================= INVENTORY PANEL ================= */

const bagBtn=document.getElementById("bagBtn")
const panel=document.getElementById("inventoryPanel")
const closeBtn=document.getElementById("closeInventory")

bagBtn.onclick=()=>panel.classList.add("show")
closeBtn.onclick=()=>panel.classList.remove("show")