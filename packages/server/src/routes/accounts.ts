import { Router, type Request, type Response } from 'express';
import admin from 'firebase-admin';
import { db } from '../firebase';
import { type IAccount } from '../../../shared/models/account';

import { AccountSchema } from '../schemas';
import { validate } from '../middleware/validate';

const router = Router();

// Get all accounts (legacy)
router.get('/', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('accounts').get();
    const accounts = snapshot.docs.map(doc => Object.assign({}, doc.data(), { accountId: doc.id }));
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get accounts for a user
router.get('/users/:userId/accounts', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const snapshot = await db.collection('users').doc(userId).collection('accounts').get();
    const accounts = snapshot.docs.map(doc => Object.assign({}, doc.data(), { accountId: doc.id }));
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching user accounts:', error);
    res.status(500).json({ error: 'Failed to fetch user accounts' });
  }
});

// Create an account for a user
router.post('/users/:userId/accounts', validate(AccountSchema), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    const account: IAccount = req.body;
    const docRef = await db.collection('users').doc(userId).collection('accounts').add(account);
    res.status(201).json(Object.assign({}, account, { accountId: docRef.id }));
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Get budget for a user
router.get('/users/:userId/budget', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }
    const snapshot = await db.collection('users').doc(userId).collection('budget').get();
    const budget = snapshot.docs.map(doc => Object.assign({}, doc.data(), { budgetId: doc.id }));
    res.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// Get transactions for a specific account
router.get('/users/:userId/accounts/:accountId/transactions', async (req: Request, res: Response) => {
  try {
    const { userId, accountId } = req.params;
    const { limit, pageToken } = req.query;

    if (!userId || !accountId) {
      res.status(400).json({ error: 'Missing userId or accountId' });
      return;
    }

    let query: admin.firestore.Query = db.collection('users').doc(userId).collection('transactions')
      .where('accountId', '==', accountId)
      .orderBy('date', 'desc');

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
    console.error('Error fetching account transactions:', error);
    res.status(500).json({ error: 'Failed to fetch account transactions' });
  }
});

export default router;
