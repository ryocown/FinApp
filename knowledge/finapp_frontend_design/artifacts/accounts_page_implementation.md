# Accounts Page Implementation

## Overview
The Accounts page (`/accounts`) provides a consolidated view of all user accounts, grouped by Institute. It serves as the primary interface for managing accounts and viewing current balances.

## Features

### 1. Institute Grouping
- **Structure**: Accounts are grouped by their parent Institute (e.g., "Chase", "Morgan Stanley").
- **UI**: Each Institute is displayed as a collapsible card.
- **Summary**: The card header shows the Institute name, total number of accounts, and the **Total Value** of all accounts within that institute.

### 2. Total Value Calculation (FX Aware)
- **Goal**: Display a meaningful total sum for the Institute, even if it contains accounts in different currencies (e.g., USD and JPY).
- **Mechanism**:
    1.  **Fetch Rates**: The component fetches the latest exchange rates from `GET /api/currencies/rates`.
    2.  **Client-Side Conversion**: For each account:
        - If currency is USD: Use balance as is.
        - If currency is non-USD (e.g., JPY): Convert to USD using the fetched rate (e.g., `Balance * JPYUSD_Rate`).
    3.  **Summation**: Sum all USD-normalized balances to produce the "Total Value".
- **Display**: The Total Value is always displayed in the user's base currency (USD), while individual accounts show their native currency and symbol.

### 3. Delete Account
- **UI**: A "Trash" icon button is available for each account row, located next to the Reconcile button.
- **Interaction**:
    1.  User clicks delete.
    2.  Confirmation dialog appears (Custom Modal).
    3.  On confirmation, `DELETE /api/accounts/users/:userId/accounts/:accountId` is called.
    4.  List refreshes upon success.
- **Backend Note**: The delete operation uses `db.recursiveDelete()` to ensure all child transactions and checkpoints are removed.

### 4. Delete Institute
- **UI**: A "Trash" icon button is available on the Institute card header (next to the total value).
- **Interaction**:
    1.  User clicks delete.
    2.  Confirmation dialog appears ("Are you sure you want to delete this institute?").
    3.  On confirmation, `DELETE /api/institutes/users/:userId/institutes/:instituteId` is called.
    4.  List refreshes upon success.
- **Backend Note**: Like account deletion, institute deletion uses `db.recursiveDelete()` to ensure all child accounts and their transactions are removed.

### 5. Reconcile Account
- **UI**: A text button labeled "Reconcile" (styling: `text-xs font-medium`, visible on hover/group-hover).
- **Interaction**: Opens the Reconciliation Modal for the specific account.

### 6. Import Transactions
- **UI**: A text button labeled "Import" (styling: `text-xs font-medium`, visible on hover/group-hover), located next to the Reconcile button.
- **Interaction**: Opens the `ImportModal` for the specific account.
- **Flow**:
    1.  User clicks "Import".
    2.  `ImportModal` opens with the account context pre-selected.
    3.  User completes the import workflow (File Select -> Preview -> Upload).
    4.  On success, the account list/data refreshes.

### 7. Account Details & Management
- **UI**:
    - **Trigger**: Clicking on an account card (or a specific "Edit" button) opens the `AccountDetailModal`.
    - **Modal Content**:
        - **Editable Fields**: Account Name, Account Number (Last 4).
        - **Read-Only Fields**: Type (displays `AccountType` enum value directly), Currency, Current Balance.
        - **Actions**: "Save Changes", "Delete Account".
- **Interaction**:
    1.  User updates fields and clicks "Save".
    2.  `PUT /api/accounts/users/:userId/accounts/:accountId` is called.
    3.  List refreshes upon success.
- **Delete Flow**:
    - Inside the modal, a "Delete Account" button triggers the deletion confirmation.

### 8. Create Account
- **UI**: "Add Account" button within an Institute card or global "Add Account" button.
- **Restriction Logic**:
    - The `CreateAccountModal` uses `INSTITUTE_SUPPORTED_ACCOUNTS` (from `capabilities.ts`) to dynamically filter the "Type" dropdown.
    - **Goal**: Prevent users from creating account types that do not have a corresponding importer implementation.
    - **Example**: If "Chase" is selected, only "Checking" and "Credit Card" options are available.

## API Integration
- **Fetch**: Parallel fetch of Institutes, Accounts, and Currency Rates.
- **Delete**: `DELETE` request to the accounts endpoint.

## Component Structure
- `Accounts.tsx`: Main container, handles data fetching, state (expanded institutes), and rendering.
- `CreateInstituteModal.tsx`: Modal for adding new institutes.
- `CreateAccountModal.tsx`: Modal for adding new accounts.
- `DeleteConfirmationModal.tsx`: Reusable modal for confirming deletions.
