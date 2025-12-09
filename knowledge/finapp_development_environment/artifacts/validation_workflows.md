# Validation Workflows

## Overview
When validating complex logic changes (like Reconciliation), it is often necessary to reset the environment to a known clean state.

## Wipe & Re-import Strategy
This strategy involves completely removing user data and re-importing it from source files (CSV/Excel) to verify the end-to-end flow.

### 1. Wipe User Data
Use the `wipe_users.ts` script to recursively delete all users and their subcollections.
**Note**: Standard Firestore delete does *not* delete subcollections. You must use `recursiveDelete` or manually delete subcollections.

```typescript
// packages/shared/lib/wipe_users.ts
import admin from 'firebase-admin';

// ... Init Admin ...

async function wipeUsers() {
  const usersRef = db.collection('users');
  const usersSnap = await usersRef.get();
  
  for (const userDoc of usersSnap.docs) {
    console.log(`Deleting user ${userDoc.id}...`);
    // Crucial: Use recursiveDelete to remove subcollections (accounts, institutes, etc.)
    await db.recursiveDelete(userDoc.ref);
  }
}
```

### 2. Re-import Data
Run the `import_to_firebase.ts` script. Ensure it is updated to use the latest logic (e.g., `ReconciliationService`) if that is what you are testing.

```bash
npx tsx packages/shared/lib/import_to_firebase.ts
```

### 3. Verify
Check the results using:
-   **Firebase Console**: Visual inspection of collections.
-   **Verification Scripts**: `simple_list_users.ts` or `debug_account_location.ts`.
-   **Direct Service Tests**: `reconciliation_direct.ts`.
