
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getStorage } from "firebase/storage"; 
import { getFirestore } from "firebase/firestore";  

const firebaseConfig = {
  apiKey: "AIzaSyBUKOwKbFGca6TYTL7PIuyUJP77F2IIBLQ",
  authDomain: "nextjsapp-15781.firebaseapp.com",
  projectId: "nextjsapp-15781",
  storageBucket: "nextjsapp-15781.appspot.com",
  messagingSenderId: "320912514538",
  appId: "1:320912514538:web:0bf1d79a714e45ec28e693"
};

const app = initializeApp(firebaseConfig);

export const auth =  getAuth(app); 
export const storage = getStorage(app); 
export const db = getFirestore(app); 
