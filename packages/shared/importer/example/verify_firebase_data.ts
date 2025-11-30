import admin from 'firebase-admin';

// Initialize Firebase Admin to connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({
  projectId: 'default', // Use a demo project ID for emulator
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
      const transactionsSnapshot = await accountDoc.ref.collection('transactions').get();
      console.log(`    Transactions: ${transactionsSnapshot.size}`);

      transactionsSnapshot.docs.forEach(t => {
        const data = t.data();
        console.log(data);
      });
    }
  }
}

verifyData().catch(console.error);
