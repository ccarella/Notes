import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Define Action Code Settings for Email Link Authentication
const actionCodeSettings = {
  url: process.env.REACT_APP_AUTH_REDIRECT_URL || "http://localhost:3000", // Use environment variable or fallback to localhost
  handleCodeInApp: true, // Indicates that this link is handled in the app
};

export { db, auth, actionCodeSettings }; // Export db, auth, and actionCodeSettings
