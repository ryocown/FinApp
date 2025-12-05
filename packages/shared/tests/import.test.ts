import { ChaseCreditCsvStatementImporter } from '../importer/institutions/chase';
import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  const accountId = 'test-account';
  const importer = new ChaseCreditCsvStatementImporter(accountId, 'test-user');

  const csvPath = path.join(__dirname, '../lib/data/Chase6459_Activity.CSV');
  const csvData = fs.readFileSync(csvPath, 'utf-8');

  const statement = await importer.import(csvData);

  console.log(`Imported ${statement.transactions.length} transactions.`);
  console.log(statement.transactions);

  // New Data Modeling Example:
  // To save these transactions to the new top-level collection:
  // const userId = 'fake-user-id-657ak5';
  // for (const t of statement.transactions) {
  //   await db.collection('users').doc(userId).collection('transactions').add(t);
  // }
}

runTest().catch(console.error);

// Run with: npx tsx packages/shared/importer/example/test_import.ts