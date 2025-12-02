import { Currency, type ICurrency } from "./currency";
import { v4 } from "uuid";
import { type IFinancialInstrument } from "./financial_instrument";
import { type ILot } from "./lot";

export interface IAccount {
  accountId: string;
  userId: string;

  accountNumber: string;
  balance: number;
  country: string;
  currency: ICurrency;
  name: string;
  subtype: SubType;
}

export interface IPosition {
  instrumentId: string;
  lots: ILot[];
}

export interface IInvestmentAccount extends IAccount {
  isTaxable: true;
  positions: IPosition[];
}

export enum SubType {
  // Transactional
  Checking = 'CHECKING',
  Savings = 'SAVINGS',
  HighYieldSavings = 'HIGH_YIELD_SAVINGS',
  MoneyMarket = 'MONEY_MARKET',
  CertificateOfDeposit = 'CERTIFICATE_OF_DEPOSIT',

  // Investment
  BrokerageAccount = 'BROKERAGE_ACCOUNT',
  RetirementAccount = 'RETIREMENT_ACCOUNT',

  // Credit/debt
  CreditCard = 'CREDIT_CARD',
  Loan = 'LOAN',

  // HSA
  HealthSavingAccount = 'HEALTH_SAVING_ACCOUNT',
  HealthFlexibleSpendingAccount = 'HEALTH_FLEXIBLE_SPENDING_ACCOUNT'
}

export class Account implements IAccount {
  accountId: string;
  userId: string;

  accountNumber: string;
  balance: number;
  country: string;
  currency: Currency;
  name: string;
  subtype: SubType;
  isTaxable: boolean;

  constructor(accountNumber: string, balance: number, country: string, currency: Currency,
    name: string, subtype: SubType, isTaxable: boolean, userId: string) {
    this.accountId = v4();
    this.userId = userId;

    this.accountNumber = accountNumber;
    this.balance = balance;
    this.country = country;
    this.currency = currency;
    this.name = name;
    this.subtype = subtype;
    this.isTaxable = isTaxable;
  }

  static fromJSON(json: any): Account {
    const account = new Account(
      json.accountNumber,
      json.balance,
      json.country,
      Currency.fromJSON(json.currency),
      json.name,
      json.subtype,
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
  country: string;
  currency: ICurrency;
  name: string;
  subtype: SubType;
  isTaxable: true;
  positions: IPosition[];

  constructor(accountNumber: string, balance: number, country: string, currency: ICurrency,
    name: string, subtype: SubType, userId: string) {
    this.accountId = v4();
    this.userId = userId;

    this.accountNumber = accountNumber;
    this.balance = balance;
    this.country = country;
    this.currency = currency;
    this.name = name;
    this.subtype = subtype;
    this.isTaxable = true;
    this.positions = [];
  }
}