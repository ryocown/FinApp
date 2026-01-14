import { type StatementProto } from "../models/statement.js";
import { type TransactionProto, TransactionType } from "../models/transaction.js";
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
export interface StatementImporterProto {
    import(source: any): Promise<StatementProto>;
}
export declare abstract class StatementImporter implements StatementImporterProto {
    protected accountId: string;
    protected userId: string;
    protected mapping: ICsvMapping;
    protected currency: ICurrency;
    protected transactionTypeColumn: string;
    constructor(accountId: string, userId: string, mapping: ICsvMapping, currency: ICurrency);
    import(source: string): Promise<StatementProto>;
    protected abstract checkTransactionType(record: any): TransactionType;
    protected processTransaction(record: any): Promise<TransactionProto | null>;
}
