import admin from 'firebase-admin';

// Force remote connection
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'hirico-internal-project-1'
  });
}

const db = admin.firestore();
const USER_ID = 'c9ec4d95-e7b9-43f5-9ce8-85dd4c735b6c';

async function checkAccountLocations() {
  console.log(`Checking accounts for user: ${USER_ID}`);

  // 1. Check direct accounts (Old Structure?)
  console.log('\n--- Checking users/{userId}/accounts ---');
  const directAccounts = await db.collection('users').doc(USER_ID).collection('accounts').get();
  if (directAccounts.empty) {
    console.log('No accounts found directly under user.');
  } else {
    console.log(`Found ${directAccounts.size} accounts:`);
    directAccounts.forEach(doc => {
      console.log(`- [${doc.id}] ${doc.data().name} (Balance: ${doc.data().balance})`);
    });
  }

  // 2. Check nested accounts (New Structure)
  console.log('\n--- Checking users/{userId}/institutes/{instituteId}/accounts ---');
  const institutes = await db.collection('users').doc(USER_ID).collection('institutes').get();
  if (institutes.empty) {
    console.log('No institutes found.');
  } else {
    console.log(`Found ${institutes.size} institutes.`);
    for (const instDoc of institutes.docs) {
      console.log(`Institute: [${instDoc.id}] ${instDoc.data().name}`);
      const nestedAccounts = await instDoc.ref.collection('accounts').get();
      if (nestedAccounts.empty) {
        console.log('  No accounts found in this institute.');
      } else {
        nestedAccounts.forEach(doc => {
          console.log(`  - [${doc.id}] ${doc.data().name} (Balance: ${doc.data().balance})`);
        });
      }
    }
  }
}

checkAccountLocations();
