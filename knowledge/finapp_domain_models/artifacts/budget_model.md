# Budget Model

## Interface: `IBudget`

Represents a spending limit or target for a specific category over a period.

```typescript
export enum BudgetPeriod {
  Weekly = 'WEEKLY',
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY',
  Custom = 'CUSTOM'
}

export interface IBudget {
  budgetId: string; // UUID (Primary Key)
  categoryId: string; // Foreign Key

  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date | null;
}
```

## Client-Side Representation
The frontend (e.g., `Budget.tsx`) often expects an aggregated or enriched view of the budget that differs from the raw `IBudget` entity.
- **Expected Fields**: `budget` (amount), `actual` (current spending), `color` (category color).
- **Raw Fields**: `amount`, `period`, `startDate`, `endDate`.
- **Discrepancy**: The client hook `useBudget` currently returns `any[]` to bypass strict type checks because the API returns this enriched structure which doesn't match the shared `IBudget` interface.


## Usage
- Links to a `Category` to define spending limits.
