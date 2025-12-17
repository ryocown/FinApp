# Statement Importer Architecture

The Statement Importer system is designed to ingest financial statements from various external formats (CSV, PDF, etc.) and transform them into the application's standardized `IStatement` domain model.

## Core Interface

The system relies on a unified interface to ensure consistency across different import strategies.

### `IStatementImporter`

Located in: `packages/shared/importer/importer.ts`

```typescript
import { type IStatement } from "../models/statement";

export interface IStatementImporter {
  /**
   * Imports a statement from a given source.
   * @param source - The raw input data (e.g., file buffer, string content).
   * @param accountId - The ID of the account this statement belongs to.
   * @returns A Promise resolving to a standardized IStatement object.
   */
  import(source: any, accountId: string): Promise<IStatement>;
}
```

## Design Principles

1.  **Abstraction**: The application core interacts only with `IStatementImporter`, remaining agnostic to the underlying file format.
2.  **Strategy Pattern**: Specific classes (e.g., `CsvStatementImporter`, `PdfStatementImporter`) implement the interface to handle format-specific parsing logic.
3.  **Normalization**: The primary responsibility of an importer is to map external fields (which vary by bank) to the internal `ITransaction` and `IStatement` structures.

## Implementation Strategy

### CSV Importer
- **Input**: CSV file content.
- **Configuration**: Likely requires a mapping configuration to define which CSV columns correspond to `date`, `amount`, `description`, etc.
- **Process**: Parse CSV -> Map rows to `ITransaction` -> Aggregate into `IStatement`.

### PDF Importer (Future)
- **Input**: PDF file.
- **Process**: Text extraction/OCR -> Pattern matching -> Transaction extraction.

### Date Parsing & Timezones
**Requirement**: All transactions must be stored in **UTC** in the database.
-   **Input**: Statements usually provide local dates (e.g., "2023-12-25" for a transaction in New York).
-   **Parsing**: Importers must parse these strings into `Date` objects that represent that specific calendar day in UTC, or at least ensure the stored timestamp is consistent.
-   **Best Practice**: Use the shared helper `parsePSTDateToUTC` (from `packages/shared/lib/date_utils.ts`) for US-based statements.
    *   *Input*: "2023-12-25" (implied PST)
    *   *Output*: `2023-12-25T08:00:00.000Z` (UTC)
    *   *Why*: Ensures that when displayed in the UI (converted back to local time), it falls on the correct day.


## Duplicate Handling

To prevent duplicate entries when importing overlapping statements, the system employs a **Deterministic ID + Check-before-Insert** strategy.

1.  **Deterministic IDs**: Transactions are assigned UUID v5 IDs based on their content (date, amount, description, etc.) at instantiation time. See [Transaction Model](../finapp_domain_models/artifacts/transaction_model.md) for details.
2.  **In-Batch Deduplication**:
    -   The importer must deduplicate transactions *within the batch* before processing.
    -   If a source file contains the same transaction twice (e.g., duplicate rows in CSV), they will generate the same ID. Attempting to write the same ID twice in a single Firestore batch causes an error (`INVALID_ARGUMENT: Cannot insert then insert an entity in the same request`).
    -   **Strategy**: Use a `Map` keyed by `transactionId` to filter the batch down to unique transactions first.
3.  **Batch Verification**:
    -   Before inserting a batch of unique transactions, the importer queries Firestore using `db.getAll(...refs)` to check if any IDs already exist.
    -   Existing transactions are **skipped** (not overwritten) to preserve any manual edits (like categories or tags).
    -   Only new transactions are inserted.
4.  **Concurrency Safety**: New transactions are inserted using `batch.create()`, which ensures the operation fails if a document with the same ID was created between the check and the write (though the primary defense is the pre-check).
5.  **Reporting**: The importer reports the count of "Skipped Duplicates" and "Imported New" transactions to the user.
6.  **Balance Consistency (Anchor & Backdate)**:
    *   **Preferred**: If the statement contains a "Ledger Balance" or "Ending Balance", the importer creates a `IBalanceCheckpoint` (Anchor) with type `BalanceCheckpointType.STATEMENT` and updates `Account.balance` if the checkpoint is newer than the current `Account.balanceDate`.
    *   **Fallback**: If no absolute balance is available, the system falls back to updating the balance by the sum of *newly inserted* transactions (Delta).
    *   **History**: Historical balances are calculated by backdating from the current Anchor. See [Balance Calculation Strategy](../finapp_domain_models/artifacts/balance_calculation_strategy.md).

## Post-Import Reconciliation

To maintain balance consistency when inserting past transactions into already-reconciled periods, the importer triggers a **Batch Reconciliation Refresh**.

-   **Trigger**: After a batch import completes.
-   **Action**: The system identifies the earliest date of inserted transactions (`minDate`) and refreshes all `BalanceCheckpoints` after that date.
-   **Result**: "Adjustment" transactions (`TransactionType.RECONCILIATION`) are automatically recalculated to ensure the reconciled balance remains accurate despite the new history. See [Reconciliation Service Design](../finapp_server_architecture/artifacts/reconciliation_service_design.md).
