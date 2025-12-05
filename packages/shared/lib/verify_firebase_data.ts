import admin from 'firebase-admin';

import 'dotenv/config';
// Initialize Firebase Admin to connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function verifyData() {
  console.log('Fetching data from Firestore emulator...');
  const usersSnapshot = await db.collection('users').get();

  if (usersSnapshot.empty) {
    console.log('No users found.');
    return;
  }

  for (const userDoc of usersSnapshot.docs) {
    console.log(`\nUser: ${userDoc.id} (${userDoc.data().name})`);
    const accountsSnapshot = await userDoc.ref.collection('accounts').get();

    for (const accountDoc of accountsSnapshot.docs) {
      console.log(`  Account: ${accountDoc.id} (${accountDoc.data().name})`);
    }

    const transactionsSnapshot = await userDoc.ref.collection('transactions').get();
    console.log(`  Total Transactions: ${transactionsSnapshot.size}`);

    transactionsSnapshot.docs.forEach(t => {
      const data = t.data();
      console.log(`    Transaction: ${JSON.stringify(data)}`);
    });
  }
}

verifyData().catch(console.error);
