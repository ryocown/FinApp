import { Router, type Request, type Response, type NextFunction } from 'express';
import { TransactionSchema, BatchTransactionSchema, UpdateTransactionSchema } from '../schemas';
import { validate } from '../middleware/validate';
import { TransactionService } from '../services/transactions';
import { ApiError } from '../errors';

const router = Router();

/**
 * Wrapper to catch async errors and pass them to the error handler.
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Get all transactions for a user, optionally filtered by account
router.get('/users/:userId/transactions', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { accountId, limit, pageToken, sortOrder } = req.query;

  if (!userId) {
    throw ApiError.badRequest('Missing userId');
  }

  const options: { accountId?: string; limit?: number; pageToken?: string; sortOrder?: 'asc' | 'desc' } = {};
  if (accountId) options.accountId = accountId as string;
  if (limit) options.limit = Number(limit);
  if (pageToken) options.pageToken = pageToken as string;
  if (sortOrder === 'asc' || sortOrder === 'desc') options.sortOrder = sortOrder;

  const result = await TransactionService.getUserTransactions(userId, options);

  res.json(result);
}));

// Create a transaction for a user
router.post('/users/:userId/transactions', validate(TransactionSchema), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    throw ApiError.badRequest('Missing userId');
  }

  const transaction = await TransactionService.createTransaction(userId, req.body);
  res.status(201).json(transaction);
}));

// Batch create transactions
router.post('/users/:userId/accounts/:accountId/transactions/batch', validate(BatchTransactionSchema), asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;
  const { transactions, skipDuplicates } = req.body;

  if (!userId || !accountId) {
    throw ApiError.badRequest('Missing userId or accountId');
  }

  const result = await TransactionService.batchCreateTransactions(userId, accountId, transactions, { skipDuplicates });
  res.status(201).json(result);
}));

// Delete a transaction
router.delete('/users/:userId/transactions/:transactionId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, transactionId } = req.params;

  if (!userId || !transactionId) {
    throw ApiError.badRequest('Missing userId or transactionId');
  }

  await TransactionService.deleteTransaction(userId, transactionId);
  res.status(200).json({ message: 'Transaction deleted successfully' });
}));

// Update a transaction
router.put('/users/:userId/transactions/:transactionId', validate(UpdateTransactionSchema), asyncHandler(async (req: Request, res: Response) => {
  const { userId, transactionId } = req.params;

  if (!userId || !transactionId) {
    throw ApiError.badRequest('Missing userId or transactionId');
  }

  await TransactionService.updateTransaction(userId, transactionId, req.body);
  res.status(200).json({ message: 'Transaction updated successfully' });
}));

// Create atomic transfer between two accounts
router.post('/users/:userId/transfers', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { source, destination } = req.body;

  if (!userId) {
    throw ApiError.badRequest('Missing userId');
  }

  if (!source || !destination) {
    throw ApiError.badRequest('Missing source or destination transaction');
  }

  const result = await TransactionService.createTransfer(userId, source, destination);
  res.status(201).json(result);
}));

export default router;
