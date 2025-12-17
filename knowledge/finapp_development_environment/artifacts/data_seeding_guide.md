# Data Seeding & Test Data Generation

## Overview
Creating valid test data requires adhering to the strict Firestore schema hierarchy, particularly for Accounts which must be nested under Institutes.

## Account Creation Hierarchy
Accounts are **not** top-level collections under Users. They are nested under Institutes.

**Correct Path**: `users/{userId}/institutes/{instituteId}/accounts/{accountId}`

### Steps to Create an Account
1.  **Create/Identify User**: Ensure the `userId` exists.
2.  **Create/Identify Institute**: You must create an Institute document first if one does not exist.
    - Path: `users/{userId}/institutes/{instituteId}`
3.  **Create Account**: Create the account document nested under that Institute.
    - Path: `users/{userId}/institutes/{instituteId}/accounts/{accountId}`
    - **Crucial**: The account document *must* also contain the `instituteId` field for easier querying/indexing.

## Example Script (`create_test_account.ts`)

```typescript
import admin from 'firebase-admin';
import { v4 } from 'uuid';

// ... Firebase Initialization ...

async function createAccount(userId: string) {
  const instituteId = v4();
  const accountId = v4();
  
  // 1. Create Institute
  const institute = {
    instituteId,
    name: 'Test Bank',
    userId
  };
  await db.collection('users').doc(userId)
    .collection('institutes').doc(instituteId)
    .set(institute);

  // 2. Create Account under Institute
  const account = {
    accountId,
    name: 'Test Checking Account',
    type: 'CHECKING',
    balance: 1000,
    balanceDate: new Date(),
    currency: 'USD',
    userId,
    instituteId // <--- Important: Link back to institute
  };

  await db.collection('users').doc(userId)
    .collection('institutes').doc(instituteId)
    .collection('accounts').doc(accountId)
    .set(account);
    
  console.log(`Created Account: ${accountId} under Institute: ${instituteId}`);
}
```

## Currency Seeding
FX rates are essential for multi-currency support. Use the dedicated seeding script to populate historical rates.

### Script: `packages/shared/lib/seed_currency.ts`
-   **Usage**: Run via `tsx` or `npm run seed:currency` (if configured).
-   **Function**: Populates the `currencies` collection with daily rates.
-   **Structure**:
    -   Creates/Updates `currencies/{pairId}` documents.
    -   Adds daily documents to `currencies/{pairId}/prices/{date}`.
-   **Example Data**:
    -   Pair: `JPYUSD`
    -   Rate: ~0.0067
    -   Range: Past 1 year
