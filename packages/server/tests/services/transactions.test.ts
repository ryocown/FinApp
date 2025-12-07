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

// Dynamic imports after mocks
const { TransactionService } = await import('../../src/services/transactions');
const { getUserRef } = await import('../../src/firebase');

describe('TransactionService', () => {
  const userId = 'test-user-id';
  const accountId = 'test-account-id';
  const transactionId = 'test-tx-id';

  beforeEach(() => {
    jest.clearAllMocks();
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
});
