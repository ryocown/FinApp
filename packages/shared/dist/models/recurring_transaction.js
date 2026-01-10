import { v4 } from "uuid";
import { GeneralTransaction, TradeTransaction, TransactionType, TransferTransaction } from "./transaction.js";
export var RecurrenceFrequency;
(function (RecurrenceFrequency) {
    RecurrenceFrequency["Daily"] = "DAILY";
    RecurrenceFrequency["Weekly"] = "WEEKLY";
    RecurrenceFrequency["BiWeekly"] = "BI_WEEKLY";
    RecurrenceFrequency["Monthly"] = "MONTHLY";
    RecurrenceFrequency["Yearly"] = "YEARLY";
})(RecurrenceFrequency || (RecurrenceFrequency = {}));
export class RecurringTransaction {
    recurringTransactionId;
    templateTransaction;
    frequency;
    nextDueDate;
    endDate;
    constructor(templateTransaction, frequency, nextDueDate, endDate = null) {
        this.recurringTransactionId = v4();
        this.templateTransaction = templateTransaction;
        this.frequency = frequency;
        this.nextDueDate = nextDueDate;
        this.endDate = endDate;
    }
    static fromJSON(json) {
        let templateTransaction;
        switch (json.templateTransaction.transactionType) {
            case TransactionType.General:
                templateTransaction = GeneralTransaction.fromJSON(json.templateTransaction);
                break;
            case TransactionType.Trade:
                templateTransaction = TradeTransaction.fromJSON(json.templateTransaction);
                break;
            case TransactionType.Transfer:
                templateTransaction = TransferTransaction.fromJSON(json.templateTransaction);
                break;
            default:
                throw new Error(`Unknown transaction type: ${json.templateTransaction.transactionType}`);
        }
        const recurringTransaction = new RecurringTransaction(templateTransaction, json.frequency, new Date(json.nextDueDate), json.endDate ? new Date(json.endDate) : null);
        recurringTransaction.recurringTransactionId = json.recurringTransactionId;
        return recurringTransaction;
    }
}
