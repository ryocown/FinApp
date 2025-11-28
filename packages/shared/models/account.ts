interface IAccount {
  accountNumber: string;
  balance: number;
  currency: ICurrency;
  name: string;
  subtype: SubType;
  isTaxable: boolean;
}

enum SubType {
  TransactionalAccount,
  InvestmentAccount,
  CreditAccount,
  HealthSavingAccount
}

enum TransactionalAccount {
  Checking,
  Savings,
  HighYieldSavings,
  MoneyMarket,
  CertificateOfDeposit
}

enum InvestmentAccount {
  BrokerageAccount,
  RetirementAccount,
}

enum CreditAccount {
  CreditCard,
  Loan
}

enum HealthSavingAccount {
  HealthSavingAccount,
  HealthFlexibleSpendingAccount
}


class Account implements IAccount {
  accountNumber: string;
  balance: number;
  currency: ICurrency;
  name: string;
  subtype: SubType;
  isTaxable: boolean;

  constructor(accountNumber: string, balance: number, currency: ICurrency, 
    name: string, subtype: SubType, isTaxable: boolean) {
    this.accountNumber = accountNumber;
    this.balance = balance;
    this.currency = currency;
    this.name = name;
    this.subtype = subtype;
    this.isTaxable = false;
  }
}