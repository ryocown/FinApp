import admin from 'firebase-admin';

// Force remote connection BEFORE importing firebase module
delete process.env.FIRESTORE_EMULATOR_HOST;

// Initialize admin if not already (though firebase.ts will do it)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'hirico-internal-project-1'
  });
}

// Import Service (dynamic import to ensure env vars are set first)
const { ReconciliationService } = await import('../../server/src/services/reconciliation');
const { getAccountRef } = await import('../../server/src/firebase');

const USER_ID = 'c9ec4d95-e7b9-43f5-9ce8-85dd4c735b6c';
// Use the direct account we found
const ACCOUNT_ID = '503adfc3-9754-42d4-82ef-8842912e1efb';

async function runDirectTest() {
  try {
    console.log(`Testing ReconciliationService directly for account ${ACCOUNT_ID}...`);

    // 1. Verify Account Access
    const accountRef = await getAccountRef(USER_ID, ACCOUNT_ID);
    if (!accountRef) {
      console.error('ERROR: getAccountRef returned null! The service cannot find the account.');
      return;
    }
    console.log('Account found via getAccountRef.');
    const accountData = (await accountRef.ref.get()).data();
    console.log('Current Balance:', accountData?.balance);

    // 2. Reconcile
    const targetBalance = (accountData?.balance || 0) + 15.50;
    console.log(`Reconciling to target: ${targetBalance}`);

    await ReconciliationService.reconcileAccount(USER_ID, ACCOUNT_ID, new Date(), targetBalance);
    console.log('ReconciliationService.reconcileAccount completed.');

    // 3. Verify Transaction
    const txSnap = await accountRef.ref.collection('transactions')
      .where('transactionType', '==', 'RECONCILIATION')
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (txSnap.empty) {
      console.error('FAILURE: No RECONCILIATION transaction found after service call.');
    } else {
      const tx = txSnap.docs[0].data();
      console.log('SUCCESS: Reconciliation Transaction Created!');
      console.log(`- ID: ${tx.transactionId}`);
      console.log(`- Amount: ${tx.amount}`);
      console.log(`- Description: ${tx.description}`);
    }

  } catch (error) {
    console.error('Error in direct test:', error);
  }
}

runDirectTest();
