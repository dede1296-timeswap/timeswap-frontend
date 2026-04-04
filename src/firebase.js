import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDruxp8WfSOLngVQAtykbOZAm2P8lI6_qk",
  authDomain: "timeswap-e208c.firebaseapp.com",
  projectId: "timeswap-e208c",
  storageBucket: "timeswap-e208c.firebasestorage.app",
  messagingSenderId: "456150513729",
  appId: "1:456150513729:web:064f94b3f21b2f328e6ec0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);