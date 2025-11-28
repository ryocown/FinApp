import { ICurrency } from "./currency";
import { IMerchant } from "./merchant";

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
  amount: number;
  currency: ICurrency;
  date: Date;
  description: string | null;
  // isTaxDeductable: boolean;

  transactionType: TransactionType;
}

enum TransactionType {
  Unknown = 'UNKNOWN',
  Invalid = 'INVALID',
  General = 'GENERAL',
  Trade = 'TRADE',
  Other = 'OTHER'
}

interface IGeneralTransaction extends ITransaction {
  transactionType: TransactionType.General;
  merchant: IMerchant | null;
}

interface ITradeTransaction extends ITransaction {
  transactionType: TransactionType.Trade;
}

class GeneralTransaction implements ITransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  currency: ICurrency;
  date: Date;
  description: string | null;
  isTaxDeductable: boolean;
  hasCapitalGains: boolean;
  merchant: IMerchant | null;
  transactionType: TransactionType;

  constructor(accountId: string, amount: number, currency: ICurrency, date: Date, description: string | null, isTaxDeductable: boolean, hasCapitalGains: boolean, merchant: IMerchant | null) {
    this.transactionId = ""; // TODO: Generate UUID
    this.accountId = accountId;
    this.amount = amount;
    this.currency = currency;
    this.date = date;
    this.description = description;
    this.isTaxDeductable = isTaxDeductable;
    this.hasCapitalGains = hasCapitalGains;
    this.merchant = merchant;
    this.transactionType = TransactionType.General;
  }
}

class TradeTransaction implements ITransaction {
  transactionId: string;
  accountId: string;

  amount: number;
  currency: ICurrency;
  date: Date;
  description: string | null;
  isTaxDeductable: boolean;
  hasCapitalGains: boolean;
  merchant: IMerchant | null;
  transactionType: TransactionType;

  constructor(accountId: string, amount: number, currency: ICurrency, date: Date, description: string | null, isTaxDeductable: boolean, hasCapitalGains: boolean, merchant: IMerchant | null) {
    this.transactionId = ""; // TODO: Generate UUID
    this.accountId = accountId;

    this.amount = amount;
    this.currency = currency;
    this.date = date;
    this.description = description;
    this.isTaxDeductable = isTaxDeductable;
    this.hasCapitalGains = hasCapitalGains;
    this.merchant = merchant;
    this.transactionType = TransactionType.Trade;
  }
}