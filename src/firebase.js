// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBMs6twFJLo_2L30-aovTI0fM_Y2NClwB4",
  authDomain: "pines-9ef68.firebaseapp.com",
  projectId: "pines-9ef68",
  storageBucket: "pines-9ef68.firebasestorage.app",
  messagingSenderId: "170872795958",
  appId: "1:170872795958:web:5ff90c0943086657223997",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ===== פונקציות עזר =====

// שמור ביקורים
export async function saveVisits(visits) {
  await setDoc(doc(db, "app", "visits"), { data: JSON.stringify(visits) });
}

// שמור משתמשים
export async function saveMembers(members) {
  await setDoc(doc(db, "app", "members"), { data: JSON.stringify(members) });
}

// האזן לשינויים בזמן אמת
export function subscribeToVisits(callback) {
  return onSnapshot(doc(db, "app", "visits"), (snap) => {
    if (snap.exists()) {
      try { callback(JSON.parse(snap.data().data)); } catch { callback({}); }
    } else { callback({}); }
  });
}

export function subscribeToMembers(callback) {
  return onSnapshot(doc(db, "app", "members"), (snap) => {
    if (snap.exists()) {
      try { callback(JSON.parse(snap.data().data)); } catch { callback([]); }
    } else { callback([]); }
  });
}
