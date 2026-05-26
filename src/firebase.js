// src/firebase.js
// ⚠️  Replace the values below with your own Firebase project config
// (Firebase Console → Project Settings → Your apps → Config)

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyChFVuch0kGJiIVgi9xY9JLXTbEDEkEVhA",
  authDomain: "ranchoap-3eed2.firebaseapp.com",
  projectId: "ranchoap-3eed2",
  storageBucket: "ranchoap-3eed2.firebasestorage.app",
  messagingSenderId: "1077172170944",
  appId: "1:1077172170944:web:a3b5ea0fc6c04b433bfd25",
  measurementId: "G-4QTD1NTLMV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
