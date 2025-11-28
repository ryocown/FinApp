interface ITransaction {
  amount: number;
  currency: ICurrency;
  date: Date;
  description: string | null;
  isTaxDeductable: boolean;
  hasCapitalGains: boolean;
  merchant: Merchant | null;
  serialNumber: string | null;

  TransactionType: TransactionType;
}

enum TransactionType {
  Expenses,
  Income,
  Trade,
}

class Transaction implements ITransaction {
  amount: number;
  currency: ICurrency;
  date: Date;
  description: string | null;
  isTaxDeductable: boolean;
  hasCapitalGains: boolean;
  merchant: Merchant | null;
  serialNumber: string | null;
  TransactionType: TransactionType;

  constructor(amount: number, currency: ICurrency, date: Date, description: string | null, isTaxDeductable: boolean, hasCapitalGains: boolean, merchant: Merchant | null, serialNumber: string | null, TransactionType: TransactionType) {
    this.amount = amount;
    this.currency = currency;
    this.date = date;
    this.description = description;
    this.isTaxDeductable = isTaxDeductable;
    this.hasCapitalGains = hasCapitalGains;
    this.merchant = merchant;
    this.serialNumber = serialNumber;
    this.TransactionType = TransactionType;
  }
}