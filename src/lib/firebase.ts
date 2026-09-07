import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment
} from "firebase/firestore";

// The Firebase client configuration retrieved from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAuNo6iSGuoPYsVF0P5B7q6oxlC8ZdPa-o",
  authDomain: "agent-for-db-design.firebaseapp.com",
  projectId: "agent-for-db-design",
  storageBucket: "agent-for-db-design.firebasestorage.app",
  messagingSenderId: "251597962382",
  appId: "1:251597962382:web:a792411c980939812a5ddf",
  measurementId: "G-LJJ7YY5N9N"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Re-export common Firestore utilities to keep imports organized
export {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged
};
export type { User };
