# Reconciliation Features Verification

## Overview
This workflow verifies the **Reconciliation Integrity Enhancements**, specifically the **Discrepancy Warning System** and the **Checkpoint Deletion** feature. It uses a standalone script to interact with the running API server.

## Script: `test_reconciliation_features.ts`
Located in `packages/shared/lib/test_reconciliation_features.ts`.

### Prerequisites
*   **Server Running**: The API server must be running (default port `3001`).
*   **Database**: Can run against Emulator or Remote (depending on server config).

### Test Strategy
The script performs an end-to-end test of the reconciliation lifecycle:

1.  **Setup**:
    *   **Create Institute** (Prerequisite):
        *   Creates an Institute to ensure the Account can be correctly nested/located.
    *   **Create Account**:
        *   Uses the `instituteId` from the created Institute.
        *   **Critical**: Payload must include `currency` as an object (`{ code, symbol, name }`) and `balance` (number).
    *   Creates a standard `EXPENSE` transaction.
        *   **Critical**: Payload must include `transactionType` (e.g., 'EXPENSE') and `currency` object.
2.  **Initial Reconciliation**:
    *   Calls `POST /reconcile` to create a checkpoint.
    *   Verifies the checkpoint is initially **Valid**.
3.  **Simulate Corruption**:
    *   Finds and **Deletes** the `RECONCILIATION` adjustment transaction created in step 2.
    *   Calls `GET /checkpoints` and asserts that the checkpoint is now **Invalid** (contains `validation: { isValid: false, difference: ... }`).
4.  **Self-Healing**:
    *   Calls `POST /reconcile` again with the same parameters.
    *   Verifies the checkpoint is **Valid** again (adjustment recreated).
5.  **Checkpoint Deletion**:
    *   Calls `DELETE /checkpoints/:id`.
    *   Verifies the checkpoint is gone.
    *   Verifies the associated `RECONCILIATION` adjustment transaction is also automatically deleted.

### Common Pitfalls
*   **Port Mismatch**: Ensure the script targets the correct port (default `3001`, not `3002`).
*   **Payload Validation**: The `POST /accounts` endpoint enforces strict schema validation.
    *   `currency`: Must be an object, not a string.
    *   `balance`: Required field.
*   **Transaction Creation**:
    *   Requires `transactionType` field.
    *   If using the global endpoint (`/users/:userId/transactions`), `accountId` must be in the body.
*   **Account Lookup**:
    *   If you encounter "Account not found" errors, verify if the account is stored directly under `users/{userId}/accounts` or nested under `institutes/{instituteId}/accounts`. The server's `getAccountRef` helper handles both, but data inconsistency can cause lookups to fail.

### Usage
```bash
npx tsx packages/shared/lib/test_reconciliation_features.ts
```
