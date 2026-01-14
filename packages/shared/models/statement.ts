import { v4 } from "uuid";
import { GeneralTransaction, type TransactionProto, TradeTransaction, TransactionType, TransferTransaction } from "./transaction.js";
import { type DateProto, toDateProto } from "./date-proto.js";

export interface StatementProto {
  statementId: string;
  accountId: string;

  periodStart: DateProto;
  periodEnd: DateProto;

  openingBalance: number;
  closingBalance: number;

  isReconciled: boolean;
  pdfUrl?: string;

  // Optional: transactions might not always be loaded
  transactions?: TransactionProto[];
}

export class Statement implements StatementProto {
  statementId: string;
  accountId: string;

  periodStart: DateProto;
  periodEnd: DateProto;

  openingBalance: number;
  closingBalance: number;

  isReconciled: boolean;
  pdfUrl?: string;

  transactions?: TransactionProto[];

  constructor(accountId: string, startDate: Date, endDate: Date, openingBalance: number, closingBalance: number, transactions?: TransactionProto[]) {
    this.statementId = v4();
    this.accountId = accountId;

    this.periodStart = toDateProto(startDate);
    this.periodEnd = toDateProto(endDate);

    this.openingBalance = openingBalance;
    this.closingBalance = closingBalance;
    this.isReconciled = false;

    this.transactions = transactions;
  }

  static fromJSON(json: any): Statement {
    let transactions: TransactionProto[] | undefined = undefined;

    if (json.transactions) {
      transactions = json.transactions.map((t: any) => {
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

    const statement = new Statement(
      json.accountId,
      startDate,
      endDate,
      json.openingBalance || 0,
      json.closingBalance || 0,
      transactions
    );
    statement.statementId = json.statementId;
    statement.isReconciled = json.isReconciled || false;
    if (json.pdfUrl) statement.pdfUrl = json.pdfUrl;

    return statement;
  }
}