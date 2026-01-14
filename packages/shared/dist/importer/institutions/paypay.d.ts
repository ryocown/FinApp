import { StatementImporter } from "../importer.js";
import { type TransactionProto, TransactionType } from "../../models/transaction.js";
export declare class PayPayStatementImporter extends StatementImporter {
    constructor(accountId: string, userId: string);
    protected checkTransactionType(record: any): TransactionType;
    protected processTransaction(record: any): Promise<TransactionProto | null>;
}
