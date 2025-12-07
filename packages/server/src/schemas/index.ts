import { z } from 'zod';

export const AccountSchema = z.object({
  name: z.string().min(1),
  instituteId: z.string().min(1),
  type: z.string(),
  currency: z.object({
    code: z.string().length(3),
    symbol: z.string(),
    name: z.string().optional(),
  }),
  balance: z.number(),
  initialBalance: z.number().optional(),
  initialDate: z.string().optional(),
  accountNumber: z.string().optional(),
});

export const UpdateAccountSchema = AccountSchema.partial();

export const TransactionSchema = z.object({
  accountId: z.string(),
  amount: z.number(),
  date: z.string(), // ISO date string
  description: z.string(),
  categoryId: z.string().optional(),
  transactionType: z.string().optional(),
  currency: z.object({
    code: z.string().length(3),
    symbol: z.string(),
    name: z.string().optional(),
  }).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const UpdateTransactionSchema = TransactionSchema.partial();

export const CategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
  parentId: z.string().optional(),
});

export const InstituteSchema = z.object({
  name: z.string().min(1),
  userId: z.string().min(1),
});

/**
 * Schema for batch transaction import.
 * Validates the structure of the request body.
 */
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
    transactionId: z.string().optional(), // Optional - will be generated if not provided
  })).min(1, 'At least one transaction is required'),
  skipDuplicates: z.boolean().optional(),
});
