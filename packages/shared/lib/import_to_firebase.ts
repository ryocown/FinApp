import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ChaseCsvStatementImporter, ChaseCreditCsvStatementImporter } from '../importer/institutions/chase';
import dotenv from 'dotenv';
import { User } from '../models/user';
import { Account, AccountType, type IAccount } from '../models/account';
import { Currency } from '../models/currency';
import { Institute } from '../models/institute';
import { type IStatementImporter } from "../importer/importer";
import { Firestore, DocumentReference } from 'firebase-admin/firestore';
import { MorganStanleyStatementImporter } from '../importer/institutions/morgan_stanley';
import { fromExcelToCsv } from './from_excel_to_csv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Firebase Admin to connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
  });
}

// base file path
const dataDir = path.join(__dirname, 'data');

const db = admin.firestore();

async function processTransactionsBatch(
  db: Firestore,
  userId: string,
  instituteId: string,
  accountRef: DocumentReference,
  transactions: any[]
) {
  const BATCH_SIZE = 400;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const chunk = transactions.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const t of chunk) {
      const deepRef = accountRef.collection('transactions').doc(t.transactionId);
      batch.set(deepRef, JSON.parse(JSON.stringify(t)));

      const refDocRef = db.collection('users').doc(userId).collection('transactions').doc(t.transactionId);
      batch.set(refDocRef, { RefTxId: deepRef });
    }
    await batch.commit();
  }
}

async function importAccountWithBatch(
  db: Firestore,
  userId: string,
  instituteId: string,
  account: IAccount,
  importerCtor: new (accountId: string, userId: string) => IStatementImporter,
  csvFileName: string
) {
  const accountId = account.accountId;
  console.log(`  Processing account ${account.name} (${accountId})...`);

  const accountRef = db.collection('users').doc(userId)
    .collection('institutes').doc(instituteId)
    .collection('accounts').doc(accountId);

  await accountRef.set(JSON.parse(JSON.stringify(account)));

  const importerInstance = new importerCtor(accountId, userId);
  const csvPath = path.join(dataDir, csvFileName);

  console.log(`    CSV file path: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.warn(`    CSV file not found: ${csvFileName}. Skipping transactions.`);
    return;
  }

  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const statement = await importerInstance.import(csvData);

  console.log(`    Importing ${statement.transactions.length} transactions...`);

  let delta = 0;
  statement.transactions.forEach(t => delta += t.amount);

  await processTransactionsBatch(db, userId, instituteId, accountRef, statement.transactions);

  // 3. Update account balance
  console.log(`    Delta: ${delta}`);
  await accountRef.update({
    balance: admin.firestore.FieldValue.increment(delta)
  });

  console.log(`  Account ${account.name} processed successfully.`);
}

async function importToFirebase() {
  // 1. Create User
  const user = new User('fake@example.com', 'Fake User');
  const userId = user.userId;
  await db.collection('users').doc(userId).set(JSON.parse(JSON.stringify(user)));
  console.log(`Created user ${user.name} (${userId})`);

  // 2. Define Accounts and Currency
  const usd = new Currency('US Dollar', '$', 'USD');

  // Chase Accounts
  const chase6459 = new Account('6459', 1000, 'US', usd, 'Chase Credit 6459', AccountType.CREDIT_CARD, false, userId);
  const chase8829 = new Account('8829', 5000, 'US', usd, 'Chase Checking 8829', AccountType.BANK, false, userId); // Assuming Checking is BANK or similar
  // Note: AccountType.CHECKING might not exist, using BANK or checking enum if available.
  // Checked AccountType: BANK, CREDIT_CARD, INVESTMENT, etc.
  // Checked AccountTag: CHECKING, SAVINGS.
  // Account model takes AccountType.

  // Morgan Stanley Accounts
  const morgan3747 = new Account('3747', 0, 'US', usd, 'Morgan Stanley 3747', AccountType.INVESTMENT, true, userId);
  const morgan3797 = new Account('3797', 0, 'US', usd, 'Morgan Stanley 3797', AccountType.INVESTMENT, true, userId);
  const morgan5008 = new Account('5008', 0, 'US', usd, 'Morgan Stanley 5008', AccountType.INVESTMENT, true, userId);
  const morgan6259 = new Account('6259', 0, 'US', usd, 'Morgan Stanley 6259', AccountType.INVESTMENT, true, userId);

  // 3. Define Institutes
  const chaseInstitute = new Institute('Chase', userId, [chase6459, chase8829]);
  const morganInstitute = new Institute('Morgan Stanley', userId, [morgan3747, morgan3797, morgan5008, morgan6259]);

  const institutes = [chaseInstitute, morganInstitute];

  // 4. Import Data
  for (const institute of institutes) {
    const instituteId = institute.name.replace(/\s+/g, '').toLowerCase();
    console.log(`Processing institute ${institute.name} (${instituteId})...`);

    // Create Institute Doc
    // Strip accounts from the doc to avoid duplication/bloat, or keep them if desired. 
    // The user model has accounts: IAccount[]. 
    // I'll save the institute metadata.
    const { accounts, ...instituteData } = institute;
    await db.collection('users').doc(userId)
      .collection('institutes').doc(instituteId)
      .set(instituteData);

    for (const account of institute.accounts) {
      let importer: any = null;
      let csvFile = '';

      // Determine importer and file
      if (account === chase6459) {
        importer = ChaseCreditCsvStatementImporter;
        csvFile = 'Chase6459_Activity.CSV';
      }

      if (account === chase8829) {
        importer = ChaseCsvStatementImporter;
        csvFile = 'Chase8829_Activity.CSV';
      }

      // if (account === morgan3747) {
      //   importer = MorganStanleyStatementImporter;
      //   csvFile = '3747.csv';
      // } 

      // if (account === morgan3797) {
      //   importer = MorganStanleyStatementImporter;
      //   csvFile = '3797.csv';
      // } 

      // if (account === morgan5008) {
      //   importer = MorganStanleyStatementImporter;
      //   csvFile = '5008.csv';
      // } 

      // if (account === morgan6259) {
      //   importer = MorganStanleyStatementImporter;
      //   csvFile = '6259.csv';
      // }

      if (importer && csvFile) {
        await importAccountWithBatch(db, userId, instituteId, account, importer, csvFile);
      }
    }
  }

  console.log('\nImport complete!');
}

function convertMorganExcelToCsv() {
  try {
    const files = ['5008', '3747', '3797', '6259'];
    for (const f of files) {
      const xlsxPath = path.join(dataDir, `${f}.xlsx`);
      if (fs.existsSync(xlsxPath)) {
        const buffer = fs.readFileSync(xlsxPath);
        const csv = fromExcelToCsv(buffer)[0];
        fs.writeFileSync(path.join(dataDir, `${f}.csv`), csv);
        console.log(`Converted ${f}.xlsx to CSV`);
      }
    }
  } catch (e) {
    console.warn("Excel conversion failed or skipped:", e);
  }
}

async function main() {
  // convertMorganExcelToCsv();
  await importToFirebase();
}

main().catch(console.error);
