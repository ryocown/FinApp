import { v4 } from 'uuid';
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';
// IDs extracted from server logs
const USER_ID = 'c9ec4d95-e7b9-43f5-9ce8-85dd4c735b6c';
const ACCOUNT_ID = '209a3397-3b3e-4559-95cb-424b04beb06b';

async function run() {
  try {
    const userId = USER_ID;
    console.log(`Using user: ${userId}`);

    const accountId = ACCOUNT_ID;
    console.log(`Using account: ${accountId}`);

    // 3. Create a transaction
    const txData = {
      transactionId: v4(),
      accountId,
      date: new Date().toISOString(),
      amount: -10.50,
      currency: { code: 'USD', symbol: '$' },
      description: 'Test Delete Transaction',
      category: 'Test',
      type: 'EXPENSE',
      status: 'POSTED',
      userId
    };

    console.log('Creating transaction via API...');
    const createRes = await fetch(`${API_BASE_URL}/transactions/users/${userId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData)
    });

    if (!createRes.ok) {
      console.error('Failed to create transaction:', await createRes.text());
      return;
    }
    const createdTx = await createRes.json();
    console.log(`Transaction created: ${createdTx.transactionId}`);

    // 4. Verify it exists
    console.log('Verifying existence via Account API...');
    const accountGetRes = await fetch(`${API_BASE_URL}/accounts/users/${userId}/accounts/${accountId}/transactions?limit=10`);
    if (!accountGetRes.ok) {
      console.error('Failed to fetch account transactions:', await accountGetRes.text());
      return;
    }
    const accountData = await accountGetRes.json();
    const accountFound = accountData.transactions?.find((t: any) => t.transactionId === createdTx.transactionId);

    if (accountFound) {
      console.log('Transaction found in Account API.');
    } else {
      console.error('Transaction NOT found in Account API.');
      console.log('Account transactions:', accountData.transactions?.map((t: any) => ({ id: t.transactionId, date: t.date })));
      return;
    }

    console.log('Verifying existence via Global API...');
    const getRes = await fetch(`${API_BASE_URL}/transactions/users/${userId}/transactions?limit=10`);
    if (!getRes.ok) {
      console.error('Failed to fetch transactions:', await getRes.text());
      return;
    }
    const getData = await getRes.json();
    if (!getData.transactions) {
      console.error('No transactions array in response:', getData);
      return;
    }
    const found = getData.transactions.find((t: any) => t.transactionId === createdTx.transactionId);
    if (!found) {
      console.warn('Transaction not found in Global API (might be index lag)');
      // We can proceed if it's found in account API, as we know it exists.
      // But we want to verify delete works for both.
    } else {
      console.log('Transaction found in Global API.');
    }

    // 5. Delete it
    console.log('Deleting transaction via API...');
    const deleteRes = await fetch(`${API_BASE_URL}/transactions/users/${userId}/transactions/${createdTx.transactionId}`, {
      method: 'DELETE'
    });

    if (!deleteRes.ok) {
      console.error('Failed to delete transaction:', await deleteRes.text());
      return;
    }
    console.log('Transaction deleted.');

    // 6. Verify it is gone
    console.log('Verifying deletion via API...');
    // We can try to fetch it directly if we had a direct endpoint, or search for it.
    // Since we don't have a direct GET /tx/:id endpoint exposed easily without account context in some paths,
    // let's try the list again.
    const checkRes = await fetch(`${API_BASE_URL}/transactions/users/${userId}/transactions?limit=10`);
    const checkData = await checkRes.json();
    const foundAfter = checkData.transactions ? checkData.transactions.find((t: any) => t.transactionId === createdTx.transactionId) : null;

    if (foundAfter) {
      console.error('Transaction still exists after deletion!');
    } else {
      console.log('Transaction successfully gone.');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

run();
