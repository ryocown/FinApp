# Currency Model

## Core Entities

### ICurrency
Represents a specific currency.
- **Code**: ISO 4217 code (e.g., `USD`, `JPY`, `EUR`).
- **Symbol**: Display symbol (e.g., `$`, `¥`, `€`).
- **Name**: Full name (e.g., `US Dollar`).

### ICurrencyPair
Represents a trading pair between two currencies.
- **Base**: The currency being priced.
- **Quote**: The currency the price is expressed in.
- **Rate**: The exchange rate (1 Base = X Quote).
- **Date**: The date of the rate.

## Canonical Pair Logic
To avoid storing duplicate rates (e.g., `USDJPY` and `JPYUSD`), the system enforces a **Canonical Pair** format based on alphabetical order of currency codes.

- **Rule**: `Base Code < Quote Code` ? Pair is `BaseQuote` : Pair is `QuoteBase`.
- **Example**: JPY vs USD.
  - `JPY` < `USD`.
  - Canonical Pair ID: `JPYUSD`.
  - Rate represents: 1 JPY = X USD.

## FX Conversion Layer
The system implements an FX conversion layer for aggregation endpoints (like Net Worth).

### Data Source
- **Collection**: `currencies/{pairId}/prices/{date}`
- **Structure**:
  ```typescript
  {
    date: string; // YYYY-MM-DD
    rate: number;
    base: string;
    quote: string;
  }
  ```

### Data Seeding
- **Script**: `packages/shared/lib/seed_currency.ts`
- **Function**: Populates the `currencies` collection with historical rates (e.g., JPY/USD for the past year) to enable testing of multi-currency features.

### Net Worth Calculation
1.  **Fetch Rates**: The server fetches daily rates for all required pairs for the requested date range.
2.  **Normalize**: For each account checkpoint:
    - If `account.currency` is not `USD` (Base), look up the rate.
    - Convert balance to USD using the rate.
3.  **Aggregate**: Sum the normalized USD values.

## Limitations
- **Fallback Strategy**: Currently, if a daily rate is missing, the system may fall back to 0 or a previous rate. Robust "fill forward" logic for missing rates is a future optimization.
- **Base Currency**: The system currently assumes `USD` as the global base currency for reporting.
