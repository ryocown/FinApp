import { Router, type Request, type Response } from 'express';
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

// Create an account
router.post('/', validate(AccountSchema), async (req: Request, res: Response) => {
  try {
    const account: IAccount = req.body;
    const docRef = await db.collection('accounts').add(account);
    res.status(201).json(Object.assign({}, account, { accountId: docRef.id }));
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

export default router;
