import { v4 } from "uuid";
import { Account } from "./account.js";
import { Institute } from "./institute.js";
export var BudgetPeriod;
(function (BudgetPeriod) {
    BudgetPeriod["Weekly"] = "WEEKLY";
    BudgetPeriod["Monthly"] = "MONTHLY";
    BudgetPeriod["Yearly"] = "YEARLY";
    BudgetPeriod["Custom"] = "CUSTOM";
})(BudgetPeriod || (BudgetPeriod = {}));
/**
 * Budget manager class for applying rules to a set of bank accounts.
 */
export class BudgetManager {
    managerId;
    startDate;
    endDate;
    rules;
    accounts;
    isEnabled;
    constructor(startDate, endDate, isEnabled = true) {
        this.managerId = v4();
        this.startDate = startDate || new Date();
        this.endDate = endDate;
        this.rules = new Set();
        this.accounts = new Set();
        this.isEnabled = isEnabled;
    }
    addAccount(account) {
        if (account instanceof Account) {
            this.accounts.add(account);
        }
        if (account instanceof Institute) {
            for (const acc of account.accounts) {
                this.accounts.add(acc);
            }
        }
        return this;
    }
    /**
     *
     * @param budget Adds an existing budget to the Budget Manager
     * @returns
     */
    addBudget(budget) {
        if (budget) {
            this.rules.add(budget);
        }
        return this;
    }
    setBudget(categoryId, amount, period) {
        const budget = new Budget(categoryId, amount, period, this.startDate, this.endDate);
        this.addBudget(budget);
        return this;
    }
}
/**
 * new BudgetManager()
 */
export class Budget {
    budgetId;
    categoryId;
    amount;
    period;
    startDate;
    endDate;
    constructor(categoryId, amount, period, startDate, endDate = null) {
        this.budgetId = v4();
        this.categoryId = categoryId;
        this.amount = amount;
        this.period = period;
        this.startDate = startDate;
        this.endDate = endDate;
    }
    static fromJSON(json) {
        const budget = new Budget(json.categoryId, json.amount, json.period, new Date(json.startDate), json.endDate ? new Date(json.endDate) : null);
        budget.budgetId = json.budgetId;
        return budget;
    }
}
