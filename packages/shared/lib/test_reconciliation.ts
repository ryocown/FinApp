import { v4 } from 'uuid';
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3002/api';
// Use the same IDs as in the previous test script or find new ones
const USER_ID = 'c9ec4d95-e7b9-43f5-9ce8-85dd4c735b6c';
const ACCOUNT_ID = 'a92343ac-b42f-4f22-90c7-91bc71954174';

async function run() {
  try {
    console.log(`Using user: ${USER_ID}`);
    console.log(`Using account: ${ACCOUNT_ID}`);

    // 1. Get current account balance
    const accountRes = await fetch(`${API_BASE_URL}/accounts/users/${USER_ID}/accounts/${ACCOUNT_ID}`);
    if (!accountRes.ok) throw new Error(`Failed to fetch account: ${accountRes.statusText}`);
    const account = await accountRes.json();
    console.log('Current Account Balance:', account.balance);

    // 2. Reconcile with a difference
    // Add $10 to the balance
    const targetBalance = account.balance + 10;
    const date = new Date().toISOString();

    console.log(`Reconciling to target balance: ${targetBalance} at ${date}`);

    const reconcileRes = await fetch(`${API_BASE_URL}/accounts/users/${USER_ID}/accounts/${ACCOUNT_ID}/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        balance: targetBalance
      })
    });

    if (!reconcileRes.ok) {
      const err = await reconcileRes.text();
      throw new Error(`Failed to reconcile: ${err}`);
    }

    const checkpoint = await reconcileRes.json();
    console.log('Reconciliation successful. Checkpoint:', checkpoint);

    // 3. Verify Transaction Existence
    // Fetch transactions for the account
    const txRes = await fetch(`${API_BASE_URL}/accounts/users/${USER_ID}/accounts/${ACCOUNT_ID}/transactions?limit=10`);
    if (!txRes.ok) throw new Error(`Failed to fetch transactions: ${txRes.statusText}`);
    const txData = await txRes.json();

    const transactions = txData.transactions || [];
    const reconTx = transactions.find((t: any) => t.transactionType === 'RECONCILIATION');

    if (reconTx) {
      console.log('SUCCESS: Found Reconciliation Transaction:', reconTx);
      console.log('Amount:', reconTx.amount);
      console.log('Description:', reconTx.description);
    } else {
      console.error('FAILURE: Reconciliation Transaction NOT found in the latest 10 transactions.');
      console.log('Latest transactions:', transactions.map((t: any) => ({
        id: t.transactionId,
        type: t.transactionType,
        amount: t.amount,
        date: t.date
      })));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
