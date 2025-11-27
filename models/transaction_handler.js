/**
 * Transaction Types Enum.
 */
const TransactionType = {
    PURCHASE: 'Purchase',
    PAYMENT: 'Payment',
    FEES: 'Fees',
    REFUND: 'Refund',
    TRANSFER_OUT: 'Transfers',       // Outgoing money
    TRANSFER_IN: 'Transfer Payment', // Incoming money
    INTEREST: 'Interest',
    DEPOSIT: 'Deposit',
    WITHDRAWAL: 'Withdrawal',
    UNCATEGORIZED: 'Uncategorized'
};

class TransactionProcessor {
    constructor(bankConfigs) {
        this.bankConfigs = bankConfigs;
        this.bankConfig = null;
        this.transactions = [];
    }

    /**
     * Main entry point. Identifies bank and routes to CSV or Text parser.
     */
    parse(statementData) {
        // 1. Identify Bank
        this.bankConfig = this.bankConfigs.find(config => config.identifier(statementData));

        if (!this.bankConfig) {
            console.warn('Could not identify bank for statement data.');
            return null;
        }

        // 2. Extract Metadata (Account/Statement IDs)
        if (this.bankConfig.dates) {
            this.bankConfig.statementId = statementData.match(this.bankConfig.dates)?.[0];
        }
        if (this.bankConfig.account) {
            this.bankConfig.accountId = statementData.match(this.bankConfig.account)?.[0];
        }

        // 3. Route
        if (this.bankConfig.format === 'text') {
            return this.parseText(statementData);
        } else if (this.bankConfig.format === 'csv') {
            return this.parseCsv(statementData);
        }
        return this;
    }

    // --- TEXT PARSER ---

    parseText(statementData) {
        SpreadsheetApp.getUi().alert(`${this.bankConfig.name} detected. Processing text...`);

        const lines = statementData.trim().split('\n');
        const transactionStrings = this._groupLinesIntoTransactions(lines, this.bankConfig);

        // Calculate Base Date (End of Year) from Statement Header
        // This helps resolve dates like "14 Jan" when the statement year is known.
        const dateHeaderMatch = this.bankConfig.dates ? statementData.match(this.bankConfig.dates) : null;
        const yearMatch = dateHeaderMatch ? dateHeaderMatch[0].match(/\d{4}/g) : null;
        const statementYear = yearMatch ? parseInt(yearMatch[yearMatch.length - 1]) : new Date().getFullYear();
        const baseDate = new Date(statementYear, 11, 31);

        this.transactions = [];

        for (const line of transactionStrings) {
            const transaction = this._processSingleLine(line, baseDate);
            if (transaction) {
                this.transactions.push(transaction);
            }
        }
        return this.transactions;
    }

    /**
     * Helper to group multi-line text transactions into single strings.
     * Handles start/end/skip delimiters.
     */
    _groupLinesIntoTransactions(lines, config) {
        let currentBlock = null;
        let skipMode = false;
        const results = [];

        for (const line of lines) {
            // Check Skip Mode
            if (skipMode) {
                if (config.startDelimiter.test(line)) {
                    skipMode = false; // Found a new transaction, stop skipping
                    currentBlock = [line.trim()];
                }
                continue;
            }

            // Check Stop Condition
            if (config.endDelimiter && config.endDelimiter.test(line)) break;

            // Check Skip Condition
            if (config.skipDelimiter && config.skipDelimiter.test(line)) {
                if (currentBlock) results.push(currentBlock.join('` '));
                currentBlock = null;
                skipMode = true;
                continue;
            }

            // Check New Transaction Start
            if (config.startDelimiter.test(line)) {
                if (currentBlock) results.push(currentBlock.join('` '));
                currentBlock = [line.trim()];
            } else if (currentBlock) {
                // Append to existing transaction
                currentBlock.push(line.trim());
            }
        }

        // Flush last block
        if (currentBlock) results.push(currentBlock.join('` '));

        return results;
    }

    /**
     * Tries to match a text line against the bank's Regex rules.
     */
    _processSingleLine(line, baseDate) {
        for (const typeConfig of this.bankConfig.transactionTypes) {
            // Remove backticks if the config says so (Text format specific)
            const cleanLine = (typeConfig.delimiter === false) ? line.replace(/`/g, '') : line;
            const match = cleanLine.match(typeConfig.pattern);

            if (match) {
                return this._createTransactionFromMatch(match, typeConfig, line, baseDate);
            }
        }
        return null;
    }

    /**
     * Parses a CSV statement.
     * @param {string} statementData - The CSV statement data.
     */
    parseCsv(statementData) {
        SpreadsheetApp.getUi().alert("Processing CSV...");

        let dataToParse = statementData;

        // Skip Header Rows
        if (this.bankConfig.skipHeader) {
            const lines = dataToParse.split('\n');
            dataToParse = lines.slice(this.bankConfig.skipHeader).join('\n');
        }

        const delimiter = this.bankConfig.delimiter || ',';
        const dataRows = this._parseRobustCsvString(dataToParse, delimiter);

        this.transactions = [];

        for (const row of dataRows) {
            // Try every rule for this CSV row
            for (const typeConfig of this.bankConfig.transactionTypes) {
                // 1. Check Identifier (Does this row match this rule?)
                if (typeConfig.identifier && !typeConfig.identifier(row)) continue;

                // 2. Process
                const transaction = this._createTransactionFromCsvRow(row, typeConfig);
                if (transaction) {
                    this.transactions.push(transaction);
                    break; // Stop after first matching rule
                }
            }
        }

        return this.transactions;
    }

    /**
     * Helper to parse CSV string accounting for quotes.
     */
    _parseRobustCsvString(csvText, delimiter) {
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let inQuotes = false;
        const text = csvText.trim().replace(/\r\n/g, '\n') + '\n';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (inQuotes) {
                if (char === '"') {
                    // Escaped quote check
                    if (i + 1 < text.length && text[i + 1] === '"') {
                        currentField += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === delimiter) {
                    currentRow.push(currentField);
                    currentField = '';
                } else if (char === '\n') {
                    currentRow.push(currentField);
                    if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
        }
        return rows;
    }

    /**
     * Maps Regex matches to a Transaction object.
     */
    _createTransactionFromMatch(match, config, rawLine, baseDate) {
        const transaction = new Transaction(this.bankConfig);
        transaction.account = this.bankConfig.name;
        transaction.raw = rawLine;

        // Resolve Type
        const resolvedType = typeof config.type === 'function' ? config.type(match.groups) : config.type;
        transaction.type = TransactionUtils.normalizeType(resolvedType);

        // Map Fields
        this._mapFields(transaction, config.mapping, match.groups, match, baseDate);

        // Common Post-Processing
        return transaction.finalize();
    }

    /**
     * Maps CSV Row array to a Transaction object.
     */
    _createTransactionFromCsvRow(row, config) {
        try {
            const cleanedRow = row.map(cell => (typeof cell === 'string' ? cell.trim() : cell));
            const transaction = new Transaction(this.bankConfig);
            transaction.account = this.bankConfig.name;
            transaction.raw = row.join(this.bankConfig.delimiter);

            // Resolve Type & Category
            const resolvedType = typeof config.type === 'function' ? config.type(cleanedRow) : config.type;
            transaction.type = TransactionUtils.normalizeType(resolvedType);

            if (config.category) {
                transaction.category = typeof config.category === 'function' ? config.category(cleanedRow) : config.category;
            }

            // Map Fields
            // Note: CSV mappings pass the whole row array as the 'source'
            this._mapFields(transaction, config.mapping, cleanedRow, null, null);

            // Filter Invalid
            if (transaction.amount === 0 && !transaction.description.includes("THANK YOU")) return null;

            return transaction.finalize();

        } catch (e) {
            console.warn(`CSV Row Parse Error:`, row, e);
            return null;
        }
    }

    /**
     * Applies the mapping configuration to the transaction.
     */
    _mapFields(transaction, mapping, sourceData, regexMatch, baseDate) {
        for (const field in mapping) {
            const mapper = mapping[field];
            if (mapper === undefined) continue;

            // Calculate Value (Function or direct property access)
            let value;
            if (typeof mapper === 'function') {
                value = mapper(sourceData, transaction.type, regexMatch);
            } else {
                value = sourceData[mapper];
            }

            // Assign based on field type
            if (field === 'setAmount') {
                transaction.setAmount(value[0], value[1]);
            } else if (field === 'setBalance') {
                transaction.setBalance(value);
            } else if (field === 'date' || field === 'spendDate') {
                // Use the Utils date parser
                const fmt = mapping[`${field}Format`];
                transaction[field] = TransactionUtils.parseDate(value, baseDate, fmt);
            } else {
                transaction[field] = value;
            }
        }
    }
}