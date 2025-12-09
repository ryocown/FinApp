# Balance Calculation Strategy

## Overview

The application uses an **"Anchor & Backdate"** strategy for tracking account balances. This approach prioritizes **current accuracy** over historical perfection and allows for self-correcting data.

## Core Concepts

### 1. Anchor & Backdate
Instead of calculating the current balance by summing all historical transactions from zero (Forward Sum), we:
1.  **Anchor** the balance to a known, accurate "Current Balance" (e.g., from the latest bank statement).
2.  **Backdate** historical balances by subtracting transactions in reverse chronological order.

**Formula:**
`Balance_at_Tx[i] = Balance_at_Tx[i+1] - Tx[i+1].amount`

**Benefits:**
*   **Self-Correcting:** Missing historical data does not affect the accuracy of the current balance.
*   **Easy Onboarding:** Users can start tracking today without importing their entire history.

### 2. Floating History & Reconciliation
*   **Floating History:** Because historical balances are calculated relative to the current anchor, gaps in transaction data (e.g., missing months) will cause the historical balance curve to "float" (shift vertically) by the missing amount. The shape of the curve remains correct, but the absolute values may be offset.
*   **Reconciliation Points:** To fix "Floating History", we use multiple **Anchors** (Checkpoints) at specific dates.
    *   If a calculated balance at Date X does not match the known balance from a statement at Date X, a "Reconciliation Adjustment" transaction is created (or the gap is accepted as an estimate).

### 3. Data Model: Balance Checkpoint
To implement Reconciliation Points, we use a dedicated model:

```typescript
export enum BalanceCheckpointType {
  STATEMENT = 'Statement',
  MANUAL = 'Manual',
  INITIAL = 'Initial'
}

export interface IBalanceCheckpoint {
  id: string;
  accountId: string;
  date: Date; // The date this balance was accurate (usually statement end date)
  balance: number; // The accurate CASH balance at this date
  type: BalanceCheckpointType;
  createdAt: Date;
}
```

## Reconciliation Workflow

To maintain accuracy, users must periodically "reconcile" their accounts. This process creates new anchors (Checkpoints).

### Checkpoint Types
1.  **STATEMENT** (`Statement`): Created automatically during statement import (from `endingBalance`).
2.  **MANUAL** (`Manual`): Created by the user. This covers both "Verified" (user confirms system matches bank) and "Correction" (user forces a balance update) scenarios.
3.  **INITIAL** (`Initial`): Created when an account is first set up with an initial balance.

### The "Reconcile" Action
*   User selects a date and enters the "Actual Balance".
*   System compares this with the "Calculated Balance".
*   **If Match**: A `Verified` checkpoint is saved.
*   **If Mismatch**: A `Manual` checkpoint is saved. This becomes the new "Truth" for that date.
    *   *Note*: The system now employs a **Continuous History** model. If a gap exists, a `RECONCILIATION` transaction is automatically created (or updated) to "plug" the difference, ensuring the sum of transactions always matches the balance. This replaces the previous "Floating History" approach.

### Reconciliation Adjustment Lifecycle
The `RECONCILIATION` transaction acts as a "plug" to force the running balance to match the checkpoint.
*   **Creation**: Automatically created by the system when a discrepancy is found during `reconcileAccount` or `refreshCheckpoints`.
*   **Deletion (Un-reconcile)**: Users **ARE ALLOWED** to manually delete this transaction.
    *   **Effect**: The running balance will no longer match the checkpoint (the account becomes "un-reconciled" for that period).
    *   **Recovery**: If the user runs "Reconcile" again for the same date/balance, the system will simply recalculate the difference and **recreate** the transaction.
    *   **Self-Healing**: If the user imports missing transactions that caused the gap, the next `refreshCheckpoints` run will automatically delete or zero-out the adjustment.
    
### Anchor Update Logic
When a new checkpoint is created (Imported, Verified, or Manual):
*   The system checks if the checkpoint's `date` is **newer than or equal to** the current `Account.balanceDate`.
*   **If Newer**: The `Account.balance` and `Account.balanceDate` are updated to match the checkpoint. This ensures the Account always reflects the *latest known accurate state*.
*   **If Same Day**: The update is **allowed**. This handles cases where the `balanceDate` has a specific time (e.g., import time 14:30) and the reconciliation is for "today" (00:00). We treat them as the same logical date.
*   **If Older**: The checkpoint is saved for historical accuracy, but the current `Account.balance` (the Anchor) remains unchanged.

## Brokerage Account Modeling

Brokerage accounts require a strict separation between **Cash** and **Total Value**.

### The Golden Rule
**`Account.balance` ALWAYS tracks Cash Balance.**

### Data Model
1.  **`Account.balance` (Cash)**:
    *   Tracks the "Cash Sweep" or "Money Market" portion of the brokerage account.
    *   **Affected by:** Deposits, Withdrawals, Dividends, Buy (Cash Out), Sell (Cash In).
    *   **NOT Affected by:** Market fluctuations of held assets.

2.  **`Account.positions` (Holdings)**:
    *   Tracks the quantity of shares held (e.g., 10 AAPL).
    *   **Affected by:** Buy (Shares In), Sell (Shares Out), Splits.

3.  **`Account.totalValue` (Derived)**:
    *   Calculated on-the-fly for dashboards and net worth tracking.
    *   **Formula:** `Account.balance + Sum(Position.quantity * CurrentPrice)`

### User Experience
*   **Transaction List:** Shows **Cash Balance**. Matches the monthly statement's cash section.
*   **Transaction List:** Shows **Cash Balance**. Matches the monthly statement's cash section.
*   **Dashboard/Net Worth:** Shows **Total Value**. Reflects market performance.

## Net Worth History Strategy

While "Anchor & Backdate" is used for *Transaction Lists*, we use a **Snapshot Strategy** for *Net Worth History*.

### Why not Anchor & Backdate?
*   **Investments**: Transactions do not capture unrealized gains/losses (market fluctuations).
*   **Performance**: Replaying history from transactions is computationally expensive.

### Snapshot Strategy
*   **Source**: `balance_checkpoints` collection.
*   **Logic**: The system fetches all checkpoints and "connects the dots" (interpolates) to form a continuous line.
*   **Granularity**: Accuracy depends on the frequency of checkpoints (Statement Imports, Manual Reconciliations, or Daily Snapshots).

