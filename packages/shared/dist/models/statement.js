import { v4 } from "uuid";
import { GeneralTransaction, TradeTransaction, TransactionType, TransferTransaction } from "./transaction.js";
export class Statement {
    statementId;
    accountId;
    startDate;
    endDate;
    endingBalance;
    transactions;
    constructor(accountId, startDate, endDate, transactions, endingBalance) {
        this.statementId = v4();
        this.accountId = accountId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.endingBalance = endingBalance;
        this.transactions = transactions;
    }
    static fromJSON(json) {
        const transactions = json.transactions.map((t) => {
            switch (t.transactionType) {
                case TransactionType.General:
                    return GeneralTransaction.fromJSON(t);
                case TransactionType.Trade:
                    return TradeTransaction.fromJSON(t);
                case TransactionType.Transfer:
                    return TransferTransaction.fromJSON(t);
                default:
                    throw new Error(`Unknown transaction type: ${t.transactionType}`);
            }
        });
        const statement = new Statement(json.accountId, new Date(json.startDate), new Date(json.endDate), transactions, json.endingBalance);
        statement.statementId = json.statementId;
        return statement;
    }
}
