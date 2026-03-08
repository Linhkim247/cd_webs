import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyC_EZOZ-ZtU64ov0waxj2_cylX9g6FcKcY",
    authDomain: "ashopvn-42bf4.firebaseapp.com",
    projectId: "ashopvn-42bf4",
    storageBucket: "ashopvn-42bf4.firebasestorage.app",
    messagingSenderId: "681530352530",
    appId: "1:681530352530:web:a3b05dc78350428cac974b",
    measurementId: "G-7KR9TMN5X7"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);