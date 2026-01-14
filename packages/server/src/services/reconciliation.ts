import admin from 'firebase-admin';
import { v4 } from 'uuid';
import { db, getUserRef, getAccountRef } from '../firebase.js';
import { type IBalanceCheckpoint, BalanceCheckpointType } from '@finapp/shared';
import { type TransactionProto, TransactionType, toDateProto, type DateProto } from '@finapp/shared';
import { logger } from '../logger.js';

export class ReconciliationService {
  /**
   * Reconcile an account to a target balance at a specific date.
   * Automatically creates or updates a RECONCILIATION transaction if needed.
   */
  static async reconcileAccount(
    userId: string,
    accountId: string,
    date: DateProto,
    targetBalance: number
  ): Promise<IBalanceCheckpoint> {
    const reconcileDate = new Date(date.timestamp);
    // 1. Find the account and its parent institute
    const result = await getAccountRef(userId, accountId);
    if (!result) {
      throw new Error('Account not found');
    }
    const { ref: accountRef } = result;
    const initialAccountDoc = await accountRef.get();
    if (!initialAccountDoc.exists) {
      throw new Error('Account document does not exist');
    }
    const initialAccountData = initialAccountDoc.data();
    const currency = initialAccountData?.currency || { code: 'USD', symbol: '$', name: 'US Dollar' };

    // 2. Find the last checkpoint BEFORE this reconciliation date
    const lastCheckpointSnap = await accountRef.collection('balance_checkpoints')
      .where('date.timestamp', '<=', reconcileDate.getTime())
      .orderBy('date.timestamp', 'desc')
      .limit(1)
      .get();

    let startBalance = 0;
    let startDate = new Date(0); // Epoch
    const reconcileDateTimestamp = reconcileDate.getTime();

    if (!lastCheckpointSnap.empty) {
      const doc = lastCheckpointSnap.docs[0];
      if (doc) {
        const lastCheckpoint = doc.data() as IBalanceCheckpoint;

        if (lastCheckpoint.date && lastCheckpoint.date.timestamp === reconcileDateTimestamp) {
          // We are re-reconciling the same day. We need the checkpoint BEFORE this one to be the "Start".
          const prevCheckpointSnap = await accountRef.collection('balance_checkpoints')
            .where('date.timestamp', '<', date.timestamp)
            .orderBy('date.timestamp', 'desc')
            .limit(1)
            .get();

          if (!prevCheckpointSnap.empty) {
            const prevDoc = prevCheckpointSnap.docs[0];
            if (prevDoc) {
              const prev = prevDoc.data() as IBalanceCheckpoint;
              startBalance = prev.balance;
              startDate = new Date(prev.date.timestamp);
            }
          }
        } else {
          startBalance = lastCheckpoint.balance;
          startDate = new Date(lastCheckpoint.date.timestamp);
        }
      }
    }

    // 3. Sum transactions in (startDate, date]
    // We must EXCLUDE any existing RECONCILIATION transaction for THIS date to avoid circular logic
    // 3. Sum transactions in (startDate, date]
    // We must EXCLUDE any existing RECONCILIATION transaction for THIS date to avoid circular logic
    const transactionsSnap = await accountRef.collection('transactions')
      .where('date.timestamp', '>', startDate.getTime())
      .where('date.timestamp', '<=', reconcileDateTimestamp)
      .get();

    let calculatedSum = 0;
    let existingReconTxId: string | null = null;

    transactionsSnap.forEach(doc => {
      const tx = doc.data() as TransactionProto;
      // Handle date access: tx.date is TransactionProto -> DateProto
      const txDateTimestamp = tx.date.timestamp;

      if (tx.transactionType === TransactionType.Reconciliation && txDateTimestamp === reconcileDateTimestamp) {
        existingReconTxId = tx.transactionId;
      } else {
        calculatedSum += tx.amount;
      }
    });

    // 4. Calculate Adjustment
    const expectedBalance = startBalance + calculatedSum;
    const adjustmentAmount = targetBalance - expectedBalance;

    // Round to 2 decimals
    const roundedAdjustment = Math.round(adjustmentAmount * 100) / 100;

    // 5. Create/Update/Delete Adjustment Transaction
    if (Math.abs(roundedAdjustment) >= 0.01) {
      if (existingReconTxId) {
        // Update existing
        await accountRef.collection('transactions').doc(existingReconTxId).update({
          amount: roundedAdjustment,
          description: 'Reconciliation Adjustment (Updated)'
        });
        logger.info(`Updated reconciliation adjustment for ${accountId}: ${roundedAdjustment}`);
      } else {
        // Create new
        const categoryId = await this.getReconciliationCategoryId(userId);
        const newTx: TransactionProto = {
          transactionId: v4(),
          accountId,
          userId,
          date: date,
          amount: roundedAdjustment,
          currency,
          description: 'Reconciliation Adjustment',
          transactionType: TransactionType.Reconciliation,
          ...(categoryId ? { categoryId } : {}),
          tagIds: [],
          statementId: null // Add statementId as null
        };

        await accountRef.collection('transactions').doc(newTx.transactionId).set(newTx);

        await getUserRef(userId).collection('transactions').doc(newTx.transactionId).set({
          RefTxId: accountRef.collection('transactions').doc(newTx.transactionId)
        });

        logger.info(`Created reconciliation adjustment for ${accountId}: ${roundedAdjustment}`);
      }
    } else {
      // No adjustment needed
      if (existingReconTxId) {
        // Delete existing
        await accountRef.collection('transactions').doc(existingReconTxId).delete();
        await getUserRef(userId).collection('transactions').doc(existingReconTxId).delete();
        logger.info(`Deleted unnecessary reconciliation adjustment for ${accountId}`);
      }
    }

    // 6. Save Checkpoint
    const checkpoint: IBalanceCheckpoint = {
      id: v4(),
      accountId,
      date: date,
      balance: targetBalance,
      type: BalanceCheckpointType.MANUAL,
      createdAt: toDateProto(new Date())
    };

    // Check if we already have a checkpoint at this date, if so update it
    if (!lastCheckpointSnap.empty) {
      const doc = lastCheckpointSnap.docs[0];
      if (doc) {
        const last = doc.data() as IBalanceCheckpoint;
        if (last.date && last.date.timestamp === reconcileDateTimestamp) {
          checkpoint.id = last.id; // Reuse ID
        }
      }
    }

    await accountRef.collection('balance_checkpoints').doc(checkpoint.id).set(checkpoint);

    // 7. Update Account Balance - SKIPPED
    // We strictly use checkpoints as source of truth now.
    // The 'Account' document will not hold the balance.

    return checkpoint;

    return checkpoint;
  }

  /**
   * Refresh reconciliation checkpoints after a batch import.
   * Finds all checkpoints AFTER the minDate and recalculates their adjustments.
   */
  static async refreshCheckpoints(
    userId: string,
    accountId: string,
    minDate: Date
  ): Promise<void> {
    const result = await getAccountRef(userId, accountId);
    if (!result) return;
    const { ref: accountRef } = result;

    // Find all checkpoints >= minDate
    const checkpointsSnap = await accountRef.collection('balance_checkpoints')
      .where('date.timestamp', '>=', minDate.getTime())
      .orderBy('date.timestamp', 'asc')
      .get();

    if (checkpointsSnap.empty) return;

    logger.info(`Refreshing ${checkpointsSnap.size} checkpoints for account ${accountId} starting from ${minDate.toISOString()}`);

    for (const doc of checkpointsSnap.docs) {
      const checkpoint = doc.data() as IBalanceCheckpoint;
      const checkpointDate = new Date(checkpoint.date.timestamp);
      await this.reconcileAccount(userId, accountId, checkpoint.date, checkpoint.balance);
    }
  }


  /**
   * Validate a list of checkpoints by calculating the actual balance from transactions.
   * Returns the checkpoints with validation results attached.
   */
  static async validateCheckpoints(
    userId: string,
    accountId: string,
    checkpoints: IBalanceCheckpoint[]
  ): Promise<IBalanceCheckpoint[]> {
    if (checkpoints.length === 0) return checkpoints;

    const result = await getAccountRef(userId, accountId);
    if (!result) return checkpoints;
    const { ref: accountRef } = result;

    // Sort checkpoints by date ascending for easier calculation
    const sortedCheckpoints = [...checkpoints].sort((a, b) =>
      a.date.timestamp - b.date.timestamp
    );

    // We only validate the provided checkpoints.
    // Ideally, we need the "start balance" for the first checkpoint in this list.
    // If the first checkpoint is the very first one ever, start balance is 0.
    // Otherwise, we need the checkpoint immediately preceding it.

    // For simplicity and performance in this batch operation, we will do a "local validation"
    // where we assume the *previous* checkpoint in the list is the anchor.
    // If there is no previous checkpoint in the list, we might skip validation for the first one
    // OR fetch the one before it from DB.
    // Let's fetch the one immediately before the first one in our list to anchor the chain.

    const firstDate = new Date(sortedCheckpoints[0]!.date.timestamp);
    const prevCheckpointSnap = await accountRef.collection('balance_checkpoints')
      .where('date.timestamp', '<', firstDate.getTime())
      .orderBy('date.timestamp', 'desc')
      .limit(1)
      .get();

    let runningBalance = 0;
    let lastDate = new Date(0); // Epoch

    if (!prevCheckpointSnap.empty) {
      const doc = prevCheckpointSnap.docs[0];
      if (doc) {
        const prev = doc.data() as IBalanceCheckpoint;
        runningBalance = prev.balance;
        lastDate = new Date(prev.date.timestamp);
      }
    }

    const validatedCheckpoints: IBalanceCheckpoint[] = [];

    for (const checkpoint of sortedCheckpoints) {
      const currentDate = new Date(checkpoint.date.timestamp);

      // Sum transactions between lastDate and currentDate
      // EXCLUDING the reconciliation adjustment for THIS checkpoint date (if any)
      // because the checkpoint balance is supposed to be the "truth" that the adjustment fixes.
      // Wait, actually:
      // The "Checkpoint Balance" is the Target.
      // The "Actual Balance" is (Start Balance + Transactions).
      // If we include the Adjustment, then Actual == Target (if reconciled).
      // If we delete the Adjustment, then Actual != Target.
      // So we SHOULD include all transactions, including adjustments, to see if they sum up to the checkpoint.

      const transactionsSnap = await accountRef.collection('transactions')
        .where('date.timestamp', '>', lastDate.getTime())
        .where('date.timestamp', '<=', currentDate.getTime())
        .get();

      let periodSum = 0;
      transactionsSnap.forEach(doc => {
        const tx = doc.data() as TransactionProto;
        periodSum += tx.amount;
      });

      const calculatedBalance = runningBalance + periodSum;
      const difference = calculatedBalance - checkpoint.balance;

      // Round to 2 decimals to avoid float issues
      const roundedDiff = Math.round(difference * 100) / 100;
      const isValid = Math.abs(roundedDiff) < 0.01;

      validatedCheckpoints.push({
        ...checkpoint,
        validation: {
          isValid,
          difference: roundedDiff
        }
      });

      // Update running params for next iteration
      // We trust the CHECKPOINT balance as the start for the next period
      // because that's how reconciliation works (it resets the truth).
      runningBalance = checkpoint.balance;
      lastDate = currentDate;
    }

    // Return in original order (descending usually)
    return validatedCheckpoints.sort((a, b) =>
      b.date.timestamp - a.date.timestamp
    );
  }

  /**
   * Delete a checkpoint and its associated reconciliation adjustment transaction.
   */
  static async deleteCheckpoint(
    userId: string,
    accountId: string,
    checkpointId: string
  ): Promise<void> {
    const result = await getAccountRef(userId, accountId);
    if (!result) throw new Error('Account not found');
    const { ref: accountRef } = result;

    // 1. Get the checkpoint to know its date
    const checkpointDoc = await accountRef.collection('balance_checkpoints').doc(checkpointId).get();
    if (!checkpointDoc.exists) {
      throw new Error('Checkpoint not found');
    }
    const checkpoint = checkpointDoc.data()! as IBalanceCheckpoint;
    const checkpointDate = checkpoint.date instanceof Date ? checkpoint.date : (checkpoint.date as any).toDate();

    // 2. Delete the checkpoint
    await accountRef.collection('balance_checkpoints').doc(checkpointId).delete();
    logger.info(`Deleted checkpoint ${checkpointId} for account ${accountId}`);

    // 3. Find and delete the associated Reconciliation Adjustment transaction
    // It must match: accountId, date, type=RECONCILIATION
    // Note: Timestamps might be slightly off if not exact, but our creation logic uses exact date.
    // We'll query by range just to be safe? No, creation uses exact 'date' object.

    // However, Firestore query equality on Date objects can be tricky if they aren't exact.
    // Let's try exact match first.
    const adjustmentSnap = await accountRef.collection('transactions')
      .where('transactionType', '==', TransactionType.Reconciliation)
      .where('date.timestamp', '==', checkpointDate.getTime())
      .get();

    if (!adjustmentSnap.empty) {
      const batch = db.batch();
      adjustmentSnap.forEach(doc => {
        batch.delete(doc.ref);
        // Also delete from user-level collection
        batch.delete(getUserRef(userId).collection('transactions').doc(doc.id));
      });
      await batch.commit();
      logger.info(`Deleted ${adjustmentSnap.size} associated adjustment transactions`);
    }
  }

  private static async getReconciliationCategoryId(userId: string): Promise<string | undefined> {
    const categoriesRef = getUserRef(userId).collection('categories');
    const snapshot = await categoriesRef
      .where('name', '==', 'Reconciliation')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return snapshot.docs[0]?.id;
    }
    return undefined;
  }

  /**
   * Get the latest checkpoint of a specific type (or any if type not provided).
   */
  static async getLatestCheckpoint(
    userId: string,
    accountId: string,
    type?: BalanceCheckpointType
  ): Promise<IBalanceCheckpoint | null> {
    const result = await getAccountRef(userId, accountId);
    if (!result) return null;
    const { ref: accountRef } = result;

    let query = accountRef.collection('balance_checkpoints').orderBy('date', 'desc');

    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.limit(1).get();

    if (snapshot.empty) return null;

    const data = snapshot.docs[0]!.data() as IBalanceCheckpoint;
    // Ensure date is a JS Date object
    // if (data.date && !(data.date instanceof Date)) {
    //   data.date = (data.date as any).toDate();
    // }
    return data;
  }

  /**
   * Create a checkpoint directly without reconciliation adjustment logic.
   * Used for tracking balance updates from transactions.
   */
  static async createCheckpoint(
    userId: string,
    accountId: string,
    balance: number,
    date: DateProto,
    type: BalanceCheckpointType
  ): Promise<void> {
    const result = await getAccountRef(userId, accountId);
    if (!result) return;
    const { ref: accountRef } = result;

    const checkpoint: IBalanceCheckpoint = {
      id: v4(),
      accountId,
      date,
      balance,
      type,
      createdAt: toDateProto(new Date())
    };

    // Check if we already have a checkpoint at this date/type?
    // For TRANSACTION type, we might have multiple per day? 
    // Ideally we keep the latest one for the day or just push new ones.
    // The previous logic for MANUAL reused IDs for same date. 
    // Let's reuse ID if same date AND same type to avoid clutter?
    // But transaction times might differ. 
    // If it's a specific transaction update, let's just make sure we don't spam.
    // For now, simple insert is safer to preserve history of changes. 
    // But if we want "End of Day" balance, we might want to update.

    // Let's follow existing pattern: Check for existing at this EXACT date (timestamp).
    const existingSnap = await accountRef.collection('balance_checkpoints')
      .where('date.timestamp', '==', date.timestamp)
      .where('type', '==', type)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      checkpoint.id = existingSnap.docs[0]!.id;
    }

    await accountRef.collection('balance_checkpoints').doc(checkpoint.id).set(checkpoint);
  }
}
