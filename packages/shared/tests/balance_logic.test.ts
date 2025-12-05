import assert from 'node:assert';

// Mock types
interface Transaction {
  id: string;
  amount: number;
  date: Date;
}

// Logic to test
function calculateRunningBalances(
  anchorBalance: number,
  transactions: Transaction[],
  pageOffset: number
): number[] {
  const startBalance = anchorBalance - pageOffset;

  const balances: number[] = [];
  let currentBalance = startBalance;

  for (const t of transactions) {
    balances.push(currentBalance);
    currentBalance -= t.amount;
  }

  return balances;
}

async function runTests() {
  console.log('Running Balance Calculation Tests...');

  // Test 1
  {
    console.log('Test 1: Single page calculation');
    const anchorBalance = 1000;
    const transactions = [
      { id: '1', amount: -100, date: new Date() }, // Newest
      { id: '2', amount: -50, date: new Date() },
      { id: '3', amount: 200, date: new Date() }   // Oldest
    ];

    const balances = calculateRunningBalances(anchorBalance, transactions, 0);
    assert.deepStrictEqual(balances, [1000, 1100, 1150]);
    console.log('PASS');
  }

  // Test 2
  {
    console.log('Test 2: Second page calculation');
    const anchorBalance = 1000;
    const page1Sum = 50; // -100 - 50 + 200 = 50

    const transactions = [
      { id: '4', amount: -20, date: new Date() },
      { id: '5', amount: -30, date: new Date() }
    ];

    const balances = calculateRunningBalances(anchorBalance, transactions, page1Sum);
    assert.deepStrictEqual(balances, [950, 970]);
    console.log('PASS');
  }
}

runTests().catch(console.error);
