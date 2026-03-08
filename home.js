import { auth, db } from "./firebase.js"
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"


onAuthStateChanged(auth, async (user)=>{

if(!user) return

const ref = doc(db,"users",user.uid)

const snap = await getDoc(ref)

const data = snap.data()

document.getElementById("welcomeText").innerText =
"Xin chào, " + data.name + " 👋"

})


document.getElementById("logoutBtn").onclick = ()=>{

signOut(auth).then(()=>{

location.href="./index.html"

})

}