import { v4 } from "uuid";

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
}
