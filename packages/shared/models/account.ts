import { ICurrency } from "./currency";
import { v4 } from "uuid";

export interface IAccount {
  accountId: string;
  accountNumber: string;

  balance: number;
  country: string;
  currency: ICurrency;
  name: string;
  subtype: SubType;
}

export interface ITaxableAccount extends IAccount {
  isTaxable: true;
}

export interface INonTaxableAccount extends IAccount {
  isTaxable: false;
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

export class TaxableBrokerageAccount implements ITaxableAccount {
  accountId: string;

  accountNumber: string;
  balance: number;
  country: string;
  currency: ICurrency;
  name: string;
  subtype: SubType;
  isTaxable: true;

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
  }
}