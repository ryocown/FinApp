# Reconciliation UI Design

## Overview
The Reconciliation feature allows users to verify their account balances against external sources (e.g., bank statements) and create "Balance Checkpoints". This ensures the "Anchor & Backdate" system remains accurate over time.

## UI Components

### 1. Reconcile Button
*   **Location 1**: Transactions Toolbar (Header).
    *   **Visibility**: Only visible when a specific account is selected (not "All Accounts").
*   **Location 2**: Accounts Page (List Item).
    *   **Visibility**: Visible on every account row (hover/always).
*   **Action**: Opens the Reconciliation Modal for the specific account.

### 2. Reconciliation Modal
*   **Inputs**:
    *   **Date**: Defaults to Today.
    *   **Actual Balance**: User input field for the balance from their bank statement.
*   **Display**:
    *   **Calculated Balance**: The system's calculated balance for the selected date (derived from the latest anchor + transactions).
*   **Logic**:
    *   **Comparison**: Real-time comparison of "Actual" vs "Calculated".
    *   **Match (Green)**: If values match, the user can "Verify". This creates a `Verified` checkpoint.
    *   **Mismatch (Red/Warning)**: If values differ, the user is warned that this will "adjust" their history.
        *   **Action**: User can "Save Adjustment". This creates a `Manual` checkpoint, effectively resetting the anchor for that date and "fixing" the history going backwards from there.
        *   *Optional Future*: Allow creating a "Reconciliation Adjustment" transaction to account for the difference.

### 3. Checkpoint Timeline Sidebar
*   **Location**: Right-hand side of the Transactions page.
*   **Visibility**: Only visible when a specific account is selected (not "All Accounts").
*   **Purpose**: Visualizes the history of balance checkpoints for the selected account, providing a quick "health check" of the reconciliation status.
*   **Visual Design**:
    *   **Vertical Timeline**: A continuous line connecting checkpoints.
    *   **Nodes**: Red dots indicating checkpoint events.
    *   **Cards**: Each node connects to a card displaying:
        *   **Date**: Formatted (e.g., "Dec 7, 2025").
        *   **Balance**: Currency formatted.
        *   **Type**: e.g., "reconciliation", "statement".
        *   **Status**:
            *   **Normal**: Emerald dot/border.
            *   **Discrepancy**: Yellow dot/border/background with an `AlertTriangle` icon. Displays the exact difference amount (e.g., "Missing $50.00").
        *   **Actions**:
            *   **Delete**: Trash icon (visible on hover) to delete the checkpoint.
            *   **Confirmation**: Browser confirm dialog warns: "Are you sure you want to delete this checkpoint? This will also remove the associated reconciliation adjustment transaction."
*   **Data Source**: Fetches from `GET /users/:userId/accounts/:accountId/checkpoints`.
    *   **Response**: Array of `IBalanceCheckpoint` objects, now enriched with an optional `validation` object: `{ isValid: boolean, difference: number }`.

## Interaction Flow
1.  User selects "Chase Checking".
2.  User clicks "Reconcile".
3.  Modal opens showing Today's date and calculated balance ($5,100).
4.  User checks bank app, sees $5,100.
5.  User enters $5,100.
6.  System shows "Matched!".
7.  User clicks "Confirm".
8.  Modal closes, toast success.

## State Management
*   The modal needs to fetch the `calculatedBalance` for the selected date if the user changes the date picker.

## Implementation Status (MVP)
*   **Components**: `ReconcileModal.tsx`, `Transactions.tsx` integration, `Accounts.tsx` integration.
*   **Current Limitation**: The "Calculated Balance" is currently passed as a static prop (`currentBalance`) when the modal opens. It does **not** yet dynamically update if the user changes the "Date" field in the modal. Users are expected to reconcile against the *current* date/balance.
*   **Backend**: `POST /users/:userId/accounts/:accountId/reconcile` handles the logic.
