import { Currency } from "./currency";
import { Merchant } from "./merchant";
import { v5 } from 'uuid';

const TRANSACTION_SALT = '1b671a64-40d5-491e-99b0-da01ff1f3341';

export function generateTransactionId(parts: (string | number | boolean | null | undefined)[]): string {
  // Filter out undefined/null to keep it clean, or just stringify everything.
  // Stringifying everything ensures position matters (e.g. null vs empty string).
  const data = parts.map(p => p === undefined || p === null ? '' : String(p)).join('|');
  return v5(data, TRANSACTION_SALT);
}

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
export interface ITransaction {
  transactionId: string;
  accountId: string;
  userId: string;
  categoryId?: string;
  tagIds: string[];

  amount: number;
  currency: Currency;
  date: Date;
  description: string | null;
  // isTaxDeductable: boolean;

  transactionType: TransactionType;
}

export enum TransactionType {
  Unknown = 'UNKNOWN',
  Invalid = 'INVALID',
  General = 'GENERAL',
  Trade = 'TRADE',
  Transfer = 'TRANSFER',
  Deposit = 'DEPOSIT',
  Withdrawal = 'WITHDRAWAL',
  Fees = 'FEES',
  Other = 'OTHER',
  Reconciliation = 'RECONCILIATION'
}

export interface IGeneralTransaction extends ITransaction {
  transactionType: TransactionType.General;
  merchant: Merchant | null;
}

export interface ITradeTransaction extends ITransaction {
  instrumentId: string;

  transactionType: TransactionType.Trade;
  quantity: number;
  price: number;
}

export interface ITransferTransaction extends ITransaction {
  transactionType: TransactionType.Transfer;
  linkedTransactionId: string;
  exchangeRate?: number;
}

export class GeneralTransaction implements ITransaction {
  transactionId: string;
  accountId: string;
  userId: string;

  categoryId?: string;
  tagIds: string[];

  amount: number;
  currency: Currency;
  date: Date;
  description: string | null;
  isTaxDeductable: boolean;
  hasCapitalGains: boolean;
  merchant: Merchant | null;
  transactionType: TransactionType;

  constructor(accountId: string, userId: string, amount: number, currency: Currency, date: Date, description: string | null, isTaxDeductable: boolean, hasCapitalGains: boolean, merchant: Merchant | null, categoryId?: string, tagIds: string[] = [], transactionType: TransactionType = TransactionType.General, seed?: string) {
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
    this.date = date;
    this.description = description;
    this.isTaxDeductable = isTaxDeductable;
    this.hasCapitalGains = hasCapitalGains;
    this.merchant = merchant;
    this.transactionType = transactionType;
    this.categoryId = categoryId;
    this.tagIds = tagIds;
  }

  static fromJSON(json: any): GeneralTransaction {
    const transaction = new GeneralTransaction(
      json.accountId,
      json.userId,
      json.amount,
      Currency.fromJSON(json.currency),
      new Date(json.date),
      json.description,
      json.isTaxDeductable,
      json.hasCapitalGains,
      json.merchant ? Merchant.fromJSON(json.merchant) : null,
      json.categoryId,
      json.tagIds,
      json.transactionType
    );
    transaction.transactionId = json.transactionId;
    return transaction;
  }
}

export class TradeTransaction implements ITransaction {
  transactionId: string;
  accountId: string;
  userId: string;
  instrumentId: string;
  categoryId?: string;
  tagIds: string[];

  amount: number;
  currency: Currency;
  date: Date;
  description: string | null;
  isTaxDeductable: boolean;
  hasCapitalGains: boolean;
  transactionType: TransactionType.Trade;
  quantity: number;
  price: number;

  constructor(accountId: string, userId: string, amount: number, currency: Currency, date: Date,
    description: string | null, isTaxDeductable: boolean, hasCapitalGains: boolean,
    instrumentId: string, quantity: number, price: number, categoryId?: string, tagIds: string[] = [], seed?: string) {

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
    this.date = date;
    this.description = description;
    this.isTaxDeductable = isTaxDeductable;
    this.hasCapitalGains = hasCapitalGains;
    this.transactionType = TransactionType.Trade;
    this.instrumentId = instrumentId;
    this.quantity = quantity;
    this.price = price;
    this.categoryId = categoryId;
    this.tagIds = tagIds;
  }

  static fromJSON(json: any): TradeTransaction {
    const transaction = new TradeTransaction(
      json.accountId,
      json.userId,
      json.amount,
      Currency.fromJSON(json.currency),
      new Date(json.date),
      json.description,
      json.isTaxDeductable,
      json.hasCapitalGains,
      json.instrumentId,
      json.quantity,
      json.price,
      json.categoryId,
      json.tagIds
    );
    transaction.transactionId = json.transactionId;
    return transaction;
  }
}

export class TransferTransaction implements ITransaction {
  transactionId: string;
  accountId: string;
  userId: string;
  linkedTransactionId: string;
  categoryId?: string;
  tagIds: string[];

  amount: number;
  currency: Currency;
  date: Date;
  description: string | null;
  isTaxDeductable: boolean;
  hasCapitalGains: boolean;
  transactionType: TransactionType;
  exchangeRate?: number;

  constructor(accountId: string, linkedTransactionId: string, userId: string, amount: number, currency: Currency, date: Date, description: string | null, categoryId?: string, tagIds: string[] = [], exchangeRate?: number, seed?: string) {
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
    this.date = date;
    this.description = description;
    this.isTaxDeductable = false;
    this.hasCapitalGains = false;
    this.transactionType = TransactionType.Transfer;
    this.categoryId = categoryId;
    this.tagIds = tagIds;
    this.exchangeRate = exchangeRate;
  }

  static fromJSON(json: any): TransferTransaction {
    const transaction = new TransferTransaction(
      json.accountId,
      json.linkedTransactionId,
      json.userId,
      json.amount,
      Currency.fromJSON(json.currency),
      new Date(json.date),
      json.description,
      json.categoryId,
      json.tagIds,
      json.exchangeRate
    );
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
  static createTransferPair(
    sourceAccountId: string,
    destinationAccountId: string,
    userId: string,
    sourceAmount: number,
    sourceCurrency: Currency,
    destinationAmount: number,
    destinationCurrency: Currency,
    date: Date,
    description: string | null
  ): [TransferTransaction, TransferTransaction] {
    // Calculate implied exchange rate (Source -> Dest)
    // Rate = DestAmount / Abs(SourceAmount)
    const rate = Math.abs(destinationAmount / sourceAmount);

    const sourceTx = new TransferTransaction(
      sourceAccountId,
      'placeholder', // Will be updated
      userId,
      sourceAmount,
      sourceCurrency,
      date,
      description,
      undefined,
      [],
      rate
    );

    const destTx = new TransferTransaction(
      destinationAccountId,
      'placeholder', // Will be updated
      userId,
      destinationAmount,
      destinationCurrency,
      date,
      description,
      undefined,
      [],
      rate
    );

    // Now link them
    sourceTx.linkedTransactionId = destTx.transactionId;
    destTx.linkedTransactionId = sourceTx.transactionId;

    return [sourceTx, destTx];
  }
}