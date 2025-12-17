# Transaction List Implementation Patterns

## Running Balance Calculation

The Transaction List implements an **"Anchor & Backdate"** strategy to display a running balance column alongside transactions. This allows users to see their historical balance at any point in time without storing historical balances for every transaction in the database.

### Core Logic
The balance for any specific transaction row is calculated on-the-fly using the following formula:

```
RowBalance = AnchorBalance - PageOffset - Sum(Transactions_Before_Row_In_Current_Page)
```

### Components

1.  **AnchorBalance**:
    *   The current **Cash Balance** of the account (`Account.balance`).
    *   Fetched via `useAccounts`.
    *   Represents the balance *after* the most recent transaction (effectively "Now").

2.  **PageOffset**:
    *   The sum of all transaction amounts that have occurred *after* the current page's time range.
    *   Since we view transactions in reverse chronological order (newest first), "after" means "on previous (newer) pages".
    *   Tracked in the `pageHistory` state.

3.  **Sum(Transactions_Before_Row_In_Current_Page)**:
    *   The sum of amounts of all transactions displayed *above* the current row in the current page.
    *   Calculated during rendering (`filteredTransactions.slice(0, index).reduce(...)`).

## Pagination & State Management

Firestore provides forward-only cursors (`nextPageToken`). To support **Previous** navigation and accurate **Running Balances**, the client maintains a history stack.

### `pageHistory` State
The `pageHistory` state is an array of objects, where each entry represents a visited page:

```typescript
interface PageHistoryEntry {
  token: string | null; // The Firestore cursor for this page
  balanceOffset: number; // The sum of amounts of all NEWER transactions (from previous pages)
}
```

### Navigation Logic

*   **Initial Load**:
    *   `pageHistory = [{ token: null, balanceOffset: 0 }]`
    *   `balanceOffset` is 0 because we are at the top (newest).

*   **Next Page (Older)**:
    *   User clicks "Next".
    *   Calculate `currentPageSum` = Sum of all transactions on the current page.
    *   New `balanceOffset` = `currentOffset` + `currentPageSum`.
    *   Push `{ token: nextPageToken, balanceOffset: newOffset }` to `pageHistory`.
    *   Set `pageToken` to `nextPageToken`.

*   **Previous Page (Newer)**:
    *   User clicks "Previous".
    *   Pop the last entry from `pageHistory`.
    *   Set `pageToken` to the `token` of the *new* last entry.
    *   The `balanceOffset` automatically reverts to the correct value for that page.

## Filtering Considerations

When the user changes the **Account Filter**:
1.  The `AnchorBalance` changes to the selected account's balance.
2.  The `pageHistory` must be reset to `[{ token: null, balanceOffset: 0 }]`.
3.  The `pageToken` is reset to `null`.

This ensures the calculation starts fresh from the new anchor.

### URL-Based Filtering
The transaction list supports deep linking via URL query parameters.
-   **Parameter**: `?account={accountId}`
-   **Syncing**:
    -   **On Load**: The `Transactions` component initializes `selectedAccountId` from the URL parameter.
    -   **On Change**: Changing the filter updates the URL (via `setSearchParams`), allowing users to bookmark or share specific account views.
    -   **Sidebar Integration**: Clicking an account in the sidebar updates the URL, which triggers the filter update in the main view.


## Implementation Notes

### ID Usage
**Crucial**: The `ITransaction` interface uses `transactionId` as its unique identifier, **not** `id`.
*   **React Keys**: Use `key={transaction.transactionId}`.
*   **Lookups**: Use `transaction.transactionId` for finding indexes (e.g., `findIndex`).

### Row Rendering Snippet
Correct implementation of the balance calculation loop:

```tsx
{filteredTransactions.map((transaction) => {
  // ... (Standard columns) ...

  // Balance Calculation
  if (selectedAccountId !== 'all') {
    const account = accounts.find(a => a.accountId === selectedAccountId);
    const anchorBalance = account?.balance || 0;
    const pageOffset = pageHistory[pageHistory.length - 1].balanceOffset;
    const startBalance = anchorBalance - pageOffset;

    // Find index using transactionId
    const index = filteredTransactions.findIndex(t => t.transactionId === transaction.transactionId);
    
    // Sum previous rows in this page
    const previousRowsSum = filteredTransactions.slice(0, index).reduce((sum, t) => sum + t.amount, 0);
    
    const rowBalance = startBalance - previousRowsSum;
    
    return (
      <td className="...">
        {rowBalance.toLocaleString(...)}
      </td>
    );
  }
})}
```


## Table Columns

The transaction table consists of the following standard columns:

1.  **Date**: Transaction date (formatted).
2.  **Description**: Main description/merchant.
3.  **Type**: Transaction type (`TransactionType`), formatted to Title Case (e.g., "General", "Trade").
4.  **Category**: Transaction category (colored badge).
5.  **Amount**: Transaction amount (currency formatted).
6.  **Balance**: Running balance (calculated on-the-fly).
7.  **Actions**: Edit/Delete controls.

## Sorting Logic

The transaction list supports server-side sorting by date.
-   **Default**: Descending (newest first).
-   **Interaction**: Clicking the "Date" column header toggles between Ascending and Descending.
-   **State**: Managed via `sortOrder` state ('asc' | 'desc') which is passed to the `useTransactions` hook.
-   **API**: The sort order is sent as a query parameter (`?sortOrder=asc|desc`) to the server, which applies it to the Firestore query.
-   **Visuals**: An arrow icon (`ArrowUpDown`) indicates the current sort direction.

## UI Patterns

### Resizable Columns
The transaction table supports user-resizable columns for better usability on different screen sizes.
- **State**: `columnWidths` object stores width in pixels for each column key (e.g., `date`, `category`).
- **Interaction**:
  - `onMouseDown` on the column header resize handle initiates the drag.
  - `document.addEventListener('mousemove')` tracks the delta.
  - `document.addEventListener('mouseup')` commits the change and cleans up listeners.
- **Visuals**: A thin hoverable area on the right edge of each `<th>`.

### Error Handling Display
API errors are displayed in a collapsible alert box to prevent UI clutter while maintaining debuggability.
- **Collapsed**: Shows a friendly "Error loading transactions" message.
- **Expanded**: Shows the full error text/stack trace in a preformatted block.


### List Updates
*   **Deletion**: When a transaction is deleted via the `TransactionDetailModal`, the list currently refreshes via a full page reload (`window.location.reload()`). This ensures the "Running Balance" calculation (which depends on the strict order and sum of *all* transactions) is correctly re-anchored from the server.

## Layout Integration

### Master-Detail / Sidebar Layout
The `Transactions` page adapts its layout based on the filter state:
*   **Default (All Accounts)**: Full-width transaction list.
*   **Account Selected**: Split view.
    *   **Main Area (Left)**: Transaction list (flex-grow).
    *   **Sidebar (Right)**: `CheckpointTimeline` component (fixed width, e.g., `w-80`).
    *   **Implementation**: Uses a flex container (`flex-row`) for the page body. The sidebar is conditionally rendered.

## Transaction Creation

### Entry Point
The "New Transaction" button is located in the **Header** of the `Transactions` page, alongside the Filter and Export controls. This placement keeps the action contextually relevant to the list view.

### Workflow
1.  User clicks "New Transaction".
2.  `CreateTransactionModal` opens.
3.  User fills out the form (Type, Amount, Description, etc.).
4.  On submit, the transaction is created via API.
5.  The page refreshes to display the new transaction and update the running balance calculation.
