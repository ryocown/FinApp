import { Router, type Request, type Response } from 'express';
import { db, getUserRef } from '../firebase';
import { type IInstitute } from '../../../shared/models/institute';

import { InstituteSchema } from '../schemas';
import { validate } from '../middleware/validate';
import { logger } from '../logger';

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
    logger.error('Error fetching institutes:', error);
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
    logger.error('Error creating institute:', error);
    res.status(500).json({ error: 'Failed to create institute' });
  }
});

// Delete an institute
router.delete('/users/:userId/institutes/:instituteId', async (req: Request, res: Response) => {
  try {
    const { userId, instituteId } = req.params;
    if (!userId || !instituteId) {
      res.status(400).json({ error: 'Missing userId or instituteId' });
      return;
    }

    // Ensure userId matches (optional security check, but good practice)
    // In a real app we'd check if the institute belongs to the user first,
    // but for now we trust the path or just delete if it exists.
    const docRef = getUserRef(userId).collection('institutes').doc(instituteId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Institute not found' });
      return;
    }

    // Recursive delete to remove institute AND all subcollections (accounts, transactions, etc.)
    await db.recursiveDelete(docRef);

    res.status(200).json({ message: 'Institute deleted successfully' });
  } catch (error) {
    logger.error('Error deleting institute:', error);
    res.status(500).json({ error: 'Failed to delete institute' });
  }
});

export default router;
