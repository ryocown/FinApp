import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BalanceCheckpointType } from '@finapp/shared/models/balance_checkpoint';

// Define mocks before imports
jest.unstable_mockModule('../../src/firebase', () => ({
    db: {
        batch: jest.fn(() => ({
            set: jest.fn(),
            commit: jest.fn(),
        })),
        recursiveDelete: jest.fn().mockReturnValue(Promise.resolve()),
    },
    getUserRef: jest.fn(),
    getAccountRef: jest.fn(),
    getAllUserAccounts: jest.fn(),
    getCollectionData: jest.fn(),
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
        validateCheckpoints: jest.fn((userId, accountId, checkpoints) =>
            Promise.resolve(checkpoints) // Pass through by default
        ),
    },
}));

jest.unstable_mockModule('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-account'),
}));

// Dynamic imports after mocks
const { AccountService } = await import('../../src/services/accounts');
const { getUserRef, getAccountRef, getAllUserAccounts, db } = await import('../../src/firebase');

describe('AccountService', () => {
    const userId = 'test-user-id';
    const accountId = 'test-account-id';
    const instituteId = 'test-institute-id';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserAccounts', () => {
        it('should call getAllUserAccounts with userId', async () => {
            const mockAccounts = [
                { accountId: 'acc1', name: 'Checking' },
                { accountId: 'acc2', name: 'Savings' },
            ];
            (getAllUserAccounts as jest.Mock).mockReturnValue(Promise.resolve(mockAccounts));

            const result = await AccountService.getUserAccounts(userId);

            expect(getAllUserAccounts).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockAccounts);
        });
    });

    describe('createAccount', () => {
        it('should throw BadRequest when instituteId is missing', async () => {
            const accountData = { name: 'Test Account' };

            await expect(AccountService.createAccount(userId, accountData as any))
                .rejects.toThrow(/instituteId/i);
        });

        it('should create account nested under institute', async () => {
            const mockDocRef = {
                set: jest.fn().mockReturnValue(Promise.resolve()),
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        set: jest.fn().mockReturnValue(Promise.resolve()),
                    }),
                }),
                update: jest.fn().mockReturnValue(Promise.resolve()),
            };

            const mockInstituteCollection = {
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockReturnValue({
                        doc: jest.fn().mockReturnValue(mockDocRef),
                    }),
                }),
            };

            (getUserRef as jest.Mock).mockReturnValue({
                collection: jest.fn().mockReturnValue(mockInstituteCollection),
            });

            const accountData = {
                instituteId: 'inst-123',
                name: 'My Checking',
                AccountType: 'Bank',
                currency: { code: 'USD', name: 'US Dollar', symbol: '$' },
                country: 'US',
            };

            const result = await AccountService.createAccount(userId, accountData as any);

            expect(mockDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
                name: 'My Checking',
                instituteId: 'inst-123',
                userId,
                accountId: 'mock-uuid-account',
            }));

            expect(result.accountId).toBe('mock-uuid-account');
        });

        it('should create initial balance checkpoint when provided', async () => {
            const mockCheckpointSet = jest.fn().mockReturnValue(Promise.resolve());
            const mockAccountUpdate = jest.fn().mockReturnValue(Promise.resolve());

            const mockCheckpointsDoc = {
                set: mockCheckpointSet,
            };

            const mockDocRef = {
                set: jest.fn().mockReturnValue(Promise.resolve()),
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue(mockCheckpointsDoc),
                }),
                update: mockAccountUpdate,
            };

            const mockInstituteCollection = {
                doc: jest.fn().mockReturnValue({
                    collection: jest.fn().mockReturnValue({
                        doc: jest.fn().mockReturnValue(mockDocRef),
                    }),
                }),
            };

            (getUserRef as jest.Mock).mockReturnValue({
                collection: jest.fn().mockReturnValue(mockInstituteCollection),
            });

            const accountData = {
                instituteId: 'inst-123',
                name: 'Savings',
                AccountType: 'Bank',
                currency: { code: 'USD', name: 'US Dollar', symbol: '$' },
                country: 'US',
            };

            await AccountService.createAccount(
                userId,
                accountData as any,
                1000,  // initialBalance
                '2025-01-01'  // initialDate
            );

            // Should create a checkpoint
            expect(mockCheckpointSet).toHaveBeenCalledWith(expect.objectContaining({
                balance: 1000,
                type: BalanceCheckpointType.MANUAL,
            }));

            // Should update account with balance
            expect(mockAccountUpdate).toHaveBeenCalledWith(expect.objectContaining({
                balance: 1000,
            }));
        });
    });

    describe('deleteAccount', () => {
        it('should throw NotFound when account does not exist', async () => {
            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

            await expect(AccountService.deleteAccount(userId, 'non-existent'))
                .rejects.toThrow(/not found/i);
        });

        it('should call recursiveDelete on account ref', async () => {
            const mockAccountRef = { id: accountId };
            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            await AccountService.deleteAccount(userId, accountId);

            expect(db.recursiveDelete).toHaveBeenCalledWith(mockAccountRef);
        });
    });

    describe('getAccountTransactions', () => {
        it('should throw NotFound when account does not exist', async () => {
            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

            await expect(AccountService.getAccountTransactions(userId, 'non-existent'))
                .rejects.toThrow(/not found/i);
        });

        it('should return transactions with pagination token', async () => {
            const mockDocs = [
                { id: 'tx1', data: () => ({ transactionId: 'tx1', amount: -50 }) },
                { id: 'tx2', data: () => ({ transactionId: 'tx2', amount: 100 }) },
            ];

            const mockQuery = {
                orderBy: jest.fn().mockReturnThis(),
                startAfter: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                get: jest.fn().mockReturnValue(Promise.resolve({ docs: mockDocs })),
            };

            const mockAccountRef = {
                collection: jest.fn().mockReturnValue(mockQuery),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            const { resolveTransactionReferences } = await import('../../src/firebase');
            (resolveTransactionReferences as jest.Mock).mockReturnValue(Promise.resolve([
                { transactionId: 'tx1', amount: -50 },
                { transactionId: 'tx2', amount: 100 },
            ]));

            const result = await AccountService.getAccountTransactions(userId, accountId, { limit: 10 });

            expect(result.transactions.length).toBe(2);
            expect(result.nextPageToken).toBe('tx2');
        });

        it('should handle pageToken for pagination', async () => {
            const mockDocs = [
                { id: 'tx3', data: () => ({ transactionId: 'tx3', amount: 50 }) },
            ];

            const mockLastDoc = { exists: true };

            const mockQuery = {
                orderBy: jest.fn().mockReturnThis(),
                startAfter: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                get: jest.fn().mockReturnValue(Promise.resolve({ docs: mockDocs })),
                doc: jest.fn().mockReturnValue({
                    get: jest.fn().mockReturnValue(Promise.resolve(mockLastDoc)),
                }),
            };

            const mockAccountRef = {
                collection: jest.fn().mockReturnValue(mockQuery),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            const { resolveTransactionReferences } = await import('../../src/firebase');
            (resolveTransactionReferences as jest.Mock).mockReturnValue(Promise.resolve([
                { transactionId: 'tx3', amount: 50 },
            ]));

            const result = await AccountService.getAccountTransactions(userId, accountId, {
                limit: 10,
                pageToken: 'tx2',
            });

            expect(mockQuery.startAfter).toHaveBeenCalledWith(mockLastDoc);
            expect(result.transactions.length).toBe(1);
        });
    });

    describe('getAccountCheckpoints', () => {
        it('should throw NotFound when account does not exist', async () => {
            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve(null));

            await expect(AccountService.getAccountCheckpoints(userId, 'non-existent'))
                .rejects.toThrow(/not found/i);
        });

        it('should convert Firestore timestamps to ISO strings', async () => {
            const mockTimestamp = {
                toDate: () => new Date('2025-01-15T00:00:00Z'),
            };

            const mockCheckpointDoc = {
                id: 'cp1',
                data: () => ({
                    id: 'cp1',
                    accountId,
                    balance: 1000,
                    date: mockTimestamp,
                    createdAt: mockTimestamp,
                    type: BalanceCheckpointType.MANUAL,
                }),
            };

            const mockQuery = {
                orderBy: jest.fn().mockReturnThis(),
                get: jest.fn().mockReturnValue(Promise.resolve({
                    docs: [mockCheckpointDoc],
                })),
            };

            const mockAccountRef = {
                collection: jest.fn().mockReturnValue(mockQuery),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            const result = await AccountService.getAccountCheckpoints(userId, accountId);

            expect(result[0]?.date).toBe('2025-01-15T00:00:00.000Z');
            expect(result[0]?.createdAt).toBe('2025-01-15T00:00:00.000Z');
        });

        it('should handle _seconds timestamp format', async () => {
            const mockCheckpointDoc = {
                id: 'cp1',
                data: () => ({
                    id: 'cp1',
                    accountId,
                    balance: 500,
                    date: { _seconds: 1736899200, _nanoseconds: 0 }, // 2025-01-15
                    createdAt: { _seconds: 1736899200, _nanoseconds: 0 },
                    type: BalanceCheckpointType.MANUAL,
                }),
            };

            const mockQuery = {
                orderBy: jest.fn().mockReturnThis(),
                get: jest.fn().mockReturnValue(Promise.resolve({
                    docs: [mockCheckpointDoc],
                })),
            };

            const mockAccountRef = {
                collection: jest.fn().mockReturnValue(mockQuery),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            const result = await AccountService.getAccountCheckpoints(userId, accountId);

            expect(typeof result[0]?.date).toBe('string');
            expect(typeof result[0]?.createdAt).toBe('string');
        });

        it('should validate recent checkpoints through ReconciliationService', async () => {
            const mockCheckpointDoc = {
                id: 'cp1',
                data: () => ({
                    id: 'cp1',
                    accountId,
                    balance: 1000,
                    date: new Date('2025-01-15').toISOString(),
                    type: BalanceCheckpointType.MANUAL,
                }),
            };

            const mockQuery = {
                orderBy: jest.fn().mockReturnThis(),
                get: jest.fn().mockReturnValue(Promise.resolve({
                    docs: [mockCheckpointDoc],
                })),
            };

            const mockAccountRef = {
                collection: jest.fn().mockReturnValue(mockQuery),
            };

            (getAccountRef as jest.Mock).mockReturnValue(Promise.resolve({ ref: mockAccountRef }));

            const { ReconciliationService } = await import('../../src/services/reconciliation');

            await AccountService.getAccountCheckpoints(userId, accountId);

            expect(ReconciliationService.validateCheckpoints).toHaveBeenCalledWith(
                userId,
                accountId,
                expect.arrayContaining([expect.objectContaining({ id: 'cp1' })])
            );
        });
    });

    describe('getUserBudget', () => {
        it('should return budget items from user collection', async () => {
            const mockBudgetDocs = {
                docs: [
                    { id: 'b1', data: () => ({ category: 'Food', amount: 500 }) },
                    { id: 'b2', data: () => ({ category: 'Transport', amount: 200 }) },
                ],
            };

            (getUserRef as jest.Mock).mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    get: jest.fn().mockReturnValue(Promise.resolve(mockBudgetDocs)),
                }),
            });

            const { getCollectionData } = await import('../../src/firebase');
            (getCollectionData as jest.Mock).mockReturnValue([
                { budgetId: 'b1', category: 'Food', amount: 500 },
                { budgetId: 'b2', category: 'Transport', amount: 200 },
            ]);

            const result = await AccountService.getUserBudget(userId);

            expect(result.length).toBe(2);
        });
    });
});
