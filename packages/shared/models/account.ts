import { type ICurrency } from "./currency";
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
  Checking,
  Savings,
  HighYieldSavings,
  MoneyMarket,
  CertificateOfDeposit,

  // Investment
  BrokerageAccount,
  RetirementAccount,

  // Credit/debt
  CreditCard,
  Loan,

  // HSA
  HealthSavingAccount,
  HealthFlexibleSpendingAccount
}

export class Account implements IAccount {
  accountId: string;
  userId: string;

  accountNumber: string;
  balance: number;
  country: string;
  currency: ICurrency;
  name: string;
  subtype: SubType;
  isTaxable: boolean;

  constructor(accountNumber: string, balance: number, country: string, currency: ICurrency,
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