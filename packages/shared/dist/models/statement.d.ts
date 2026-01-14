import { type TransactionProto } from "./transaction.js";
import { type DateProto } from "./date-proto.js";
export interface StatementProto {
    statementId: string;
    accountId: string;
    periodStart: DateProto;
    periodEnd: DateProto;
    openingBalance: number;
    closingBalance: number;
    isReconciled: boolean;
    pdfUrl?: string;
    transactions?: TransactionProto[];
}
export declare class Statement implements StatementProto {
    statementId: string;
    accountId: string;
    periodStart: DateProto;
    periodEnd: DateProto;
    openingBalance: number;
    closingBalance: number;
    isReconciled: boolean;
    pdfUrl?: string;
    transactions?: TransactionProto[];
    constructor(accountId: string, startDate: Date, endDate: Date, openingBalance: number, closingBalance: number, transactions?: TransactionProto[]);
    static fromJSON(json: any): Statement;
}
