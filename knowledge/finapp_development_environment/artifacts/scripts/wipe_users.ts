import admin from 'firebase-admin';

// Force remote connection
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'hirico-internal-project-1'
  });
}

const db = admin.firestore();

async function wipeUsers() {
  console.log('Starting wipe of users collection...');

  const usersRef = db.collection('users');
  const usersSnap = await usersRef.get();

  if (usersSnap.empty) {
    console.log('No users found.');
    return;
  }

  console.log(`Found ${usersSnap.size} users. Deleting recursively...`);

  for (const userDoc of usersSnap.docs) {
    console.log(`Deleting user ${userDoc.id}...`);
    await db.recursiveDelete(userDoc.ref);
  }

  console.log('Wipe complete.');
}

wipeUsers();
