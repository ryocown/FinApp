import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

import path from 'path';
import dotenv from 'dotenv';
import { type TransactionProto, toDateProto } from '@finapp/shared';
import { type Account } from '@finapp/shared';

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

export const db = getFirestore(admin.app(), 'finapp-data');
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
    return accountsSnapshot.docs.map(doc => {
      const data = doc.data();
      // Date conversion logic
      if (data.balanceDate) {
        if (typeof data.balanceDate === 'string' || typeof data.balanceDate === 'number') {
          data.balanceDate = toDateProto(new Date(data.balanceDate));
        } else if (typeof data.balanceDate === 'object') {
          if ('_seconds' in data.balanceDate) {
            const seconds = (data.balanceDate as any)._seconds;
            const nanoseconds = (data.balanceDate as any)._nanoseconds || 0;
            data.balanceDate = toDateProto(new Date(seconds * 1000 + nanoseconds / 1000000));
          } else if (!('timestamp' in data.balanceDate)) {
            // Try toDate or generic date object?
            // If it's a Firestore Timestamp, it has toDate()
            if (typeof data.balanceDate.toDate === 'function') {
              data.balanceDate = toDateProto(data.balanceDate.toDate());
            }
          }
        }
      } else {
        // Default if missing?
        data.balanceDate = toDateProto(new Date());
      }

      // Interest effectiveDate
      if (data.interest && Array.isArray(data.interest)) {
        data.interest = data.interest.map((i: any) => {
          if (i.effectiveDate) {
            if (typeof i.effectiveDate === 'object' && '_seconds' in i.effectiveDate) {
              const seconds = (i.effectiveDate as any)._seconds;
              const nanoseconds = (i.effectiveDate as any)._nanoseconds || 0;
              i.effectiveDate = toDateProto(new Date(seconds * 1000 + nanoseconds / 1000000));
            } else if (typeof i.effectiveDate.toDate === 'function') {
              i.effectiveDate = toDateProto(i.effectiveDate.toDate());
            } else if (typeof i.effectiveDate === 'string' || typeof i.effectiveDate === 'number') {
              i.effectiveDate = toDateProto(new Date(i.effectiveDate));
            }
          }
          return i;
        });
      }

      return Object.assign({}, data, {
        accountId: doc.id,
        instituteId: instituteDoc.id
      }) as Account;
    });
  });

  const nestedAccounts = await Promise.all(accountPromises);
  return nestedAccounts.flat();
};

export const resolveTransactionReferences = async (docs: admin.firestore.QueryDocumentSnapshot[]): Promise<TransactionProto[]> => {
  const transactionPromises = docs.map(async doc => {
    const data = doc.data();
    let txData: any = null;

    if (data.RefTxId && data.RefTxId instanceof admin.firestore.DocumentReference) {
      try {
        const realDoc = await data.RefTxId.get();
        if (realDoc.exists) {
          txData = Object.assign({}, realDoc.data(), { transactionId: realDoc.id });
        } else {
          // Reference exists but document is missing (dangling pointer)
          console.warn(`Found dangling transaction reference: ${doc.id} -> ${data.RefTxId.path}`);
          return null;
        }
      } catch (err) {
        console.error(`Failed to resolve transaction reference for ${doc.id}:`, err);
        return null;
      }
    } else {
      // Fallback if it's not a reference (legacy data?) or reference broken
      txData = Object.assign({}, data, { transactionId: doc.id });
    }

    if (!txData) return null;

    // Convert date to DateProto if it isn't already (backwards compatibility or if stored as Timestamp)
    if (txData.date) {
      // Check if it's already a DateProto (has timestamp number property)
      if (typeof txData.date === 'object' && 'timestamp' in txData.date && typeof txData.date.timestamp === 'number') {
        // Assume it's already DateProto, do nothing or validate
      } else {
        // Convert from Timestamp or ISO string
        let jsDate: Date;
        if (typeof txData.date.toDate === 'function') {
          jsDate = txData.date.toDate();
        } else if (typeof txData.date === 'object' && '_seconds' in txData.date) {
          const seconds = (txData.date as any)._seconds;
          const nanoseconds = (txData.date as any)._nanoseconds || 0;
          jsDate = new Date(seconds * 1000 + nanoseconds / 1000000);
        } else {
          // string or number
          jsDate = new Date(txData.date);
        }
        txData.date = toDateProto(jsDate);
      }
    }

    return txData as TransactionProto;
  });

  const results = await Promise.all(transactionPromises);
  // Filter out nulls (broken references)
  return results.filter((t): t is TransactionProto => t !== null);
};
