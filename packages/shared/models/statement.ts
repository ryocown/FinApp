import { v4 } from "uuid";
import { type ITransaction } from "./transaction";

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
}