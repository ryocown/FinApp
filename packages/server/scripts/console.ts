import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import repl from 'repl';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...(process.env.FIREBASE_PROJECT_ID && { projectId: process.env.FIREBASE_PROJECT_ID }),
  });
}

const db = admin.firestore();

console.log('Firestore Console');
console.log('Available globals: db, admin');
console.log('Top-level await is supported.');
console.log('Example: await db.collection("instruments").limit(1).get().then(s => s.docs[0]?.data())');

const r = repl.start('> ');
r.context.db = db;
r.context.admin = admin;
