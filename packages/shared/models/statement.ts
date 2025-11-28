import { ITransaction } from "./transaction";

export interface IStatement {
  statementId: string;
  accountId: string;

  startDate: Date;
  endDate: Date;
  transactions: ITransaction[];
}