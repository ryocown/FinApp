export interface BankConfig {
    name: string;
    identifier: (input: string) => boolean;
    format: 'text' | 'csv' | 'pdf';
    account?: RegExp;
    dates?: RegExp;
    startDelimiter?: RegExp;
    endDelimiter?: RegExp;
    skipDelimiter?: RegExp;
    skipHeader?: number;
    delimiter?: string;
    transactionTypes: TransactionRule[];
    statementId?: string;
    accountId?: string;
}

export interface TransactionRule {
    identifier?: (row: any) => boolean;
    pattern?: RegExp;
    type: string | ((row: any) => string);
    category?: string | ((row: any) => string);
    delimiter?: boolean; // For text based configs to skip cleaning backticks
    mapping: FieldMapping;
}

export interface FieldMapping {
    [key: string]: string | ((source: any, type?: string, regexMatch?: RegExpMatchArray) => any) | undefined;

    // Core fields
    id?: string | ((source: any) => string);
    date: string | ((source: any) => Date | null);
    dateFormat?: string;
    description?: string | ((source: any) => string);
    amount?: string;
    setAmount?: (source: any) => [string | number, boolean]; // [Amount, isCredit]
    setBalance?: string | ((source: any) => string);

    // Extended fields
    merchant?: string | ((source: any) => string);
    city?: string | ((source: any) => string | null);
    country?: string | ((source: any) => string | null);
    spendDate?: string | ((source: any) => Date | null);
    spendDateFormat?: string;
    spendAmount?: string | ((source: any) => number | null);
    spendCurrency?: string | ((source: any) => string | null);
    reference?: string | ((source: any) => string | null);

    name?: string | ((source: any) => string);
    cardMember?: string | ((source: any) => string);
}

export interface ParsedTransaction {
    id?: string;
    date: Date;
    description: string;
    amount: number;
    type: string;
    category?: string;
    merchant?: string;
    city?: string;
    country?: string;
    balance?: number;
    currency: string;

    // Metadata
    raw?: string;
    account?: string;
    originalSource?: any;
}
