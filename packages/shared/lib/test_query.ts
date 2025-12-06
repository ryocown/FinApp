import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'hirico-internal-project-1',
  });
}

const db = admin.firestore();

async function testQuery() {
  const userId = 'c9ec4d95-e7b9-43f5-9ce8-85dd4c735b6c';
  console.log(`Testing query for userId: ${userId}`);

  try {
    const snapshot = await db.collectionGroup('transactions')
      .where('userId', '==', userId)
      // .orderBy('date', 'desc')
      .limit(5)
      .get();

    console.log(`Query successful! Found ${snapshot.size} documents.`);
    snapshot.forEach(doc => {
      console.log(doc.id, doc.data().date.toDate());
    });
  } catch (error) {
    console.error('Query failed:', error);
  }
}

testQuery().catch(console.error);
