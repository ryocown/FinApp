import admin from 'firebase-admin';
import { v4 } from 'uuid';

// Force remote connection by unsetting emulator host
delete process.env.FIRESTORE_EMULATOR_HOST;

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'hirico-internal-project-1'
  });
}

const db = admin.firestore();
const USER_ID = 'c9ec4d95-e7b9-43f5-9ce8-85dd4c735b6c';

async function createAccount() {
  try {
    const instituteId = v4();
    const accountId = v4();

    // Create Institute
    const institute = {
      instituteId,
      name: 'Test Bank',
      userId: USER_ID
    };

    console.log(`Creating institute ${instituteId}...`);
    await db.collection('users').doc(USER_ID).collection('institutes').doc(instituteId).set(institute);

    // Create Account under Institute
    const account = {
      accountId,
      name: 'Test Checking Account',
      type: 'CHECKING',
      balance: 1000,
      balanceDate: new Date(),
      currency: 'USD',
      userId: USER_ID,
      instituteId
    };

    console.log(`Creating account ${accountId} for user ${USER_ID} under institute ${instituteId}...`);
    await db.collection('users').doc(USER_ID).collection('institutes').doc(instituteId).collection('accounts').doc(accountId).set(account);
    console.log('Account created successfully.');
    console.log(`ACCOUNT_ID=${accountId}`);
  } catch (error) {
    console.error('Error creating account:', error);
  }
}

createAccount();
