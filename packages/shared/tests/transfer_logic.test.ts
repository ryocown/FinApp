import { Currency } from '../models/currency';
import { TransferTransaction } from '../models/transaction';

function testTransferLogic() {
  console.log('Testing TransferTransaction logic...');

  const usd = new Currency('US Dollar', '$', 'USD');
  const aud = new Currency('Australian Dollar', 'A$', 'AUD');

  const sourceAccountId = 'acc_usd';
  const destAccountId = 'acc_aud';
  const userId = 'user_123';
  const date = new Date();

  // Scenario: Transfer 100 USD to AUD, getting 150 AUD (Rate 1.5)
  const [sourceTx, destTx] = TransferTransaction.createTransferPair(
    sourceAccountId,
    destAccountId,
    userId,
    -100,
    usd,
    150,
    aud,
    date,
    'Transfer to AUD'
  );

  console.log('Source Transaction:');
  console.log(`  ID: ${sourceTx.transactionId}`);
  console.log(`  Amount: ${sourceTx.amount} ${sourceTx.currency.code}`);
  console.log(`  Linked ID: ${sourceTx.linkedTransactionId}`);
  console.log(`  Exchange Rate: ${sourceTx.exchangeRate}`);

  console.log('Destination Transaction:');
  console.log(`  ID: ${destTx.transactionId}`);
  console.log(`  Amount: ${destTx.amount} ${destTx.currency.code}`);
  console.log(`  Linked ID: ${destTx.linkedTransactionId}`);
  console.log(`  Exchange Rate: ${destTx.exchangeRate}`);

  // Assertions
  if (sourceTx.linkedTransactionId !== destTx.transactionId) {
    console.error('FAIL: Source linked ID does not match Dest ID');
  } else {
    console.log('PASS: Source linked ID matches Dest ID');
  }

  if (destTx.linkedTransactionId !== sourceTx.transactionId) {
    console.error('FAIL: Dest linked ID does not match Source ID');
  } else {
    console.log('PASS: Dest linked ID matches Source ID');
  }

  if (sourceTx.exchangeRate !== 1.5) {
    console.error(`FAIL: Expected rate 1.5, got ${sourceTx.exchangeRate}`);
  } else {
    console.log('PASS: Exchange rate calculated correctly');
  }

  // JSON Serialization Test
  const json = JSON.parse(JSON.stringify(sourceTx));
  const rehydrated = TransferTransaction.fromJSON(json);

  if (rehydrated.linkedTransactionId !== sourceTx.linkedTransactionId) {
    console.error('FAIL: JSON serialization lost linkedTransactionId');
  } else {
    console.log('PASS: JSON serialization preserved linkedTransactionId');
  }
}

testTransferLogic();
