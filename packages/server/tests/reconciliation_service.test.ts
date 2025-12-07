import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock uuid before imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// Mock firebase
jest.mock('../src/firebase', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    batch: jest.fn(),
  },
  getUserRef: jest.fn(),
  getAccountRef: jest.fn(),
}));

// Mock logger
jest.mock('../src/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { ReconciliationService } from '../src/services/reconciliation';
import { BalanceCheckpointType } from '../../shared/models/balance_checkpoint';
import { TransactionType } from '../../shared/models/transaction';
import { db, getUserRef, getAccountRef } from '../src/firebase';

describe('ReconciliationService', () => {
  const userId = 'test-user';
  const accountId = 'test-account';

  // Create fresh mock objects for return values
  const mockCollectionObj = {
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    get: jest.fn(),
    doc: jest.fn(),
    add: jest.fn(),
  };

  const mockDocObj = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    collection: jest.fn(),
    id: 'mock-doc-id',
    data: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    (getAccountRef as jest.Mock).mockResolvedValue({ ref: mockDocObj });
    (getUserRef as jest.Mock).mockReturnValue(mockDocObj);

    // Setup chaining
    (mockDocObj.collection as jest.Mock).mockReturnValue(mockCollectionObj);
    (mockCollectionObj.doc as jest.Mock).mockReturnValue(mockDocObj);
    (mockCollectionObj.where as jest.Mock).mockReturnValue(mockCollectionObj);
    (mockCollectionObj.orderBy as jest.Mock).mockReturnValue(mockCollectionObj);
    (mockCollectionObj.limit as jest.Mock).mockReturnValue(mockCollectionObj);

    // Setup db mock
    (db.batch as jest.Mock).mockReturnValue({
      set: jest.fn(),
      commit: jest.fn(),
    });
  });

  describe('reconcileAccount', () => {
    it('should create a reconciliation adjustment when there is a difference', async () => {
      // Setup:
      // Last checkpoint: Balance 1000 at Jan 1
      // Transactions: -100 on Jan 2
      // Target: Balance 950 at Jan 3
      // Expected: 1000 - 100 = 900
      // Adjustment needed: 950 - 900 = +50

      const lastCheckpoint = {
        id: 'cp1',
        date: new Date('2025-01-01'),
        balance: 1000,
        type: BalanceCheckpointType.MANUAL
      };

      const transactions = [
        {
          transactionId: 'tx1',
          amount: -100,
          date: new Date('2025-01-02'),
          transactionType: TransactionType.General
        }
      ];

      // Mock last checkpoint query
      (mockCollectionObj.get as jest.Mock)
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ data: () => lastCheckpoint }],
          forEach: (cb: any) => [{ data: () => lastCheckpoint }].forEach(cb)
        }) // lastCheckpointSnap
        .mockResolvedValueOnce({
          empty: false,
          docs: transactions.map(t => ({ data: () => t })),
          forEach: (cb: any) => transactions.map(t => ({ data: () => t })).forEach(cb)
        }); // transactionsSnap

      // Mock account data for balance update check
      (mockDocObj.get as jest.Mock).mockResolvedValue({ data: () => ({ balanceDate: new Date('2025-01-01') }) });

      await ReconciliationService.reconcileAccount(
        userId,
        accountId,
        new Date('2025-01-03'),
        950
      );

      // Verify adjustment transaction creation
      expect(mockCollectionObj.doc).toHaveBeenCalledWith(expect.any(String)); // New tx ID
      expect(mockDocObj.set).toHaveBeenCalledWith(expect.objectContaining({
        amount: 50,
        transactionType: TransactionType.Reconciliation,
        description: 'Reconciliation Adjustment'
      }));
    });

    it('should NOT create adjustment if balance matches', async () => {
      // Setup:
      // Last checkpoint: 1000
      // Transactions: -100
      // Target: 900
      // Expected: 900
      // Adjustment: 0

      const lastCheckpoint = {
        id: 'cp1',
        date: new Date('2025-01-01'),
        balance: 1000,
        type: BalanceCheckpointType.MANUAL
      };

      const transactions = [
        {
          transactionId: 'tx1',
          amount: -100,
          date: new Date('2025-01-02'),
          transactionType: TransactionType.General
        }
      ];

      (mockCollectionObj.get as jest.Mock)
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ data: () => lastCheckpoint }],
          forEach: (cb: any) => [{ data: () => lastCheckpoint }].forEach(cb)
        })
        .mockResolvedValueOnce({
          empty: false,
          docs: transactions.map(t => ({ data: () => t })),
          forEach: (cb: any) => transactions.map(t => ({ data: () => t })).forEach(cb)
        });

      (mockDocObj.get as jest.Mock).mockResolvedValue({ data: () => ({ balanceDate: new Date('2025-01-01') }) });

      await ReconciliationService.reconcileAccount(
        userId,
        accountId,
        new Date('2025-01-03'),
        900
      );

      // Verify NO adjustment transaction created (set not called for tx)
      // Note: set IS called for checkpoint, so we need to be specific
      const setCalls = (mockDocObj.set as jest.Mock).mock.calls;
      const txCall = setCalls.find((call: any) => call[0].transactionType === TransactionType.Reconciliation);
      expect(txCall).toBeUndefined();
    });
  });
});
