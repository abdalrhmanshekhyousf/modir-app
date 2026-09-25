import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ استبدل القيم أدناه ببيانات مشروعك من لوحة تحكم Firebase Console
const firebaseConfig = {
   apiKey: "AIzaSyDcqhLwFenNNAj50G-SsYvP7sZeTtKpwgE",

  authDomain: "app-m-be363.firebaseapp.com",

  projectId: "app-m-be363",

  storageBucket: "app-m-be363.firebasestorage.app",

  messagingSenderId: "717624897522",

  appId: "1:717624897522:web:fd43f017f3b560ca9d856b"

};


// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تصدير خدمات المصادقة وقاعدة البيانات
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;