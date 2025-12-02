import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ChaseCsvStatementImporter, ChaseCreditCsvStatementImporter } from '../institutions/chase';
import dotenv from 'dotenv';
import { User } from '../../models/user';
import { Account, SubType } from '../../models/account';
import { Currency } from '../../models/currency';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Firebase Admin to connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function importToFirebase() {

  // 1. Create User
  const user = new User('fake@example.com', 'Fake User');
  const userId = user.userId;
  await db.collection('users').doc(userId).set(JSON.parse(JSON.stringify(user)));

  // 2. Create Accounts
  const usd = new Currency('US Dollar', '$', 'USD');

  const account6459 = new Account(
    '6459',
    0,
    'US',
    usd,
    'Chase Credit 6459',
    SubType.CreditCard,
    false,
    userId
  );
  const accountId6459 = account6459.accountId;

  const account8829 = new Account(
    '8829',
    0,
    'US',
    usd,
    'Chase Checking 8829',
    SubType.Checking,
    false,
    userId
  );
  const accountId8829 = account8829.accountId;

  await db.collection('users').doc(userId)
    .collection('accounts').doc(accountId6459)
    .set(JSON.parse(JSON.stringify(account6459)));

  await db.collection('users').doc(userId)
    .collection('accounts').doc(accountId8829)
    .set(JSON.parse(JSON.stringify(account8829)));

  // 3. Import Chase Credit 6459
  const importer6459 = new ChaseCreditCsvStatementImporter(accountId6459, userId);
  const csvPath6459 = path.join(__dirname, 'Chase6459_Activity.CSV');
  const csvData6459 = fs.readFileSync(csvPath6459, 'utf-8');
  const statement6459 = await importer6459.import(csvData6459);

  console.log(`Importing ${statement6459.transactions.length} transactions for 6459...`);
  const batch6459 = db.batch();
  statement6459.transactions.forEach(t => {
    const ref = db.collection('users').doc(userId)
      .collection('accounts').doc(accountId6459)
      .collection('transactions').doc(t.transactionId);
    batch6459.set(ref, JSON.parse(JSON.stringify(t))); // Convert to plain object
  });
  const result6459 = await batch6459.commit();
  console.log(`6459 Batch commit successful: ${result6459.length} operations`);

  // 4. Import Chase Checking 8829
  const importer8829 = new ChaseCsvStatementImporter(accountId8829, userId);
  const csvPath8829 = path.join(__dirname, 'Chase8829_Activity.CSV');
  const csvData8829 = fs.readFileSync(csvPath8829, 'utf-8');
  const statement8829 = await importer8829.import(csvData8829);

  console.log(`Importing ${statement8829.transactions.length} transactions for 8829...`);
  const batch8829 = db.batch();
  statement8829.transactions.forEach(t => {
    const ref = db.collection('users').doc(userId)
      .collection('accounts').doc(accountId8829)
      .collection('transactions').doc(t.transactionId);
    batch8829.set(ref, JSON.parse(JSON.stringify(t))); // Convert to plain object
  });
  const result8829 = await batch8829.commit();
  console.log(`8829 Batch commit successful: ${result8829.length} operations`);

  console.log('Import complete!');
}

importToFirebase().catch(console.error);
