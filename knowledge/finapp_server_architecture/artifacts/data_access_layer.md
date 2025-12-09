# Data Access Layer

## Overview
The Data Access Layer (DAL) centralizes Firestore interactions, providing helper functions to resolve references and manage nested collections.

## Account Resolution Strategy
Accounts in FinApp are nested under Institutes (`users/{userId}/institutes/{instituteId}/accounts/{accountId}`). This nesting creates a challenge when resolving an account solely by its `accountId` and `userId`.

### `getAccountRef` Logic
To find an account without knowing its `instituteId`, the system currently employs a **Dual-Path Search** strategy to support both legacy (direct) and nested accounts:

1.  **Check Direct Accounts**: Checks `users/{userId}/accounts/{accountId}`. If found, returns immediately.
2.  **Fetch All Institutes**: Retrieves all institute documents for the user.
3.  **Iterate and Check**: For each institute, it constructs a reference to the potential account path (`.../accounts/{accountId}`) and attempts to `get()` it.
4.  **Return on First Match**: If the document exists, it returns the `DocumentReference` and the found `instituteId`.
5.  **Return Null**: If iterated through all institutes without success, returns `null`.

```typescript
// Observed Implementation Pattern
export const getAccountRef = async (userId: string, accountId: string) => {
  // 1. Check direct accounts (users/{userId}/accounts/{accountId})
  const directRef = getUserRef(userId).collection('accounts').doc(accountId);
  const directDoc = await directRef.get();
  if (directDoc.exists) {
    return { ref: directRef, instituteId: undefined };
  }

  // 2. Get all institutes (O(N) read)
  const institutesSnapshot = await getUserRef(userId).collection('institutes').get();

  // 3. Check each institute (N reads in worst case)
  for (const doc of institutesSnapshot.docs) {
    const ref = doc.ref.collection('accounts').doc(accountId);
    const accountDoc = await ref.get();
    if (accountDoc.exists) {
      return { ref, instituteId: doc.id };
    }
  }
  return null;
};
```

### Performance Implications
-   **Reads**: This operation costs `1 (direct check) + 1 (institutes list) + N (account checks)` reads.
-   **Optimization**: This suggests that `instituteId` should be cached or passed whenever possible to avoid this expensive lookup.
 
 ## Global Transaction Access
 
 ### The "Dual Write" Pattern
 Transactions are stored in a nested structure (`accounts/{accountId}/transactions`) but also require global access (e.g., "All Transactions" view) and ID-based operations (e.g., Delete by ID).
 
 1.  **Source of Truth**: The full transaction document is stored in `users/{userId}/institutes/{instituteId}/accounts/{accountId}/transactions/{txId}`.
 2.  **Global Pointer**: A lightweight reference document is written to `users/{userId}/transactions/{txId}` containing `{ RefTxId: <DocumentReference> }`.
 
 ### Read Strategies
 
 #### 1. Listing All Transactions (Collection Group Query)
 To fetch a global list of transactions sorted by date, the system uses a **Collection Group Query** on `transactions`.
 
 *   **Query**: `db.collectionGroup('transactions').where('userId', '==', userId).orderBy('date', 'desc')`
 *   **Mechanism**: This query scans *all* collections named `transactions`. It matches the nested "Source of Truth" documents (which have `userId` and `date`) and ignores the "Global Pointer" documents (which lack these fields).
 *   **Requirement**: This **REQUIRES** a composite index on `transactions` (`userId` ASC, `date` DESC). Without this index, the query will fail or return empty results.
 
 #### 2. ID-Based Lookup / Deletion
 To delete or fetch a transaction knowing only its `transactionId` (and `userId`), the system uses the **Global Pointer**.
 
 *   **Lookup**: `getUserRef(userId).collection('transactions').doc(txId).get()`
 *   **Resolution**: The retrieved document contains `RefTxId`, which points directly to the nested path.
 *   **Action**: The system can then delete both the global pointer and the nested document (via the reference).
 
 ## Data Retrieval & Serialization Patterns
 
### Timestamp Serialization Strategy
**The Problem**: Firestore stores dates as `Timestamp` objects. When these objects are passed directly to `res.json()`, Express uses `JSON.stringify()`, which serializes them as `{ _seconds: number, _nanoseconds: number }` instead of ISO strings. This breaks frontend components expecting `string` dates.
 
**The Solution**: All API endpoints MUST explicitly convert `Timestamp` fields to ISO 8601 strings before sending the response.
 
**Implementation Pattern**:
```typescript
// Helper logic (often inline or in utility functions)
const toIsoString = (dateField: any): string => {
  if (!dateField) return dateField;
  // Handle Firestore Timestamp
  if (typeof dateField.toDate === 'function') {
    return dateField.toDate().toISOString();
  }
  // Handle raw object (e.g. from JSON serialization)
  if (typeof dateField === 'object' && '_seconds' in dateField) {
    const seconds = dateField._seconds;
    const nanoseconds = dateField._nanoseconds || 0;
    return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
  }
  return dateField; // Assume already string or other format
};
```

### Internal Service Data Handling
**Critical Warning**: When fetching documents for internal business logic (e.g., inside a Service method), `doc.data()` returns `Timestamp` objects for date fields, NOT `Date` objects, even if your TypeScript interface says `date: Date`.

**The Pitfall**:
```typescript
const doc = await ref.get();
const tx = doc.data() as ITransaction; // <--- DANGEROUS LIE
// tx.date is actually a Firestore Timestamp here!
tx.date.toISOString(); // CRASH: tx.date.toISOString is not a function
```

**The Best Practice**:
Always convert data *immediately* after fetching if you intend to use it in logic.
```typescript
const doc = await ref.get();
const rawData = doc.data();
const tx = {
  ...rawData,
  date: rawData.date.toDate() // Explicit conversion
} as ITransaction;
```

 
## Shared Data Access Helpers
 
To standardize data retrieval and ensure consistent response formatting, the following helpers in `firebase.ts` should be used:

To standardize data retrieval and ensure consistent response formatting, the following helpers in `firebase.ts` should be used:

### 1. `getCollectionData`
Reduces boilerplate when fetching collections. It maps the `QuerySnapshot` to an array of data objects, injecting the document ID into a specified field (defaulting to `id`).

```typescript
export const getCollectionData = <T>(snapshot: admin.firestore.QuerySnapshot, idField: string = 'id'): T[] => {
  return snapshot.docs.map(doc => Object.assign({}, doc.data(), { [idField]: doc.id }) as T);
};
```

### 2. `getAllUserAccounts`
Abstracts the complexity of the nested `User -> Institute -> Account` structure. It fetches all institutes, then all accounts for each institute, enriches them with `instituteId`, and returns a flattened array.

```typescript
export const getAllUserAccounts = async (userId: string): Promise<IAccount[]> => {
  // ... implementation ...
};
```

### 3. `resolveTransactionReferences`
Centralizes the logic for resolving `RefTxId` pointers and **normalizing dates**.
*   **Reference Resolution**: Fetches the actual transaction document if `RefTxId` is present.
*   **Date Normalization**: **CRITICAL**: Applies the **Timestamp Serialization Strategy** to convert `date` fields into ISO 8601 strings.
    *   **Robustness**: Explicitly handles both `Timestamp` instances (via `.toDate()`) and plain objects with `_seconds` properties.

```typescript
export const resolveTransactionReferences = async (docs: admin.firestore.QueryDocumentSnapshot[]): Promise<ITransaction[]> => {
  // ... maps docs ...
  // ... resolves RefTxId ...
  // ... converts Timestamp/Object to ISO String ...
  return transactions;
};
```
