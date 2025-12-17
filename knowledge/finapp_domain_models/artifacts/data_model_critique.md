# Data Model Critique & Recommendations (2025-12-05)

## Executive Summary
The current data model is a strong foundation for a personal finance application, particularly in its handling of investment specifics (Lots, Positions) and strict typing. However, the "Single Entry" philosophy for transactions presents significant challenges for **cross-currency transfers** and **data consistency** between accounts. To achieve the goal of robust net worth tracking across multiple countries and currencies, the Transfer model needs refinement.

## Strengths

1.  **Investment Granularity**:
    *   **Tax Lots (`ILot`)**: Explicitly tracking lots with `costBasis` and `purchaseDate` is excellent. This is often overlooked in simple apps but is critical for accurate capital gains tax calculation and performance tracking.
    *   **Positions**: Aggregating lots into `IPosition` on the `Account` model allows for quick "current state" views without re-calculating from transaction history every time.

2.  **Strict Typing**:
    *   Extensive use of Enums (`TransactionType`, `AccountType`, `ExpenseTypes`) ensures data consistency and prevents "magic strings".
    *   Discriminated unions for Transactions (`IGeneralTransaction`, `ITradeTransaction`, etc.) make runtime handling of different transaction shapes safe and predictable.

3.  **Category Hierarchy**:
    *   The `StandardCategoryTree` and `CategoryGroups` provide a solid, standardized starting point for categorization, which is essential for consistent reporting.

## Critical Gaps & Risks

### 1. The Transfer Problem (Cross-Currency & Consistency)
**Current State**: `ITransferTransaction` has `accountId`, `destinationAccountId`, and a single `amount`.
**Risk**: This model breaks down for cross-currency transfers (e.g., transferring 1000 USD to an AUD account).
*   **Scenario**: You send 1000 USD and receive 1500 AUD.
*   **Problem**: A single `amount` field cannot represent both the -1000 (source) and +1500 (destination).
*   **Consistency**: If you only create one transaction record, which account does it "live" in? If you create two (one for each account), how do you link them to ensure they don't get double-counted or orphaned?

### 2. Net Worth Calculation Complexity
**Current State**: Net Worth = Sum of all Account Balances + Sum of all Position Market Values.
**Risk**:
*   **FX Normalization**: To show a single "Net Worth" number, you need historical FX rates for every single day you want to plot.
*   **Cash vs. Accrual**: The model tracks cash balances well, but for accurate net worth, you need to ensure `price_history` is populated not just for stocks, but for **Currencies** (e.g., USD/AUD, USD/JPY).

### 3. Category Rigidity
**Current State**: Categories are heavily defined in Enums (`ExpenseTypes`).
**Risk**: While good for standardization, this can be too rigid. If a user wants a category not in the Enum, they might feel blocked. The `Category` class exists, but the heavy reliance on Enums in the code might make dynamic user-defined categories second-class citizens.

## Recommendations

### 1. Refactor Transfers for Multi-Currency
Adopt a "Linked Transaction" approach for transfers. instead of a single `TransferTransaction` that tries to do everything.

**Proposed Change**:
A Transfer should consist of **two** distinct transactions linked by a `transferId`:
1.  **Source Transaction** (Withdrawal): `amount: -1000`, `currency: USD`, `accountId: Source`
2.  **Destination Transaction** (Deposit): `amount: +1500`, `currency: AUD`, `accountId: Dest`

**Data Model Update**:
```typescript
export interface ITransferTransaction extends ITransaction {
  transactionType: TransactionType.Transfer;
  // ID of the "other side" of the transfer
  linkedTransactionId: string; 
  // The exchange rate implied by this transfer (optional but helpful)
  exchangeRate?: number; 
}
```
*Why*: This allows each account to remain mathematically consistent in its own currency. The "Transfer" is just the logical link between them.

### 2. Explicit FX Rate Tracking
Ensure `PriceHistory` is treated as a first-class citizen for Currencies, not just Stocks.
*   **Action**: Create a standard way to query "Rate at Date".
*   **Model**: The current `PricePoint` model works for this (`targetId` can be a `currencyPairId`).

### 3. Hybrid Categorization
Keep the `StandardCategoryTree` as a "System Default" but allow the `Category` database objects to be the source of truth for the UI.
*   **Action**: When the app starts, seed the DB with the Enum values.
*   **Benefit**: Users can rename or add categories in the DB without requiring code changes to Enums.

### 4. Snapshotting for Performance
Calculating Net Worth from t=0 by replaying all transactions is expensive.
*   **Recommendation**: Introduce a `BalanceSnapshot` model that records the balance of every account and value of every position at the end of each month/week.
*   **Benefit**: fast graphing of historical net worth.
