import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCEii559-6WxQVaf6-v_kJB9vup1mAua2A",
  authDomain: "hirico-internal-project-1.firebaseapp.com",
  projectId: "hirico-internal-project-1",
  storageBucket: "hirico-internal-project-1.firebasestorage.app",
  messagingSenderId: "173326345868",
  appId: "1:173326345868:web:e8abd4b8f69c70ad96bda9"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Connect to emulator in development
// if (import.meta.env.DEV) {
//   connectFirestoreEmulator(db, 'localhost', 8080)
// }
