# Supporting Domain Models

This artifact documents smaller, supporting entities in the FinApp domain model.

## Merchant Model

### Interface: `IMerchant`
Represents a vendor or entity for general transactions.

```typescript
export interface IMerchant {
  merchantId: string; // UUID (Primary Key)
  name: string;
  category: string;
  type: string;
}
```

### Usage
- Linked to `IGeneralTransaction` to identify who the transaction was with.

---

## Tag Model

### Interface: `ITag`
Represents a label that can be attached to transactions for flexible organization.

```typescript
export interface ITag {
  tagId: string; // UUID (Primary Key)

  name: string;
  color: string;
}
```

### Usage
- Transactions can have multiple tags via `tagIds: string[]`.

---

## User Model

### Interface: `IUser`
Represents a system user who owns accounts.

```typescript
export interface IUser {
  userId: string; // UUID (Primary Key)

  email: string;
  name: string;
}
```

### Usage
- Accounts should be linked to a `User` (implementation pending in `IAccount`).

---

## Price History Model

### Interface: `IPricePoint`
Represents historical pricing data for financial instruments or currencies.

```typescript
export interface IPricePoint {
  pricePointId: string; // UUID (Primary Key)
  targetId: string; // Foreign Key (instrumentId or currencyPairId)
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Metadata
}
```

### Usage
- Used to track the performance of assets over time.
- Can be linked to `IFinancialInstrument` (via `instrumentId`) or `ICurrencyPair`.

---

## Statement Model

### Interface: `IStatement`
Represents a monthly or periodic statement for an account.

```typescript
export interface IStatement {
  statementId: string; // UUID (Primary Key)
  accountId: string; // Foreign Key

  startDate: Date;
  endDate: Date;
  endingBalance?: number; // Optional: The closing balance of the statement (Anchor)
  transactions: ITransaction[];
}
```

### Purpose
- Groups transactions within a specific date range for reconciliation or reporting.
