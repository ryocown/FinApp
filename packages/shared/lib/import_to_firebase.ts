import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { v4 } from 'uuid';
import { fileURLToPath } from 'url';
import { ChaseCsvStatementImporter, ChaseCreditCsvStatementImporter } from '../importer/institutions/chase';
import dotenv from 'dotenv';
import { User } from '../models/user';
import { Account, AccountType, type IAccount } from '../models/account';
import { Currency } from '../models/currency';
import { Institute } from '../models/institute';
import { type IStatementImporter } from "../importer/importer";
import { type IBalanceCheckpoint, BalanceCheckpointType } from '../models/balance_checkpoint';
import { Firestore, DocumentReference } from 'firebase-admin/firestore';
import { MorganStanleyStatementImporter } from '../importer/institutions/morgan_stanley';
import { fromExcelToCsv } from './from_excel_to_csv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USER_ID = "c9ec4d95-e7b9-43f5-9ce8-85dd4c735b6c";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Initialize Firebase Admin to connect to emulator
delete process.env.FIRESTORE_EMULATOR_HOST;
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'hirico-internal-project-1',
  });
}

// base file path
const dataDir = path.join(__dirname, 'data');

const db = admin.firestore();

async function processTransactionsBatch(
  db: Firestore,
  userId: string,
  accountRef: DocumentReference,
  transactions: any[]
): Promise<number> {
  const BATCH_SIZE = 400;
  let totalDuplicates = 0;
  let totalImported = 0;
  let totalAmount = 0;

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const chunk = transactions.slice(i, i + BATCH_SIZE);

    // Deduplicate within the chunk first
    const uniqueChunkMap = new Map();
    chunk.forEach(t => {
      if (!uniqueChunkMap.has(t.transactionId)) {
        uniqueChunkMap.set(t.transactionId, t);
      } else {
        // Count as duplicate if it's already in the batch
        totalDuplicates++;
      }
    });
    const uniqueChunk = Array.from(uniqueChunkMap.values());

    if (uniqueChunk.length === 0) continue;

    // Check for duplicates in Firestore
    const refs = uniqueChunk.map(t => accountRef.collection('transactions').doc(t.transactionId));

    // db.getAll() supports reading multiple documents efficiently
    const snapshots = await db.getAll(...refs);

    const newTransactions: any[] = [];
    let duplicatesInBatch = 0;

    snapshots.forEach((snap, index) => {
      if (snap.exists) {
        duplicatesInBatch++;
      } else {
        newTransactions.push(uniqueChunk[index]);
      }
    });

    totalDuplicates += duplicatesInBatch;

    if (newTransactions.length > 0) {
      const batch = db.batch();

      for (const t of newTransactions) {
        const deepRef = accountRef.collection('transactions').doc(t.transactionId);
        // Use create() to ensure we don't overwrite if it somehow appeared since the check
        batch.create(deepRef, JSON.parse(JSON.stringify(t)));

        const refDocRef = db.collection('users').doc(userId).collection('transactions').doc(t.transactionId);
        // We use set() for the reference to ensure it exists/updates, 
        // though typically if deepRef didn't exist, this shouldn't either.
        batch.set(refDocRef, { RefTxId: deepRef });

        totalAmount += t.amount;
      }
      await batch.commit();
      totalImported += newTransactions.length;
    }
  }

  if (totalDuplicates > 0) {
    console.log(`    Skipped ${totalDuplicates} duplicate transactions.`);
  }
  console.log(`    Imported ${totalImported} new transactions.`);

  return totalAmount;
}

async function importAccountWithBatch(
  db: Firestore,
  userId: string,
  instituteId: string,
  account: IAccount,
  importerCtor: new (accountId: string, userId: string) => IStatementImporter,
  csvFileName: string,
  forcedEndingBalance?: number
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
  if (forcedEndingBalance !== undefined) {
    statement.endingBalance = forcedEndingBalance;
  }

  console.log(`    Importing ${statement.transactions.length} transactions...`);

  // We don't calculate delta here anymore, we get it from what was actually inserted
  const insertedAmount = await processTransactionsBatch(db, userId, accountRef, statement.transactions);

  // 3. Update account balance using Checkpoint if available
  if (statement.endingBalance !== undefined) {
    const checkpoint: IBalanceCheckpoint = {
      id: v4(),
      accountId: accountId,
      date: statement.endDate,
      balance: statement.endingBalance,
      type: BalanceCheckpointType.STATEMENT,
      createdAt: new Date()
    };

    // Save checkpoint
    await accountRef.collection('balance_checkpoints').doc(checkpoint.id).set(checkpoint);
    console.log(`    Created balance checkpoint: ${checkpoint.balance} at ${checkpoint.date.toISOString()}`);

    // Update Account if this checkpoint is newer
    // For simplicity in this script, we assume the imported statement is the "latest" we want to sync to
    // or we check against current balanceDate.
    // Since we are overwriting/seeding, we can just update.
    await accountRef.update({
      balance: statement.endingBalance,
      balanceDate: statement.endDate
    });
  } else {
    // Fallback or just log
    console.log(`    No ending balance in statement. Account balance not updated (Legacy delta: ${insertedAmount})`);
    // Optional: Keep legacy delta if needed, but User wants Anchor approach.
    // if (insertedAmount !== 0) {
    //   await accountRef.update({
    //     balance: admin.firestore.FieldValue.increment(insertedAmount)
    //   });
    // }
  }

  console.log(`  Account ${account.name} processed successfully.`);
}

async function importToFirebase() {
  // 1. Create User
  const user = new User('fake@example.com', 'Fake User');
  user.userId = USER_ID;
  await db.collection('users').doc(USER_ID).set(JSON.parse(JSON.stringify(user)));
  console.log(`Created user ${user.name} (${USER_ID})`);

  // 2. Define Accounts and Currency
  const usd = new Currency('US Dollar', '$', 'USD');

  // Chase Accounts
  const chase6459 = new Account('6459', 1000, 'US', usd, 'Chase Credit 6459', AccountType.CREDIT_CARD, false, USER_ID);
  const chase8829 = new Account('8829', 5000, 'US', usd, 'Chase Checking 8829', AccountType.BANK, false, USER_ID); // Assuming Checking is BANK or similar
  // Note: AccountType.CHECKING might not exist, using BANK or checking enum if available.
  // Checked AccountType: BANK, CREDIT_CARD, INVESTMENT, etc.
  // Checked AccountTag: CHECKING, SAVINGS.
  // Account model takes AccountType.

  // Morgan Stanley Accounts
  const morgan3747 = new Account('3747', 0, 'US', usd, 'Morgan Stanley 3747', AccountType.INVESTMENT, true, USER_ID);
  const morgan3797 = new Account('3797', 0, 'US', usd, 'Morgan Stanley 3797', AccountType.INVESTMENT, true, USER_ID);
  const morgan5008 = new Account('5008', 0, 'US', usd, 'Morgan Stanley 5008', AccountType.INVESTMENT, true, USER_ID);
  const morgan6259 = new Account('6259', 0, 'US', usd, 'Morgan Stanley 6259', AccountType.INVESTMENT, true, USER_ID);

  // 3. Define Institutes
  const chaseInstitute = new Institute('Chase', USER_ID, [chase6459, chase8829]);
  const morganInstitute = new Institute('Morgan Stanley', USER_ID, [morgan3747, morgan3797, morgan5008, morgan6259]);

  const institutes = [chaseInstitute, morganInstitute];

  // 4. Import Data
  for (const institute of institutes) {
    const instituteId = institute.instituteId;
    console.log(`Processing institute ${institute.name} (${instituteId})...`);

    // Create Institute Doc
    // Strip accounts from the doc to avoid duplication/bloat, or keep them if desired. 
    // The user model has accounts: IAccount[]. 
    // I'll save the institute metadata.
    const { accounts, ...instituteData } = institute;
    await db.collection('users').doc(USER_ID)
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

      if (account === morgan3747) {
        importer = MorganStanleyStatementImporter;
        csvFile = '3747.csv';
      }

      if (account === morgan3797) {
        importer = MorganStanleyStatementImporter;
        csvFile = '3797.csv';
      }

      if (account === morgan5008) {
        importer = MorganStanleyStatementImporter;
        csvFile = '5008.csv';
      }

      if (account === morgan6259) {
        importer = MorganStanleyStatementImporter;
        csvFile = '6259.csv';
      }

      if (importer && csvFile) {
        let forcedBalance: number | undefined;
        if (account === chase8829) forcedBalance = 5000;
        if (account === chase6459) forcedBalance = -1000;
        await importAccountWithBatch(db, USER_ID, instituteId, account, importer, csvFile, forcedBalance);
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
  convertMorganExcelToCsv();
  await importToFirebase();
}

main().catch(console.error);
