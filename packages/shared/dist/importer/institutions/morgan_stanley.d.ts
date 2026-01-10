import type { IStatement } from "../../models/statement.js";
import { type ITransaction, TransactionType } from "../../models/transaction.js";
import { StatementImporter } from "../importer.js";
export declare class MorganStanleyStatementImporter extends StatementImporter {
    constructor(accountId: string, userId: string);
    protected checkTransactionType(record: any): TransactionType;
    protected processTransaction(record: any): Promise<ITransaction | null>;
    import(source: string): Promise<IStatement>;
    private static getInstrumentId;
}
