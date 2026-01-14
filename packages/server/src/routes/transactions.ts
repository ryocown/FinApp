import { Router, type Request, type Response, type NextFunction } from 'express';
import { TransactionSchema, BatchTransactionSchema, UpdateTransactionSchema } from '../schemas/index.js';
import { validate } from '../middleware/validate.js';
import { TransactionService } from '../services/transactions.js';
import { ApiError } from '../errors/index.js';
import { checkAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Wrapper to catch async errors and pass them to the error handler.
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Verify User ID matches Authenticated User
const verifyUser = (req: Request, targetUserId: string | undefined) => {
  if (!targetUserId) {
    throw ApiError.badRequest('Missing userId');
  }
  const authReq = req as AuthRequest;
  if (!authReq.user || authReq.user.uid !== targetUserId) {
    throw ApiError.forbidden('Access denied');
  }
};

// Get all transactions for a user, optionally filtered by account
router.get('/users/:userId/transactions', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  verifyUser(req, userId);

  const { accountId, limit, pageToken, sortOrder } = req.query;

  const options: { accountId?: string; limit?: number; pageToken?: string; sortOrder?: 'asc' | 'desc' } = {};
  if (accountId) options.accountId = accountId as string;
  if (limit) options.limit = Number(limit);
  if (pageToken) options.pageToken = pageToken as string;
  if (sortOrder === 'asc' || sortOrder === 'desc') options.sortOrder = sortOrder;

  const result = await TransactionService.getUserTransactions(userId!, options);

  res.json(result);
}));

// Create a transaction for a user
router.post('/users/:userId/transactions', checkAuth, validate(TransactionSchema), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  verifyUser(req, userId);

  const transaction = await TransactionService.createTransaction(userId!, req.body);
  res.status(201).json(transaction);
}));

// Batch create transactions
router.post('/users/:userId/accounts/:accountId/transactions/batch', checkAuth, validate(BatchTransactionSchema), asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;
  verifyUser(req, userId);

  if (!accountId) {
    throw ApiError.badRequest('Missing accountId');
  }

  const result = await TransactionService.batchCreateTransactions(userId!, accountId, req.body.transactions, { skipDuplicates: req.body.skipDuplicates });
  res.status(201).json(result);
}));

// Delete a transaction
router.delete('/users/:userId/transactions/:transactionId', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId, transactionId } = req.params;
  verifyUser(req, userId);

  if (!transactionId) {
    throw ApiError.badRequest('Missing transactionId');
  }

  await TransactionService.deleteTransaction(userId!, transactionId);
  res.status(200).json({ message: 'Transaction deleted successfully' });
}));

// Update a transaction
router.put('/users/:userId/transactions/:transactionId', checkAuth, validate(UpdateTransactionSchema), asyncHandler(async (req: Request, res: Response) => {
  const { userId, transactionId } = req.params;
  verifyUser(req, userId);

  if (!transactionId) {
    throw ApiError.badRequest('Missing transactionId');
  }

  await TransactionService.updateTransaction(userId!, transactionId, req.body);
  res.status(200).json({ message: 'Transaction updated successfully' });
}));

// Create atomic transfer between two accounts
router.post('/users/:userId/transfers', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  verifyUser(req, userId);

  const { source, destination } = req.body;

  if (!source || !destination) {
    throw ApiError.badRequest('Missing source or destination transaction');
  }

  const result = await TransactionService.createTransfer(userId!, source, destination);
  res.status(201).json(result);
}));

export default router;
