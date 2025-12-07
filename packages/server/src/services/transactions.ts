import admin from 'firebase-admin';
import { v4 } from 'uuid';
import { db, getUserRef, getAccountRef, resolveTransactionReferences } from '../firebase';
import type { ITransaction } from '../../../shared/models/transaction';
import { ApiError } from '../errors';
import { ReconciliationService } from './reconciliation';
import { logger } from '../logger';
import { ensureDate } from '@finapp/shared/lib/date_utils';

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
    ): Promise<{ transactions: ITransaction[]; nextPageToken: string | null }> {
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
            query = collectionRef.orderBy('date', sortOrder);
        } else {
            query = db.collectionGroup('transactions')
                .where('userId', '==', userId)
                .orderBy('date', sortOrder);
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

        return { transactions, nextPageToken };
    }

    /**
     * Create a single transaction.
     */
    static async createTransaction(
        userId: string,
        transaction: ITransaction
    ): Promise<ITransaction> {
        const result = await getAccountRef(userId, transaction.accountId);

        if (!result) {
            throw ApiError.notFound('Account');
        }

        const { ref: accountRef } = result;

        const txId = transaction.transactionId || v4();
        const txWithUserId: ITransaction = {
            ...transaction,
            transactionId: txId,
            userId // Ensure userId is set
        };

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
        transactions: Partial<ITransaction>[],
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

        // If skipDuplicates is true, we need to check for existence
        // We can optimize this by checking all IDs in parallel if the batch is small enough
        // or just check one by one if we want to be safe. 
        // For Firestore, we can use getAll() for up to 100 documents usually, or just loop.
        // Given BATCH_SIZE is usually small (e.g. 400 in script, but Firestore batch limit is 500),
        // we should be careful.

        const txsToImport: Partial<ITransaction>[] = [];

        if (options.skipDuplicates) {
            // Deduplicate by ID first within the input
            const uniqueInput = new Map<string, Partial<ITransaction>>();
            for (const tx of transactions) {
                if (tx.transactionId) {
                    uniqueInput.set(tx.transactionId, tx);
                } else {
                    // If no ID, we can't really check for duplicates easily without generating one
                    // But usually imports have deterministic IDs or we generate them before calling this
                    // If we generate random IDs here, we can't detect duplicates from previous runs
                    // So we assume caller provides deterministic IDs for duplicate detection to work effectively
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
            const txDate = new Date(txData.date as Date | string);

            const tx: ITransaction = {
                ...txData,
                transactionId: txId,
                accountId,
                userId,
                date: txDate
            } as ITransaction;

            const nestedRef = accountRef.collection('transactions').doc(txId);
            batch.set(nestedRef, tx);

            const globalRef = getUserRef(userId).collection('transactions').doc(txId);
            batch.set(globalRef, { RefTxId: nestedRef });

            if (!minDate || txDate < minDate) {
                minDate = txDate;
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
        source: ITransaction,
        destination: ITransaction
    ): Promise<{ source: ITransaction; destination: ITransaction }> {
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
        updates: Partial<ITransaction>
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

        const currentTx = nestedDoc.data() as ITransaction;

        // Prevent updating immutable fields
        delete updates.transactionId;
        delete updates.userId;
        delete updates.accountId;
        delete updates.currency;
        delete updates.tagIds;

        // If date is updated, ensure it's a Date object
        if (updates.date) {
            updates.date = ensureDate(updates.date);
        }

        await nestedRef.update(updates);

        // Trigger Reconciliation Refresh if amount or date changed
        if (updates.amount !== undefined || updates.date !== undefined) {
            const currentTxDate = ensureDate(currentTx.date);
            const minDate = updates.date && updates.date < currentTxDate ? updates.date : currentTxDate;
            await ReconciliationService.refreshCheckpoints(userId, currentTx.accountId, minDate);
        }
    }
}

