import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "demo-sender-id",
  appId: "demo-app-id"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Connect to emulator in development
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
