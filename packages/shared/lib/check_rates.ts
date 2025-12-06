import { db } from '../../server/src/firebase';

async function checkRates() {
  console.log(`FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log('Checking rates for JPYUSD...');

  console.log(db.databaseId);

  const pricesRef = db.collection('currencies').doc('JPYUSD').collection('prices');

  const doc = await pricesRef.doc('2025-12-01').get();
  if (doc.exists) {
    console.log('Found 2025-12-01:', doc.data());
  } else {
    console.log('2025-12-01 NOT FOUND');
  }

  const snapshot = await pricesRef.where('date', '>=', '2025-11-01').limit(5).get();
  console.log(`Query >= 2025-11-01 found ${snapshot.size} docs`);
  snapshot.docs.forEach(d => console.log(d.id));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkRates().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
