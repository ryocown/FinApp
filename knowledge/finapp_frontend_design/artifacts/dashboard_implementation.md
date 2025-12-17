# Dashboard Implementation

## Overview
The Dashboard (`/`) is the landing page of the application, providing a high-level financial overview. Its primary component is the **Net Worth** card and history chart.

## Net Worth Card

### 1. Current Net Worth Display
- **Calculation Strategy**: Client-side Aggregation.
- **Source**: Fetches all user accounts via `useAccounts` hook.
- **Logic**:
    1.  Filter accounts by type (Assets vs Liabilities).
    2.  Convert non-USD balances to USD using latest rates (fetched from `/api/currencies/rates`).
    3.  **Liability Handling**: Liability accounts (Credit Cards, Loans) typically have negative balances (representing debt).
    4.  **Calculation**: `Net Worth = Total Assets - |Total Liabilities|` (or `Total Assets + Total Liabilities` if liabilities are negative).
        *   *Correction*: Ensure that if liabilities are summed as negative numbers, they are added to assets. If they are summed as positive magnitudes (absolute value), they are subtracted.
        *   *Current Implementation*: Inverts the sign of `totalLiabilities` (which sums negative balances) to treat debt as a positive magnitude, then subtracts it from assets. `Net Worth = Assets - (-1 * SumOfNegativeLiabilities)`.
- **Display**: Large, bold text formatted to 2 decimal places (e.g., `$1,140,200.45`).

### 2. "vs Last Month" Comparison
- **Calculation Strategy**: Hybrid (Client Current vs Server History).
- **Source**: Compares the *calculated current Net Worth* (from client-side aggregation) against historical data fetched from `/api/analytics/users/:userId/net-worth`.
- **Logic**:
    1.  Fetch `netWorthHistory` (array of `{ date, value }`).
    2.  Find the history entry closest to **30 days ago**.
    3.  `Diff = Current Net Worth - Historical Value`.
    4.  `Percent Change = (Diff / |Historical Value|) * 100`.
    5.  **Edge Case**: If `Historical Value` is 0 and `Current Net Worth` is not 0, `Percent Change` is displayed as `∞`.
- **Display**: Green (positive) or Red (negative) text with arrow, absolute change (2 decimals), and percentage (1 decimal or ∞).
    - Example: `↑ $407,313.94 (101.6%) vs last month`
    - Example: `↑ $1,000.00 (∞) vs start`

### 3. Net Worth History Chart
- **Source**: `/api/analytics/users/:userId/net-worth`.
- **Visualization**: Area chart showing the trend over time.
- **Consistency Note**: The chart relies entirely on server-side historical data. Discrepancies may arise if the *current* client-side calculation differs from the *latest* server-side history point (e.g., due to different FX rates or account inclusion logic).

## Key Components
- `Dashboard.tsx`: Main container.
- `NetWorthCard`: (Conceptually part of Dashboard.tsx) Displays the summary.
- `NetWorthChart`: Renders the Recharts area chart.
