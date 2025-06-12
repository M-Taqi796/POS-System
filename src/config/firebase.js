import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrY-7KHNnT5LKdsXnGSX1JIYh7enj2Iuc",
  authDomain: "pos-project-8063e.firebaseapp.com",
  projectId: "pos-project-8063e",
  storageBucket: "pos-project-8063e.appspot.com",
  messagingSenderId: "169863682047",
  appId: "1:169863682047:web:aada103f8c4ae2d15f39ca",
  measurementId: "G-JS7YLS6HK1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

export { auth, db, analytics, storage }; 