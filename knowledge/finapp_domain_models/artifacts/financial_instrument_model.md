# Financial Instrument Model

## Overview
Financial Instruments represent tradable assets (Stocks, ETFs, Mutual Funds, etc.) and are stored in a top-level `instruments` collection in Firestore. They are referenced by `TradeTransaction`s via `instrumentId`.

## Data Structure

### Interface: `IFinancialInstrument`

```typescript
export interface IFinancialInstrument {
  id?: string; // Firestore Document ID
  cusip: string; // Unique Identifier (often used as key for lookup)
  ticker?: string; // Symbol (e.g., AAPL)
  name: string;
  type: InstrumentType;
  sector?: string;
  currency?: string;
  
  // Metadata
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any;
}
```

### Known Discrepancies
- **`ticker`**: While `StockInstrument` defines a `ticker` field, the base `IFinancialInstrument` interface does NOT include it. Client-side code often needs to cast to `any` or a specific type to access `ticker` when iterating over a mixed list of instruments.
- **`instrumentId` vs `id`**: The domain model uses `instrumentId` as the primary key. However, some legacy or client-side code might attempt to access `id`. Always use `instrumentId`.


### Enum: `InstrumentType`
- `Stock`
- `ETF`
- `MutualFund`
- `Cash`
- `Unknown`

## Enrichment Strategy
When a new instrument is encountered (e.g., via statement import or manual creation) and its details are incomplete (e.g., `type` is `Unknown`):

1.  **Quote Provider (Alpaca)**: Fetches `ticker`, `name`, and `type` using the CUSIP.
2.  **AI Provider (Gemini)**: If the name is known but sector is missing, AI is used to categorize the instrument into a `sector`.

## Search & Discovery
Instruments are indexed by `ticker` and `name` to support autocomplete in the UI.
- **Search API**: `GET /instruments/search?q={query}`
- **Logic**: Prefers `ticker` prefix match, falls back to `name` prefix match.
