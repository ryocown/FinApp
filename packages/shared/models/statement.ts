import { v4 } from "uuid";
import { GeneralTransaction, type ITransaction, TradeTransaction, TransactionType, TransferTransaction } from "./transaction";

export interface IStatement {
  statementId: string;
  accountId: string;

  startDate: Date;
  endDate: Date;
  transactions: ITransaction[];
}

export class Statement implements IStatement {
  statementId: string;
  accountId: string;

  startDate: Date;
  endDate: Date;
  transactions: ITransaction[];

  constructor(accountId: string, startDate: Date, endDate: Date, transactions: ITransaction[]) {
    this.statementId = v4();
    this.accountId = accountId;

    this.startDate = startDate;
    this.endDate = endDate;
    this.transactions = transactions;
  }

  static fromJSON(json: any): Statement {
    const transactions = json.transactions.map((t: any) => {
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

    const statement = new Statement(
      json.accountId,
      new Date(json.startDate),
      new Date(json.endDate),
      transactions
    );
    statement.statementId = json.statementId;
    return statement;
  }
}