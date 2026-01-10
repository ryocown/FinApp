import { CategoryType } from "../../models/category.js";
import { GeneralTransaction, TradeTransaction, TransactionType, TransferTransaction } from "../../models/transaction.js";
import { StatementImporter } from "../importer.js";
import { parsePSTDateToUTC } from "../../lib/date_utils.js";
export class MorganStanleyStatementImporter extends StatementImporter {
    constructor(accountId, userId) {
        super(accountId, userId, {
            dateColumn: 'Activity Date',
            amountColumn: 'Amount($)',
            descriptionColumn: 'Description',
            merchantColumn: 'Description',
            transactionTypeColumn: 'Category',
            quantityColumn: 'Quantity',
            priceColumn: 'Price($)',
            cusipColumn: 'Cusip',
        }, {
            code: 'USD',
            name: 'US Dollar',
            symbol: '$'
        });
    }
    checkTransactionType(record) {
        if (this.mapping.cusipColumn)
            return TransactionType.Trade;
        const type = record[this.mapping.transactionTypeColumn];
        if (!type)
            return TransactionType.Unknown;
        switch (true) {
            case type.includes('Other Income'):
            case type.includes('Investment Income'):
                return TransactionType.Trade;
            case type.includes('Deposits'):
                return TransactionType.Deposit;
            case type.includes('Service Charges/Fees'):
            case type.includes('Online Services'):
            case type.includes('Other Expenses'):
                return TransactionType.Fees;
            case type.includes('Transfers'):
                return TransactionType.Transfer;
            case type.includes('Loans'):
            case type.includes('Refunds/Adjustments'):
                return TransactionType.Other;
            default:
                return TransactionType.Unknown;
        }
    }
    async processTransaction(record) {
        const type = this.checkTransactionType(record);
        if (type === TransactionType.Trade) {
            const cusip = this.mapping.cusipColumn ? record[this.mapping.cusipColumn] : undefined;
            const instrumentId = await MorganStanleyStatementImporter.getInstrumentId(cusip, record[this.mapping.descriptionColumn]);
            return new TradeTransaction(this.accountId, this.userId, parseFloat(record[this.mapping.amountColumn]), this.currency, parsePSTDateToUTC(record[this.mapping.dateColumn]), record[this.mapping.descriptionColumn], false, false, instrumentId, this.mapping.quantityColumn && record[this.mapping.quantityColumn] ? Number(record[this.mapping.quantityColumn]) : 0, this.mapping.priceColumn && record[this.mapping.priceColumn] ? Number(record[this.mapping.priceColumn]) : 0, this.mapping.categoryColumn ? record[this.mapping.categoryColumn] : undefined, []);
        }
        if (type === TransactionType.Transfer) {
            return new TransferTransaction(this.accountId, 'unknown_linked_tx', // We don't know the linked transaction yet
            this.userId, parseFloat(record[this.mapping.amountColumn]), this.currency, parsePSTDateToUTC(record[this.mapping.dateColumn]), record[this.mapping.descriptionColumn], undefined, // categoryId
            [] // tagIds
            );
        }
        return new GeneralTransaction(this.accountId, this.userId, parseFloat(record[this.mapping.amountColumn]), this.currency, parsePSTDateToUTC(record[this.mapping.dateColumn]), record[this.mapping.descriptionColumn], false, false, null, CategoryType.Other, [], this.mapping.categoryColumn ? record[this.mapping.categoryColumn] : undefined);
    }
    async import(source) {
        // take out the first five lines for the MS statement format
        source = source.split('\n').slice(4).join('\n');
        // remove the last 29 lines
        source = source.split('\n').slice(0, -29).join('\n');
        return super.import(source);
    }
    // Identifying Morgan Stanley holdings with CUSIP.
    static async getInstrumentId(cusip, description) {
        // console.log(`Getting instrument ID for CUSIP: ${cusip}`);
        if (!cusip)
            return 'unknown_instrument_id';
        // Use relative path in browser, or default to localhost in node (if needed, but node usually doesn't fetch via http from itself in this context)
        const baseUrl = '';
        try {
            // Try to get existing instrument
            const response = await fetch(`${baseUrl}/api/instruments?cusip=${encodeURIComponent(cusip)}`);
            if (response.ok) {
                const data = await response.json();
                // console.log(`Found instrument ID for CUSIP: ${cusip}, ID: ${data.id}`);
                return data.id;
            }
            // If not found and name is provided, create it
            if (response.status === 404) {
                const createResponse = await fetch(`${baseUrl}/api/instruments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cusip,
                        name: description || `Unknown Instrument ${cusip}`,
                        type: 'unknown' // We don't know the type from CSV usually
                    }),
                });
                if (createResponse.ok) {
                    const data = await createResponse.json();
                    console.log(`Created instrument ID for CUSIP: ${cusip}, ID: ${data.id}`);
                    return data.id;
                }
                else {
                    console.error(`Failed to create instrument for CUSIP: ${cusip}. Status: ${createResponse.status} ${createResponse.statusText}`);
                    const errorText = await createResponse.text();
                    console.error(`Response: ${errorText}`);
                }
            }
        }
        catch (error) {
            console.error('Error fetching/creating instrument ID:', error);
        }
        return 'unknown_instrument_id';
    }
}
