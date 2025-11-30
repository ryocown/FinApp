import { ChaseCreditCsvStatementImporter } from '../institutions/chase';
import * as fs from 'fs';
import * as path from 'path';

async function runTest() {
  const accountId = 'test-account';
  const importer = new ChaseCreditCsvStatementImporter(accountId);

  const csvPath = path.join(__dirname, 'Chase6459_Activity20251130.CSV');
  const csvData = fs.readFileSync(csvPath, 'utf-8');

  const statement = await importer.import(csvData);

  console.log(`Imported ${statement.transactions.length} transactions.`);
  console.log(statement.transactions);
}

runTest().catch(console.error);

//npx ts-node --compiler-options '{"module": "commonjs"}' packages/shared/importer/example/test_import.ts