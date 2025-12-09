# Domain Models

This document outlines the core domain models shared between the Client and Server, located in `packages/shared/models`.

## Account (`models/account.ts`)

The `IAccount` interface represents a user's financial account.

```typescript
export interface IAccount {
  accountId: string;
  instituteId?: string;
  userId: string;

  accountNumber: string; // Last 4 digits or full number, optional in schema but required in model
  balance: number;
  balanceDate: Date;
  country: string;
  currency: ICurrency;
  name: string;
  AccountType: AccountType;
  isTaxable: boolean;
}
```

### AccountType Enum

The `AccountType` enum defines the supported categories of accounts. These values are used directly in the UI for display and logic.

```typescript
export enum AccountType {
  BANK = 'Bank',
  CREDIT_CARD = 'Credit Card',
  INVESTMENT = 'Investment',
  SUPERANNUATION = 'Superannuation',
  EMPLOYER = 'Employer',
  LOAN = 'Loan',
  OTHER = 'Other',
  INVALID = 'Invalid'
}
```

## Institute (`models/institute.ts`)

The `IInstitute` interface represents a financial institution (e.g., Chase, Morgan Stanley).

```typescript
export interface IInstitute {
  instituteId: string;
  name: string;
  userId: string;
}

export enum SupportedInstitute {
  CHASE = 'Chase',
  MORGAN_STANLEY = 'Morgan Stanley',
  // ...
}
```

## Usage Patterns

1.  **Shared Validation**: These models are often mirrored by Zod schemas in the server (`packages/server/src/schemas/index.ts`) for runtime validation.
2.  **Frontend Display**: Enum values like `AccountType.BANK` ('Bank') are often used directly as display labels in the UI, avoiding the need for separate mapping objects.
