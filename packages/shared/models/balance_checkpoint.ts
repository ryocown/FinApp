import { type DateProto } from './date-proto.js';

export interface IBalanceCheckpoint {
  id: string;
  accountId: string;
  date: DateProto; // The date this balance was accurate (usually statement end date)
  balance: number; // The accurate CASH balance at this date
  type: BalanceCheckpointType;
  createdAt: DateProto;
  validation?: {
    isValid: boolean;
    difference: number;
  };
}

export enum BalanceCheckpointType {
  STATEMENT = 'Statement',
  MANUAL = 'MANUAL', // Changed to uppercase as per code edit
  IMPORT = 'IMPORT', // Added as per code edit
  TRANSACTION = 'TRANSACTION', // Added as per instruction
  INITIAL = 'Initial'
}