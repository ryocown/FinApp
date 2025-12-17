# Instrument Service Design

## Overview
The Instrument Service manages the lifecycle, retrieval, and enrichment of financial instruments. It exposes endpoints for searching instruments by ticker/name and creating new instruments with automatic enrichment.

## API Endpoints

### 1. Search Instruments
**Endpoint**: `GET /instruments/search`
**Query Params**:
- `q`: Search query string (Ticker or Name)

**Logic**:
- Performs a dual-strategy search on the `instruments` collection:
    1.  **Ticker Match**: Searches for instruments where `ticker` starts with `q` (case-insensitive simulation via uppercase storage or query normalization).
    2.  **Name Match**: If fewer than 5 results found by ticker, searches where `name` starts with `q`.
- Returns a combined list of results (max ~10).

### 2. Get Instrument by CUSIP
**Endpoint**: `GET /instruments`
**Query Params**:
- `cusip`: The CUSIP to look up.

**Logic**:
- Returns the instrument if found.
- Returns 404 if not found.

### 3. Create Instrument
**Endpoint**: `POST /instruments`
**Body**: `{ cusip: string, name: string, type?: string }`

**Logic**:
1.  **Check Existence**: If instrument with `cusip` exists, return it.
2.  **Enrichment**:
    - If `type` is missing or `unknown`, query **Alpaca Quote Provider** to fetch details (Ticker, Name, Type).
    - If `name` is available, query **Gemini AI Provider** to determine the `sector`.
3.  **Persistence**: Save the new (enriched) instrument to Firestore.

## Dependencies
- **AlpacaQuoteProvider**: External API for financial data.
- **GeminiAIProvider**: AI service for semantic categorization (Sector).
- **Firestore**: Storage for `instruments` collection.
