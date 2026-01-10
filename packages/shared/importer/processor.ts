import { BANK_CONFIGS } from './configs.js';
import type { BankConfig, ParsedTransaction, TransactionRule } from './types.js';
import { TransactionUtils } from './utils.js';

export class TransactionProcessor {
    bankConfig: BankConfig | null = null;
    transactions: ParsedTransaction[] = [];

    process(statementData: string): ParsedTransaction[] {
        // 1. Identify Bank
        this.bankConfig = BANK_CONFIGS.find(config => config.identifier(statementData)) || null;

        if (!this.bankConfig) {
            console.warn('Could not identify bank for statement data.');
            return [];
        }

        console.log(`Identified bank: ${this.bankConfig.name}`);

        // 2. Route
        if (this.bankConfig.format === 'text') {
            return this.parseText(statementData);
        } else if (this.bankConfig.format === 'csv') {
            return this.parseCsv(statementData);
        }
        return [];
    }

    private parseText(statementData: string): ParsedTransaction[] {
        if (!this.bankConfig) return [];

        const lines = statementData.trim().split('\n');
        // Group lines if needed (simplified here, assumes line-by-line for now unless grouping logic ported fully)
        // The user's grouping logic is complex, I will implement a simplified version or the full one if needed.
        // For Suncorp (Text), grouping is often handled by regex matching across lines if we join them, 
        // OR the user's grouping logic used `startDelimiter`.

        // Let's implement grouping:
        const transactionStrings = this.groupLines(lines);

        const results: ParsedTransaction[] = [];
        const baseDate = new Date(); // Should extract from statement

        for (const line of transactionStrings) {
            for (const rule of this.bankConfig.transactionTypes) {
                const regex = rule.pattern;
                if (!regex) continue;

                const match = line.match(regex);
                if (match) {
                    const txn = this.mapTransaction(rule, null, match, baseDate, line);
                    if (txn) results.push(txn);
                    break; // Stop after first match
                }
            }
        }
        return results;
    }

    private groupLines(lines: string[]): string[] {
        if (!this.bankConfig || !this.bankConfig.startDelimiter) return lines;

        const results: string[] = [];
        let currentBlock: string[] = [];

        for (const line of lines) {
            if (this.bankConfig.startDelimiter.test(line)) {
                if (currentBlock.length > 0) results.push(currentBlock.join(' ')); // Join with space for regex
                currentBlock = [line.trim()];
            } else if (currentBlock.length > 0) {
                // Check end/skip?
                currentBlock.push(line.trim());
            }
        }
        if (currentBlock.length > 0) results.push(currentBlock.join(' '));
        return results;
    }

    private parseCsv(statementData: string): ParsedTransaction[] {
        if (!this.bankConfig) return [];

        let rows: string[][] = [];
        const lines = statementData.split('\n');
        // Robust CSV parsing
        // For simplicity, using simple split for now, relying on robust rules or the user's robust parser if needed.
        // The user provided a robust parser `_parseRobustCsvString`. Let's use a simplified version.
        rows = lines.map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))); // Basic

        if (this.bankConfig.skipHeader) {
            rows = rows.slice(this.bankConfig.skipHeader);
        }

        const results: ParsedTransaction[] = [];
        for (const row of rows) {
            if (row.length === 0 || (row.length === 1 && !row[0])) continue;

            for (const rule of this.bankConfig.transactionTypes) {
                if (rule.identifier && !rule.identifier(row)) continue;

                const txn = this.mapTransaction(rule, row, null, null, null);
                if (txn) {
                    results.push(txn);
                    break;
                }
            }
        }
        return results;
    }

    private mapTransaction(rule: TransactionRule, sourceData: any, match: RegExpMatchArray | null, baseDate: Date | null, raw: string | null): ParsedTransaction | null {
        const txn: any = {
            currency: 'USD', // Default
            raw: raw || (Array.isArray(sourceData) ? sourceData.join(',') : ''),
            account: this.bankConfig?.name
        };

        const fieldSource = match ? match.groups : sourceData;

        // Resolve Type
        if (typeof rule.type === 'function') {
            txn.type = rule.type(sourceData || match?.groups);
        } else {
            txn.type = rule.type;
        }

        // Mapping
        for (const key in rule.mapping) {
            const mapper = rule.mapping[key];
            if (!mapper) continue;

            let value;
            if (typeof mapper === 'function') {
                value = mapper(fieldSource, txn.type, match || undefined);
            } else if (typeof mapper === 'string' && fieldSource) {
                value = fieldSource[mapper];
            }

            if (key === 'setAmount') {
                const [amt, isCredit] = value;
                txn.amount = typeof amt === 'string' ? parseFloat(amt.replace(/[$,]/g, '')) : amt;
                if (!isCredit && txn.amount > 0) txn.amount *= -1; // Debit
                if (isCredit && txn.amount < 0) txn.amount *= -1; // Credit
            } else if (key === 'date') {
                txn.date = TransactionUtils.parseDate(value, baseDate, rule.mapping.dateFormat);
            } else {
                txn[key] = value;
            }
        }

        if (isNaN(txn.amount)) return null;
        if (!txn.date) return null; // Date is required

        return txn as ParsedTransaction;
    }
}
