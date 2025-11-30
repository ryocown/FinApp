import { z } from 'zod';

export const AccountSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  currency: z.string().length(3),
  balance: z.number(),
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
