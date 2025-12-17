# Firestore Schema

## Collections

### Users (Root)
- **Collection**: `users`
- **Document ID**: `userId` (UUID v4)
- **Model**: `IUser`
- **Subcollections**:
    - `institutes`: Financial institutions linked to the user.
    - `budget`: Budget categories and limits.
    - `transactions`: **Global Pointers** for ID-based lookup (e.g., Deletion). Contains `{ RefTxId }`. Note: "All Transactions" listing uses **Collection Group Queries** on the nested collections, NOT this pointer collection.

### Institutes (Nested)
- **Path**: `users/{userId}/institutes`
- **Document ID**: `instituteId` (UUID v4)
- **Model**: `IInstitute`
- **Subcollections**:
    - `accounts`: Accounts belonging to this institute.

### Accounts (Nested)
- **Path**: `users/{userId}/institutes/{instituteId}/accounts`
- **Document ID**: `accountId` (UUID v4)
- **Model**: `IAccount`
- **Subcollections**:
    - `transactions`: Actual transaction data for this account.
    - `balance_checkpoints`: History of balance updates.

### Currencies (Global)
- **Collection**: `currencies`
- **Document ID**: `pairId` (Canonical Pair, e.g., `JPYUSD`)
- **Model**: `ICurrencyPair` (Metadata)
- **Subcollections**:
    - `prices`: Daily exchange rates.
        - **Document ID**: `date` (YYYY-MM-DD)
        - **Model**: `{ date, rate, base, quote }`

## Design Decisions
- **Nested Transactions**: Transactions are stored deep within the hierarchy (`.../accounts/{accountId}/transactions`) to logically group them with their source account.
- **Transaction References**: A top-level `users/{userId}/transactions` collection stores references (`RefTxId`) to the actual transaction documents. This enables "All Transactions" queries while maintaining the logical hierarchy.
- **Implementation**: See `finapp_server_architecture` for helper functions (`getCollectionData`, `getAllUserAccounts`, `resolveTransactionReferences`) used to interact with this schema efficiently.
