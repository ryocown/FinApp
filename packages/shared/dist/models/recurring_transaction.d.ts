import { type TransactionProto } from "./transaction.js";
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export interface RecurringTransactionProto {
    recurringTransactionId: string;
    templateTransaction: TransactionProto;
    frequency: RecurrenceFrequency;
    nextDueDate: Date;
    endDate: Date | null;
}
export declare class RecurringTransaction implements RecurringTransactionProto {
    recurringTransactionId: string;
    templateTransaction: TransactionProto;
    frequency: RecurrenceFrequency;
    nextDueDate: Date;
    endDate: Date | null;
    constructor(templateTransaction: TransactionProto, frequency: RecurrenceFrequency, nextDueDate: Date, endDate?: Date | null);
    static fromJSON(json: any): RecurringTransaction;
}
