
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCGniiANJ5qRqT-6EvRHG0TMJmEYlJNKcc",
    authDomain: "gshiftwork.firebaseapp.com",
    databaseURL: "https://gshiftwork.firebaseio.com",
    projectId: "gshiftwork",
    storageBucket: "gshiftwork.firebasestorage.app",
    messagingSenderId: "725156246479",
    appId: "1:725156246479:web:bf07e7dd0072c198b2d8ba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

console.log('Firebase Initialized:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKeyPresent: !!firebaseConfig.apiKey
});
