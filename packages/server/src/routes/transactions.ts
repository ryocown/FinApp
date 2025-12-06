import { Router, type Request, type Response } from 'express';
import admin from 'firebase-admin';
import { db, getUserRef, getAccountRef } from '../firebase';
import { type ITransaction } from '../../../shared/models/transaction';
import { v4 } from 'uuid';

import { TransactionSchema } from '../schemas';
import { validate } from '../middleware/validate';
import { logger } from '../logger';

const router = Router();

// Get all transactions for a user, optionally filtered by account
router.get('/users/:userId/transactions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { accountId, limit, pageToken } = req.query;

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    let query: admin.firestore.Query;
    let collectionRef: admin.firestore.CollectionReference | undefined;

    // If accountId is provided, we query the specific account's nested collection
    // This allows us to filter and sort by date efficiently
    if (accountId) {
      // 1. Find the institute for this account
      const result = await getAccountRef(userId, accountId as string);

      if (!result) {
        // If account not found, return empty list or 404.
        // Returning empty list is safer for a filter.
        res.json({ transactions: [], nextPageToken: null });
        return;
      }

      const { ref: accountRef } = result;

      collectionRef = accountRef.collection('transactions');

      query = collectionRef;

      // We can sort by date here because it's the real collection
      query = query.orderBy('date', 'desc');

    } else {
      // Global list: query using collection group to allow sorting by date
      // We filter by userId to ensure we only get this user's transactions
      // and exclude the global reference documents (which don't have userId)
      query = db.collectionGroup('transactions')
        .where('userId', '==', userId)
        .orderBy('date', 'desc');
    }

    if (pageToken) {
      // For both nested and global collections, pageToken is the document ID.
      let lastDoc: admin.firestore.DocumentSnapshot | null = null;

      if (collectionRef!) {
        // Account scope: direct lookup
        lastDoc = await collectionRef.doc(pageToken as string).get();
      } else {
        // Global scope: find by transactionId in collection group
        const cursorSnap = await db.collectionGroup('transactions')
          .where('userId', '==', userId)
          .where('transactionId', '==', pageToken)
          .limit(1)
          .get();

        if (!cursorSnap.empty) {
          lastDoc = cursorSnap.docs[0] as admin.firestore.DocumentSnapshot;
        }
      }

      if (lastDoc && lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    if (limit) {
      query = query.limit(Number(limit));
    }

    const snapshot = await query.get();

    // Resolve references
    const transactionPromises = snapshot.docs.map(async doc => {
      const data = doc.data();
      if (data.RefTxId && data.RefTxId instanceof admin.firestore.DocumentReference) {
        const realDoc = await data.RefTxId.get();
        if (realDoc.exists) {
          return Object.assign({}, realDoc.data(), { transactionId: realDoc.id });
        }
      }
      // Fallback if it's not a reference (legacy data?) or reference broken
      return Object.assign({}, data, { transactionId: doc.id });
    });

    const transactions = (await Promise.all(transactionPromises)).filter(t => t !== null);

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    const nextPageToken = lastVisible ? lastVisible.id : null;

    res.json({
      transactions,
      nextPageToken
    });
  } catch (error: any) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// Create a transaction for a user
router.post('/users/:userId/transactions', validate(TransactionSchema), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    const transaction: ITransaction = req.body;

    // 1. Find the institute for this account
    const result = await getAccountRef(userId, transaction.accountId);

    if (!result) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const { ref: accountRef } = result;

    // 2. Create in nested collection
    // Use transactionId if provided, or auto-generate?
    // The model usually generates it. If the client sends it, we use it.
    // If not, we should probably generate it or let Firestore do it (but we prefer deterministic IDs).
    // For now, let's assume client sends it or we let Firestore generate if missing (though model requires it).

    const nestedRef = accountRef.collection('transactions').doc(transaction.transactionId || v4());
    await nestedRef.set(transaction);

    // 3. Create reference in global collection
    const globalRef = getUserRef(userId).collection('transactions').doc(nestedRef.id);
    await globalRef.set({ RefTxId: nestedRef });

    res.status(201).json(Object.assign({}, transaction, { transactionId: nestedRef.id }));
  } catch (error) {
    logger.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

export default router;
