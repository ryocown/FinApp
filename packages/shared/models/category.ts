import { v4 } from "uuid";

export enum CategoryType {
  Income = 'INCOME',
  Expense = 'EXPENSE',
  Transfer = 'TRANSFER',
  Other = 'OTHER'
}

export interface ICategory {
  categoryId: string;
  parentCategoryId: string | null;

  name: string;
  type: CategoryType;
}

export class Category implements ICategory {
  categoryId: string;
  parentCategoryId: string | null;

  name: string;
  type: CategoryType;

  constructor(name: string, type: CategoryType, parentCategoryId: string | null = null) {
    this.categoryId = v4();

    this.name = name;
    this.type = type;
    this.parentCategoryId = parentCategoryId;
  }
}
