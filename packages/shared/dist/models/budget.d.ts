import { Account } from "./account.js";
import { Institute } from "./institute.js";
export declare enum BudgetPeriod {
    Weekly = "WEEKLY",
    Monthly = "MONTHLY",
    Yearly = "YEARLY",
    Custom = "CUSTOM"
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
export declare class BudgetManager {
    managerId: string;
    startDate: Date;
    endDate: Date | null;
    rules: Set<Budget>;
    accounts: Set<Account>;
    isEnabled: boolean;
    constructor(startDate: Date, endDate: Date, isEnabled?: boolean);
    addAccount(account: Account | Institute): BudgetManager;
    /**
     *
     * @param budget Adds an existing budget to the Budget Manager
     * @returns
     */
    addBudget(budget: Budget): BudgetManager;
    setBudget(categoryId: string, amount: number, period: BudgetPeriod): this;
}
/**
 * new BudgetManager()
 */
export declare class Budget implements IBudget {
    budgetId: string;
    categoryId: string;
    amount: number;
    period: BudgetPeriod;
    startDate: Date;
    endDate: Date | null;
    constructor(categoryId: string, amount: number, period: BudgetPeriod, startDate: Date, endDate?: Date | null);
    static fromJSON(json: any): Budget;
}
