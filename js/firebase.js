import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbG-pk2n3cJ09-egduIDhmVTS04yhX0jM",
  authDomain: "futaqi-ali.firebaseapp.com",
  databaseURL: "https://futaqi-ali-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "futaqi-ali",
  storageBucket: "futaqi-ali.firebasestorage.app",
  messagingSenderId: "77087108301",
  appId: "1:77087108301:web:682924ffc170f789870d84"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, push, set };
