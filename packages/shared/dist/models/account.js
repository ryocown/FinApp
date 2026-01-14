import { Currency } from "./currency.js";
import { v4 } from "uuid";
import {} from "./lot.js";
import { toDateProto } from "./date-proto.js";
export var AccountType;
(function (AccountType) {
    // total assets
    AccountType["BANK"] = "Bank";
    AccountType["INVESTMENT"] = "Investment";
    AccountType["SUPERANNUATION"] = "Superannuation";
    AccountType["EMPLOYER"] = "Employer";
    // total debt/liabilities
    AccountType["CREDIT_CARD"] = "Credit Card";
    AccountType["LOAN"] = "Loan";
    // should always be zero
    AccountType["OTHER"] = "Other";
    AccountType["INVALID"] = "Invalid";
})(AccountType || (AccountType = {}));
export var AccountTag;
(function (AccountTag) {
    // Banking
    AccountTag["CHECKING"] = "Checking";
    AccountTag["SAVINGS"] = "Savings";
    AccountTag["CREDIT"] = "Credit";
    AccountTag["HIGH_YIELD_SAVINGS"] = "High Yield Savings";
    // Bonds and Investments
    AccountTag["MONEY_MARKET"] = "Money Market";
    AccountTag["CERTIFICATE_OF_DEPOSIT"] = "Certificate of Deposit";
    AccountTag["BROKERAGE_ACCOUNT"] = "Brokerage Account";
    // Retirement
    AccountTag["RETIREMENT_ACCOUNT"] = "Retirement Account";
    // Credit/debt
    AccountTag["CREDIT_CARD"] = "Credit Card";
    AccountTag["LOAN"] = "Loan";
    // HSA
    AccountTag["HEALTH_SAVING_ACCOUNT"] = "Health Saving Account";
    AccountTag["HEALTH_FLEXIBLE_SPENDING_ACCOUNT"] = "Health Flexible Spending Account";
    // Misc
    AccountTag["OTHER"] = "Other";
    AccountTag["INVALID"] = "Invalid";
})(AccountTag || (AccountTag = {}));
export class Account {
    accountId;
    userId;
    accountNumber;
    balance;
    balanceDate;
    country;
    currency;
    name;
    type;
    isTaxable;
    instituteId;
    tags;
    interest;
    limit;
    constructor(accountNumber, balance, country, currency, name, AccountType, isTaxable = true, userId, instituteId) {
        this.accountId = v4();
        this.userId = userId;
        this.accountNumber = accountNumber;
        this.balance = balance;
        this.balanceDate = toDateProto(new Date()); // Default to now if not specified
        this.country = country;
        this.currency = currency;
        this.name = name;
        this.type = AccountType;
        this.isTaxable = isTaxable;
        if (instituteId !== undefined) {
            this.instituteId = instituteId;
        }
        this.interest = [];
        this.tags = [];
    }
    withInterest(rate, effectiveDate = toDateProto(new Date())) {
        try {
            if (!rate)
                throw 'Account: Unable to add Interest rate without rate or effective date';
            this.interest.push({ rate, effectiveDate });
            this.interest.sort((a, b) => b.effectiveDate.timestamp - a.effectiveDate.timestamp); // Sorts newest to oldest
        }
        catch (error) {
            console.error(error);
        }
        return this;
    }
    getInterest() {
        return this.interest[0];
    }
    static fromJSON(json) {
        const account = new BankAccount(json.accountNumber, json.balance, json.country, Currency.fromJSON(json.currency), json.name, json.type || json.AccountType, json.isTaxable, json.userId);
        account.accountId = json.accountId;
        account.tags = json.tags || [];
        return account;
    }
}
export class BankAccount extends Account {
    constructor(accountNumber, balance, country, currency, name, AccountType, isTaxable = true, userId, instituteId) {
        super(accountNumber, balance, country, currency, name, AccountType, isTaxable, userId, instituteId);
    }
}
export class InvestmentAccount extends Account {
    positions;
    constructor(accountNumber, balance, country, currency, name, AccountType, isTaxable = true, userId, instituteId) {
        super(accountNumber, balance, country, currency, name, AccountType, isTaxable, userId, instituteId);
        this.positions = [];
    }
    static fromJSON(json) {
        const account = new InvestmentAccount(json.accountNumber, json.balance, json.country, Currency.fromJSON(json.currency), json.name, json.type, json.isTaxable, json.userId);
        account.accountId = json.accountId;
        account.tags = json.tags || [];
        account.positions = json.positions || [];
        if (json.balanceDate) {
            account.balanceDate = json.balanceDate;
        }
        return account;
    }
}
