import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Ajout

const firebaseConfig = {
  apiKey: "AIzaSyB8zWASRK5hbrYmwlrVjqL4LU4w3QZrWno",
  authDomain: "archive-itc.firebaseapp.com",
  projectId: "archive-itc",
  storageBucket: "archive-itc.appspot.com",
  messagingSenderId: "201436816812",
  appId: "1:201436816812:web:a823746dcc75132b29c609",
  measurementId: "G-V8T56XQK3G"
};

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app); // Ajout
const analytics = getAnalytics(app);