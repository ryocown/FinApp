import { v4 } from "uuid";
import { GeneralTransaction, TradeTransaction, TransactionType, TransferTransaction } from "./transaction.js";
import { toDateProto } from "./date-proto.js";
export class Statement {
    statementId;
    accountId;
    periodStart;
    periodEnd;
    openingBalance;
    closingBalance;
    isReconciled;
    pdfUrl;
    transactions;
    constructor(accountId, startDate, endDate, openingBalance, closingBalance, transactions) {
        this.statementId = v4();
        this.accountId = accountId;
        this.periodStart = toDateProto(startDate);
        this.periodEnd = toDateProto(endDate);
        this.openingBalance = openingBalance;
        this.closingBalance = closingBalance;
        this.isReconciled = false;
        this.transactions = transactions;
    }
    static fromJSON(json) {
        let transactions = undefined;
        if (json.transactions) {
            transactions = json.transactions.map((t) => {
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
        }
        // Handle date conversion if necessary (assuming JSON has ISO strings or timestamp)
        const startDate = json.periodStart && json.periodStart.timestamp ? new Date(json.periodStart.timestamp) : new Date(json.periodStart || json.startDate);
        const endDate = json.periodEnd && json.periodEnd.timestamp ? new Date(json.periodEnd.timestamp) : new Date(json.periodEnd || json.endDate);
        const statement = new Statement(json.accountId, startDate, endDate, json.openingBalance || 0, json.closingBalance || 0, transactions);
        statement.statementId = json.statementId;
        statement.isReconciled = json.isReconciled || false;
        if (json.pdfUrl)
            statement.pdfUrl = json.pdfUrl;
        return statement;
    }
}
