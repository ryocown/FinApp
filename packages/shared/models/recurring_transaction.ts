import { v4 } from "uuid";
import { GeneralTransaction, type ITransaction, TradeTransaction, TransactionType, TransferTransaction } from "./transaction";

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

  static fromJSON(json: any): RecurringTransaction {
    let templateTransaction: ITransaction;
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

    const recurringTransaction = new RecurringTransaction(
      templateTransaction,
      json.frequency,
      new Date(json.nextDueDate),
      json.endDate ? new Date(json.endDate) : null
    );
    recurringTransaction.recurringTransactionId = json.recurringTransactionId;
    return recurringTransaction;
  }
}
