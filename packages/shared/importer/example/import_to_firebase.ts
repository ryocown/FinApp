import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ChaseCsvStatementImporter, ChaseCreditCsvStatementImporter } from '../institutions/chase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import path from 'path';
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '../../../../.env') });

// Initialize Firebase Admin to connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function importToFirebase() {
  const userId = 'fake-user-id-yxt06l';
  const accountId6459 = 'account-6459';
  const accountId8829 = 'account-8829';

  console.log(`Using User ID: ${userId}`);

  // 1. Create User
  await db.collection('users').doc(userId).set({
    name: 'Fake User',
    email: 'fake@example.com'
  });

  // 2. Create Accounts
  await db.collection('users').doc(userId).collection('accounts').doc(accountId6459).set({
    name: 'Chase Credit 6459',
    type: 'Credit'
  });
  await db.collection('users').doc(userId).collection('accounts').doc(accountId8829).set({
    name: 'Chase Checking 8829',
    type: 'Checking'
  });

  // 3. Import Chase Credit 6459
  const importer6459 = new ChaseCreditCsvStatementImporter(accountId6459);
  const csvPath6459 = path.join(__dirname, 'Chase6459_Activity20251130.CSV');
  const csvData6459 = fs.readFileSync(csvPath6459, 'utf-8');
  const statement6459 = await importer6459.import(csvData6459);

  console.log(`Importing ${statement6459.transactions.length} transactions for 6459...`);
  const batch6459 = db.batch();
  statement6459.transactions.forEach(t => {
    const ref = db.collection('users').doc(userId).collection('transactions').doc(t.transactionId);
    batch6459.set(ref, JSON.parse(JSON.stringify(t))); // Convert to plain object
  });
  const result6459 = await batch6459.commit();
  console.log(`6459 Batch commit successful: ${result6459.length} operations`);

  // 4. Import Chase Checking 8829
  const importer8829 = new ChaseCsvStatementImporter(accountId8829);
  const csvPath8829 = path.join(__dirname, 'Chase8829_Activity_20251129.CSV');
  const csvData8829 = fs.readFileSync(csvPath8829, 'utf-8');
  const statement8829 = await importer8829.import(csvData8829);

  console.log(`Importing ${statement8829.transactions.length} transactions for 8829...`);
  const batch8829 = db.batch();
  statement8829.transactions.forEach(t => {
    const ref = db.collection('users').doc(userId).collection('transactions').doc(t.transactionId);
    batch8829.set(ref, JSON.parse(JSON.stringify(t))); // Convert to plain object
  });
  const result8829 = await batch8829.commit();
  console.log(`8829 Batch commit successful: ${result8829.length} operations`);

  console.log('Import complete!');
}

importToFirebase().catch(console.error);
