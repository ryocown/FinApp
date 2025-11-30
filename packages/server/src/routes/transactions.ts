import { Router, type Request, type Response } from 'express';
import admin from 'firebase-admin';
import { db } from '../firebase';
import { type ITransaction } from '../../../shared/models/transaction';

import { TransactionSchema } from '../schemas';
import { validate } from '../middleware/validate';

const router = Router();

// Get all transactions (legacy)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;
    let query: admin.firestore.Query = db.collection('transactions');

    if (accountId) {
      query = query.where('accountId', '==', accountId);
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => Object.assign({}, doc.data(), { transactionId: doc.id }));
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transactions for an account
router.get('/users/:userId/accounts/:accountId/transactions', async (req: Request, res: Response) => {
  try {
    const { userId, accountId } = req.params;
    if (!userId || !accountId) {
      res.status(400).json({ error: 'Missing userId or accountId' });
      return;
    }
    const snapshot = await db.collection('users').doc(userId).collection('accounts').doc(accountId).collection('transactions').get();
    const transactions = snapshot.docs.map(doc => Object.assign({}, doc.data(), { transactionId: doc.id }));
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    res.status(500).json({ error: 'Failed to fetch account transactions' });
  }
});

// Create a transaction
router.post('/', validate(TransactionSchema), async (req: Request, res: Response) => {
  try {
    const transaction: ITransaction = req.body;
    const docRef = await db.collection('transactions').add(transaction);
    res.status(201).json(Object.assign({}, transaction, { transactionId: docRef.id }));
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

export default router;
