import { type IStatement } from "../models/statement.js";
import { type ITransaction, TransactionType } from "../models/transaction.js";
import { type ICurrency } from "../models/currency.js";
export interface ICsvMapping {
    dateColumn: string;
    amountColumn: string;
    descriptionColumn: string;
    merchantColumn?: string;
    transactionTypeColumn: string;
    categoryColumn?: string;
    quantityColumn?: string;
    priceColumn?: string;
    cusipColumn?: string;
    symbolColumn?: string;
}
export interface IStatementImporter {
    import(source: any): Promise<IStatement>;
}
export declare abstract class StatementImporter implements IStatementImporter {
    protected accountId: string;
    protected userId: string;
    protected mapping: ICsvMapping;
    protected currency: ICurrency;
    protected transactionTypeColumn: string;
    constructor(accountId: string, userId: string, mapping: ICsvMapping, currency: ICurrency);
    import(source: string): Promise<IStatement>;
    protected abstract checkTransactionType(record: any): TransactionType;
    protected processTransaction(record: any): Promise<ITransaction | null>;
}
