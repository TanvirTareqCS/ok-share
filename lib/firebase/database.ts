import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBSn_UrhUnWZdvU0WfaDUbPC8lviWFfRWA",
  authDomain: "share-5d4a0.firebaseapp.com",
  databaseURL: "https://share-5d4a0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "share-5d4a0",
  storageBucket: "share-5d4a0.firebasestorage.app",
  messagingSenderId: "851824058701",
  appId: "1:851824058701:web:8e66692c9a9213f1229704",
  measurementId: "G-7DNZJJZD69",
};

const firebaseApp = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);

export const db = getDatabase(firebaseApp);
