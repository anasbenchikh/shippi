/*import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyCtO4vkNn7HjdHe7z-8omtjmW7X7cpVtkw",
    authDomain: "orders-shipp.firebaseapp.com",
    projectId: "orders-shipp",
    storageBucket: "orders-shipp.firebasestorage.app",
    messagingSenderId: "406068032682",
    appId: "1:406068032682:web:542d300320b96d91f08cd3",
    measurementId: "G-GVHHQHKM8Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Initializing app...');

const auth = getAuth(app);
console.log('Initializing Auth...');

//export default auth;

const db = getFirestore(app);
console.log('Initializing firestore...');

export { app, auth, db };

*/
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = "/Users/macos/Downloads/orders-shipp-firebase-adminsdk-ntfaw-5c53348ca3.json";
const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);

const app = initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
    databaseURL: 'https://orders-shipp.firebaseio.com'
});
console.log('Initializing app...');

const auth = getAuth(app);
console.log('Initializing Auth...');

const db = admin.firestore();

export { app, auth, db }