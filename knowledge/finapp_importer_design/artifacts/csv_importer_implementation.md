# CSV Importer Implementation

This document details the implementation of the CSV statement importer, including the flexible base class and bank-specific implementations.

## Directory Structure

- **Base Importer**: `packages/shared/importer/csv_importer.ts`
- **Bank Implementations**: `packages/shared/importer/institutions/<bank_name>.ts` (e.g., `chase.ts`)


## Interface: ICsvMapping

The mapping interface defines how CSV columns map to internal data fields.

```typescript
export interface ICsvMapping {
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  merchantColumn?: string;
  transactionTypeColumn: string;
  categoryColumn?: string;
  dateFormat?: string;
}
```

## Date Parsing & Timezones

**Crucial**: Statement dates (e.g., from Chase or Morgan Stanley CSVs) are typically in **PST/PDT** (bank time), not UTC.
- **Problem**: `new Date('YYYY-MM-DD')` parses as UTC if ISO format, or local time if slash format, leading to inconsistencies.
- **Solution**: Use `parsePSTDateToUTC(dateString)` from `packages/shared/lib/date_utils.ts`.
- **Implementation**:
  ```typescript
  import { parsePSTDateToUTC } from '../../lib/date_utils';
  
  // Inside processTransaction
  const date = parsePSTDateToUTC(record[this.mapping.dateColumn]);
  ```

## Base Class: CsvStatementImporter

The abstract base class handles the common CSV parsing logic and delegates transaction type identification to subclasses.

```typescript
import { type IStatement, Statement } from "../models/statement";
import { type ITransaction, GeneralTransaction, TransactionType, TradeTransaction, TransferTransaction } from "../models/transaction";
import { type ICurrency } from "../models/currency";
import { type IStatementImporter } from "./importer";
import { parse } from 'csv-parse/sync';

export abstract class CsvStatementImporter implements IStatementImporter {
  protected accountId: string;
  protected mapping: ICsvMapping;
  protected currency: ICurrency;
  protected transactionTypeColumn: string;

  constructor(mapping: ICsvMapping, currency: ICurrency, accountId: string) {
    this.accountId = accountId;
    this.mapping = mapping;
    this.currency = currency;
    this.transactionTypeColumn = mapping.transactionTypeColumn;
  }

  async import(source: string): Promise<IStatement> {
    // ... parsing logic ...
    // Calls this.processTransaction(record) for each row
  }

  protected abstract checkTransactionType(record: any): TransactionType;

  protected processTransaction(record: any): ITransaction | null {
    // ... default processing logic ...
    // Uses checkTransactionType to determine type
    // Creates GeneralTransaction or TransferTransaction based on type
    // MUST assign this.accountId to the transaction object (required for top-level transactions collection)
  }
}
}
```

## Implementation: Chase Checking

Handles Chase checking accounts, including Zelle transfers and various transaction codes.

**CSV Format:**
```csv
Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
DEBIT,12/01/2025,"ZELLE PAYMENT TO XXXX 123456789",-16.00,QUICKPAY_DEBIT, ,,
DEBIT,11/28/2025,"INTERNATIONAL INCOMING WIRE FEE",-15.00,FEE_TRANSACTION,51362.79,,
```

```typescript
export class ChaseCsvStatementImporter extends CsvStatementImporter {
  constructor(accountId: string) {
    super({
      dateColumn: 'Posting Date',
      amountColumn: 'Amount',
      descriptionColumn: 'Description',
      merchantColumn: 'Description',
      transactionTypeColumn: 'Type',
    }, {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$'
    }, accountId);
  }

  protected override checkTransactionType(record: any): TransactionType {
    const type = record[this.mapping.transactionTypeColumn];
    if (!type) return TransactionType.General;

    switch (true) {
      case type.includes('ACCT_XFER'):
        return TransactionType.Transfer;
      case type.includes('FEE'):
        return TransactionType.Fees;
      case type.includes('ACH_CREDIT'):
      case type.includes('CHECK_DEPOSIT'):
      case type.includes('MISC_CREDIT'):
      case type.includes('REFUND_TRANSACTION'):
      case type.includes('WIRE_INCOMING'):
      case type.includes('PARTNERFI_TO_CHASE'): // Zelle Incoming
      case type.includes('QUICKPAY_CREDIT'):    // Zelle Incoming
        return TransactionType.Deposit;
      case type.includes('ACH_DEBIT'):
      case type.includes('MISC_DEBIT'):
      case type.includes('CHASE_TO_PARTNERFI'): // Zelle Outgoing
      case type.includes('QUICKPAY_DEBIT'):     // Zelle Outgoing
      case type.includes('DEPOSIT_RETURN'):
        return TransactionType.Withdrawal;
      default:
        return TransactionType.General;
    }
  }
}
```

## Implementation: Chase Credit Card

Handles Chase credit card statements, mapping payments to Transfers and sales to Withdrawals.

**CSV Format:**
```csv
Transaction Date,Post Date,Description,Category,Type,Amount,Memo
11/28/2025,11/28/2025,GO/MASSAGE* GOOGLER SE,Personal,Sale,-17.03,
11/23/2025,11/24/2025,GOOGLE*YOUTUBEPREMIUM,Bills & Utilities,Sale,-14.60,
```

```typescript
export class ChaseCreditCsvStatementImporter extends CsvStatementImporter {
  constructor(accountId: string) {
    super({
      dateColumn: 'Transaction Date',
      amountColumn: 'Amount',
      descriptionColumn: 'Description',
      merchantColumn: 'Description',
      transactionTypeColumn: 'Type',
      categoryColumn: 'Category',
    }, {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$'
    }, accountId);
  }

  protected override checkTransactionType(record: any): TransactionType {
    const type = record[this.mapping.transactionTypeColumn];
    if (!type) return TransactionType.General;

    switch (true) {
      case type.includes('Payment'):
        return TransactionType.Transfer; // Payments to credit card are transfers from checking
      case type.includes('Sale'):
        return TransactionType.Withdrawal; // Sales are withdrawals (spending)
      case type.includes('Fee'):
        return TransactionType.Fees;
      case type.includes('Refund'):
        return TransactionType.Deposit;
      default:
        return TransactionType.General;
    }
  }
  
  // processTransaction is overridden to handle transfers and map categories
}
```

## Implementation: Morgan Stanley

Handles Morgan Stanley brokerage accounts, including Trades, Transfers, and specific CSV formatting quirks.

**CSV Format:**
*   Requires skipping the first 4 lines (headers/metadata) and the last 29 lines (disclaimers/footers).
*   Columns: `Activity Date`, `Amount($)`, `Description`, `Category`, `Quantity`, `Price($)`, `Cusip`.

**Key Features:**
*   **Trade Detection**: Checks for the presence of a `Cusip`. If present, treats as `TransactionType.Trade`.
*   **Instrument Resolution**:
    *   Uses `Cusip` to look up the `Instrument` via the API (`GET /api/instruments?cusip=...`).
    *   If not found, automatically creates a new Instrument (`POST /api/instruments`).
*   **Transaction Types**:
    *   `Investment Income`, `Other Income` -> `Trade`
    *   `Deposits` -> `Deposit`
    *   `Transfers` -> `Transfer`
    *   `Service Charges/Fees` -> `Fees`

```typescript
export class MorganStanleyStatementImporter extends StatementImporter {
  // ... constructor ...

  async import(source: string): Promise<IStatement> {
    // Pre-processing: Remove first 4 lines and last 29 lines
    source = source.split('\n').slice(4).join('\n');
    source = source.split('\n').slice(0, -29).join('\n');
    return super.import(source);
  }

  protected checkTransactionType(record: any): TransactionType {
    if (this.mapping.cusipColumn) return TransactionType.Trade;
    // ... keyword matching logic ...
  }

  // ... processTransaction overrides for TradeTransaction creation ...
}
```

## Testing & Verification

## Testing & Verification

To verify the importer logic and data modeling, use the `import.test.ts` script. This script demonstrates how to instantiate an importer, process a CSV file, and iterate over the resulting transactions.

**Example Usage (`packages/shared/tests/import.test.ts`):**

```typescript
import { ChaseCreditCsvStatementImporter } from '../importer/institutions/chase';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  const accountId = 'test-account';
  // Note: userId is now required in the constructor
  const importer = new ChaseCreditCsvStatementImporter(accountId, 'test-user');

  const csvPath = path.join(__dirname, '../lib/data/Chase6459_Activity.CSV');
  const csvData = fs.readFileSync(csvPath, 'utf-8');

  const statement = await importer.import(csvData);

  console.log(`Imported ${statement.transactions.length} transactions.`);
  console.log(statement.transactions);
}

runTest().catch(console.error);
```

**Running the Test:**
Use `npm test` or run the script directly:
```bash
npx tsx packages/shared/tests/import.test.ts
```
