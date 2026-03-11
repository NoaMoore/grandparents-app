// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, deleteDoc, getDoc } from "firebase/firestore";

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

export async function saveVisits(visits) {
  await setDoc(doc(db, "app", "visits"), { data: JSON.stringify(visits) });
}

export async function saveMembers(members) {
  await setDoc(doc(db, "app", "members"), { data: JSON.stringify(members) });
}

export async function getMembers() {
  const snap = await getDoc(doc(db, "app", "members"));
  if (!snap.exists()) return [];
  try { return JSON.parse(snap.data().data); } catch { return []; }
}

// שמור OTP זמני (פג תוקף אחרי 10 דקות)
export async function saveOTP(email, code) {
  await setDoc(doc(db, "otps", email.toLowerCase().replace(/[.]/g, "_")), {
    code,
    email,
    createdAt: Date.now(),
  });
}

export async function verifyOTP(email, code) {
  const key = email.toLowerCase().replace(/[.]/g, "_");
  const snap = await getDoc(doc(db, "otps", key));
  if (!snap.exists()) return false;
  const data = snap.data();
  const expired = Date.now() - data.createdAt > 10 * 60 * 1000;
  if (expired || data.code !== code) return false;
  await deleteDoc(doc(db, "otps", key));
  return true;
}

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
