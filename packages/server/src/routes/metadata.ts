import { Router, type Request, type Response } from 'express';
import { db, getCollectionData } from '../firebase.js';
import { logger } from '../logger.js';

const router = Router();

// Get Common Institutes
router.get('/institutes', async (_req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('common_institutes').get();
        const data = getCollectionData(snapshot, 'instituteId');
        res.json(data);
    } catch (error) {
        logger.error('Error fetching common institutes:', error);
        res.status(500).json({ error: 'Failed to fetch institutes' });
    }
});

// Get Known Merchants
router.get('/merchants', async (_req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('common_merchants').get();
        // Custom mapping to handle matcher object if needed, or just return as is
        const data = snapshot.docs.map(doc => doc.data());
        res.json(data);
    } catch (error) {
        logger.error('Error fetching known merchants:', error);
        res.status(500).json({ error: 'Failed to fetch merchants' });
    }
});

// Seed Data (Dev only - strictly speaking should be protected)
import { seedCommonData } from '../scripts/seed_common.js';

router.post('/seed', async (_req: Request, res: Response) => {
    try {
        await seedCommonData();
        res.json({ message: 'Seeding complete' });
    } catch (error) {
        logger.error('Error seeding data:', error);
        res.status(500).json({ error: 'Seeding failed' });
    }
});

export default router;
