import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ChaseCsvStatementImporter, ChaseCreditCsvStatementImporter } from '../importer/institutions/chase';
import dotenv from 'dotenv';
import { User } from '../models/user';
import { Account, SubType } from '../models/account';
import { Currency } from '../models/currency';
import { type IStatementImporter } from "../importer/importer";
import { Firestore } from 'firebase-admin/firestore';
import { MorganStanleyStatementImporter } from '../importer/institutions/morgan_stanley';
import { fromExcelToCsv } from './from_excel_to_csv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Firebase Admin to connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

// base file path
const dataDir = path.join(__dirname, 'data');

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
  const csvPath = path.join(dataDir, csvFileName);
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
  console.log(`  Delta: ${delta}`);

  await db.collection('users').doc(userId)
    .collection('accounts').doc(accountId)
    .update({
      balance: admin.firestore.FieldValue.increment(delta)
    });

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
  const chase6459 = new Account('6459', 1000, 'US', usd, 'Chase Credit 6459', SubType.CreditCard, false, userId);
  const chase8829 = new Account('8829', 5000, 'US', usd, 'Chase Checking 8829', SubType.Checking, false, userId);
  const morgan3747 = new Account('3747', 0, 'US', usd, 'Morgan Stanley 3747', SubType.BrokerageAccount, false, userId);
  const morgan3797 = new Account('3797', 0, 'US', usd, 'Morgan Stanley 3797', SubType.BrokerageAccount, false, userId);
  const morgan5008 = new Account('5008', 0, 'US', usd, 'Morgan Stanley 5008', SubType.BrokerageAccount, false, userId);
  const morgan6259 = new Account('6259', 0, 'US', usd, 'Morgan Stanley 6259', SubType.BrokerageAccount, false, userId);


  // 3. Import data for each account
  await importAccount(db, userId, chase6459, ChaseCreditCsvStatementImporter, 'Chase6459_Activity.CSV');
  await importAccount(db, userId, chase8829, ChaseCsvStatementImporter, 'Chase8829_Activity.CSV');
  await importAccount(db, userId, morgan3747, MorganStanleyStatementImporter, '3747.csv');
  await importAccount(db, userId, morgan3797, MorganStanleyStatementImporter, '3797.csv');
  await importAccount(db, userId, morgan5008, MorganStanleyStatementImporter, '5008.csv');
  await importAccount(db, userId, morgan6259, MorganStanleyStatementImporter, '6259.csv');

  console.log('\nImport complete!');
}

function convertMorganExcelToCsv() {
  const ms5008 = fs.readFileSync(path.join(dataDir, '5008.xlsx'));
  const ms3747 = fs.readFileSync(path.join(dataDir, '3747.xlsx'));
  const ms3797 = fs.readFileSync(path.join(dataDir, '3797.xlsx'));
  const ms6259 = fs.readFileSync(path.join(dataDir, '6259.xlsx'));

  const ms5008Csv = fromExcelToCsv(ms5008)[0];
  const ms3747Csv = fromExcelToCsv(ms3747)[0];
  const ms3797Csv = fromExcelToCsv(ms3797)[0];
  const ms6259Csv = fromExcelToCsv(ms6259)[0];

  // write to files
  fs.writeFileSync(path.join(dataDir, '5008.csv'), ms5008Csv);
  fs.writeFileSync(path.join(dataDir, '3747.csv'), ms3747Csv);
  fs.writeFileSync(path.join(dataDir, '3797.csv'), ms3797Csv);
  fs.writeFileSync(path.join(dataDir, '6259.csv'), ms6259Csv);
}

async function main() {
  // convertMorganExcelToCsv();
  await importToFirebase();
}

main().catch(console.error);
