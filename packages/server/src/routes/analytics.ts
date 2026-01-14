import { Router, type Request, type Response } from 'express';
import { db, getUserRef } from '../firebase.js';
import { type IBalanceCheckpoint, Account } from '@finapp/shared';
import { logger } from '../logger.js';
import { checkAuth, type AuthRequest } from '../middleware/auth.js';

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
router.get('/users/:userId/net-worth', checkAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { range = '30d' } = req.query; // 30d, 90d, 1y, all

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    if (req.user?.uid !== userId) {
      res.status(403).json({ error: 'Forbidden: Access denied' });
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
      const accountData = doc.data() as Account;
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
            date: new Date(data.date.timestamp),
            balance: Number(data.balance)
          };
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
          if (!hasCheckpoints || firstCheckpointDate.getTime() < earliestDate.getTime()) {
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
          // cp.date in account.checkpoints was converted to Date object in step 2 (line 67 update)
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

/**
 * Get Month-over-Month (MoM) metrics
 */
router.get('/users/:userId/mom', checkAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || !req.user || req.user.uid !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Dates
    const now = new Date();
    const currentMonthEnd = new Date(now);

    // Previous Month: Same day last month
    const prevMonthEnd = new Date(now);
    prevMonthEnd.setMonth(now.getMonth() - 1);

    // Normalize to EOD to capture everything up to that second
    // Or exactly 30 days ago? "MoM" usually means "vs Last Month".
    // Let's use exact timestamp comparison or EOD?
    // Using EOD ensures we get the "Status" at end of day.
    // Actually, "Current" is "Right Now".
    // "Previous" is "Right Now - 1 Month" or "EOD Last Month"?
    // User wants "MoM Diff". Usually: (Current Value - Value 1 Month Ago).

    // Helper to calculate Net Worth at a specific point in time
    const calculateNetWorthAt = async (targetDate: Date): Promise<number> => {
      const institutesSnapshot = await getUserRef(userId).collection('institutes').get();
      let total = 0;

      for (const doc of institutesSnapshot.docs) {
        const accountsSnap = await doc.ref.collection('accounts').get();
        for (const accountDoc of accountsSnap.docs) {
          const accountData = accountDoc.data() as Account;

          // Find latest checkpoint BEFORE or ON targetDate
          // We need to fetch checkpoints. 
          // Optimization: Limit 1 orderBy date desc where date <= targetDate
          // Firestore doesn't support inequality on one field and sort on another easily without index?
          // Actually: where('date.timestamp', '<=', timestamp).orderBy('date.timestamp', 'desc').limit(1)
          // This works and is indexed.

          const cpSnap = await accountDoc.ref.collection('balance_checkpoints')
            .where('date.timestamp', '<=', targetDate.getTime())
            .orderBy('date.timestamp', 'desc')
            .limit(1)
            .get();

          let balance = 0;
          const firstDoc = cpSnap.docs[0];
          if (!cpSnap.empty && firstDoc) {
            const data = firstDoc.data();
            balance = Number(data['balance'] || 0);
          }

          // Currency conversion (Mocked JPYUSD for now as per NetWorth route)
          if (accountData.currency?.code && accountData.currency.code !== 'USD') {
            // Fetch rate for targetDate
            // Simplify: assume 1:1 if not found or look up latest price?
            // For now, let's treat non-USD as 0 or 1:1 to prevent crashing if no rate?
            // Or fetch rate.
            // Reusing logic is hard without refactoring.
            // Let's copy simple logic: JPY -> USD approx 0.007 or fetch from DB?
            // Fetching from DB for a single point is fast.
            const pairId = accountData.currency.code < 'USD' ? `${accountData.currency.code}USD` : `USD${accountData.currency.code}`;
            // Fetch latest price before targetDate
            const priceSnap = await db.collection('currencies').doc(pairId).collection('prices')
              .where('date', '<=', targetDate.toISOString().split('T')[0])
              .orderBy('date', 'desc')
              .limit(1)
              .get();

            if (!priceSnap.empty) {
              const firstPriceDoc = priceSnap.docs[0];
              if (firstPriceDoc) {
                const data = firstPriceDoc.data();
                const priceRate = data['rate'] as number | undefined;
                if (priceRate !== undefined) {
                  balance *= priceRate;
                }
              }
            }
          }
          total += balance;
        }
      }
      return total;
    };

    const currentValue = await calculateNetWorthAt(now);
    const prevValue = await calculateNetWorthAt(prevMonthEnd);

    const diff = currentValue - prevValue;
    const percent = prevValue === 0 ? (currentValue === 0 ? 0 : 100) : ((diff / prevValue) * 100);

    res.json({
      current: currentValue,
      previous: prevValue,
      diff,
      percent
    });

  } catch (error) {
    logger.error('Error calculating MoM:', error);
    res.status(500).json({ error: 'Failed to calculate MoM' });
  }
});

export default router;
