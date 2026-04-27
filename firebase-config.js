import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDY_HmNfD_QFLI7Vwj39s1b3WHKEKD80nQ",
  authDomain: "ovkb-8d398.firebaseapp.com",
  projectId: "ovkb-8d398",
  storageBucket: "ovkb-8d398.firebasestorage.app",
  messagingSenderId: "804850492300",
  appId: "1:804850492300:web:cf90f3c83773e1f13caca9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy };
