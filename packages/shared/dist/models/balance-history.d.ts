export interface BalanceEntryProto {
    dateKey: string;
    amount: number;
    currency: string;
    sourceType: 'CALCULATED' | 'STATEMENT_CHECKPOINT' | 'MANUAL_ADJUSTMENT';
    linkedStatementId?: string;
}
export interface YearlyBalanceDocProto {
    year: number;
    entries: {
        [isoDate: string]: BalanceEntryProto;
    };
}
