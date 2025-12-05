import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
if (!admin.apps.length) {
  // Check if we are running in the emulator environment
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('Connecting to Firestore Emulator at', process.env.FIRESTORE_EMULATOR_HOST);
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID as string,
    });
  } else {
    // Fallback to default credentials for production/other environments
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth: admin.auth.Auth = admin.auth();

export const getUserRef = (userId: string) => db.collection('users').doc(userId);

export const getInstituteRef = (userId: string, instituteId: string) =>
  getUserRef(userId).collection('institutes').doc(instituteId);

export const getAccountRef = async (userId: string, accountId: string) => {
  const institutesSnapshot = await getUserRef(userId).collection('institutes').get();

  for (const doc of institutesSnapshot.docs) {
    const ref = doc.ref.collection('accounts').doc(accountId);
    const accountDoc = await ref.get();
    if (accountDoc.exists) {
      return { ref, instituteId: doc.id };
    }
  }
  return null;
};

export const getInstrumentsRef = () => db.collection('instruments');
export const getCategoriesRef = () => db.collection('categories');
