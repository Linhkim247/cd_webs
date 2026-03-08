import { auth, db } from "./firebase.js";
import {
doc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

let previousXP = null;
let previousLevel = null;


/* =========================
INJECT CSS
========================= */

const style = document.createElement("style");

style.innerHTML = `

/* ================= XP EFFECT ================= */

.xp-float{

position:fixed;

font-size:22px;
font-weight:800;

color:#FFD700;

text-shadow:
0 0 6px rgba(255,215,0,.8),
0 0 14px rgba(255,200,0,.6);

pointer-events:none;

animation:xpRise 1.5s ease forwards;

z-index:9999;

}

@keyframes xpRise{

0%{
transform:translateY(0) scale(.6);
opacity:0;
}

20%{
opacity:1;
transform:translateY(-10px) scale(1);
}

100%{
transform:translateY(-100px) scale(1.15);
opacity:0;
}

}



/* ================= LEVEL UP ================= */

.levelup-overlay{

position:fixed;
top:0;
left:0;

width:100%;
height:100%;

display:flex;
align-items:center;
justify-content:center;

background:radial-gradient(
circle,
rgba(0,0,0,.2),
rgba(0,0,0,.85)
);

z-index:99999;

animation:fadeIn .3s ease;

}


/* main level box */

.levelup-box{

text-align:center;

padding:60px 110px;

border-radius:18px;

background:linear-gradient(
180deg,
#f5c96a,
#d98c1d
);

color:white;

box-shadow:
0 0 40px rgba(255,180,0,.7),
0 0 90px rgba(255,140,0,.5);

animation:levelPop .55s cubic-bezier(.17,.67,.29,1.4);

}



/* LEVEL UP text */

.levelup-title{

font-size:20px;
letter-spacing:6px;
font-weight:700;

margin-bottom:20px;

opacity:.95;

}



/* LEVEL NUMBER */

.levelup-number{

font-size:90px;
font-weight:900;

line-height:1;

text-shadow:
0 0 8px rgba(255,255,255,.8),
0 0 20px rgba(255,220,0,.6);

}



/* animations */

@keyframes levelPop{

0%{
transform:scale(.4);
opacity:0;
}

60%{
transform:scale(1.12);
}

100%{
transform:scale(1);
}

}

@keyframes fadeIn{

from{opacity:0}
to{opacity:1}

}

.levelup-overlay.fade-out{

animation:fadeOut .8s forwards;

}

@keyframes fadeOut{

to{opacity:0}

}

`;

document.head.appendChild(style);


/* ================= XP EFFECT ================= */

function showXPEffect(amount){

const xp = document.createElement("div");

xp.className = "xp-float";

xp.innerText = "+" + amount + " XP";

xp.style.left = (window.innerWidth/2 - 40) + "px";
xp.style.top = (window.innerHeight/2 + 60) + "px";

document.body.appendChild(xp);

setTimeout(()=>{

xp.remove();

},1500);

}



/* ================= LEVEL UP EFFECT ================= */

function showBetterLevelUp(level){

const overlay = document.createElement("div");

overlay.className = "levelup-overlay";

overlay.innerHTML = `

<div class="levelup-box">

<div class="levelup-title">LEVEL UP</div>

<div class="levelup-number">${level}</div>

</div>

`;

document.body.appendChild(overlay);

setTimeout(()=>{

overlay.classList.add("fade-out");

setTimeout(()=>{

overlay.remove();

},800);

},2500);

}



/* ================= FIRESTORE LISTENER ================= */

onAuthStateChanged(auth,(user)=>{

if(!user) return;

const ref = doc(db,"users",user.uid);

onSnapshot(ref,(snap)=>{

const data = snap.data();

if(!data) return;

const currentXP = data.xp || 0;
const currentLevel = data.level || 1;


/* bỏ qua lần load đầu */

if(previousXP === null){

previousXP = currentXP;
previousLevel = currentLevel;

return;

}


/* xp gained */

if(currentXP > previousXP){

const gained = currentXP - previousXP;

showXPEffect(gained);

}


/* level up */

if(currentLevel > previousLevel){

showBetterLevelUp(currentLevel);

}

previousXP = currentXP;
previousLevel = currentLevel;

});

});