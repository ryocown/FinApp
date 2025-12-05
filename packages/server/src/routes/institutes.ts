import { Router, type Request, type Response } from 'express';
import { db, getUserRef } from '../firebase';
import { type IInstitute } from '../../../shared/models/institute';

import { InstituteSchema } from '../schemas';
import { validate } from '../middleware/validate';

const router = Router();

// Get all institutes for a user
router.get('/users/:userId/institutes', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    const snapshot = await getUserRef(userId).collection('institutes').get();
    const institutes = snapshot.docs.map(doc => Object.assign({}, doc.data(), { instituteId: doc.id }));
    res.json(institutes);
  } catch (error) {
    console.error('Error fetching institutes:', error);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
});

// Create an institute for a user
router.post('/users/:userId/institutes', validate(InstituteSchema), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    const institute: IInstitute = req.body;
    // Ensure userId matches
    if (institute.userId !== userId) {
      res.status(400).json({ error: 'UserId mismatch' });
      return;
    }

    const docRef = await getUserRef(userId).collection('institutes').add(institute);
    res.status(201).json(Object.assign({}, institute, { instituteId: docRef.id }));
  } catch (error) {
    console.error('Error creating institute:', error);
    res.status(500).json({ error: 'Failed to create institute' });
  }
});

export default router;
