import { Router, type Request, type Response } from 'express';
import { db, getUserRef } from '../firebase';
import { type IBalanceCheckpoint } from '../../../shared/models/balance_checkpoint';
import { type IAccount } from '../../../shared/models/account';
import { logger } from '../logger';

const router = Router();

// Helper to generate a range of dates
const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  // Normalize to midnight
  currentDate.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// Get net worth history
router.get('/users/:userId/net-worth', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { range = '30d' } = req.query; // 30d, 90d, 1y, all

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    // 1. Fetch all accounts for the user
    const institutesSnapshot = await getUserRef(userId).collection('institutes').get();
    const accountPromises = institutesSnapshot.docs.map(doc => doc.ref.collection('accounts').get());
    const accountsSnapshots = await Promise.all(accountPromises);
    const accountDocs = accountsSnapshots.flatMap(snap => snap.docs);

    if (accountDocs.length === 0) {
      res.json([]);
      return;
    }

    // RE-IMPLEMENTATION OF STEP 2 to include currency
    const accountsWithCurrency = await Promise.all(accountDocs.map(async (doc) => {
      const accountData = doc.data() as IAccount;
      const checkpointsSnap = await doc.ref.collection('balance_checkpoints')
        .orderBy('date', 'asc')
        .get();

      return {
        accountId: doc.id,
        currency: accountData.currency?.code || 'USD',
        checkpoints: checkpointsSnap.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            date: data.date.toDate ? data.date.toDate() : new Date(data.date),
            balance: Number(data.balance)
          } as IBalanceCheckpoint;
        })
      };
    }));

    // 3. Determine Date Range (Moved after fetching accounts to get earliest date)
    const endDate = new Date();
    const startDate = new Date();

    if (range === '30d') startDate.setDate(endDate.getDate() - 30);
    else if (range === '90d') startDate.setDate(endDate.getDate() - 90);
    else if (range === '1y') startDate.setFullYear(endDate.getFullYear() - 1);
    else if (range === 'all') {
      // Find the earliest checkpoint date across all accounts
      let earliestDate = new Date();
      let hasCheckpoints = false;

      for (const account of accountsWithCurrency) {
        const firstCheckpoint = account.checkpoints[0];
        if (firstCheckpoint) {
          const firstCheckpointDate = firstCheckpoint.date;
          if (!hasCheckpoints || firstCheckpointDate < earliestDate) {
            earliestDate = firstCheckpointDate;
            hasCheckpoints = true;
          }
        }
      }

      if (hasCheckpoints) {
        startDate.setTime(earliestDate.getTime());
      } else {
        startDate.setFullYear(2020); // Fallback if no data
      }
    }

    // 3. Fetch FX Rates (if needed)
    // We need rates for any non-USD currency.
    // For now, hardcode JPYUSD fetching. In future, make dynamic based on account currencies.
    const currencyPairs = new Set<string>();
    accountsWithCurrency.forEach(acc => {
      // We need to know the currency of the account. 
      // We didn't fetch it in step 2, but we have it in accountDocs.
      // Let's attach currency to accountsData in step 2 first.
    });

    // Identify needed pairs
    const neededPairs = new Set<string>();
    accountsWithCurrency.forEach(acc => {
      if (acc.currency !== 'USD') {
        // Canonical pair logic: JPY vs USD -> JPYUSD
        const pairId = acc.currency < 'USD' ? `${acc.currency}USD` : `USD${acc.currency}`;
        neededPairs.add(pairId);
      }
    });

    // Fetch rates for needed pairs
    const ratesMap: Record<string, Record<string, number>> = {}; // pairId -> date(YYYY-MM-DD) -> rate

    logger.info(`Fetching rates for range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    await Promise.all(Array.from(neededPairs).map(async (pairId) => {
      const ratesSnap = await db.collection('currencies').doc(pairId).collection('prices')
        .where('date', '>=', startDate.toISOString().split('T')[0])
        .where('date', '<=', endDate.toISOString().split('T')[0])
        .get();

      ratesMap[pairId] = {};
      ratesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (ratesMap[pairId]) {
          ratesMap[pairId]![data.date] = data.rate;
        }
      });
    }));

    // 5. Build Timeline
    const timelineDates = getDatesInRange(startDate, endDate);
    const result = timelineDates.map(date => {
      let totalNetWorth = 0;
      // Use local date string to avoid UTC shift
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      const dateStr = localDate.toISOString().split('T')[0] as string;

      // Compare against end of day to include all transactions from that day
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      for (const account of accountsWithCurrency) {
        let lastCheckpointBalance = 0;
        for (const cp of account.checkpoints) {
          if (cp.date <= endOfDay) {
            lastCheckpointBalance = cp.balance;
          } else {
            break;
          }
        }

        // Convert to USD if needed
        if (account.currency !== 'USD') {
          const pairId = account.currency < 'USD' ? `${account.currency}USD` : `USD${account.currency}`;
          const pairRates = ratesMap[pairId];
          const rate = pairRates?.[dateStr];

          if (rate !== undefined) {
            const converted = lastCheckpointBalance * rate;
            totalNetWorth += converted;
          } else {
            // logger.warn(`Missing rate for ${pairId} on ${dateStr}`);
            totalNetWorth += 0;
          }
        } else {
          totalNetWorth += lastCheckpointBalance;
        }
      }

      return {
        date: dateStr,
        value: totalNetWorth
      };
    });

    res.json(result);

  } catch (error) {
    logger.error('Error calculating net worth:', error);
    res.status(500).json({ error: 'Failed to calculate net worth' });
  }
});

export default router;
