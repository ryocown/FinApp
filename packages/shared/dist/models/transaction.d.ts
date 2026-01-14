import { Currency } from "./currency.js";
import { Merchant } from "./merchant.js";
import { type DateProto } from "./date-proto.js";
export declare function generateTransactionId(parts: (string | number | boolean | null | undefined)[]): string;
/**
 * I don't think we are going to do double entry bookkeeping,
 * meaning we will not track debits and credits,
 * instead we will track transactions and their impact on accounts.
 *
 * Funding an investment account / getting paid is a credit (positive amount) to the cash balance of that account.
 * Similiarly, withdrawing from an investment account / paying bills
 * is a debit (negative amount) to the cash balance of that account.
 *
 * The direct consequence of this design choice is there is only one accountId, instead of a source and destination account,
 * and the amount is the net impact of the transaction on that account.
 *
 * Making a trade is debiting the cash balance from the investment account,
 * and adding a new position to the investment account.
 * The net result is allowing the investment account to track its own positions,
 * while maintaining a single cash account and a single total balance.
 */
export interface TransactionProto {
    transactionId: string;
    accountId: string;
    userId: string;
    statementId: string | null;
    categoryId?: string;
    tagIds: string[];
    amount: number;
    currency: Currency;
    date: DateProto;
    description: string | null;
    /**
     * Optional running balance after this transaction.
     * This is computed on read or provided on write (to create a checkpoint).
     */
    balance?: number;
    transactionType: TransactionType;
}
export declare enum TransactionType {
    Unknown = "UNKNOWN",
    Invalid = "INVALID",
    General = "GENERAL",
    Trade = "TRADE",
    Transfer = "TRANSFER",
    Deposit = "DEPOSIT",
    Withdrawal = "WITHDRAWAL",
    Fees = "FEES",
    Other = "OTHER",
    Reconciliation = "RECONCILIATION"
}
export interface GeneralTransactionProto extends TransactionProto {
    transactionType: TransactionType.General;
    merchant: Merchant | null;
}
export interface TradeTransactionProto extends TransactionProto {
    instrumentId: string;
    transactionType: TransactionType.Trade;
    quantity: number;
    price: number;
}
export interface TransferTransactionProto extends TransactionProto {
    transactionType: TransactionType.Transfer;
    linkedTransactionId: string;
    exchangeRate?: number;
}
export declare class GeneralTransaction implements TransactionProto {
    transactionId: string;
    accountId: string;
    userId: string;
    categoryId?: string;
    tagIds: string[];
    amount: number;
    currency: Currency;
    date: DateProto;
    description: string | null;
    isTaxDeductable: boolean;
    hasCapitalGains: boolean;
    merchant: Merchant | null;
    transactionType: TransactionType;
    balance?: number;
    statementId: string | null;
    constructor(accountId: string, userId: string, amount: number, currency: Currency, date: Date, description: string | null, isTaxDeductable: boolean, hasCapitalGains: boolean, merchant: Merchant | null, categoryId?: string, tagIds?: string[], transactionType?: TransactionType, seed?: string);
    static fromJSON(json: any): GeneralTransaction;
}
export declare class TradeTransaction implements TransactionProto {
    transactionId: string;
    accountId: string;
    userId: string;
    instrumentId: string;
    categoryId?: string;
    tagIds: string[];
    amount: number;
    currency: Currency;
    date: DateProto;
    description: string | null;
    isTaxDeductable: boolean;
    hasCapitalGains: boolean;
    transactionType: TransactionType.Trade;
    quantity: number;
    price: number;
    statementId: string | null;
    constructor(accountId: string, userId: string, amount: number, currency: Currency, date: Date, description: string | null, isTaxDeductable: boolean, hasCapitalGains: boolean, instrumentId: string, quantity: number, price: number, categoryId?: string, tagIds?: string[], seed?: string);
    static fromJSON(json: any): TradeTransaction;
}
export declare class TransferTransaction implements TransactionProto {
    transactionId: string;
    accountId: string;
    userId: string;
    linkedTransactionId: string;
    categoryId?: string;
    tagIds: string[];
    amount: number;
    currency: Currency;
    date: DateProto;
    description: string | null;
    isTaxDeductable: boolean;
    hasCapitalGains: boolean;
    transactionType: TransactionType;
    exchangeRate?: number;
    statementId: string | null;
    constructor(accountId: string, linkedTransactionId: string, userId: string, amount: number, currency: Currency, date: Date, description: string | null, categoryId?: string, tagIds?: string[], exchangeRate?: number, seed?: string);
    static fromJSON(json: any): TransferTransaction;
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
    static createTransferPair(sourceAccountId: string, destinationAccountId: string, userId: string, sourceAmount: number, sourceCurrency: Currency, destinationAmount: number, destinationCurrency: Currency, date: Date, description: string | null): [TransferTransaction, TransferTransaction];
}
