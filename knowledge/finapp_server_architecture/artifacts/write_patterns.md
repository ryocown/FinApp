# Firestore Write Patterns

## Explicit ID Generation

### The Pattern
For core domain entities (`Institute`, `Account`, `Transaction`), the application requires specific ID formats (UUID v4 for random, UUID v5 for deterministic).

**Rule**: Never use Firestore's auto-generated IDs (`collection.add()`) for these entities. Always generate the ID explicitly and use `doc(id).set()`.

### Why?
1.  **Consistency**: Models define IDs as UUIDs. Firestore IDs are alphanumeric strings that do not match this format.
2.  **Determinism**: Some entities (Transactions) require deterministic IDs (UUID v5) to prevent duplicates during import.
3.  **Client-Side Generation**: In some flows, IDs might be generated client-side (optimistic updates) or need to be known before the write completes.

### Implementation Example

**❌ Incorrect (Auto-ID)**:
```typescript
// Generates a random Firestore ID (e.g., "7f8a9d...")
const docRef = await collection.add(data); 
// Result: doc.id !== data.instituteId (if data had one)
```

**✅ Correct (Explicit ID)**:
```typescript
import { v4 } from 'uuid';

const id = v4(); // Or v5()
const data = { ...input, id };

// Uses the explicit UUID as the document key
await collection.doc(id).set(data);
```

### Affected Entities
- **Institutes**: `instituteId` (UUID v4)
- **Accounts**: `accountId` (UUID v4)
- **Transactions**: `transactionId` (UUID v5 usually, or v4 for manual)
- **Users**: `userId` (UUID v4 - usually from Auth, but stored as such)

## Transaction Update Pattern

### The Challenge
Transactions are stored in a nested collection (`accounts/{accountId}/transactions/{transactionId}`) but are often accessed via a global pointer (`users/{userId}/transactions/{transactionId}`). Updates must resolve this pointer and ensure data integrity.

### The Pattern
1.  **Resolve Reference**: Fetch the global document to get the `RefTxId` (pointer to the nested document).
2.  **Verify Existence**: Ensure both the global pointer and the nested document exist.
3.  **Strip Immutable Fields**: Prevent corruption by removing fields that define the transaction's identity or location.
    - `transactionId`, `userId`, `accountId`, `currency`, `tagIds`
4.  **Update Nested Document**: Apply changes *only* to the nested document. The global pointer does not need updating unless indexed fields change (currently none).
5.  **Trigger Side Effects**:
    - **Reconciliation**: If `amount` or `date` changes, trigger `ReconciliationService.refreshCheckpoints` for the affected account, using the *earlier* of the old or new date to ensure history is corrected.

### Implementation Example
```typescript
// 1. Resolve & Verify
const globalDoc = await globalRef.get();
const nestedRef = globalDoc.data()?.RefTxId;

// 2. Strip Immutable
delete updates.transactionId;
delete updates.accountId;
// ...

// 3. Update
await nestedRef.update(updates);

// 4. Side Effects
if (updates.amount !== undefined || updates.date !== undefined) {
    await ReconciliationService.refreshCheckpoints(userId, accountId, minDate);
}
```

## Batch Transaction Creation

### The Pattern
When importing transactions, we often need to insert many records at once while avoiding duplicates.

### Strategy
1.  **Atomic Batch**: Use `db.batch()` to ensure all-or-nothing success for the chunk (e.g., 200 items).
2.  **Duplicate Detection (Optional)**:
    -   If `skipDuplicates` is enabled, query Firestore for existing IDs *before* adding to the batch.
    -   Use `db.getAll(...refs)` for efficient bulk retrieval.
    -   Filter out existing IDs and only insert new ones.
3.  **Dual Writes**: For each new transaction, write to:
    -   Nested Collection: `accounts/{accountId}/transactions/{txId}` (Full Data)
    -   Global Collection: `users/{userId}/transactions/{txId}` (Pointer `{ RefTxId: ... }`)
4.  **Reconciliation**: Track the `minDate` of all inserted transactions and trigger a *single* reconciliation refresh after the batch commits.
5.  **Statistics**: Return `importedCount` and `duplicateCount` to the client for feedback.

### Implementation Example
```typescript
// 1. Check Duplicates
if (skipDuplicates) {
    const refs = txs.map(t => accountRef.collection('transactions').doc(t.id));
    const snaps = await db.getAll(...refs);
    // Filter out snaps[i].exists
}

// 2. Build Batch
for (const tx of newTxs) {
    batch.set(nestedRef, tx);
    batch.set(globalRef, { RefTxId: nestedRef });
    minDate = min(minDate, tx.date);
}

// 3. Commit & Reconcile
await batch.commit();
if (minDate) await ReconciliationService.refreshCheckpoints(userId, accountId, minDate);
```
