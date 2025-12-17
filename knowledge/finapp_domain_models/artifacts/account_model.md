# Account Model

## Interface
```typescript
export interface IAccount {
  accountId: string;       // UUID v4
  instituteId?: string;    // UUID v4 (Optional in model, but REQUIRED for Account Creation)
  userId: string;          // Owner's User ID

  accountNumber: string;   // Last 4 digits or masked number
  name: string;            // User-friendly name (e.g., "Chase Checking")
  
  balance: number;         // Current balance (as of balanceDate)
  balanceDate: Date;       // Timestamp of the last balance update
  
  currency: ICurrency;     // { code, symbol, name }
  type: AccountType;       // 'checking', 'savings', 'credit_card', etc.
  
  // ... other fields
}
```

## Key Considerations
- **Institute Association**: Accounts are logically grouped under an Institute. While `instituteId` is optional in the interface (for flattened API responses), it is **mandatory** when creating a new account to ensure proper nesting in Firestore.
- **Currency**: Stored as a full object (`ICurrency`) to support display symbols without extra lookups.
- **Balance Strategy**: Uses an "Anchor & Backdate" strategy. The `balance` field represents the latest known state, updated via `balance_checkpoints`.

## Mutability
When updating an account via the API (`PUT /accounts/:accountId`), the following fields are **immutable** and will be ignored/stripped if present in the request:
- `accountId` (Identity)
- `userId` (Ownership)
- `instituteId` (Structural Parent)
- `balance` (Derived State - only updated via Reconciliation or Transactions)

Editable fields include:
- `name`
- `accountNumber`
- `type`
- `currency` (though changing this after creation may have side effects)
