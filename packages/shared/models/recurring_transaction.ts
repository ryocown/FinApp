import { v4 } from "uuid";
import { GeneralTransaction, type TransactionProto, TradeTransaction, TransactionType, TransferTransaction } from "./transaction.js";

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransactionProto {
  recurringTransactionId: string;
  templateTransaction: TransactionProto;

  frequency: RecurrenceFrequency;
  nextDueDate: Date;
  endDate: Date | null;
}

export class RecurringTransaction implements RecurringTransactionProto {
  recurringTransactionId: string;
  templateTransaction: TransactionProto;

  frequency: RecurrenceFrequency;
  nextDueDate: Date;
  endDate: Date | null;

  constructor(templateTransaction: TransactionProto, frequency: RecurrenceFrequency, nextDueDate: Date, endDate: Date | null = null) {
    this.recurringTransactionId = v4();
    this.templateTransaction = templateTransaction;
    this.frequency = frequency;
    this.nextDueDate = nextDueDate;
    this.endDate = endDate;
  }

  static fromJSON(json: any): RecurringTransaction {
    let templateTransaction: TransactionProto;
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
        throw new Error(`Unknown transaction type: ${json.templateTransaction.transactionType} `);
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
