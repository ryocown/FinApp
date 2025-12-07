import { Router, type Request, type Response } from 'express';
import admin from 'firebase-admin';
import { db, getUserRef, getAccountRef, resolveTransactionReferences } from '../firebase';
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
    const transactions = await resolveTransactionReferences(snapshot.docs);

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

// Batch create transactions
router.post('/users/:userId/accounts/:accountId/transactions/batch', async (req: Request, res: Response) => {
  try {
    const { userId, accountId } = req.params;
    const { transactions } = req.body; // Expecting array of transactions

    if (!userId || !accountId || !Array.isArray(transactions)) {
      res.status(400).json({ error: 'Missing required fields or invalid transactions format' });
      return;
    }

    const result = await getAccountRef(userId, accountId);
    if (!result) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }
    const { ref: accountRef } = result;

    const batch = db.batch();
    let minDate: Date | null = null;
    let importedCount = 0;

    for (const txData of transactions) {
      // Basic validation or use schema?
      // For now assume valid or minimal validation
      const txId = txData.transactionId || v4();
      const txDate = new Date(txData.date);

      const tx: ITransaction = {
        ...txData,
        transactionId: txId,
        accountId,
        userId,
        date: txDate
      };

      const nestedRef = accountRef.collection('transactions').doc(txId);
      batch.set(nestedRef, tx);

      const globalRef = getUserRef(userId).collection('transactions').doc(txId);
      batch.set(globalRef, { RefTxId: nestedRef });

      if (!minDate || txDate < minDate) {
        minDate = txDate;
      }
      importedCount++;
    }

    await batch.commit();

    // Trigger Reconciliation Refresh
    if (minDate) {
      // We import ReconciliationService dynamically or at top level if possible
      // But we need to import it. I'll add the import at the top.
      const { ReconciliationService } = await import('../services/reconciliation');
      // Run asynchronously to not block response? Or synchronously?
      // For now synchronously to ensure consistency for the user
      await ReconciliationService.refreshCheckpoints(userId, accountId, minDate);
    }

    res.status(201).json({ importedCount, minDate });
  } catch (error: any) {
    logger.error('Error batch creating transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to batch create transactions' });
  }
});

// Delete a transaction
router.delete('/users/:userId/transactions/:transactionId', async (req: Request, res: Response) => {
  try {
    const { userId, transactionId } = req.params;

    if (!userId || !transactionId) {
      res.status(400).json({ error: 'Missing userId or transactionId' });
      return;
    }

    // 1. Find the global reference to get the nested path
    const globalRef = getUserRef(userId).collection('transactions').doc(transactionId);
    const globalDoc = await globalRef.get();

    if (!globalDoc.exists) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const data = globalDoc.data();
    const nestedRef = data?.RefTxId as admin.firestore.DocumentReference | undefined;

    // 2. Delete nested document if it exists
    if (nestedRef) {
      await nestedRef.delete();
    } else {
      logger.warn(`Global transaction ${transactionId} has no RefTxId`);
    }

    // 3. Delete global reference
    await globalRef.delete();

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    logger.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
