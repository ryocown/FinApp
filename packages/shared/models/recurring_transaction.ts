import { v4 } from "uuid";
import { ITransaction } from "./transaction";

export enum RecurrenceFrequency {
  Daily = 'DAILY',
  Weekly = 'WEEKLY',
  BiWeekly = 'BI_WEEKLY',
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY'
}

export interface IRecurringTransaction {
  recurringTransactionId: string;
  templateTransaction: ITransaction;

  frequency: RecurrenceFrequency;
  nextDueDate: Date;
  endDate: Date | null;
}

export class RecurringTransaction implements IRecurringTransaction {
  recurringTransactionId: string;
  templateTransaction: ITransaction;

  frequency: RecurrenceFrequency;
  nextDueDate: Date;
  endDate: Date | null;

  constructor(templateTransaction: ITransaction, frequency: RecurrenceFrequency, nextDueDate: Date, endDate: Date | null = null) {
    this.recurringTransactionId = v4();
    this.templateTransaction = templateTransaction;
    this.frequency = frequency;
    this.nextDueDate = nextDueDate;
    this.endDate = endDate;
  }
}
