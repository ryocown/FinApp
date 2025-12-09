# Firestore Indexes

## Overview
Certain queries in FinApp require composite indexes to function correctly, particularly those involving Collection Group queries or sorting on multiple fields.

## Required Indexes

### Transactions (Collection Group)
**Usage**: `ReconciliationService`
**Query Pattern**: Fetching the latest `RECONCILIATION` transaction for an account.
```typescript
db.collectionGroup('transactions')
  .where('transactionType', '==', 'RECONCILIATION')
  .orderBy('date', 'desc')
```

**Index Definition**:
- **Collection ID**: `transactions`
- **Scope**: `Collection Group`
- **Fields**:
  1. `transactionType` (Ascending)
  2. `date` (Descending)
  3. `__name__` (Descending)

**Creation Link**:
[Create Index in Firebase Console](https://console.firebase.google.com/v1/r/project/hirico-internal-project-1/firestore/indexes?create_composite=Cl5wcm9qZWN0cy9oaXJpY28taW50ZXJuYWwtcHJvamVjdC0xL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaEwoPdHJhbnNhY3Rpb25UeXBlEAEaCAoEZGF0ZRACGgwKCF9fbmFtZV9fEAI)

### User Transactions (Collection Group)
**Usage**: `TransactionService.getUserTransactions`
**Query Pattern**: Fetching all transactions for a user across all accounts.
```typescript
db.collectionGroup('transactions')
  .where('userId', '==', userId)
  .orderBy('date', 'desc')
```

**Index Definition**:
- **Collection ID**: `transactions`
- **Scope**: `Collection Group`
- **Fields**:
  1. `userId` (Ascending)
  2. `date` (Descending)
  3. `__name__` (Descending)

## Troubleshooting
If you encounter `FAILED_PRECONDITION: The query requires an index`, check the error message for a direct link to create the missing index.
