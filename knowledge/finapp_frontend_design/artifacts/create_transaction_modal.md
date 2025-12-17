# Create Transaction Modal

## Overview
The `CreateTransactionModal` is a comprehensive UI component for manually adding transactions. It supports three distinct modes: **General**, **Trade**, and **Transfer**.

## UI Design
- **Modal Layout**: Centered overlay with a tabbed interface. **Auto-sizing height** adapts dynamically to content (e.g., when opening dropdowns or switching tabs).
- **Tabs**:
  1.  **General**: For Income/Expense transactions.
  2.  **Trade**: For Buy/Sell investment transactions.
  3.  **Transfer**: For moving funds between accounts.

## State Management
The modal manages complex state for all three modes, resetting specific fields when switching tabs while preserving common ones (like Date).

### Common Fields
- **Date**: Defaults to today.
- **Account**: The primary account for the transaction.

### Tab-Specific Logic

#### 1. General Tab
- **Type**: Toggle between `EXPENSE` and `INCOME`.
- **Amount**: Numeric input.
- **Category**: **Searchable Combobox** (replacing simple dropdown).
  - **Implementation**: **Client-side filtering** of the static `ExpenseTree` constant.
  - **UX**: Allows filtering grouped categories by name without scrolling.
- **Description**: Text input.
- **Payload**: Creates a `GeneralTransaction` with `transactionType: 'GENERAL'`.

#### 2. Trade Tab
- **Action**: Toggle between `BUY` and `SELL`.
- **Instrument Search**:
  - Input field for Ticker.
  - **Implementation**: **Server-side search** via debounced API call to `searchInstruments(query)`.
  - Dropdown to select instrument from results.
- **Quantity**: Numeric input.
- **Price**: Numeric input (Price per Share).
- **Payload**: Creates a `TradeTransaction` with `transactionType: 'TRADE'` and `instrumentId`.

#### 3. Transfer Tab
- **Destination Account**: Dropdown to select the receiving account (filters out source account).
- **Amount**: Numeric input.
- **Logic**:
  - Client-side generation of **Linked Transactions** (Source Out, Destination In).
  - Uses `TransferTransaction.createTransferPair` helper.
  - Calls `createTransfer` API (which sends both transactions).

## API Integration
- **`createTransaction`**: Used for General and Trade transactions.
- **`createTransfer`**: Used for Transfer transactions (handles the pair).
- **`searchInstruments`**: Used for autocomplete in Trade tab.

## Validation
- **General**: Amount > 0, Description required.
- **Trade**: Ticker selected, Quantity > 0, Price > 0.
- **Transfer**: Destination selected, Amount > 0.
