import { type ITransaction } from "./transaction.js";
export interface IStatement {
    statementId: string;
    accountId: string;
    startDate: Date;
    endDate: Date;
    endingBalance?: number;
    transactions: ITransaction[];
}
export declare class Statement implements IStatement {
    statementId: string;
    accountId: string;
    startDate: Date;
    endDate: Date;
    endingBalance?: number;
    transactions: ITransaction[];
    constructor(accountId: string, startDate: Date, endDate: Date, transactions: ITransaction[], endingBalance?: number);
    static fromJSON(json: any): Statement;
}
