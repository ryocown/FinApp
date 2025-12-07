import { Currency, type ICurrency } from "./currency";
import { v4 } from "uuid";
import { type ILot } from "./lot";

export interface IAccount {
  accountId: string;
  instituteId?: string;
  userId: string;

  accountNumber: string;
  balance: number;
  balanceDate: Date;
  country: string;
  currency: ICurrency;
  name: string;
  AccountType: AccountType;
  isTaxable: boolean;
}

export interface IPosition {
  instrumentId: string;
  lots: ILot[];
}

export interface IInvestmentAccount extends IAccount {
  isTaxable: true;
  positions: IPosition[];
}


export enum AccountType {
  BANK = 'Bank',
  CREDIT_CARD = 'Credit Card',
  INVESTMENT = 'Investment',
  SUPERANNUATION = 'Superannuation',
  EMPLOYER = 'Employer',
  LOAN = 'Loan',
  OTHER = 'Other',
  INVALID = 'Invalid'
}

export enum AccountTag {
  // Banking
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
  CREDIT = 'Credit',
  HIGH_YIELD_SAVINGS = 'High Yield Savings',

  // Bonds and Investments
  MONEY_MARKET = 'Money Market',
  CERTIFICATE_OF_DEPOSIT = 'Certificate of Deposit',
  BROKERAGE_ACCOUNT = 'Brokerage Account',

  // Retirement
  RETIREMENT_ACCOUNT = 'Retirement Account',

  // Credit/debt
  CREDIT_CARD = 'Credit Card',
  LOAN = 'Loan',

  // HSA
  HEALTH_SAVING_ACCOUNT = 'Health Saving Account',
  HEALTH_FLEXIBLE_SPENDING_ACCOUNT = 'Health Flexible Spending Account',

  // Misc
  OTHER = 'Other',
  INVALID = 'Invalid'
}

export class Account implements IAccount {
  accountId: string;
  userId: string;

  accountNumber: string;
  balance: number;
  balanceDate: Date;
  country: string;
  currency: Currency;
  name: string;
  AccountType: AccountType;
  isTaxable: boolean;

  constructor(accountNumber: string, balance: number, country: string, currency: Currency,
    name: string, AccountType: AccountType, isTaxable: boolean, userId: string) {
    this.accountId = v4();
    this.userId = userId;

    this.accountNumber = accountNumber;
    this.balance = balance;
    this.balanceDate = new Date(); // Default to now if not specified
    this.country = country;
    this.currency = currency;
    this.name = name;
    this.AccountType = AccountType;
    this.isTaxable = isTaxable;
  }

  static fromJSON(json: any): Account {
    const account = new Account(
      json.accountNumber,
      json.balance,
      json.country,
      Currency.fromJSON(json.currency),
      json.name,
      json.AccountType,
      json.isTaxable,
      json.userId
    );
    account.accountId = json.accountId;
    return account;
  }
}

export class InvestmentAccount implements IInvestmentAccount {
  accountId: string;
  userId: string;

  accountNumber: string;
  balance: number;
  balanceDate: Date;
  country: string;
  currency: ICurrency;
  name: string;
  AccountType: AccountType;
  isTaxable: true;
  positions: IPosition[];

  constructor(accountNumber: string, balance: number, country: string, currency: ICurrency,
    name: string, AccountType: AccountType, userId: string) {
    this.accountId = v4();
    this.userId = userId;

    this.accountNumber = accountNumber;
    this.balance = balance;
    this.balanceDate = new Date(); // Default to now if not specified
    this.country = country;
    this.currency = currency;
    this.name = name;
    this.AccountType = AccountType;
    this.isTaxable = true;
    this.positions = [];
  }

  static fromJSON(json: any): InvestmentAccount {
    const account = new InvestmentAccount(
      json.accountNumber,
      json.balance,
      json.country,
      Currency.fromJSON(json.currency),
      json.name,
      json.AccountType,
      json.userId
    );
    account.accountId = json.accountId;
    account.positions = json.positions || [];
    if (json.balanceDate) {
      account.balanceDate = new Date(json.balanceDate);
    }
    return account;
  }
}