# Transaction Detail Modal

## Overview
The Transaction Detail Modal provides a focused view of a single transaction, offering both a user-friendly rendered view and a raw data view for debugging and verification.

## Features

### 1. Dual-View Tabs
The modal is split into two tabs to serve different needs:
- **Normal**: A clean, rendered view of the transaction details (Date, Description, Amount, Category, Account, Merchant, etc.).
- **Raw**: A developer-focused view showing the raw JSON data of the transaction object.

### 2. Edit Mode
- **Purpose**: Allows users to modify mutable fields of a transaction.
- **State Management**:
    - `isEditing`: Boolean toggle for the UI state.
    - `formData`: Local state initialized with transaction data, tracking changes before save.
    - `isSaving`: Loading state during API call.
- **Input Types**:
    - **Description**: Text input.
    - **Date**: `datetime-local` input (requires `YYYY-MM-DDThh:mm` formatting).
    - **Amount**: Number input (`step="0.01"`).
    - **Type**: Select dropdown (mapped to `TransactionType` enum).
    - **Category**: `CategoryPicker` component (searchable, hierarchical selection).
- **Immutable Fields**:
    - `accountId`, `currency`, `transactionId`, `userId` are displayed as read-only text.
- **Actions**:
    - **Save**: Calls `updateTransaction` API -> `onUpdate` callback -> `setIsEditing(false)`.
    - **Cancel**: Reverts to read-only view without saving (`setIsEditing(false)`).

### 3. Delete Action
- **Purpose**: Allows users to permanently remove a transaction.
- **UI**: A "Delete Transaction" button in the modal footer (red/danger style).
- **Interaction**:
    - Clicking triggers a native confirmation dialog (`window.confirm`).
    - On confirmation, calls the `deleteTransaction` API.
    - Shows a "Deleting..." state during the request.
    - On success, closes the modal and triggers a refresh of the parent list.

### 4. Raw JSON View
- **Library**: `react-syntax-highlighter`
- **Purpose**: Allows users (and developers) to see the exact data stored in the database, including internal IDs (`transactionId`, `accountId`, `userId`) and unrendered fields.
- **Implementation**:
  ```tsx
  <SyntaxHighlighter language="json" style={vscDarkPlus}>
    {JSON.stringify(transaction, null, 2)}
  </SyntaxHighlighter>
  ```

## Integration
- **Entry Point**: The modal is triggered by clicking on any transaction row in the `Transactions` list.
- **State Management**:
  - `Transactions.tsx` holds the state:
    - `selectedTransaction`: The `ITransaction` object to display.
    - `isDetailModalOpen`: Boolean flag.
  - **Interaction**:
    - `handleRowClick(transaction)`: Sets the selected transaction and opens the modal.
    - `onClose`: Clears the selected transaction and closes the modal.

## Component Structure
  - Props: `isOpen`, `onClose`, `transaction`.
  - Internal State: `activeTab` ('normal' | 'raw').

## Data Handling
- **Enriched Data**: The modal expects an "enriched" transaction object (extending `ITransaction`) which may include resolved fields from the server, such as:
  - `category`: String name (vs `categoryId`).
  - `merchant`: Object with name (vs `merchantId`).
  - `transactionType`: Display-friendly string.
- **Type Safety**: The component defines a local `EnrichedTransaction` interface to handle these API-provided fields safely while maintaining compatibility with the base `ITransaction` model.
