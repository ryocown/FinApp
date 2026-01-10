import {} from "../models/statement.js";
import { TransactionType } from "../models/transaction.js";
import {} from "../models/currency.js";
export class StatementImporter {
    accountId;
    userId;
    mapping;
    currency;
    transactionTypeColumn;
    constructor(accountId, userId, mapping, currency) {
        this.accountId = accountId;
        this.userId = userId;
        this.mapping = mapping;
        this.currency = currency;
        this.transactionTypeColumn = mapping.transactionTypeColumn;
    }
    async import(source) {
        throw new Error("StatementImporter is deprecated. Use TransactionProcessor.");
    }
    async processTransaction(record) {
        return null;
    }
}
