import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { TransactionType } from '@finapp/shared/models/transaction';

// Define mocks before imports
jest.unstable_mockModule('../../src/firebase', () => ({
  db: {
    batch: jest.fn(() => ({
      set: jest.fn(),
      commit: jest.fn(),
      delete: jest.fn(),
    })),
    collectionGroup: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnValue(Promise.resolve({ docs: [], empty: true } as any)),
    })),
  },
  getUserRef: jest.fn(),
  getAccountRef: jest.fn(),
  resolveTransactionReferences: jest.fn(),
}));

jest.unstable_mockModule('../../src/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/services/reconciliation', () => ({
  ReconciliationService: {
    refreshCheckpoints: jest.fn(),
  },
}));

jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-12345'),
}));

// Dynamic imports after mocks
const { TransactionService } = await import('../../src/services/transactions');
const { getUserRef, getAccountRef, db } = await import('../../src/firebase');

describe('TransactionService', () => {
  const userId = 'test-user-id';
  const accountId = 'test-account-id';
  const transactionId = 'test-tx-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should throw ApiError when account does not exist', async () => {
      (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

      const mockTx = {
        accountId: 'non-existent-account',
        amount: -50,
        date: new Date(),
        transactionType: TransactionType.General,
      };

      await expect(TransactionService.createTransaction(userId, mockTx as any))
        .rejects.toThrow(/not found/i);
    });

    it('should set transaction to nested collection and create global reference', async () => {
      const mockNestedRef = {
        set: jest.fn().mockReturnValue(Promise.resolve()),
        id: 'nested-tx-id',
      };

      const mockAccountRef = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue(mockNestedRef),
        }),
      };

      const mockGlobalRef = {
        set: jest.fn().mockReturnValue(Promise.resolve()),
      };

      (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));
      (getUserRef as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue(mockGlobalRef),
        }),
      });

      const mockTx = {
        accountId,
        transactionId: 'my-tx-id',
        amount: -100,
        date: new Date(),
        transactionType: TransactionType.General,
      };

      const result = await TransactionService.createTransaction(userId, mockTx as any);

      // Nested ref should have been called with full transaction
      expect(mockNestedRef.set).toHaveBeenCalledWith(expect.objectContaining({
        accountId,
        amount: -100,
        userId,
      }));

      // Global ref should have been called with RefTxId pointer
      expect(mockGlobalRef.set).toHaveBeenCalledWith({ RefTxId: mockNestedRef });

      expect(result.transactionId).toBe('nested-tx-id');
    });
  });

  describe('deleteTransaction', () => {
    it('should throw ApiError when transaction does not exist', async () => {
      (getUserRef as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue(Promise.resolve({ exists: false })),
          }),
        }),
      });

      await expect(TransactionService.deleteTransaction(userId, 'non-existent'))
        .rejects.toThrow(/not found/i);
    });

    it('should delete both nested ref and global ref', async () => {
      const mockNestedRef = {
        delete: jest.fn().mockReturnValue(Promise.resolve()),
      };

      const mockGlobalRef = {
        get: jest.fn().mockReturnValue(Promise.resolve({
          exists: true,
          data: () => ({ RefTxId: mockNestedRef }),
        })),
        delete: jest.fn().mockReturnValue(Promise.resolve()),
      };

      (getUserRef as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue(mockGlobalRef),
        }),
      });

      await TransactionService.deleteTransaction(userId, transactionId);

      expect(mockNestedRef.delete).toHaveBeenCalled();
      expect(mockGlobalRef.delete).toHaveBeenCalled();
    });
  });

  describe('createTransfer', () => {
    it('should throw ApiError when source account does not exist', async () => {
      (getAccountRef as jest.Mock)
        .mockReturnValueOnce(Promise.resolve(null)) // Source doesn't exist
        .mockReturnValueOnce(Promise.resolve({ ref: {} })); // Dest exists

      await expect(TransactionService.createTransfer(
        userId,
        { accountId: 'source', amount: -100 } as any,
        { accountId: 'dest', amount: 100 } as any
      )).rejects.toThrow(/source account.*not found/i);
    });

    it('should throw ApiError when destination account does not exist', async () => {
      (getAccountRef as jest.Mock)
        .mockReturnValueOnce(Promise.resolve({ ref: {} })) // Source exists
        .mockReturnValueOnce(Promise.resolve(null)); // Dest doesn't exist

      await expect(TransactionService.createTransfer(
        userId,
        { accountId: 'source', amount: -100 } as any,
        { accountId: 'dest', amount: 100 } as any
      )).rejects.toThrow(/destination account.*not found/i);
    });

    it('should commit both transactions atomically in a batch', async () => {
      const mockBatchSet = jest.fn();
      const mockBatchCommit = jest.fn().mockReturnValue(Promise.resolve());

      (db.batch as jest.Mock).mockReturnValue({
        set: mockBatchSet,
        commit: mockBatchCommit,
      });

      const mockSourceAccountRef = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ id: 'source-nested' }),
        }),
      };

      const mockDestAccountRef = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ id: 'dest-nested' }),
        }),
      };

      (getAccountRef as jest.Mock)
        .mockReturnValueOnce(Promise.resolve({ ref: mockSourceAccountRef }))
        .mockReturnValueOnce(Promise.resolve({ ref: mockDestAccountRef }));

      (getUserRef as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ id: 'global-ref' }),
        }),
      });

      await TransactionService.createTransfer(
        userId,
        { accountId: 'source', transactionId: 'src-tx', amount: -100 } as any,
        { accountId: 'dest', transactionId: 'dest-tx', amount: 100 } as any
      );

      // Should have 4 batch.set calls: 2 nested + 2 global refs
      expect(mockBatchSet).toHaveBeenCalledTimes(4);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateTransaction', () => {
    it('should handle Firestore Timestamp dates correctly during update', async () => {
      // Mock existing transaction with Timestamp date (simulating Firestore behavior)
      const mockTimestamp = {
        toDate: () => new Date('2025-01-01T00:00:00Z'),
      };

      const mockNestedTx = {
        transactionId,
        accountId,
        userId,
        amount: 100,
        date: mockTimestamp, // Simulating Firestore Timestamp
        transactionType: TransactionType.General,
      };

      const mockNestedRef = {
        get: jest.fn().mockReturnValue(Promise.resolve({
          exists: true,
          data: () => mockNestedTx,
        } as any)),
        update: jest.fn(),
        id: transactionId,
      };

      (getUserRef as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue(Promise.resolve({
              exists: true,
              data: () => ({ RefTxId: mockNestedRef }),
            } as any)),
          }),
        }),
      });

      // Perform update
      const updates = {
        amount: 200,
        date: new Date('2025-01-02T00:00:00Z'),
      };

      await TransactionService.updateTransaction(userId, transactionId, updates);

      // Verify update was called
      expect(mockNestedRef.update).toHaveBeenCalledWith(expect.objectContaining({
        amount: 200,
        date: expect.any(Date),
      }));
    });

    it('should throw error if date handling is broken (reproduction case)', async () => {
      // This test is designed to FAIL if the fix is not implemented

      const mockTimestamp = {
        toDate: () => new Date('2025-01-01T00:00:00Z'),
        // Missing toISOString method
      };

      const mockNestedTx = {
        transactionId,
        accountId,
        userId,
        amount: 100,
        date: mockTimestamp, // Simulating Firestore Timestamp
        transactionType: TransactionType.General,
      };

      const mockNestedRef = {
        get: jest.fn().mockReturnValue(Promise.resolve({
          exists: true,
          data: () => mockNestedTx,
        } as any)),
        update: jest.fn(),
        id: transactionId,
      };

      (getUserRef as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue(Promise.resolve({
              exists: true,
              data: () => ({ RefTxId: mockNestedRef }),
            } as any)),
          }),
        }),
      });

      const updates = {
        amount: 200,
        date: new Date('2025-01-02T00:00:00Z'),
      };

      // If the code tries to call .toISOString() on mockTimestamp, it will throw TypeError
      await expect(TransactionService.updateTransaction(userId, transactionId, updates))
        .resolves.not.toThrow();
    });

    it('should pass a Date object (not Timestamp) to ReconciliationService', async () => {
      // This test reproduces the bug where a Firestore Timestamp is passed to ReconciliationService

      const mockTimestamp = {
        toDate: () => new Date('2025-01-01T00:00:00Z'),
        // toISOString is missing, simulating Timestamp
      };

      const mockNestedTx = {
        transactionId,
        accountId,
        userId,
        amount: 100,
        date: mockTimestamp, // Simulating Firestore Timestamp
        transactionType: TransactionType.General,
      };

      const mockNestedRef = {
        get: jest.fn().mockReturnValue(Promise.resolve({
          exists: true,
          data: () => mockNestedTx,
        } as any)),
        update: jest.fn(),
        id: transactionId,
      };

      (getUserRef as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue(Promise.resolve({
              exists: true,
              data: () => ({ RefTxId: mockNestedRef }),
            } as any)),
          }),
        }),
      });

      const updates = {
        amount: 200,
        date: new Date('2025-01-02T00:00:00Z'),
      };

      await TransactionService.updateTransaction(userId, transactionId, updates);

      // Verify that refreshCheckpoints was called with a Date object
      // The bug is that it passes mockTimestamp (currentTx.date) if it's smaller, 
      // or if we rely on currentTx.date being a Date.

      // In this case, updates.date (Jan 2) > currentTx.date (Jan 1).
      // So minDate should be currentTx.date (Jan 1).
      // If it passes mockTimestamp, this expectation should fail if we check for Date instance strictly.

      const { ReconciliationService } = await import('../../src/services/reconciliation');

      expect(ReconciliationService.refreshCheckpoints).toHaveBeenCalledWith(
        userId,
        accountId,
        expect.any(Date)
      );

      // Strict check: ensure it has toISOString (i.e. is a real Date or behaves like one)
      const capturedDate = (ReconciliationService.refreshCheckpoints as jest.Mock).mock.calls[0]?.[2] as any;
      expect(capturedDate).toBeDefined();
      expect(typeof capturedDate.toISOString).toBe('function');
    });
  });

  describe('getUserTransactions', () => {
    it('should return empty array when accountId provided but account not found', async () => {
      (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

      const result = await TransactionService.getUserTransactions(userId, { accountId: 'missing' });

      expect(result.transactions).toEqual([]);
      expect(result.nextPageToken).toBeNull();
    });

    it('should query account transactions when accountId provided', async () => {
      const mockDocs = [
        { id: 'tx1', data: () => ({ transactionId: 'tx1', amount: -50 }) },
        { id: 'tx2', data: () => ({ transactionId: 'tx2', amount: 100 }) },
      ];

      const mockQuery = {
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        startAfter: jest.fn().mockReturnThis(),
        get: jest.fn().mockReturnValue(Promise.resolve({ docs: mockDocs })),
      };

      const mockAccountRef = {
        collection: jest.fn().mockReturnValue({
          ...mockQuery,
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue(Promise.resolve({ exists: true })),
          }),
        }),
      };

      (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

      const { resolveTransactionReferences } = await import('../../src/firebase');
      (resolveTransactionReferences as jest.Mock).mockReturnValue(Promise.resolve([
        { transactionId: 'tx1', amount: -50 },
        { transactionId: 'tx2', amount: 100 },
      ]));

      const result = await TransactionService.getUserTransactions(userId, { accountId, limit: 10 });

      expect(result.transactions.length).toBe(2);
      expect(result.nextPageToken).toBe('tx2');
    });

    it('should use collectionGroup query when no accountId provided', async () => {
      const { resolveTransactionReferences } = await import('../../src/firebase');
      (resolveTransactionReferences as jest.Mock).mockReturnValue(Promise.resolve([]));

      const result = await TransactionService.getUserTransactions(userId, {});

      expect(db.collectionGroup).toHaveBeenCalledWith('transactions');
      expect(result.transactions).toEqual([]);
    });

    it('should handle pageToken for pagination', async () => {
      const mockAccountRef = {
        collection: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          startAfter: jest.fn().mockReturnThis(),
          get: jest.fn().mockReturnValue(Promise.resolve({ docs: [] })),
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue(Promise.resolve({ exists: true })),
          }),
        }),
      };

      (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

      const { resolveTransactionReferences } = await import('../../src/firebase');
      (resolveTransactionReferences as jest.Mock).mockReturnValue(Promise.resolve([]));

      await TransactionService.getUserTransactions(userId, { accountId, pageToken: 'cursor-tx' });

      expect(mockAccountRef.collection).toHaveBeenCalledWith('transactions');
    });
  });

  describe('batchCreateTransactions', () => {
    it('should throw ApiError when account not found', async () => {
      (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

      await expect(TransactionService.batchCreateTransactions(userId, accountId, []))
        .rejects.toThrow(/not found/i);
    });

    it('should batch create multiple transactions and track minDate', async () => {
      const mockBatchSet = jest.fn();
      const mockBatchCommit = jest.fn().mockReturnValue(Promise.resolve());

      (db.batch as jest.Mock).mockReturnValue({
        set: mockBatchSet,
        commit: mockBatchCommit,
      });

      const mockAccountRef = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ id: 'nested-tx' }),
        }),
      };

      (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));
      (getUserRef as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ id: 'global-ref' }),
        }),
      });

      const transactions = [
        { amount: -100, date: new Date('2025-01-15') },
        { amount: -50, date: new Date('2025-01-10') }, // Earlier date
        { amount: 200, date: new Date('2025-01-20') },
      ];

      const result = await TransactionService.batchCreateTransactions(userId, accountId, transactions);

      expect(result.importedCount).toBe(3);
      expect(result.minDate?.toISOString()).toBe(new Date('2025-01-10').toISOString());
      expect(mockBatchSet).toHaveBeenCalledTimes(6); // 3 nested + 3 global
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it('should call ReconciliationService.refreshCheckpoints after import', async () => {
      const mockBatchSet = jest.fn();
      const mockBatchCommit = jest.fn().mockReturnValue(Promise.resolve());

      (db.batch as jest.Mock).mockReturnValue({
        set: mockBatchSet,
        commit: mockBatchCommit,
      });

      const mockAccountRef = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ id: 'nested-tx' }),
        }),
      };

      (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));
      (getUserRef as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({ id: 'global-ref' }),
        }),
      });

      await TransactionService.batchCreateTransactions(userId, accountId, [
        { amount: -100, date: new Date('2025-01-15') },
      ]);

      const { ReconciliationService } = await import('../../src/services/reconciliation');
      expect(ReconciliationService.refreshCheckpoints).toHaveBeenCalledWith(
        userId,
        accountId,
        expect.any(Date)
      );
    });
  });
});

