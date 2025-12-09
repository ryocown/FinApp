# Accounting Sign Conventions

## Core Principle
FinApp uses a **Signed** convention where the sign indicates the direction of value relative to the account holder.
*   **Positive (+)**: Asset / Value you own.
*   **Negative (-)**: Liability / Debt you owe.

### 1. Account Balances

| Account Type | Interpretation of Positive Balance (+) | Interpretation of Negative Balance (-) |
| :--- | :--- | :--- |
| **Asset** (Checking, Savings, Brokerage) | **Funds Available** (You have money) | **Overdraft** (You owe money) |
| **Liability** (Credit Card, Loan) | *Surplus/Credit* (Bank owes you) | **Debt Owed** (You owe money) |

**Key Takeaway**: A Credit Card balance of `$500.00` debt is stored as `-500.00`.

### 2. Net Worth Calculation
Because Liabilities are stored as negative numbers, the Net Worth formula is an algebraic sum:

```typescript
Net Worth = Sum(All Accounts)
```

*Implementation Note*: In the Dashboard or other UI components, if "Total Liabilities" is displayed as a positive number (e.g., "$5,000 Debt"), it is calculated by summing the negative balances and multiplying by `-1` (or taking the absolute value).

### 3. Transaction Signs

Transactions affect the balance by simple addition: `NewBalance = OldBalance + TransactionAmount`.

#### Asset Accounts
*   **Deposit (Income)**: **Positive (+)**. Increases funds.
*   **Withdrawal (Expense)**: **Negative (-)**. Decreases funds.

#### Liability Accounts
*   **Spending (Purchase)**: **Negative (-)**. Increases debt (moves balance further from 0 in negative direction).
*   **Payment (Repayment)**: **Positive (+)**. Decreases debt (moves balance closer to 0).
*   **Refund**: **Positive (+)**. Decreases debt.

### 4. Reconciliation
When reconciling a Credit Card account:
*   **Input**: You must enter the **Negative** number to represent debt.
    *   *Example*: If statement says "New Balance: $450.00" (debt), enter `-450.00`.
*   **Logic**:
    *   System Balance: `-400.00`
    *   User Input: `-450.00`
    *   Diff: `-450 - (-400) = -50`
    *   Result: Creates a `-50.00` transaction (Spending/Adjustment), bringing balance to `-450.00`.

## Implementation Notes

### Importers
Importers for Liability accounts (e.g., `ChaseCreditCsvStatementImporter`) **MUST** ensure that:
*   Spending/Sales are imported as **Negative** amounts.
*   Payments/Credits are imported as **Positive** amounts.
*   *Note*: Chase CSVs typically provide spending as negative numbers already, so they can be imported directly.

### Display
*   **Frontend**: The UI typically formats currency. `Intl.NumberFormat` will display `-500` as `-$500.00` or `($500.00)`.
*   **Dashboard**: To calculate "Total Liabilities" as a positive magnitude (e.g. "You owe $500"), sum the negative balances and multiply by `-1`.
