import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
import { type ITransaction } from '../../shared/models/transaction';
import { type Account } from '../../shared/models/account';

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
  // 1. Check direct accounts (users/{userId}/accounts/{accountId})
  const directRef = getUserRef(userId).collection('accounts').doc(accountId);
  const directDoc = await directRef.get();
  if (directDoc.exists) {
    return { ref: directRef, instituteId: undefined };
  }

  // 2. Check nested accounts (users/{userId}/institutes/{instituteId}/accounts/{accountId})
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

export const getCollectionData = <T>(snapshot: admin.firestore.QuerySnapshot, idField: string = 'id'): T[] => {
  return snapshot.docs.map(doc => Object.assign({}, doc.data(), { [idField]: doc.id }) as T);
};

export const getAllUserAccounts = async (userId: string): Promise<Account[]> => {
  const institutesSnapshot = await getUserRef(userId).collection('institutes').get();

  const accountPromises = institutesSnapshot.docs.map(async instituteDoc => {
    const accountsSnapshot = await instituteDoc.ref.collection('accounts').get();
    return accountsSnapshot.docs.map(doc => Object.assign({}, doc.data(), {
      accountId: doc.id,
      instituteId: instituteDoc.id
    }) as Account);
  });

  const nestedAccounts = await Promise.all(accountPromises);
  return nestedAccounts.flat();
};

export const resolveTransactionReferences = async (docs: admin.firestore.QueryDocumentSnapshot[]): Promise<ITransaction[]> => {
  const transactionPromises = docs.map(async doc => {
    const data = doc.data();
    let txData = data;

    if (data.RefTxId && data.RefTxId instanceof admin.firestore.DocumentReference) {
      const realDoc = await data.RefTxId.get();
      if (realDoc.exists) {
        txData = Object.assign({}, realDoc.data(), { transactionId: realDoc.id });
      }
    } else {
      // Fallback if it's not a reference (legacy data?) or reference broken
      txData = Object.assign({}, data, { transactionId: doc.id });
    }

    // Convert Firestore Timestamp to ISO string for date
    // Convert Firestore Timestamp to ISO string for date
    if (txData.date) {
      if (typeof txData.date.toDate === 'function') {
        txData.date = txData.date.toDate().toISOString();
      } else if (typeof txData.date === 'object' && '_seconds' in txData.date) {
        // Handle raw object if somehow not an instance
        const seconds = (txData.date as any)._seconds;
        const nanoseconds = (txData.date as any)._nanoseconds || 0;
        txData.date = new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
      }
    }

    return txData as ITransaction;
  });

  const transactions = (await Promise.all(transactionPromises)).filter(t => t !== null);
  return transactions;
};
