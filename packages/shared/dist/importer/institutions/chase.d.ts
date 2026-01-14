import { StatementImporter } from '../importer.js';
import { type TransactionProto, TransactionType } from '../../models/transaction.js';
/**
 * Checking account CSV format:
 *
 * Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
 * DEBIT,12/01/2025,"ZELLE PAYMENT TO XXXX 123456789",-16.00,QUICKPAY_DEBIT, ,,
 * DEBIT,11/28/2025,"INTERNATIONAL INCOMING WIRE FEE",-15.00,FEE_TRANSACTION,51362.79,,
 */
export declare class ChaseCsvStatementImporter extends StatementImporter {
    constructor(accountId: string, userId: string);
    protected checkTransactionType(record: any): TransactionType;
    protected processTransaction(record: any): Promise<TransactionProto | null>;
}
/**
 * Credit card CSV format:
 *
 * Transaction Date,Post Date,Description,Category,Type,Amount,Memo
 * 11/28/2025,11/28/2025,GO/MASSAGE* GOOGLER SE,Personal,Sale,-17.03,
 * 11/23/2025,11/24/2025,GOOGLE*YOUTUBEPREMIUM,Bills & Utilities,Sale,-14.60,
 */
export declare class ChaseCreditCsvStatementImporter extends StatementImporter {
    constructor(accountId: string, userId: string);
    protected checkTransactionType(record: any): TransactionType;
    protected processTransaction(record: any): Promise<TransactionProto | null>;
}
