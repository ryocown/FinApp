import { Currency, type ICurrency } from "./currency";
import { v4 } from "uuid";
import { type ILot } from "./lot";

export interface AccountProp {
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

export interface Position {
  instrumentId: string;
  lots: ILot[];
}

export interface InvestmentAccountProp extends AccountProp {
  isTaxable: boolean;
  positions: Position[];
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


export interface Interest {
  rate: number;
  effectiveDate: Date;
}

export class Account implements AccountProp {
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
  instituteId?: string | undefined;
  interest: Interest[];

  constructor(accountNumber: string, balance: number, country: string, currency: Currency,
    name: string, AccountType: AccountType, isTaxable: boolean = true, userId: string, instituteId?: string) {
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
    this.instituteId = instituteId;
    this.interest = [];
  }

  withInterest(rate: number, effectiveDate: Date = new Date()): Account {
    try {
      if (!rate) throw 'Account: Unable to add Interest rate without rate or effective date';

      this.interest.push({ rate, effectiveDate });
      this.interest.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime()); // Sorts newest to oldest
    } catch (error) {
      console.error(error);
    }
    return this;
  }

  getInterest(): Interest {
    return this.interest[0];
  }

  static fromJSON(json: any): AccountProp {
    const account = new BankAccount(
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

export class BankAccount extends Account {
  constructor(accountNumber: string, balance: number, country: string, currency: Currency,
    name: string, AccountType: AccountType, isTaxable: boolean = true, userId: string, instituteId?: string) {
    super(accountNumber, balance, country, currency, name, AccountType, isTaxable, userId, instituteId);
  }


}

export class InvestmentAccount extends Account {
  positions: Position[];

  constructor(accountNumber: string, balance: number, country: string, currency: ICurrency,
    name: string, AccountType: AccountType, isTaxable: boolean = true, userId: string, instituteId?: string) {
    super(accountNumber, balance, country, currency, name, AccountType, isTaxable, userId, instituteId);
    this.positions = [];
  }

  static fromJSON(json: InvestmentAccountProp): InvestmentAccount {
    const account = new InvestmentAccount(
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
    account.positions = json.positions || [];
    if (json.balanceDate) {
      account.balanceDate = new Date(json.balanceDate);
    }

    return account;
  }
}