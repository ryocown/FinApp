import admin from 'firebase-admin';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import util from 'util';
import repl from 'repl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Firebase Admin to connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'demo-project';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

// Helper to dump objects
const dump = (obj: any, depth: number | null = null) => {
  console.log(util.inspect(obj, { showHidden: false, depth: depth, colors: true }));
};

console.log(`\n🔥 Firestore Shell Connected to ${process.env.FIREBASE_PROJECT_ID}`);
console.log(`   Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
console.log(`\nAvailable globals:`);
console.log(`  - db: admin.firestore()`);
console.log(`  - admin: firebase-admin`);
console.log(`  - dump(obj, depth?): Pretty print object`);
console.log(`\nUsage examples:`);
console.log(`  await db.collection('users').get()`);
console.log(`  dump((await db.collection('users').get()).docs.map(d => d.data()))`);
console.log(`\nType .exit to quit.\n`);

const r = repl.start({
  prompt: 'firestore> ',
  useGlobal: true
});

// Initialize context
r.context.db = db;
r.context.admin = admin;
r.context.dump = dump;

// Add history support if possible (basic)
r.setupHistory(path.join(process.cwd(), '.firestore_shell_history'), (err) => {
  if (err) console.warn('Failed to setup history:', err);
});
