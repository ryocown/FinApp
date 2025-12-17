import admin from 'firebase-admin';
import { v4 } from 'uuid';
import { db, getUserRef, getAccountRef, getAllUserAccounts, getCollectionData, resolveTransactionReferences } from '../firebase';
import type { AccountProps, Account } from '../../../shared/models/account';
import { type IBalanceCheckpoint, BalanceCheckpointType } from '../../../shared/models/balance_checkpoint';
import type { ITransaction } from '../../../shared/models/transaction';
import { ApiError } from '../errors';
import { ReconciliationService } from './reconciliation';

/**
 * Service for account-related business logic.
 * Extracted from routes for better separation of concerns.
 */
export class AccountService {
    /**
     * Get all accounts for a user.
     */
    static async getUserAccounts(userId: string): Promise<Account[]> {
        return getAllUserAccounts(userId);
    }

    /**
     * Create a new account for a user.
     */
    static async createAccount(
        userId: string,
        accountData: Partial<AccountProps> & { instituteId: string },
        initialBalance?: number,
        initialDate?: string
    ): Promise<Account> {
        if (!accountData.instituteId) {
            throw ApiError.badRequest('Missing instituteId');
        }

        const accountId = v4();
        const newAccount: Account = {
            ...accountData,
            accountId,
            userId
        } as Account;

        // Create the account document nested under the institute
        const docRef = getUserRef(userId)
            .collection('institutes')
            .doc(accountData.instituteId)
            .collection('accounts')
            .doc(accountId);

        await docRef.set(newAccount);

        // Handle initial reconciliation if provided
        if (initialBalance !== undefined && initialDate) {
            const checkpoint: IBalanceCheckpoint = {
                id: v4(),
                accountId,
                date: new Date(initialDate),
                balance: Number(initialBalance),
                type: BalanceCheckpointType.MANUAL,
                createdAt: new Date()
            };

            // Save checkpoint
            await docRef.collection('balance_checkpoints').doc(checkpoint.id).set(checkpoint);

            // Update Account with initial balance
            await docRef.update({
                balance: checkpoint.balance,
                balanceDate: checkpoint.date
            });

            newAccount.balance = checkpoint.balance;
            newAccount.balanceDate = checkpoint.date;
        }

        return newAccount;
    }

    /**
     * Get transactions for a specific account with pagination.
     */
    static async getAccountTransactions(
        userId: string,
        accountId: string,
        options: { limit?: number; pageToken?: string; sortOrder?: 'asc' | 'desc' } = {}
    ): Promise<{ transactions: ITransaction[]; nextPageToken: string | null }> {
        const result = await getAccountRef(userId, accountId);

        if (!result) {
            throw ApiError.notFound('Account');
        }

        const { ref: accountRef } = result;
        const sortOrder = options.sortOrder || 'desc';

        let query: admin.firestore.Query = accountRef.collection('transactions');
        query = query.orderBy('date', sortOrder);

        if (options.pageToken) {
            const lastDoc = await accountRef.collection('transactions').doc(options.pageToken).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const snapshot = await query.get();
        const transactions = await resolveTransactionReferences(snapshot.docs);

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        const nextPageToken = lastVisible ? lastVisible.id : null;

        return { transactions, nextPageToken };
    }

    /**
     * Get balance checkpoints for an account with validation.
     */
    static async getAccountCheckpoints(
        userId: string,
        accountId: string
    ): Promise<IBalanceCheckpoint[]> {
        const result = await getAccountRef(userId, accountId);

        if (!result) {
            throw ApiError.notFound('Account');
        }

        const { ref: accountRef } = result;

        const snapshot = await accountRef.collection('balance_checkpoints').orderBy('date', 'desc').get();
        let checkpoints = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore timestamps to ISO strings
            if (data.date) {
                if (typeof data.date.toDate === 'function') {
                    data.date = data.date.toDate().toISOString();
                } else if (typeof data.date === 'object' && '_seconds' in data.date) {
                    const seconds = (data.date as { _seconds: number })._seconds;
                    const nanoseconds = (data.date as { _nanoseconds?: number })._nanoseconds || 0;
                    data.date = new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
                }
            }

            if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                    data.createdAt = data.createdAt.toDate().toISOString();
                } else if (typeof data.createdAt === 'object' && '_seconds' in data.createdAt) {
                    const seconds = (data.createdAt as { _seconds: number })._seconds;
                    const nanoseconds = (data.createdAt as { _nanoseconds?: number })._nanoseconds || 0;
                    data.createdAt = new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
                }
            }
            return data as IBalanceCheckpoint;
        });

        // Validate the last 12 checkpoints
        if (checkpoints.length > 0) {
            const recentCheckpoints = checkpoints.slice(0, 12);
            const olderCheckpoints = checkpoints.slice(12);
            const validatedRecent = await ReconciliationService.validateCheckpoints(userId, accountId, recentCheckpoints);
            checkpoints = [...validatedRecent, ...olderCheckpoints];
        }

        return checkpoints;
    }

    /**
     * Delete an account and all its subcollections.
     */
    static async deleteAccount(userId: string, accountId: string): Promise<void> {
        const result = await getAccountRef(userId, accountId);

        if (!result) {
            throw ApiError.notFound('Account');
        }

        const { ref: accountRef } = result;
        await db.recursiveDelete(accountRef);
    }

    /**
     * Get budget items for a user.
     */
    static async getUserBudget(userId: string): Promise<unknown[]> {
        const snapshot = await getUserRef(userId).collection('budget').get();
        return getCollectionData(snapshot, 'budgetId');
    }

    /**
     * Update an account.
     */
    static async updateAccount(
        userId: string,
        accountId: string,
        updates: Partial<Account>
    ): Promise<void> {
        const result = await getAccountRef(userId, accountId);

        if (!result) {
            throw ApiError.notFound('Account');
        }

        const { ref: accountRef } = result;

        // Prevent updating immutable fields
        delete updates.accountId;
        delete updates.userId;
        delete updates.instituteId;
        delete updates.balance; // Balance should only be updated via reconciliation or transactions

        await accountRef.update(updates);
    }
}
