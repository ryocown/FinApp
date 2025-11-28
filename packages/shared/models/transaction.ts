interface ITransaction {
  amount: number;
  currency: ICurrency;
  date: Date;
  description: string;
  isTaxDeductable: boolean;
  hasCapitalGains: boolean;
  merchant: Merchant;
  serialNumber: string;
}