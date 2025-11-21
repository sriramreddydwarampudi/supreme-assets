// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbsA4uutuPoEP18gpEsUwaJLkVE-pUzr8",
  authDomain: "supreme-assets-98ab6.firebaseapp.com",
  projectId: "supreme-assets-98ab6",
  storageBucket: "supreme-assets-98ab6.firebasestorage.app",
  messagingSenderId: "603179509924",
  appId: "1:603179509924:web:611e4b7aff816f4f72de31",
  measurementId: "G-0N3027522F"
};

// Initialize Firebase (avoid re-initializing if already done)
const apps = getApps();
const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
const customerWorkerApp =
  apps.find((a) => a.name === 'customer-worker') ||
  initializeApp(firebaseConfig, 'customer-worker');

// Initialize Firebase Services
export const auth = getAuth(app);
export const customerCreationAuth = getAuth(customerWorkerApp);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
