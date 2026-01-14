import { Router, type Request, type Response, type NextFunction } from 'express';
import { checkAuth, type AuthRequest } from '../middleware/auth.js';
import { AccountSchema, UpdateAccountSchema } from '../schemas/index.js';
import { validate } from '../middleware/validate.js';
import { logger } from '../logger.js';
import { AccountService } from '../services/accounts.js';
import { ReconciliationService } from '../services/reconciliation.js';
import { toDateProto } from '@finapp/shared';
import { ApiError } from '../errors/index.js';

const router = Router();

/**
 * Wrapper to catch async errors and pass them to the error handler.
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Get accounts for a user
router.get('/users/:userId/accounts', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (!userId) {
    throw ApiError.badRequest('Missing userId');
  }

  if ((req as AuthRequest).user!.uid !== userId) {
    throw ApiError.forbidden('Access denied');
  }

  const accounts = await AccountService.getUserAccounts(userId);
  res.json(accounts);
}));

// Create an account for a user
router.post('/users/:userId/accounts', checkAuth, validate(AccountSchema), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    throw ApiError.badRequest('Missing userId');
  }

  if ((req as AuthRequest).user!.uid !== userId) {
    throw ApiError.forbidden('Access denied');
  }

  const { initialBalance, initialDate, ...accountData } = req.body;

  logger.info('Creating account:', { body: req.body, accountData });

  const account = await AccountService.createAccount(userId, accountData, initialBalance, initialDate);
  res.status(201).json(account);
}));

// Update an account
router.put('/users/:userId/accounts/:accountId', checkAuth, validate(UpdateAccountSchema), asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;

  if (!userId || !accountId) {
    throw ApiError.badRequest('Missing userId or accountId');
  }

  await AccountService.updateAccount(userId, accountId, req.body);
  res.status(200).json({ message: 'Account updated successfully' });
}));

// Get budget for a user
router.get('/users/:userId/budget', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    throw ApiError.badRequest('Missing userId');
  }

  if ((req as AuthRequest).user!.uid !== userId) {
    throw ApiError.forbidden('Access denied');
  }

  const budget = await AccountService.getUserBudget(userId);
  res.json(budget);
}));

// Get transactions for a specific account
router.get('/users/:userId/accounts/:accountId/transactions', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;
  const { limit, pageToken, sortOrder } = req.query;

  if (!userId || !accountId) {
    throw ApiError.badRequest('Missing userId or accountId');
  }

  const options: { limit?: number; pageToken?: string; sortOrder?: 'asc' | 'desc' } = {};
  if (limit) options.limit = Number(limit);
  if (pageToken) options.pageToken = pageToken as string;
  if (sortOrder === 'asc' || sortOrder === 'desc') options.sortOrder = sortOrder;

  const result = await AccountService.getAccountTransactions(userId, accountId, options);

  res.json(result);
}));

// Reconcile account balance
router.post('/users/:userId/accounts/:accountId/reconcile', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;
  const { date, balance } = req.body;

  if (!userId || !accountId || !date || balance === undefined) {
    throw ApiError.badRequest('Missing required fields');
  }

  const checkpoint = await ReconciliationService.reconcileAccount(
    userId,
    accountId,
    toDateProto(new Date(date)),
    Number(balance)
  );

  res.status(201).json(checkpoint);
}));

// Get balance checkpoints for an account
router.get('/users/:userId/accounts/:accountId/checkpoints', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;

  if (!userId || !accountId) {
    throw ApiError.badRequest('Missing userId or accountId');
  }

  const checkpoints = await AccountService.getAccountCheckpoints(userId, accountId);
  res.json(checkpoints);
}));

// Delete a checkpoint
router.delete('/users/:userId/accounts/:accountId/checkpoints/:checkpointId', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId, checkpointId } = req.params;

  if (!userId || !accountId || !checkpointId) {
    throw ApiError.badRequest('Missing required fields');
  }

  await ReconciliationService.deleteCheckpoint(userId, accountId, checkpointId);
  res.status(200).json({ message: 'Checkpoint deleted successfully' });
}));

// Delete an account
router.delete('/users/:userId/accounts/:accountId', checkAuth, asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;

  if (!userId || !accountId) {
    throw ApiError.badRequest('Missing userId or accountId');
  }

  await AccountService.deleteAccount(userId, accountId);
  res.status(200).json({ message: 'Account deleted successfully' });
}));

export default router;
