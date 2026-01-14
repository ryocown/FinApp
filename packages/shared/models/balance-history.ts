
export interface BalanceEntryProto {
    dateKey: string;     // "YYYY-MM-DD"
    amount: number;      // The End-of-Day Balance
    currency: string;

    // Provenance: Why is the balance this number?
    sourceType: 'CALCULATED' | 'STATEMENT_CHECKPOINT' | 'MANUAL_ADJUSTMENT';

    // If this entry exists because of a specific statement
    linkedStatementId?: string;
}

// This represents the document: `users/{uid}/accounts/{acc}/balance_history/{year}`
export interface YearlyBalanceDocProto {
    year: number;
    entries: { [isoDate: string]: BalanceEntryProto }; // Map for O(1) lookup
}
