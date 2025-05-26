import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "react-chat-app-14a4a.firebaseapp.com",
  projectId: "react-chat-app-14a4a",
  storageBucket: "react-chat-app-14a4a.firebasestorage.app",
  messagingSenderId: "483394613614",
  appId: "1:483394613614:web:bc2e323f980ed5d7e6117f",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
export const rtdb = getDatabase(
  app,
  "https://react-chat-app-14a4a-default-rtdb.europe-west1.firebasedatabase.app"
);
