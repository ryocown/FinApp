import { Currency, type ICurrency } from "./currency.js";
import { type ILot } from "./lot.js";
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
    type: AccountType;
    tags: AccountTag[];
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
export declare enum AccountType {
    BANK = "Bank",
    INVESTMENT = "Investment",
    SUPERANNUATION = "Superannuation",
    EMPLOYER = "Employer",
    CREDIT_CARD = "Credit Card",
    LOAN = "Loan",
    OTHER = "Other",
    INVALID = "Invalid"
}
export declare enum AccountTag {
    CHECKING = "Checking",
    SAVINGS = "Savings",
    CREDIT = "Credit",
    HIGH_YIELD_SAVINGS = "High Yield Savings",
    MONEY_MARKET = "Money Market",
    CERTIFICATE_OF_DEPOSIT = "Certificate of Deposit",
    BROKERAGE_ACCOUNT = "Brokerage Account",
    RETIREMENT_ACCOUNT = "Retirement Account",
    CREDIT_CARD = "Credit Card",
    LOAN = "Loan",
    HEALTH_SAVING_ACCOUNT = "Health Saving Account",
    HEALTH_FLEXIBLE_SPENDING_ACCOUNT = "Health Flexible Spending Account",
    OTHER = "Other",
    INVALID = "Invalid"
}
export interface Interest {
    rate: number;
    effectiveDate: Date;
}
export declare class Account implements AccountProp {
    accountId: string;
    userId: string;
    accountNumber: string;
    balance: number;
    balanceDate: Date;
    country: string;
    currency: Currency;
    name: string;
    type: AccountType;
    isTaxable: boolean;
    instituteId?: string;
    tags: AccountTag[];
    interest: Interest[];
    constructor(accountNumber: string, balance: number, country: string, currency: Currency, name: string, AccountType: AccountType, isTaxable: boolean | undefined, userId: string, instituteId?: string);
    withInterest(rate: number, effectiveDate?: Date): Account;
    getInterest(): Interest | undefined;
    static fromJSON(json: any): Account;
}
export declare class BankAccount extends Account {
    constructor(accountNumber: string, balance: number, country: string, currency: Currency, name: string, AccountType: AccountType, isTaxable: boolean | undefined, userId: string, instituteId?: string);
}
export declare class InvestmentAccount extends Account {
    positions: Position[];
    constructor(accountNumber: string, balance: number, country: string, currency: ICurrency, name: string, AccountType: AccountType, isTaxable: boolean | undefined, userId: string, instituteId?: string);
    static fromJSON(json: InvestmentAccountProp): InvestmentAccount;
}
