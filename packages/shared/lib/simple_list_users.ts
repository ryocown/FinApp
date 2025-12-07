import admin from 'firebase-admin';

// Initialize Firebase Admin
// Initialize Firebase Admin
if (!admin.apps.length) {
  // Use default credentials (ADC)
  admin.initializeApp();
}

const db = admin.firestore();

async function listUsers() {
  try {
    console.log('Listing users...');
    const usersSnap = await db.collection('users').get();
    if (usersSnap.empty) {
      console.log('No users found.');
      return;
    }

    for (const userDoc of usersSnap.docs) {
      console.log(`User: ${userDoc.id}`);
      const accountsSnap = await db.collection('users').doc(userDoc.id).collection('accounts').get();
      if (accountsSnap.empty) {
        console.log('  No accounts found.');
      } else {
        accountsSnap.forEach(accountDoc => {
          const data = accountDoc.data();
          console.log(`  Account: ${accountDoc.id} (${data.name}) - Balance: ${data.balance}`);
        });
      }
    }
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

listUsers();
