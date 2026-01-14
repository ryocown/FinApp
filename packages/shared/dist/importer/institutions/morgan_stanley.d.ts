import type { StatementProto } from "../../models/statement.js";
import { type TransactionProto, TransactionType } from "../../models/transaction.js";
import { StatementImporter } from "../importer.js";
export declare class MorganStanleyStatementImporter extends StatementImporter {
    constructor(accountId: string, userId: string);
    protected checkTransactionType(record: any): TransactionType;
    protected processTransaction(record: any): Promise<TransactionProto | null>;
    import(source: string): Promise<StatementProto>;
    private static getInstrumentId;
}
