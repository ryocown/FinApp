export interface IBalanceCheckpoint {
  id: string;
  accountId: string;
  date: Date; // The date this balance was accurate (usually statement end date)
  balance: number; // The accurate CASH balance at this date
  type: BalanceCheckpointType;
  createdAt: Date;
}

export enum BalanceCheckpointType {
  STATEMENT = 'Statement',
  MANUAL = 'Manual',
  INITIAL = 'Initial'
}