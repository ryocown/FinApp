import { z } from 'zod';

const DateProtoSchema = z.object({
  timestamp: z.number(),
  year: z.number(),
  month: z.number(),
  day: z.number(),
  quarter: z.number(),
});

export const AccountSchema = z.object({
  name: z.string().min(1),
  instituteId: z.string().min(1),
  type: z.string(),
  currency: z.object({
    code: z.string().length(3),
    symbol: z.string(),
    name: z.string().optional(),
  }),
  balance: z.number().optional(),
  balanceDate: z.union([z.string(), z.date(), DateProtoSchema]).optional(),
  initialBalance: z.number().optional(),
  initialDate: z.string().optional(),
  accountNumber: z.string().optional(),
});

export const UpdateAccountSchema = AccountSchema.partial();

export const TransactionSchema = z.object({
  accountId: z.string(),
  amount: z.number(),
  date: z.string().or(DateProtoSchema), // Allow ISO string or DateProto
  description: z.string().nullable().optional(),
  categoryId: z.string().optional(),
  transactionType: z.string().optional(),
  currency: z.object({
    code: z.string().length(3),
    symbol: z.string(),
    name: z.string().optional(),
  }).optional(),
  tagIds: z.array(z.string()).optional(),
  statementId: z.string().nullable().optional(),
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
  type: z.string().optional(),
  supportedInstituteId: z.string().optional() // New field
});

/**
 * Schema for batch transaction import.
 * Validates the structure of the request body.
 */
export const BatchTransactionSchema = z.object({
  transactions: z.array(z.object({
    amount: z.number(),
    date: z.string().or(DateProtoSchema), // ISO date string or Proto
    description: z.string().nullable().optional(),
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
