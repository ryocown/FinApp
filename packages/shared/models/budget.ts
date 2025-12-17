import { v4 } from "uuid";
import { Account } from "./account";
import { Institute } from "./institute";

export enum BudgetPeriod {
  Weekly = 'WEEKLY',
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY',
  Custom = 'CUSTOM'
}

export interface IBudget {
  budgetId: string;
  categoryId: string;

  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date | null;
}

/**
 * Budget manager class for applying rules to a set of bank accounts.
 */
export class BudgetManager {
  managerId: string;
  startDate: Date;
  endDate: Date | null;
  rules: Set<Budget>;
  accounts: Set<Account>;
  isEnabled: boolean;

  constructor(startDate: Date, endDate: Date, isEnabled = true) {
    this.managerId = v4();
    this.startDate = startDate || new Date();
    this.endDate = endDate;
    this.rules = new Set();
    this.accounts = new Set();
    this.isEnabled = isEnabled;
  }

  addAccount(account: Account | Institute): BudgetManager {
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
  addBudget(budget: Budget): BudgetManager {
    if (budget) {
      this.rules.add(budget);
    }
    return this;
  }

  setBudget(categoryId: string, amount: number, period: BudgetPeriod) {
    const budget = new Budget(categoryId, amount, period, this.startDate, this.endDate);
    this.addBudget(budget);

    return this;
  }
}

/**
 * new BudgetManager()
 */

export class Budget implements IBudget {
  budgetId: string;
  categoryId: string;

  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date | null;

  constructor(categoryId: string, amount: number, period: BudgetPeriod, startDate: Date, endDate: Date | null = null) {
    this.budgetId = v4();
    this.categoryId = categoryId;

    this.amount = amount;
    this.period = period;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  static fromJSON(json: any): Budget {
    const budget = new Budget(
      json.categoryId,
      json.amount,
      json.period,
      new Date(json.startDate),
      json.endDate ? new Date(json.endDate) : null
    );
    budget.budgetId = json.budgetId;
    return budget;
  }
}
