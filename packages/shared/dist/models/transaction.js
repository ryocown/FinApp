import { Currency } from "./currency.js";
import { Merchant } from "./merchant.js";
import { createDeterministicHash } from '../lib/hash.js';
import { toDateProto } from "./date-proto.js";
const TRANSACTION_SALT = '1b671a64-40d5-491e-99b0-da01ff1f3341';
export function generateTransactionId(parts) {
    // Filter out undefined/null to keep it clean, or just stringify everything.
    // Stringifying everything ensures position matters (e.g. null vs empty string).
    const data = parts.map(p => p === undefined || p === null ? '' : String(p)).join('|');
    return createDeterministicHash(data + TRANSACTION_SALT);
}
export var TransactionType;
(function (TransactionType) {
    TransactionType["Unknown"] = "UNKNOWN";
    TransactionType["Invalid"] = "INVALID";
    TransactionType["General"] = "GENERAL";
    TransactionType["Trade"] = "TRADE";
    TransactionType["Transfer"] = "TRANSFER";
    TransactionType["Deposit"] = "DEPOSIT";
    TransactionType["Withdrawal"] = "WITHDRAWAL";
    TransactionType["Fees"] = "FEES";
    TransactionType["Other"] = "OTHER";
    TransactionType["Reconciliation"] = "RECONCILIATION";
})(TransactionType || (TransactionType = {}));
export class GeneralTransaction {
    transactionId;
    accountId;
    userId;
    categoryId;
    tagIds;
    amount;
    currency;
    date; // FIXED: matches interface
    description;
    isTaxDeductable;
    hasCapitalGains;
    merchant;
    transactionType;
    balance;
    statementId = null;
    constructor(accountId, userId, amount, currency, date, description, isTaxDeductable, hasCapitalGains, merchant, categoryId, tagIds = [], transactionType = TransactionType.General, seed) {
        // Hash: accountId, userId, amount, currency, date, description, transactionType, merchantName
        this.transactionId = generateTransactionId([
            accountId,
            userId,
            amount,
            currency.code,
            date.toISOString(),
            description,
            transactionType,
            merchant?.name,
            seed // edge case
        ]);
        this.accountId = accountId;
        this.userId = userId;
        this.amount = amount;
        this.currency = currency;
        this.date = toDateProto(date);
        this.description = description;
        this.isTaxDeductable = isTaxDeductable;
        this.hasCapitalGains = hasCapitalGains;
        this.merchant = merchant;
        this.transactionType = transactionType;
        if (categoryId !== undefined) {
            this.categoryId = categoryId;
        }
        this.tagIds = tagIds;
    }
    static fromJSON(json) {
        const transaction = new GeneralTransaction(json.accountId, json.userId, json.amount, Currency.fromJSON(json.currency), new Date(json.date), json.description, json.isTaxDeductable, json.hasCapitalGains, json.merchant ? Merchant.fromJSON(json.merchant) : null, json.categoryId, json.tagIds, json.transactionType);
        transaction.transactionId = json.transactionId;
        if (json.statementId)
            transaction.statementId = json.statementId;
        if (json.balance !== undefined)
            transaction.balance = json.balance;
        return transaction;
    }
}
export class TradeTransaction {
    transactionId;
    accountId;
    userId;
    instrumentId;
    categoryId;
    tagIds;
    amount;
    currency;
    date; // FIXED: matches interface
    description;
    isTaxDeductable;
    hasCapitalGains;
    transactionType;
    quantity;
    price;
    statementId = null;
    constructor(accountId, userId, amount, currency, date, description, isTaxDeductable, hasCapitalGains, instrumentId, quantity, price, categoryId, tagIds = [], seed) {
        // Hash: accountId, userId, amount, currency, date, description, instrumentId, quantity, price
        this.transactionId = generateTransactionId([
            accountId,
            userId,
            amount,
            currency.code,
            date.toISOString(),
            description,
            TransactionType.Trade,
            instrumentId,
            quantity,
            price,
            seed
        ]);
        this.accountId = accountId;
        this.userId = userId;
        this.amount = amount;
        this.currency = currency;
        this.date = toDateProto(date);
        this.description = description;
        this.isTaxDeductable = isTaxDeductable;
        this.hasCapitalGains = hasCapitalGains;
        this.transactionType = TransactionType.Trade;
        this.instrumentId = instrumentId;
        this.quantity = quantity;
        this.price = price;
        if (categoryId !== undefined) {
            this.categoryId = categoryId;
        }
        this.tagIds = tagIds;
    }
    static fromJSON(json) {
        const transaction = new TradeTransaction(json.accountId, json.userId, json.amount, Currency.fromJSON(json.currency), json.date && json.date.timestamp ? new Date(json.date.timestamp) : new Date(json.date), json.description, json.isTaxDeductable, json.hasCapitalGains, json.instrumentId, json.quantity, json.price, json.categoryId, json.tagIds);
        transaction.transactionId = json.transactionId;
        return transaction;
    }
}
export class TransferTransaction {
    transactionId;
    accountId;
    userId;
    linkedTransactionId;
    categoryId;
    tagIds;
    amount;
    currency;
    date; // FIXED: matches interface
    description;
    isTaxDeductable;
    hasCapitalGains;
    transactionType;
    exchangeRate;
    statementId = null;
    constructor(accountId, linkedTransactionId, userId, amount, currency, date, description, categoryId, tagIds = [], exchangeRate, seed) {
        // Hash: accountId, userId, amount, currency, date, description, transactionType
        // EXCLUDING linkedTransactionId to avoid circular dependency and allow linking later without ID change
        this.transactionId = generateTransactionId([
            accountId,
            userId,
            amount,
            currency.code,
            date.toISOString(),
            description,
            TransactionType.Transfer,
            seed // edge case
        ]);
        this.accountId = accountId;
        this.linkedTransactionId = linkedTransactionId;
        this.userId = userId;
        this.amount = amount;
        this.currency = currency;
        this.date = toDateProto(date);
        this.description = description;
        this.isTaxDeductable = false;
        this.hasCapitalGains = false;
        this.transactionType = TransactionType.Transfer;
        if (categoryId !== undefined) {
            this.categoryId = categoryId;
        }
        this.tagIds = tagIds;
        if (exchangeRate !== undefined) {
            this.exchangeRate = exchangeRate;
        }
    }
    static fromJSON(json) {
        const transaction = new TransferTransaction(json.accountId, json.linkedTransactionId, json.userId, json.amount, Currency.fromJSON(json.currency), json.date && json.date.timestamp ? new Date(json.date.timestamp) : new Date(json.date), json.description, json.categoryId, json.tagIds, json.exchangeRate);
        transaction.transactionId = json.transactionId;
        return transaction;
    }
    /**
     * Helper to create a pair of linked transfer transactions.
     *
     * @param sourceAccountId Account ID sending money (amount should be negative)
     * @param destinationAccountId Account ID receiving money (amount should be positive)
     * @param userId User ID
     * @param sourceAmount Amount in source currency (negative)
     * @param sourceCurrency Source Currency
     * @param destinationAmount Amount in destination currency (positive)
     * @param destinationCurrency Destination Currency
     * @param date Date of transfer
     * @param description Description
     */
    static createTransferPair(sourceAccountId, destinationAccountId, userId, sourceAmount, sourceCurrency, destinationAmount, destinationCurrency, date, description) {
        // Calculate implied exchange rate (Source -> Dest)
        // Rate = DestAmount / Abs(SourceAmount)
        const rate = Math.abs(destinationAmount / sourceAmount);
        const sourceTx = new TransferTransaction(sourceAccountId, 'placeholder', // Will be updated
        userId, sourceAmount, sourceCurrency, date, description, undefined, [], rate);
        const destTx = new TransferTransaction(destinationAccountId, 'placeholder', // Will be updated
        userId, destinationAmount, destinationCurrency, date, description, undefined, [], rate);
        // Now link them
        sourceTx.linkedTransactionId = destTx.transactionId;
        destTx.linkedTransactionId = sourceTx.transactionId;
        return [sourceTx, destTx];
    }
}
