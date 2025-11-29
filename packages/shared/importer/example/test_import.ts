import { CsvStatementImporter, ICsvMapping } from '../csv_importer';
import { Currency } from '../../models/currency';
import * as fs from 'fs';
import * as path from 'path';

async function runTest() {
  const mapping: ICsvMapping = {
    dateColumn: 'Posting Date',
    amountColumn: 'Amount',
    descriptionColumn: 'Description'
  };

  const usd = new Currency('US Dollar', '$', 'USD');
  const importer = new CsvStatementImporter(mapping, usd);

  const csvPath = path.join(__dirname, 'Chase8829_Activity_20251129.CSV');
  const csvData = fs.readFileSync(csvPath, 'utf-8');

  const accountId = 'test-account';
  const statement = await importer.import(csvData, accountId);

  console.log(`Imported ${statement.transactions.length} transactions.`);
  console.log('First Transaction:', statement.transactions[0]);
  console.log('Last Transaction:', statement.transactions[statement.transactions.length - 1]);
}

runTest().catch(console.error);

//npx ts-node --compiler-options '{"module": "commonjs"}' packages/shared/importer/example/test_import.ts