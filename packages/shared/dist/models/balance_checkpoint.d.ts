import { type DateProto } from './date-proto.js';
export interface IBalanceCheckpoint {
    id: string;
    accountId: string;
    date: DateProto;
    balance: number;
    type: BalanceCheckpointType;
    createdAt: DateProto;
    validation?: {
        isValid: boolean;
        difference: number;
    };
}
export declare enum BalanceCheckpointType {
    STATEMENT = "Statement",
    MANUAL = "MANUAL",// Changed to uppercase as per code edit
    IMPORT = "IMPORT",// Added as per code edit
    TRANSACTION = "TRANSACTION",// Added as per instruction
    INITIAL = "Initial"
}
