import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockBatch = {
  set: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

// Define mocks before imports
jest.unstable_mockModule('../../src/firebase', () => ({
  db: {
    batch: jest.fn(() => mockBatch),
    getAll: jest.fn(),
  },
  getUserRef: jest.fn(),
  getAccountRef: jest.fn(),
  resolveTransactionReferences: jest.fn(),
}));

jest.unstable_mockModule('../../src/services/reconciliation', () => ({
  ReconciliationService: {
    refreshCheckpoints: jest.fn(),
  },
}));

jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn(() => 'generated-uuid'),
}));

// Dynamic imports after mocks
const { TransactionService } = await import('../../src/services/transactions');
const { getUserRef, getAccountRef, db } = await import('../../src/firebase');
const { ReconciliationService } = await import('../../src/services/reconciliation');
const { v4 } = await import('uuid');

describe('TransactionService.batchCreateTransactions', () => {
  const mockUserId = 'user123';
  const mockAccountId = 'account123';
  const mockAccountRef = {
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: jest.fn(),
      }),
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBatch.set.mockClear();
    mockBatch.commit.mockClear();
    (getAccountRef as jest.Mock).mockResolvedValue({ ref: mockAccountRef });
    (getUserRef as jest.Mock).mockReturnValue({
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          set: jest.fn(),
        }),
      }),
    });
  });

  it('should create transactions and return stats', async () => {
    const transactions = [
      { amount: 100, date: new Date('2023-01-01') },
      { amount: 200, date: new Date('2023-01-02') },
    ];

    const result = await TransactionService.batchCreateTransactions(mockUserId, mockAccountId, transactions);

    expect(result.importedCount).toBe(2);
    expect(result.duplicateCount).toBe(0); // Default 0
    expect(mockBatch.commit).toHaveBeenCalled();
    expect(ReconciliationService.refreshCheckpoints).toHaveBeenCalled();
  });

  it('should skip duplicates when skipDuplicates is true', async () => {
    const transactions = [
      { transactionId: 'tx1', amount: 100, date: new Date('2023-01-01') },
      { transactionId: 'tx2', amount: 200, date: new Date('2023-01-02') },
    ];

    // Mock db.getAll to return one existing doc (tx1) and one non-existing (tx2)
    (db.getAll as jest.Mock).mockResolvedValue([
      { exists: true, id: 'tx1' },
      { exists: false, id: 'tx2' },
    ]);

    const result = await TransactionService.batchCreateTransactions(mockUserId, mockAccountId, transactions, { skipDuplicates: true });

    expect(result.importedCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
    expect(db.getAll).toHaveBeenCalled();
    // Should only add tx2 to batch
  });
});
