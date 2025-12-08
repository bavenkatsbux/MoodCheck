import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC9mnTT87B3r7oL75SQS2IlLf19Dvq6Duc",
    authDomain: "moodcheck-4cf7c.firebaseapp.com",
    projectId: "moodcheck-4cf7c",
    storageBucket: "moodcheck-4cf7c.firebasestorage.app",
    messagingSenderId: "311193677000",
    appId: "1:311193677000:web:293bde80a82a36ce9e09fd",
    measurementId: "G-ZP7QY3G3V1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
