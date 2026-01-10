import { TransactionUtils } from './utils.js';
const titleCase = TransactionUtils.titleCase;
const createDeterministicHash = TransactionUtils.createDeterministicHash;
export const BANK_CONFIGS = [
    {
        name: 'Suncorp',
        identifier: (input) => /(Suncorp|suncorpbank.com.au)/i.test(input),
        format: 'text',
        account: /(?<=Account Number\s*)\d+/,
        dates: /(?<=Statement Period\s*)\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}/,
        startDelimiter: /^\d{1,2}\s[A-Za-z]{3}\s\d{4}/,
        endDelimiter: /CLOSING BALANCE|Summary of Interest, Fees and Charges/,
        transactionTypes: [
            // RULE 0: Fees and Interest
            {
                type: (row) => TransactionUtils.normalizeType(row.rawDescription),
                pattern: new RegExp(String.raw `^(?<date>\d{1,2}\s[A-Za-z]{3}\s\d{4})\s+(?<rawDescription>VISA CASH ADVANCE FEE|FOREIGN CURRENCY CONVERSION FEE|FOREIGN CURRENCY CONV FEE REV|BONUS INTEREST|CREDIT INTEREST|INTEREST CHARGE)\s+(?<amount>[\d,]+\.\d{2})\s+(?<balance>-?[\d,]+\.\d{2})(?<details>[\s\S]*)`),
                mapping: {
                    date: 'date',
                    setBalance: 'balance',
                    setAmount: (g) => {
                        // Logic for credit/debit detection could be added here if needed, 
                        // but standard Suncorp fees are usually debits, interest credits.
                        // For now assuming existing logic or simple directional check
                        return [g.amount, g.amount > 0]; // Simplified
                    },
                    merchant: (g) => titleCase(g.rawDescription),
                    city: () => '',
                    country: () => '',
                    description: () => ''
                }
            },
            // RULE 2: CARD TRANSACTIONS (Simplified for brevity but capturing core)
            {
                type: 'Purchase', // Dynamic logic in full version
                pattern: new RegExp(String.raw `^(?<date>\d{1,2}\s[A-Za-z]{3}\s\d{4})\s+(?<rawDescription>.+?)\s+(?<amount>[\d,]+\.\d{2})\s+(?<balance>-?[\d,]+\.\d{2})(?<details>[\s\S]*)`),
                mapping: {
                    date: 'date',
                    setBalance: 'balance',
                    setAmount: (g) => [g.amount, false], // Default to debit for purchases
                    merchant: (g) => {
                        let raw = g.rawDescription.trim();
                        // Remove prefixes
                        const prefixes = ["VISA PURCHASE", "VISA CASH ADV", "VISA CREDIT", "ATM WITHDRAWAL", "ATM WDL REV", "DIRECT DEBIT", "DIRECT DR DISH", "AMEX DEBIT", "AMEX CREDIT"];
                        const prefixRegex = new RegExp(`^(?:${prefixes.join('|')})\\s+`, 'i');
                        raw = raw.replace(prefixRegex, '').trim();
                        return raw;
                    },
                    city: (g) => {
                        const details = (g.details || '').replace(/`/g, ' ');
                        const match = details.match(/(?:^|\s)([^`\d]+?)\s+\d{2}\/\d{2}\s+([A-Z]{2})\b/);
                        if (match)
                            return titleCase(match[1].trim());
                        return null;
                    }
                }
            }
        ]
    },
    {
        name: 'ING',
        identifier: (input) => /BSB number:\s*923\s*100/.test(input) || (/ing/i.test(input) && /Client number:/i.test(input)),
        format: 'text',
        // ... (rest of ING logic would go here, simplified for this step)
        transactionTypes: []
    },
    {
        name: 'Citi',
        identifier: (input) => input.includes("'5327803310904026'"), // Example identifier
        format: 'csv',
        delimiter: ',',
        transactionTypes: [{
                type: (row) => (parseFloat(row[2]) > 0 ? 'Payment' : 'Purchase'),
                mapping: {
                    date: (row) => TransactionUtils.parseDate(row[0], null, 'DD/MM/YYYY'),
                    description: (row) => row[1],
                    setAmount: (row) => [parseFloat(row[2]) * -1, false], // Amount is column 2
                    id: (row) => createDeterministicHash(`${row[0]}|${row[1]}|${row[2]}`),
                    merchant: (row) => (row[1] || '').trim().split(/\s{2,}/)[0]
                }
            }]
    },
    {
        name: 'ANZ_CSV',
        identifier: (input) => typeof input === 'string' && input.includes('4564680414590892'), // Example
        format: 'csv',
        delimiter: ',',
        transactionTypes: [{
                type: (row) => (row[3].includes("PAYMENT") ? 'Payment' : 'Purchase'),
                mapping: {
                    date: (row) => TransactionUtils.parseDate(row[1], null, 'DD/MM/YYYY'),
                    description: (row) => row[3],
                    setAmount: (row) => [parseFloat(row[4]) * -1, false],
                    id: (row) => row[0], // Reference
                    merchant: (row) => row[3].split(/\s{2,}/)[0]
                }
            }]
    }
];
