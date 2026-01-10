import type { BankConfig, ParsedTransaction } from './types.js';
export declare class TransactionProcessor {
    bankConfig: BankConfig | null;
    transactions: ParsedTransaction[];
    process(statementData: string): ParsedTransaction[];
    private parseText;
    private groupLines;
    private parseCsv;
    private mapTransaction;
}
