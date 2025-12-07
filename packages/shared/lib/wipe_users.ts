import admin from 'firebase-admin';

// Force remote connection
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'hirico-internal-project-1'
  });
}

const db = admin.firestore();

async function deleteCollection(collectionPath: string, batchSize: number = 500) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db: admin.firestore.Firestore, query: admin.firestore.Query, resolve: (value?: unknown) => void) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function wipeUsers() {
  console.log('Starting wipe of users collection...');

  // 1. List all users to delete their subcollections first (if needed, though recursive delete is hard in client SDKs, Admin SDK has recursive delete but it's often safer to just delete the top level if we don't care about orphaned subcollections, BUT Firestore subcollections are NOT deleted when parent is deleted).
  // We MUST delete subcollections explicitly or use a recursive delete tool.
  // Admin SDK has `firestore.recursiveDelete(ref)`.

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
