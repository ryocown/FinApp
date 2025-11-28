import { ICurrency } from "./currency";
import { v4 } from "uuid";
import { IFinancialInstrument } from "./financial_instrument";

export interface IAccount {
  accountId: string;
  accountNumber: string;

  balance: number;
  country: string;
  currency: ICurrency;
  name: string;
  subtype: SubType;
}

export interface IInvestmentAccount extends IAccount {
  isTaxable: true;
  positions: IFinancialInstrument[];
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

  accountNumber: string;
  balance: number;
  country: string;
  currency: ICurrency;
  name: string;
  subtype: SubType;
  isTaxable: boolean;

  constructor(accountNumber: string, balance: number, country: string, currency: ICurrency,
    name: string, subtype: SubType, isTaxable: boolean) {
    this.accountId = v4();

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

  accountNumber: string;
  balance: number;
  country: string;
  currency: ICurrency;
  name: string;
  subtype: SubType;
  isTaxable: true;
  positions: IFinancialInstrument[];

  constructor(accountNumber: string, balance: number, country: string, currency: ICurrency,
    name: string, subtype: SubType) {
    this.accountId = v4();

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