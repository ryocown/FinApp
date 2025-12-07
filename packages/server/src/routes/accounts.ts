import { Router, type Request, type Response, type NextFunction } from 'express';
import { AccountSchema } from '../schemas';
import { validate } from '../middleware/validate';
import { logger } from '../logger';
import { AccountService } from '../services/accounts';
import { ReconciliationService } from '../services/reconciliation';
import { ApiError } from '../errors';

const router = Router();

/**
 * Wrapper to catch async errors and pass them to the error handler.
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Get accounts for a user
router.get('/users/:userId/accounts', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (!userId) {
    throw ApiError.badRequest('Missing userId');
  }
  const accounts = await AccountService.getUserAccounts(userId);
  res.json(accounts);
}));

// Create an account for a user
router.post('/users/:userId/accounts', validate(AccountSchema), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    throw ApiError.badRequest('Missing userId');
  }

  const { initialBalance, initialDate, ...accountData } = req.body;

  logger.info('Creating account:', { body: req.body, accountData });

  const account = await AccountService.createAccount(userId, accountData, initialBalance, initialDate);
  res.status(201).json(account);
}));

// Get budget for a user
router.get('/users/:userId/budget', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    throw ApiError.badRequest('Missing userId');
  }
  const budget = await AccountService.getUserBudget(userId);
  res.json(budget);
}));

// Get transactions for a specific account
router.get('/users/:userId/accounts/:accountId/transactions', asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;
  const { limit, pageToken } = req.query;

  if (!userId || !accountId) {
    throw ApiError.badRequest('Missing userId or accountId');
  }

  const options: { limit?: number; pageToken?: string } = {};
  if (limit) options.limit = Number(limit);
  if (pageToken) options.pageToken = pageToken as string;

  const result = await AccountService.getAccountTransactions(userId, accountId, options);

  res.json(result);
}));

// Reconcile account balance
router.post('/users/:userId/accounts/:accountId/reconcile', asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;
  const { date, balance } = req.body;

  if (!userId || !accountId || !date || balance === undefined) {
    throw ApiError.badRequest('Missing required fields');
  }

  const checkpoint = await ReconciliationService.reconcileAccount(
    userId,
    accountId,
    new Date(date),
    Number(balance)
  );

  res.status(201).json(checkpoint);
}));

// Get balance checkpoints for an account
router.get('/users/:userId/accounts/:accountId/checkpoints', asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;

  if (!userId || !accountId) {
    throw ApiError.badRequest('Missing userId or accountId');
  }

  const checkpoints = await AccountService.getAccountCheckpoints(userId, accountId);
  res.json(checkpoints);
}));

// Delete a checkpoint
router.delete('/users/:userId/accounts/:accountId/checkpoints/:checkpointId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId, checkpointId } = req.params;

  if (!userId || !accountId || !checkpointId) {
    throw ApiError.badRequest('Missing required fields');
  }

  await ReconciliationService.deleteCheckpoint(userId, accountId, checkpointId);
  res.status(200).json({ message: 'Checkpoint deleted successfully' });
}));

// Delete an account
router.delete('/users/:userId/accounts/:accountId', asyncHandler(async (req: Request, res: Response) => {
  const { userId, accountId } = req.params;

  if (!userId || !accountId) {
    throw ApiError.badRequest('Missing userId or accountId');
  }

  await AccountService.deleteAccount(userId, accountId);
  res.status(200).json({ message: 'Account deleted successfully' });
}));

export default router;
