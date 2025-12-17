# API Validation Layer

## Overview
The FinApp server uses **Zod** for runtime request validation. This ensures that all data entering the system conforms to strict type definitions before reaching the controller logic.

## Middleware
The `validate` middleware is applied to all write endpoints (`POST`, `PUT`, `PATCH`).

```typescript
// packages/server/src/middleware/validate.ts
export const validate = (schema: ZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    // parseAsync strips unknown keys by default
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    // ... error handling ...
  }
};
```

### Key Behavior: Stripping Unknown Keys
Zod's default behavior for `z.object()` is to **strip** any keys that are not explicitly defined in the schema.
*   **Security**: Prevents mass-assignment vulnerabilities.
*   **Maintenance**: Requires that any new field added to the frontend model **MUST** also be added to the backend Zod schema, or it will be silently discarded.

## Core Schemas
Schemas are defined in `packages/server/src/schemas/index.ts`.

### TransactionSchema
Used for creating and updating transactions.

```typescript
export const TransactionSchema = z.object({
  accountId: z.string(),
  amount: z.number(),
  date: z.string(), // ISO 8601 date string
  description: z.string(),
  
  // Optional Fields
  categoryId: z.string().optional(),
  transactionType: z.string().optional(), // e.g., 'EXPENSE', 'INCOME', 'TRANSFER'
  currency: z.object({
    code: z.string().length(3),
    symbol: z.string(),
    name: z.string().optional(),
  }).optional(),
  tagIds: z.array(z.string()).optional(),
});
```

### AccountSchema
Used for creating accounts.

```typescript
export const AccountSchema = z.object({
  name: z.string().min(1),
  instituteId: z.string().min(1),
  accountNumber: z.string().optional(), // Added for account details
  type: z.string(), // e.g., 'CHECKING', 'SAVINGS'
  currency: z.object({
    code: z.string().length(3),
    symbol: z.string(),
    name: z.string().optional(),
  }),
  balance: z.number(),
  initialBalance: z.number().optional(),
  initialDate: z.string().optional(),
});
```

### InstituteSchema
Used for creating institutes.

```typescript
export const InstituteSchema = z.object({
  name: z.string().min(1),
  userId: z.string().min(1),
});
```

### BatchTransactionSchema
Used for bulk import of transactions.

```typescript
export const BatchTransactionSchema = z.object({
  transactions: z.array(z.object({
    amount: z.number(),
    date: z.string(), // ISO date string
    description: z.string().optional(),
    categoryId: z.string().optional(),
    transactionType: z.string().optional(),
    currency: z.object({
      code: z.string().length(3),
      symbol: z.string(),
      name: z.string().optional(),
    }).optional(),
    tagIds: z.array(z.string()).optional(),
    transactionId: z.string().optional(),
  })).min(1, 'At least one transaction is required'),
  skipDuplicates: z.boolean().optional(), // If true, checks for existing IDs before insert
});
```
