export interface IBalanceCheckpoint {
  id: string;
  accountId: string;
  date: Date; // The date this balance was accurate (usually statement end date)
  balance: number; // The accurate CASH balance at this date
  type: 'statement' | 'manual' | 'initial';
  createdAt: Date;
}
