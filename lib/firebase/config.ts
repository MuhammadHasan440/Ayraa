import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAP2jaQCCH1M5NEGi5B1vYlycXtq0Qqh1w",
  authDomain: "ayraa-store.firebaseapp.com",
  projectId: "ayraa-store",
  storageBucket: "ayraa-store.firebasestorage.app",
  messagingSenderId: "657096800104",
  appId: "1:657096800104:web:0b2eae4afd48775f7bc8dd",
  measurementId: "G-J3NNQW3M4E"
};
// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };