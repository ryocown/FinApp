import { Router, type Request, type Response } from 'express';
import admin from 'firebase-admin';
import { db, getUserRef, getAccountRef } from '../firebase';
import { type IAccount } from '../../../shared/models/account';
import { type IBalanceCheckpoint } from '../../../shared/models/balance_checkpoint';
import { v4 } from 'uuid';

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

    // Accounts are nested under institutes: users/{userId}/institutes/{instituteId}/accounts/{accountId}
    const institutesSnapshot = await getUserRef(userId).collection('institutes').get();

    const accountPromises = institutesSnapshot.docs.map(async instituteDoc => {
      const accountsSnapshot = await instituteDoc.ref.collection('accounts').get();
      return accountsSnapshot.docs.map(doc => Object.assign({}, doc.data(), { accountId: doc.id }));
    });

    const nestedAccounts = await Promise.all(accountPromises);
    const accounts = nestedAccounts.flat();

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
    const docRef = await getUserRef(userId).collection('accounts').add(account);
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
    const snapshot = await getUserRef(userId).collection('budget').get();
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

    // We need to find the instituteId for this account to query the nested collection
    // 1. Get all institutes
    // 1. Find the account and institute
    const result = await getAccountRef(userId, accountId);

    if (!result) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const { ref: accountRef, instituteId } = result;

    let query: admin.firestore.Query = accountRef.collection('transactions');

    // Now we CAN order by date because the real transactions have dates!
    query = query.orderBy('date', 'desc');

    if (pageToken) {
      const lastDoc = await accountRef.collection('transactions').doc(pageToken as string).get();

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

// Reconcile account balance
router.post('/users/:userId/accounts/:accountId/reconcile', async (req: Request, res: Response) => {
  try {
    const { userId, accountId } = req.params;
    const { date, balance } = req.body;

    if (!userId || !accountId || !date || balance === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Find the account
    const result = await getAccountRef(userId, accountId);

    if (!result) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const { ref: accountRef } = result;

    const checkpoint: IBalanceCheckpoint = {
      id: v4(),
      accountId,
      date: new Date(date),
      balance: Number(balance),
      type: 'manual',
      createdAt: new Date()
    };

    // Save checkpoint
    await accountRef.collection('balance_checkpoints').doc(checkpoint.id).set(checkpoint);

    // Update Account if this checkpoint is newer than current balanceDate
    const accountDoc = await accountRef.get();
    const accountData = accountDoc.data() as IAccount;

    // If no existing balanceDate, or new date is >= existing
    const existingDate = accountData.balanceDate ? new Date(accountData.balanceDate) : new Date(0);

    if (checkpoint.date >= existingDate) {
      await accountRef.update({
        balance: checkpoint.balance,
        balanceDate: checkpoint.date
      });
    }

    res.status(201).json(checkpoint);
  } catch (error) {
    console.error('Error reconciling account:', error);
    res.status(500).json({ error: 'Failed to reconcile account' });
  }
});

// Get balance checkpoints for an account
router.get('/users/:userId/accounts/:accountId/checkpoints', async (req: Request, res: Response) => {
  try {
    const { userId, accountId } = req.params;
    if (!userId || !accountId) {
      res.status(400).json({ error: 'Missing userId or accountId' });
      return;
    }

    // Find the account
    const result = await getAccountRef(userId, accountId);

    if (!result) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const { ref: accountRef } = result;

    const snapshot = await accountRef.collection('balance_checkpoints').orderBy('date', 'desc').get();
    const checkpoints = snapshot.docs.map(doc => doc.data());

    res.json(checkpoints);
  } catch (error) {
    console.error('Error fetching checkpoints:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoints' });
  }
});

export default router;
