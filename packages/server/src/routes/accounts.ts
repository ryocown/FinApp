import { Router, type Request, type Response } from 'express';
import admin from 'firebase-admin';
import { db, getUserRef, getAccountRef, getAllUserAccounts, getCollectionData, resolveTransactionReferences } from '../firebase';
import { type IAccount } from '../../../shared/models/account';
import { type IBalanceCheckpoint, BalanceCheckpointType } from '../../../shared/models/balance_checkpoint';
import { v4 } from 'uuid';

import { AccountSchema } from '../schemas';
import { validate } from '../middleware/validate';
import { logger } from '../logger';
import { ReconciliationService } from '../services/reconciliation';

const router = Router();

// Get all accounts (legacy)
router.get('/', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('accounts').get();
    const accounts = snapshot.docs.map(doc => Object.assign({}, doc.data(), { accountId: doc.id }));
    res.json(accounts);
  } catch (error) {
    logger.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get accounts for a user
router.get('/users/:userId/accounts', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const accounts = await getAllUserAccounts(userId);

    res.json(accounts);
  } catch (error) {
    logger.error('Error fetching user accounts:', error);
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

    // Extract initial balance/date from body if present, separate from account object
    const { initialBalance, initialDate, ...accountData } = req.body;
    const account: IAccount = accountData;

    logger.info('Creating account:', { body: req.body, account });

    if (!account.instituteId) {
      res.status(400).json({ error: 'Missing instituteId' });
      return;
    }

    // Generate UUID v4 for the account
    const accountId = v4();
    const newAccount: IAccount = {
      ...account,
      accountId
    };

    // Create the account document nested under the institute
    const docRef = getUserRef(userId)
      .collection('institutes')
      .doc(account.instituteId)
      .collection('accounts')
      .doc(accountId);

    await docRef.set(newAccount);

    // Handle initial reconciliation if provided
    if (initialBalance !== undefined && initialDate) {
      const checkpoint: IBalanceCheckpoint = {
        id: v4(),
        accountId,
        date: new Date(initialDate),
        balance: Number(initialBalance),
        type: BalanceCheckpointType.MANUAL,
        createdAt: new Date()
      };

      // Save checkpoint
      await docRef.collection('balance_checkpoints').doc(checkpoint.id).set(checkpoint);

      // Update Account with initial balance
      await docRef.update({
        balance: checkpoint.balance,
        balanceDate: checkpoint.date
      });

      // Update returned account object
      account.balance = checkpoint.balance;
      account.balanceDate = checkpoint.date;
    }

    res.status(201).json(Object.assign({}, account, { accountId }));
  } catch (error) {
    logger.error('Error creating account:', error);
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
    const budget = getCollectionData(snapshot, 'budgetId');
    res.json(budget);
  } catch (error) {
    logger.error('Error fetching budget:', error);
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
    const transactions = await resolveTransactionReferences(snapshot.docs);

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    const nextPageToken = lastVisible ? lastVisible.id : null;

    res.json({
      transactions,
      nextPageToken
    });
  } catch (error) {
    logger.error('Error fetching account transactions:', error);
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

    const checkpoint = await ReconciliationService.reconcileAccount(
      userId,
      accountId,
      new Date(date),
      Number(balance)
    );

    res.status(201).json(checkpoint);
  } catch (error: any) {
    logger.error('Error reconciling account:', error);
    res.status(500).json({ error: error.message || 'Failed to reconcile account' });
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
    let checkpoints = snapshot.docs.map(doc => {
      const data = doc.data();
      // Convert dates
      if (data.date) {
        if (typeof data.date.toDate === 'function') {
          data.date = data.date.toDate().toISOString();
        } else if (typeof data.date === 'object' && '_seconds' in data.date) {
          const seconds = (data.date as any)._seconds;
          const nanoseconds = (data.date as any)._nanoseconds || 0;
          data.date = new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
        }
      }

      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          data.createdAt = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'object' && '_seconds' in data.createdAt) {
          const seconds = (data.createdAt as any)._seconds;
          const nanoseconds = (data.createdAt as any)._nanoseconds || 0;
          data.createdAt = new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
        }
      }
      return data as IBalanceCheckpoint;
    });

    // Validate the last 12 checkpoints
    // We only validate if there are checkpoints
    if (checkpoints.length > 0) {
      // Take the top 12 (most recent)
      const recentCheckpoints = checkpoints.slice(0, 12);
      const olderCheckpoints = checkpoints.slice(12);

      // Validate them
      const validatedRecent = await ReconciliationService.validateCheckpoints(userId, accountId, recentCheckpoints);

      // Merge back
      checkpoints = [...validatedRecent, ...olderCheckpoints];
    }

    res.json(checkpoints);
  } catch (error) {
    logger.error('Error fetching checkpoints:', error);
    res.status(500).json({ error: 'Failed to fetch checkpoints' });
  }
});

// Delete a checkpoint
router.delete('/users/:userId/accounts/:accountId/checkpoints/:checkpointId', async (req: Request, res: Response) => {
  try {
    const { userId, accountId, checkpointId } = req.params;
    if (!userId || !accountId || !checkpointId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    await ReconciliationService.deleteCheckpoint(userId, accountId, checkpointId);

    res.status(200).json({ message: 'Checkpoint deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting checkpoint:', error);
    res.status(500).json({ error: error.message || 'Failed to delete checkpoint' });
  }
});

// Delete an account
router.delete('/users/:userId/accounts/:accountId', async (req: Request, res: Response) => {
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

    // Recursive delete to remove account AND all subcollections (transactions, checkpoints)
    await db.recursiveDelete(accountRef);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
