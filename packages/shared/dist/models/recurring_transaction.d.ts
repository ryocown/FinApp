import { type ITransaction } from "./transaction.js";
export declare enum RecurrenceFrequency {
    Daily = "DAILY",
    Weekly = "WEEKLY",
    BiWeekly = "BI_WEEKLY",
    Monthly = "MONTHLY",
    Yearly = "YEARLY"
}
export interface IRecurringTransaction {
    recurringTransactionId: string;
    templateTransaction: ITransaction;
    frequency: RecurrenceFrequency;
    nextDueDate: Date;
    endDate: Date | null;
}
export declare class RecurringTransaction implements IRecurringTransaction {
    recurringTransactionId: string;
    templateTransaction: ITransaction;
    frequency: RecurrenceFrequency;
    nextDueDate: Date;
    endDate: Date | null;
    constructor(templateTransaction: ITransaction, frequency: RecurrenceFrequency, nextDueDate: Date, endDate?: Date | null);
    static fromJSON(json: any): RecurringTransaction;
}
