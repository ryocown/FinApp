import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BalanceCheckpointType } from '@finapp/shared/models/balance_checkpoint';
import { TransactionType } from '@finapp/shared/models/transaction';

// Mock dependencies before imports
jest.unstable_mockModule('../../src/firebase', () => ({
    db: {
        batch: jest.fn(() => ({
            delete: jest.fn(),
            commit: jest.fn().mockReturnValue(Promise.resolve()),
        })),
    },
    getUserRef: jest.fn(),
    getAccountRef: jest.fn(),
}));

jest.unstable_mockModule('../../src/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

jest.unstable_mockModule('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-12345'),
}));

// Dynamic imports after mocks
const { ReconciliationService } = await import('../../src/services/reconciliation');
const { getAccountRef, getUserRef, db } = await import('../../src/firebase');

describe('ReconciliationService', () => {
    const userId = 'test-user-id';
    const accountId = 'test-account-id';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Helper to create a mock Firestore collection with chainable query methods
    function createMockCollection(docs: any[] = []) {
        const mockQuery = {
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: jest.fn().mockReturnValue(Promise.resolve({
                empty: docs.length === 0,
                docs: docs.map(d => ({
                    id: d.id || 'doc-id',
                    data: () => d,
                    ref: { id: d.id || 'doc-id' },
                    exists: true,
                })),
                forEach: (fn: any) => docs.forEach((d, i) => fn({
                    id: d.id || `doc-${i}`,
                    data: () => d,
                    ref: { id: d.id || `doc-${i}` },
                })),
                size: docs.length,
            })),
        };
        return {
            ...mockQuery,
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockReturnValue(Promise.resolve({
                    exists: docs.length > 0,
                    data: () => docs[0],
                })),
                set: jest.fn().mockReturnValue(Promise.resolve()),
                update: jest.fn().mockReturnValue(Promise.resolve()),
                delete: jest.fn().mockReturnValue(Promise.resolve()),
            }),
        };
    }

    describe('reconcileAccount', () => {
        it('should throw error when account is not found', async () => {
            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

            await expect(
                ReconciliationService.reconcileAccount(userId, accountId, new Date(), 1000)
            ).rejects.toThrow('Account not found');
        });

        it('should create adjustment transaction when balance differs', async () => {
            const reconcileDate = new Date('2025-01-15T00:00:00Z');
            const targetBalance = 1000;

            // Mock: no previous checkpoint (starting from 0)
            const mockCheckpointsCollection = createMockCollection([]);

            // Mock: one transaction of -200 exists
            const mockTransactionsCollection = createMockCollection([
                { transactionId: 'tx1', amount: -200, date: new Date('2025-01-10'), transactionType: TransactionType.General }
            ]);

            const mockAccountRef = {
                collection: jest.fn().mockImplementation((name: string) => {
                    if (name === 'balance_checkpoints') return mockCheckpointsCollection;
                    if (name === 'transactions') return mockTransactionsCollection;
                    return createMockCollection([]);
                }),
                get: jest.fn().mockReturnValue(Promise.resolve({
                    data: () => ({ balanceDate: new Date('2024-01-01') }),
                })),
                update: jest.fn().mockReturnValue(Promise.resolve()),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));
            (getUserRef as jest.Mock).mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        set: jest.fn().mockReturnValue(Promise.resolve()),
                    }),
                }),
            });

            const result = await ReconciliationService.reconcileAccount(
                userId, accountId, reconcileDate, targetBalance
            );

            // Expected: start=0, transactions=-200, so calculated=-200
            // Adjustment needed: 1000 - (-200) = 1200
            expect(result.balance).toBe(targetBalance);
            expect(result.type).toBe(BalanceCheckpointType.MANUAL);

            // Verify transaction was created
            const txDoc = mockTransactionsCollection.doc;
            expect(txDoc).toHaveBeenCalled();
        });

        it('should NOT create adjustment when balance already matches', async () => {
            const reconcileDate = new Date('2025-01-15T00:00:00Z');
            const targetBalance = -200; // Matches the singular transaction

            const mockCheckpointsCollection = createMockCollection([]);
            const mockTransactionsCollection = createMockCollection([
                { transactionId: 'tx1', amount: -200, date: new Date('2025-01-10'), transactionType: TransactionType.General }
            ]);

            const mockAccountRef = {
                collection: jest.fn().mockImplementation((name: string) => {
                    if (name === 'balance_checkpoints') return mockCheckpointsCollection;
                    if (name === 'transactions') return mockTransactionsCollection;
                    return createMockCollection([]);
                }),
                get: jest.fn().mockReturnValue(Promise.resolve({
                    data: () => ({ balanceDate: new Date('2024-01-01') }),
                })),
                update: jest.fn().mockReturnValue(Promise.resolve()),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            const result = await ReconciliationService.reconcileAccount(
                userId, accountId, reconcileDate, targetBalance
            );

            expect(result.balance).toBe(targetBalance);
        });

        it('should update existing reconciliation transaction instead of creating new one', async () => {
            const reconcileDate = new Date('2025-01-15T00:00:00Z');
            const targetBalance = 1500;

            const mockCheckpointsCollection = createMockCollection([]);

            // Existing reconciliation transaction for this date
            const existingReconTx = {
                transactionId: 'old-recon-tx',
                amount: 1000,
                date: reconcileDate,
                transactionType: TransactionType.Reconciliation
            };

            const mockUpdateFn = jest.fn().mockReturnValue(Promise.resolve());
            const mockTransactionsCollection = {
                ...createMockCollection([existingReconTx]),
                doc: jest.fn().mockReturnValue({
                    update: mockUpdateFn,
                    set: jest.fn().mockReturnValue(Promise.resolve()),
                    get: jest.fn().mockReturnValue(Promise.resolve({ exists: true, data: () => existingReconTx })),
                }),
            };

            const mockAccountRef = {
                collection: jest.fn().mockImplementation((name: string) => {
                    if (name === 'balance_checkpoints') return mockCheckpointsCollection;
                    if (name === 'transactions') return mockTransactionsCollection;
                    return createMockCollection([]);
                }),
                get: jest.fn().mockReturnValue(Promise.resolve({
                    data: () => ({ balanceDate: new Date('2024-01-01') }),
                })),
                update: jest.fn().mockReturnValue(Promise.resolve()),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            await ReconciliationService.reconcileAccount(userId, accountId, reconcileDate, targetBalance);

            // Should update existing transaction, not create new
            expect(mockUpdateFn).toHaveBeenCalledWith(expect.objectContaining({
                amount: expect.any(Number),
                description: 'Reconciliation Adjustment (Updated)',
            }));
        });

        it('should use previous checkpoint balance as starting point', async () => {
            const reconcileDate = new Date('2025-02-01T00:00:00Z');
            const targetBalance = 2000;

            // Previous checkpoint with balance 1000
            const prevCheckpoint = {
                id: 'cp-1',
                balance: 1000,
                date: new Date('2025-01-01T00:00:00Z'),
                type: BalanceCheckpointType.MANUAL,
            };

            const mockCheckpointsCollection = createMockCollection([prevCheckpoint]);

            // Transactions after checkpoint: +500
            const mockTransactionsCollection = createMockCollection([
                { transactionId: 'tx1', amount: 500, date: new Date('2025-01-15'), transactionType: TransactionType.General }
            ]);

            const mockAccountRef = {
                collection: jest.fn().mockImplementation((name: string) => {
                    if (name === 'balance_checkpoints') return mockCheckpointsCollection;
                    if (name === 'transactions') return mockTransactionsCollection;
                    return createMockCollection([]);
                }),
                get: jest.fn().mockReturnValue(Promise.resolve({
                    data: () => ({ balanceDate: new Date('2024-01-01') }),
                })),
                update: jest.fn().mockReturnValue(Promise.resolve()),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));
            (getUserRef as jest.Mock).mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        set: jest.fn().mockReturnValue(Promise.resolve()),
                    }),
                }),
            });

            const result = await ReconciliationService.reconcileAccount(
                userId, accountId, reconcileDate, targetBalance
            );

            // Start=1000, Tx=+500, Expected=1500, Target=2000
            // Adjustment should be 500
            expect(result.balance).toBe(targetBalance);
        });
    });

    describe('refreshCheckpoints', () => {
        it('should do nothing if account not found', async () => {
            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

            // Should not throw
            await expect(
                ReconciliationService.refreshCheckpoints(userId, accountId, new Date())
            ).resolves.toBeUndefined();
        });

        it('should do nothing if no checkpoints after minDate', async () => {
            const mockCheckpointsCollection = createMockCollection([]);
            const mockAccountRef = {
                collection: jest.fn().mockReturnValue(mockCheckpointsCollection),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            await expect(
                ReconciliationService.refreshCheckpoints(userId, accountId, new Date())
            ).resolves.toBeUndefined();
        });
    });

    describe('validateCheckpoints', () => {
        it('should return empty array for empty input', async () => {
            const result = await ReconciliationService.validateCheckpoints(userId, accountId, []);
            expect(result).toEqual([]);
        });

        it('should return original checkpoints if account not found', async () => {
            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

            const checkpoints = [
                { id: 'cp1', balance: 100, date: new Date(), type: BalanceCheckpointType.MANUAL, accountId, createdAt: new Date() }
            ];

            const result = await ReconciliationService.validateCheckpoints(userId, accountId, checkpoints);
            expect(result).toEqual(checkpoints);
        });

        it('should mark checkpoint as valid when transactions sum matches balance', async () => {
            const checkpointDate = new Date('2025-01-15T00:00:00Z');
            const checkpoints = [{
                id: 'cp1',
                accountId,
                balance: 500,
                date: checkpointDate,
                type: BalanceCheckpointType.MANUAL,
                createdAt: new Date(),
            }];

            // No previous checkpoint
            const mockPrevCheckpointQuery = createMockCollection([]);

            // Transactions sum to 500
            const mockTransactionsQuery = createMockCollection([
                { transactionId: 'tx1', amount: 300 },
                { transactionId: 'tx2', amount: 200 },
            ]);

            const mockAccountRef = {
                collection: jest.fn().mockImplementation((name: string) => {
                    if (name === 'balance_checkpoints') return mockPrevCheckpointQuery;
                    if (name === 'transactions') return mockTransactionsQuery;
                    return createMockCollection([]);
                }),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            const result = await ReconciliationService.validateCheckpoints(userId, accountId, checkpoints);

            expect(result[0]?.validation?.isValid).toBe(true);
            expect(result[0]?.validation?.difference).toBe(0);
        });

        it('should mark checkpoint as invalid when transactions sum does not match', async () => {
            const checkpointDate = new Date('2025-01-15T00:00:00Z');
            const checkpoints = [{
                id: 'cp1',
                accountId,
                balance: 500,
                date: checkpointDate,
                type: BalanceCheckpointType.MANUAL,
                createdAt: new Date(),
            }];

            const mockPrevCheckpointQuery = createMockCollection([]);

            // Transactions only sum to 400 (mismatch!)
            const mockTransactionsQuery = createMockCollection([
                { transactionId: 'tx1', amount: 250 },
                { transactionId: 'tx2', amount: 150 },
            ]);

            const mockAccountRef = {
                collection: jest.fn().mockImplementation((name: string) => {
                    if (name === 'balance_checkpoints') return mockPrevCheckpointQuery;
                    if (name === 'transactions') return mockTransactionsQuery;
                    return createMockCollection([]);
                }),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            const result = await ReconciliationService.validateCheckpoints(userId, accountId, checkpoints);

            expect(result[0]?.validation?.isValid).toBe(false);
            expect(result[0]?.validation?.difference).toBe(-100); // 400 - 500 = -100
        });
    });

    describe('deleteCheckpoint', () => {
        it('should throw error when account not found', async () => {
            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

            await expect(
                ReconciliationService.deleteCheckpoint(userId, accountId, 'cp-123')
            ).rejects.toThrow('Account not found');
        });

        it('should throw error when checkpoint not found', async () => {
            const mockCheckpointsCollection = {
                doc: jest.fn().mockReturnValue({
                    get: jest.fn().mockReturnValue(Promise.resolve({ exists: false })),
                }),
            };

            const mockAccountRef = {
                collection: jest.fn().mockReturnValue(mockCheckpointsCollection),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            await expect(
                ReconciliationService.deleteCheckpoint(userId, accountId, 'non-existent')
            ).rejects.toThrow('Checkpoint not found');
        });

        it('should delete checkpoint and associated reconciliation transactions', async () => {
            const checkpointDate = new Date('2025-01-15T00:00:00Z');
            const checkpointId = 'cp-to-delete';

            const mockCheckpointDoc = {
                get: jest.fn().mockReturnValue(Promise.resolve({
                    exists: true,
                    data: () => ({
                        id: checkpointId,
                        date: checkpointDate,
                        balance: 1000,
                    }),
                })),
                delete: jest.fn().mockReturnValue(Promise.resolve()),
            };

            const reconTxDoc = {
                id: 'recon-tx-1',
                ref: { id: 'recon-tx-1' },
                data: () => ({
                    transactionId: 'recon-tx-1',
                    transactionType: TransactionType.Reconciliation,
                    date: checkpointDate,
                }),
            };

            const mockTransactionsQuery = {
                where: jest.fn().mockReturnThis(),
                get: jest.fn().mockReturnValue(Promise.resolve({
                    empty: false,
                    docs: [reconTxDoc],
                    forEach: (fn: any) => fn(reconTxDoc),
                    size: 1,
                })),
            };

            const mockCheckpointsCollection = {
                doc: jest.fn().mockReturnValue(mockCheckpointDoc),
            };

            const mockAccountRef = {
                collection: jest.fn().mockImplementation((name: string) => {
                    if (name === 'balance_checkpoints') return mockCheckpointsCollection;
                    if (name === 'transactions') return mockTransactionsQuery;
                    return {};
                }),
            };

            const mockBatchDelete = jest.fn();
            const mockBatchCommit = jest.fn().mockReturnValue(Promise.resolve());
            (db.batch as jest.Mock).mockReturnValue({
                delete: mockBatchDelete,
                commit: mockBatchCommit,
            });

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));
            (getUserRef as jest.Mock).mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({ id: 'user-tx-ref' }),
                }),
            });

            await ReconciliationService.deleteCheckpoint(userId, accountId, checkpointId);

            // Verify checkpoint was deleted
            expect(mockCheckpointDoc.delete).toHaveBeenCalled();

            // Verify batch delete was used for reconciliation transactions
            expect(mockBatchDelete).toHaveBeenCalledTimes(2); // tx + user ref
            expect(mockBatchCommit).toHaveBeenCalled();
        });
    });
});
