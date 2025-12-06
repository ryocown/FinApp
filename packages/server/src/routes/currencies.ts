import { Router, type Request, type Response } from 'express';
import { db } from '../firebase';

const router = Router();

// Get latest rates for all currencies
router.get('/rates', async (req: Request, res: Response) => {
  try {
    // For now, we only have JPYUSD.
    // In a real app, we'd fetch all unique pairs.
    // Let's just fetch JPYUSD latest rate.

    const pairs = ['JPYUSD'];
    const rates: Record<string, number> = {};
    const today = new Date().toISOString().split('T')[0];

    await Promise.all(pairs.map(async (pairId) => {
      // Try to get today's rate, or fallback to latest
      const pricesRef = db.collection('currencies').doc(pairId).collection('prices');
      const snapshot = await pricesRef
        .orderBy('date', 'desc')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        if (data) {
          rates[pairId] = data.rate;
        }
      }
    }));

    res.json(rates);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

export default router;
