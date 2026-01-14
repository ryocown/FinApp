import admin from 'firebase-admin';
import { v4 } from 'uuid';
import { db, getUserRef, getAccountRef, resolveTransactionReferences } from '../firebase.js';
import type { TransactionProto } from '@finapp/shared';
import { DateUtils, toDateProto } from '@finapp/shared';
import { ApiError } from '../errors/index.js';
import { ReconciliationService } from './reconciliation.js';
import { BalanceCheckpointType } from '@finapp/shared';
import { logger } from '../logger.js';

/**
 * Service for transaction-related business logic.
 * Extracted from routes for better separation of concerns.
 */
export class TransactionService {
    /**
     * Get all transactions for a user, optionally filtered by account.
     */
    static async getUserTransactions(
        userId: string,
        options: { accountId?: string; limit?: number; pageToken?: string; sortOrder?: 'asc' | 'desc' } = {}
    ): Promise<{ transactions: TransactionProto[]; nextPageToken: string | null }> {
        try {
            // Enforce default limit to prevent N+1 issues and timeouts
            if (!options.limit) {
                options.limit = 50;
            }

            let query: admin.firestore.Query;
            let collectionRef: admin.firestore.CollectionReference | undefined;
            const sortOrder = options.sortOrder || 'desc';

            if (options.accountId) {
                const result = await getAccountRef(userId, options.accountId);

                if (!result) {
                    return { transactions: [], nextPageToken: null };
                }

                const { ref: accountRef } = result;
                collectionRef = accountRef.collection('transactions');
                query = collectionRef.orderBy('date.timestamp', sortOrder);
            } else {
                query = db.collectionGroup('transactions')
                    .where('userId', '==', userId)
                    .orderBy('date.timestamp', sortOrder);
            }

            if (options.pageToken) {
                let lastDoc: admin.firestore.DocumentSnapshot | null = null;

                if (collectionRef) {
                    lastDoc = await collectionRef.doc(options.pageToken).get();
                } else {
                    const cursorSnap = await db.collectionGroup('transactions')
                        .where('userId', '==', userId)
                        .where('transactionId', '==', options.pageToken)
                        .limit(1)
                        .get();

                    if (!cursorSnap.empty) {
                        lastDoc = cursorSnap.docs[0] as admin.firestore.DocumentSnapshot;
                    }
                }

                if (lastDoc && lastDoc.exists) {
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

            // Stitching: Populate balance for transactions
            // Optimization: Only run stitching if we have transactions and an account context
            if (options.accountId && transactions.length > 0) {
                const accountId = options.accountId;

                const timestamps = transactions
                    .map(t => t.date?.timestamp)
                    .filter(t => typeof t === 'number' && !isNaN(t));

                if (timestamps.length > 0) {
                    const minTime = Math.min(...timestamps);
                    const maxTime = Math.max(...timestamps);

                    // Fetch checkpoints in range [minTime, maxTime] matching account
                    const accountRef = (await getAccountRef(userId, accountId))?.ref;
                    if (accountRef) {
                        const checkpointsSnap = await accountRef.collection('balance_checkpoints')
                            .where('date.timestamp', '>=', minTime)
                            .where('date.timestamp', '<=', maxTime)
                            .get();

                        const checkpointsMap = new Map<number, number>();
                        checkpointsSnap.docs.forEach(doc => {
                            const data = doc.data();
                            if (data.date && typeof data.date.timestamp === 'number') {
                                checkpointsMap.set(data.date.timestamp, data.balance);
                            }
                        });

                        transactions.forEach(tx => {
                            if (tx.date?.timestamp) {
                                const bal = checkpointsMap.get(tx.date.timestamp);
                                if (bal !== undefined) {
                                    tx.balance = bal;
                                }
                            }
                        });

                        // Spread balances from anchors to neighbors
                        // Propagate from Newer to Older (Index 0 -> N)
                        // Bal(Older) = Bal(Newer) - Amt(Newer)

                        if (sortOrder === 'desc') {
                            // 1. Propagate Down (Newer -> Older)
                            for (let i = 0; i < transactions.length - 1; i++) {
                                const currentTx = transactions[i];
                                const olderTx = transactions[i + 1];
                                if (currentTx && olderTx && currentTx.balance !== undefined && olderTx.balance === undefined) {
                                    olderTx.balance = currentTx.balance - currentTx.amount;
                                }
                            }
                            // 2. Propagate Up (Older -> Newer)
                            for (let i = transactions.length - 1; i > 0; i--) {
                                const currentTx = transactions[i];
                                const newerTx = transactions[i - 1];
                                if (currentTx && newerTx && currentTx.balance !== undefined && newerTx.balance === undefined) {
                                    newerTx.balance = currentTx.balance + newerTx.amount;
                                }
                            }
                        } else {
                            // Ascending: Index 0 is Oldest.
                            // 1. Propagate Down (Older -> Newer)
                            for (let i = 0; i < transactions.length - 1; i++) {
                                const currentTx = transactions[i];
                                const newerTx = transactions[i + 1];
                                if (currentTx && newerTx && currentTx.balance !== undefined && newerTx.balance === undefined) {
                                    newerTx.balance = currentTx.balance + newerTx.amount;
                                }
                            }
                            // 2. Propagate Up (Newer -> Older)
                            for (let i = transactions.length - 1; i > 0; i--) {
                                const currentTx = transactions[i];
                                const olderTx = transactions[i - 1];
                                if (currentTx && olderTx && currentTx.balance !== undefined && olderTx.balance === undefined) {
                                    olderTx.balance = currentTx.balance - currentTx.amount;
                                }
                            }
                        }
                    }
                }
            }

            return { transactions, nextPageToken };
        } catch (error) {
            logger.error(`Error in getUserTransactions for user ${userId}:`, error);
            // Return empty list instead of crashing, or rethrow? 
            // 500 is better than silent failure for debugging, but user experience is bad.
            // Let's rethrow properly as ApiError if possible, or just let express handler catch it.
            // But now we have logged it.
            throw error;
        }
    }

    /**
     * Create a single transaction.
     */
    static async createTransaction(
        userId: string,
        transaction: TransactionProto
    ): Promise<TransactionProto> {
        const result = await getAccountRef(userId, transaction.accountId);

        if (!result) {
            throw ApiError.notFound('Account');
        }

        const { ref: accountRef } = result;

        const txId = transaction.transactionId || v4();

        // Ensure date is Proto
        let dateProto = transaction.date;
        if (typeof transaction.date === 'string') {
            dateProto = toDateProto(new Date(transaction.date));
        } else if (transaction.date instanceof Date) {
            dateProto = toDateProto(transaction.date);
        } else if (transaction.date && typeof transaction.date === 'object' && !('timestamp' in transaction.date)) {
            // Handle generic object if needed, but schema should catch valid proto
            dateProto = toDateProto(transaction.date as unknown as Date);
        }

        const txWithUserId: TransactionProto = {
            ...transaction,
            transactionId: txId,
            userId, // Ensure userId is set
            date: dateProto
        };

        // If balance is provided, create a checkpoint
        if (transaction.balance !== undefined) {
            await ReconciliationService.createCheckpoint(
                userId,
                transaction.accountId,
                transaction.balance,
                dateProto,
                BalanceCheckpointType.MANUAL
            );
            // Remove balance from the stored transaction data
            delete txWithUserId.balance;
        }

        const nestedRef = accountRef.collection('transactions').doc(txId);
        await nestedRef.set(txWithUserId);

        const globalRef = getUserRef(userId).collection('transactions').doc(nestedRef.id);
        await globalRef.set({ RefTxId: nestedRef });

        return { ...txWithUserId, transactionId: nestedRef.id };
    }

    /**
     * Batch create multiple transactions for an account.
     */
    static async batchCreateTransactions(
        userId: string,
        accountId: string,
        transactions: Partial<TransactionProto>[],
        options: { skipDuplicates?: boolean } = {}
    ): Promise<{ importedCount: number; duplicateCount: number; minDate: Date | null }> {
        const result = await getAccountRef(userId, accountId);

        if (!result) {
            throw ApiError.notFound('Account');
        }

        const { ref: accountRef } = result;
        const batch = db.batch();
        let minDate: Date | null = null;
        let importedCount = 0;
        let duplicateCount = 0;

        const txsToImport: Partial<TransactionProto>[] = [];

        if (options.skipDuplicates) {
            // Deduplicate by ID first within the input
            const uniqueInput = new Map<string, Partial<TransactionProto>>();
            for (const tx of transactions) {
                if (tx.transactionId) {
                    uniqueInput.set(tx.transactionId, tx);
                } else {
                    txsToImport.push(tx);
                }
            }

            const uniqueTxs = Array.from(uniqueInput.values());

            if (uniqueTxs.length > 0) {
                const refs = uniqueTxs.map(tx => accountRef.collection('transactions').doc(tx.transactionId!));
                const snapshots = await db.getAll(...refs);

                snapshots.forEach((snap, index) => {
                    if (snap.exists) {
                        duplicateCount++;
                    } else {
                        const tx = uniqueTxs[index];
                        if (tx) {
                            txsToImport.push(tx);
                        }
                    }
                });
            }
        } else {
            txsToImport.push(...transactions);
        }

        for (const txData of txsToImport) {
            const txId = txData.transactionId || v4();

            // Handle date conversion if needed. 
            // If it's a batch import, caller should have provided compatible date proto or ISO string?
            // Let's assume input has correct proto OR we convert.
            let txDateProto: any = txData.date;
            if (txData.date && typeof txData.date === 'string') {
                txDateProto = toDateProto(new Date(txData.date));
            } else if (txData.date && typeof txData.date === 'object' && !('timestamp' in txData.date)) {
                // Assume it's a Date object
                txDateProto = toDateProto(txData.date as any);
            }

            const tx: TransactionProto = {
                ...txData,
                transactionId: txId,
                accountId,
                userId,
                date: txDateProto
            } as TransactionProto;

            const nestedRef = accountRef.collection('transactions').doc(txId);
            batch.set(nestedRef, tx);

            const globalRef = getUserRef(userId).collection('transactions').doc(txId);
            batch.set(globalRef, { RefTxId: nestedRef });

            const jsDate = new Date(txDateProto.timestamp);
            if (!minDate || jsDate < minDate) {
                minDate = jsDate;
            }
            importedCount++;
        }

        if (importedCount > 0) {
            await batch.commit();
        }

        // Trigger Reconciliation Refresh
        if (minDate) {
            await ReconciliationService.refreshCheckpoints(userId, accountId, minDate);
        }

        return { importedCount, duplicateCount, minDate };
    }

    /**
     * Delete a transaction by ID.
     */
    static async deleteTransaction(userId: string, transactionId: string): Promise<void> {
        const globalRef = getUserRef(userId).collection('transactions').doc(transactionId);
        const globalDoc = await globalRef.get();

        if (!globalDoc.exists) {
            throw ApiError.notFound('Transaction');
        }

        const data = globalDoc.data();
        const nestedRef = data?.RefTxId as admin.firestore.DocumentReference | undefined;

        if (nestedRef) {
            await nestedRef.delete();
        } else {
            logger.warn(`Global transaction ${transactionId} has no RefTxId`);
        }

        await globalRef.delete();
    }

    /**
     * Create an atomic transfer between two accounts.
     * Both source and destination transactions are created in a single batch.
     */
    static async createTransfer(
        userId: string,
        source: TransactionProto,
        destination: TransactionProto
    ): Promise<{ source: TransactionProto; destination: TransactionProto }> {
        // Validate accounts exist
        const sourceAccountResult = await getAccountRef(userId, source.accountId);
        const destAccountResult = await getAccountRef(userId, destination.accountId);

        if (!sourceAccountResult) {
            throw ApiError.notFound('Source account');
        }
        if (!destAccountResult) {
            throw ApiError.notFound('Destination account');
        }

        const { ref: sourceAccountRef } = sourceAccountResult;
        const { ref: destAccountRef } = destAccountResult;

        // Generate IDs if not provided
        const sourceId = source.transactionId || v4();
        const destId = destination.transactionId || v4();

        const sourceTx = { ...source, transactionId: sourceId };
        const destTx = { ...destination, transactionId: destId };

        // Create both transactions in a single atomic batch
        const batch = db.batch();

        // Source transaction (nested + global reference)
        const sourceNestedRef = sourceAccountRef.collection('transactions').doc(sourceId);
        batch.set(sourceNestedRef, sourceTx);
        const sourceGlobalRef = getUserRef(userId).collection('transactions').doc(sourceId);
        batch.set(sourceGlobalRef, { RefTxId: sourceNestedRef });

        // Destination transaction (nested + global reference)
        const destNestedRef = destAccountRef.collection('transactions').doc(destId);
        batch.set(destNestedRef, destTx);
        const destGlobalRef = getUserRef(userId).collection('transactions').doc(destId);
        batch.set(destGlobalRef, { RefTxId: destNestedRef });

        await batch.commit();

        return { source: sourceTx, destination: destTx };
    }
    /**
     * Update a transaction.
     */
    static async updateTransaction(
        userId: string,
        transactionId: string,
        updates: Partial<TransactionProto>
    ): Promise<void> {
        const globalRef = getUserRef(userId).collection('transactions').doc(transactionId);
        const globalDoc = await globalRef.get();

        if (!globalDoc.exists) {
            throw ApiError.notFound('Transaction');
        }

        const data = globalDoc.data();
        const nestedRef = data?.RefTxId as admin.firestore.DocumentReference | undefined;

        if (!nestedRef) {
            throw ApiError.internal('Transaction reference missing');
        }

        const nestedDoc = await nestedRef.get();
        if (!nestedDoc.exists) {
            throw ApiError.notFound('Transaction data');
        }

        const currentTx = nestedDoc.data() as TransactionProto;

        // Prevent updating immutable fields
        delete updates.transactionId;
        delete updates.userId;
        delete updates.accountId;
        delete updates.currency;
        if (updates.tagIds !== undefined) {
            // tagIds is allowed
        }

        if (updates.date) {
            // Convert to proto if passed as string/date
            /* Logic to convert updates.date to DateProto if needed */
            if (updates.date instanceof Date) {
                updates.date = toDateProto(updates.date);
            } else if (typeof updates.date === 'string') {
                updates.date = toDateProto(new Date(updates.date));
            }
        }

        await nestedRef.update(updates);

        // Trigger Reconciliation Refresh if amount or date changed
        if (updates.amount !== undefined || updates.date !== undefined) {
            const currentTxDate = new Date(currentTx.date.timestamp);
            let minDate = currentTxDate;
            if (updates.date) {
                const newDate = new Date(updates.date.timestamp);
                minDate = newDate < currentTxDate ? newDate : currentTxDate;
            }
            await ReconciliationService.refreshCheckpoints(userId, currentTx.accountId, minDate);
        }
    }
}

