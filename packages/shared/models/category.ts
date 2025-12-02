import { v4 } from "uuid";

export enum CategoryType {
  Income = 'INCOME',
  Expense = 'EXPENSE',
  Transfer = 'TRANSFER',
  Other = 'OTHER'
}

export enum StandardCategory {
  Personal = 'Personal',
  BillsUtilities = 'Bills & Utilities',
  FoodDrink = 'Food & Drink',
  Shopping = 'Shopping',
  Entertainment = 'Entertainment',
  ProfessionalServices = 'Professional Services',
  Travel = 'Travel',
  Groceries = 'Groceries'
}

export const StandardCategoryTree = {
  Expense: {
    Personal: StandardCategory.Personal,
    BillsUtilities: StandardCategory.BillsUtilities,
    FoodDrink: StandardCategory.FoodDrink,
    Shopping: StandardCategory.Shopping,
    Entertainment: StandardCategory.Entertainment,
    ProfessionalServices: StandardCategory.ProfessionalServices,
    Travel: StandardCategory.Travel,
    Groceries: StandardCategory.Groceries,
  }
} as const;

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

  static createStandardCategories(): Category[] {
    const expense = new Category('Expense', CategoryType.Expense);
    return [
      expense,
      ...Object.values(StandardCategory).map(name => new Category(name, CategoryType.Expense, expense.categoryId))
    ];
  }

  static fromJSON(json: any): Category {
    const category = new Category(json.name, json.type, json.parentCategoryId);
    category.categoryId = json.categoryId;
    return category;
  }
}
