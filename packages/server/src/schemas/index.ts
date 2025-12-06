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
});

export const TransactionSchema = z.object({
  accountId: z.string(),
  amount: z.number(),
  date: z.string(), // ISO date string
  description: z.string(),
  categoryId: z.string().optional(),
});

export const CategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
  parentId: z.string().optional(),
});

export const InstituteSchema = z.object({
  name: z.string().min(1),
  userId: z.string().min(1),
});
