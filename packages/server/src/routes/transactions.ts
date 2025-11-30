import { Router, type Request, type Response } from 'express';
import admin from 'firebase-admin';
import { db } from '../firebase';
import { type ITransaction } from '../../../shared/models/transaction';

import { TransactionSchema } from '../schemas';
import { validate } from '../middleware/validate';

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

    let query: admin.firestore.Query = db.collection('users').doc(userId).collection('transactions');

    if (accountId) {
      query = query.where('accountId', '==', accountId);
    }

    // Always order by date for consistent pagination
    query = query.orderBy('date', 'desc');

    if (pageToken) {
      const lastDoc = await db.collection('users').doc(userId).collection('transactions').doc(pageToken as string).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    if (limit) {
      query = query.limit(Number(limit));
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => Object.assign({}, doc.data(), { transactionId: doc.id }));

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    const nextPageToken = lastVisible ? lastVisible.id : null;

    res.json({
      transactions,
      nextPageToken
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
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
    const docRef = await db.collection('users').doc(userId).collection('transactions').add(transaction);
    res.status(201).json(Object.assign({}, transaction, { transactionId: docRef.id }));
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

export default router;
