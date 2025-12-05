import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from project root
console.log('Current working directory:', process.cwd());
const envPath = path.resolve(process.cwd(), './.env');
console.log('Resolved .env path:', envPath);
dotenv.config({ path: envPath });

// Initialize Firebase Admin to connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function aggregateByAccount() {
  const userId = 'fake-user-id-yxt06l';
  console.log(`Aggregating transactions for user: ${userId}`);

  // 1. Get all accounts for the user
  const accountsSnapshot = await db.collection('users').doc(userId).collection('accounts').get();

  console.log(`Found ${accountsSnapshot.docs.length} accounts for user: ${userId}`);

  for (const accountDoc of accountsSnapshot.docs) {
    const accountId = accountDoc.id;
    const accountName = accountDoc.data().name;

    // 2. Use Firestore aggregation to sum the 'amount' field for this account
    const query = db.collection('users').doc(userId).collection('transactions')
      .where('accountId', '==', accountId);

    const countSnapshot = await query.count().get();
    const sumSnapshot = await query.aggregate({
      totalAmount: admin.firestore.AggregateField.sum('amount')
    }).get();

    const count = countSnapshot.data().count;
    const totalAmount = sumSnapshot.data().totalAmount;

    console.log(`Account: ${accountName} (${accountId})`);
    console.log(`  Transactions: ${count}`);
    console.log(`  Total Amount: $${totalAmount?.toFixed(2) || 0}`);
  }
}

aggregateByAccount().catch(console.error);
