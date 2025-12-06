import { db } from '../../server/src/firebase';
import { CurrencyPair } from '../models/currency';

async function seedCurrency() {
  console.log('Seeding currency data...');

  // 1. Define JPY/USD rates (approximate historical data)
  // JPYUSD means Base=JPY, Quote=USD.
  // 1 JPY = ~0.0067 USD
  // We want to store daily prices for the last year.

  const pairId = 'JPYUSD'; // J < U, so JPYUSD is canonical
  const collectionRef = db.collection('currencies').doc(pairId).collection('prices');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);

  const currentDate = new Date(startDate);

  // Base rate around 0.0067 with some random fluctuation
  let currentRate = 0.0067;

  const batchSize = 400;
  let batch = db.batch();
  let count = 0;

  while (currentDate <= endDate) {
    // Random walk
    const change = (Math.random() - 0.5) * 0.0001;
    currentRate += change;

    // Ensure it stays within reasonable bounds (0.0060 - 0.0075)
    if (currentRate < 0.0060) currentRate = 0.0060;
    if (currentRate > 0.0075) currentRate = 0.0075;

    const dateStr = currentDate.toISOString().split('T')[0];
    const docRef = collectionRef.doc(dateStr);

    batch.set(docRef, {
      date: dateStr,
      rate: currentRate,
      base: 'JPY',
      quote: 'USD'
    });

    count++;
    if (count >= batchSize) {
      await batch.commit();
      batch = db.batch();
      count = 0;
      console.log(`Committed batch up to ${dateStr}`);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log('Currency seeding completed.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCurrency().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
