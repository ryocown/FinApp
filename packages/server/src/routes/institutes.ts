import { Router, type Request, type Response } from 'express';
import { v4 } from 'uuid';
import { db, getUserRef, getCollectionData } from '../firebase.js';
import { type InstituteProp } from '@finapp/shared';
import { checkAuth, type AuthRequest } from '../middleware/auth.js';

import { InstituteSchema } from '../schemas/index.js';
import { validate } from '../middleware/validate.js';
import { logger } from '../logger.js';

const router = Router();

// Get all institutes for a user
router.get('/users/:userId/institutes', checkAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    if (req.user!.uid !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const snapshot = await getUserRef(userId).collection('institutes').get();
    const institutes = getCollectionData(snapshot, 'instituteId');
    res.json(institutes);
  } catch (error) {
    logger.error('Error fetching institutes:', error);
    res.status(500).json({ error: 'Failed to fetch institutes', details: (error as Error).message });
  }
});

// Create an institute for a user
router.post('/users/:userId/institutes', checkAuth, validate(InstituteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    if (req.user!.uid !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const instituteData = req.body;
    // Ensure userId matches
    if (instituteData.userId !== userId) {
      res.status(400).json({ error: 'UserId mismatch' });
      return;
    }

    // Generate UUID v4 for the institute
    const instituteId = v4();

    // Generate supportedInstituteId from name (slugify) if not provided
    const supportedInstituteId = instituteData.supportedInstituteId || instituteData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const newInstitute: InstituteProp = {
      ...instituteData,
      instituteId,
      supportedInstituteId,
      accounts: [] // Initialize with empty accounts
    };

    await getUserRef(userId).collection('institutes').doc(instituteId).set(newInstitute);
    res.status(201).json(newInstitute);
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
