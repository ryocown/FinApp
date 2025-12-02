import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ChaseCsvStatementImporter, ChaseCreditCsvStatementImporter } from '../institutions/chase';
import dotenv from 'dotenv';
import { User } from '../../models/user';
import { Account, SubType } from '../../models/account';
import { Currency } from '../../models/currency';
import { type IStatementImporter } from '../importer';
import { Firestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Firebase Admin to connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function importAccount(
  db: Firestore,
  userId: string,
  account: Account,
  importer: new (accountId: string, userId: string) => IStatementImporter,
  csvFileName: string
) {
  const accountId = account.accountId;
  console.log(`Processing account ${account.name} (${accountId})...`);

  // 1. Create account document
  await db.collection('users').doc(userId)
    .collection('accounts').doc(accountId)
    .set(JSON.parse(JSON.stringify(account)));

  // 2. Import transactions from CSV
  const importerInstance = new importer(accountId, userId);
  const csvPath = path.join(__dirname, csvFileName);
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const statement = await importerInstance.import(csvData);

  console.log(`Importing ${statement.transactions.length} transactions for ${account.name}...`);
  const batch = db.batch();
  let delta = 0;
  statement.transactions.forEach(t => {
    delta += t.amount;
    const ref = db.collection('users').doc(userId)
      .collection('accounts').doc(accountId)
      .collection('transactions').doc(t.transactionId);
    batch.set(ref, JSON.parse(JSON.stringify(t)));
  });
  await batch.commit();

  // 3. Update account balance
  const accountData = (await db.collection('users').doc(userId)
    .collection('accounts').doc(accountId)
    .get()).data();

  if (accountData) {
    const currentAccount = Account.fromJSON(accountData);
    const newBalance = currentAccount.balance + delta;

    console.log(`  Current balance: ${currentAccount.balance}`);
    console.log(`  Delta: ${delta}`);
    console.log(`  New balance: ${newBalance}`);

    await db.collection('users').doc(userId)
      .collection('accounts').doc(accountId)
      .update({ balance: newBalance });
  } else {
    console.error(`Could not find account data for ${accountId}`);
  }

  console.log(`Account ${account.name} processed successfully.`);
}


async function importToFirebase() {
  // 1. Create User
  const user = new User('fake@example.com', 'Fake User');
  const userId = user.userId;
  await db.collection('users').doc(userId).set(JSON.parse(JSON.stringify(user)));
  console.log(`Created user ${user.name} (${userId})`);

  // 2. Define Accounts and Currency
  const usd = new Currency('US Dollar', '$', 'USD');
  const account6459 = new Account('6459', 1000, 'US', usd, 'Chase Credit 6459', SubType.CreditCard, false, userId);
  const account8829 = new Account('8829', 5000, 'US', usd, 'Chase Checking 8829', SubType.Checking, false, userId);

  // 3. Import data for each account
  await importAccount(db, userId, account6459, ChaseCreditCsvStatementImporter, 'Chase6459_Activity.CSV');
  await importAccount(db, userId, account8829, ChaseCsvStatementImporter, 'Chase8829_Activity.CSV');

  console.log('\nImport complete!');
}

importToFirebase().catch(console.error);
