# Currency Service Design

## Overview
The Currency Service is responsible for managing and retrieving foreign exchange (FX) rates. It supports the multi-currency capabilities of the application, particularly for Net Worth calculation and balance normalization.

## API Endpoints

### `GET /api/currencies/rates`
Retrieves the latest exchange rates for supported currency pairs.

-   **Purpose**: Used by the frontend (and potentially other services) to get the most recent conversion rates.
-   **Response Format**:
    ```json
    {
      "JPYUSD": 0.0067,
      "EURUSD": 1.05
    }
    ```
-   **Implementation Details**:
    -   Currently hardcoded to fetch specific pairs (e.g., `JPYUSD`).
    -   Queries the `currencies/{pairId}/prices` sub-collection.
    -   **Query Strategy**: `orderBy('date', 'desc').limit(1)` to get the latest available rate.
    -   **Fallback**: If no rate is found, it is omitted from the response (or potentially falls back to a default if implemented).

## Data Storage Strategy

### Collection Structure
Currencies are stored in a top-level `currencies` collection to allow global access (not user-scoped).

-   **Root Collection**: `currencies`
    -   **Document ID**: Canonical Pair ID (e.g., `JPYUSD`).
    -   **Sub-collection**: `prices`
        -   **Document ID**: Date string (`YYYY-MM-DD`).
        -   **Fields**:
            -   `date`: String (ISO 8601 Date, `YYYY-MM-DD`).
            -   `rate`: Number (Exchange rate).
            -   `base`: String (Base currency code, e.g., `JPY`).
            -   `quote`: String (Quote currency code, e.g., `USD`).

### Canonical Pair Logic
To avoid data duplication (storing both `JPYUSD` and `USDJPY`), the system enforces a canonical direction:
-   **Rule**: Alphabetical order of currency codes.
-   **Logic**: `Base < Quote` ? `BaseQuote` : `QuoteBase`.
-   **Example**: `JPY` vs `USD` -> `JPY` comes before `USD` -> ID is `JPYUSD`.

## Data Seeding
FX rates are populated via the `seed_currency.ts` script.
-   **Path**: `packages/shared/lib/seed_currency.ts`
-   **Function**: Generates daily price points for the past year (or specified range).
-   **Resolution**: 1 Day (Daily close/avg).
