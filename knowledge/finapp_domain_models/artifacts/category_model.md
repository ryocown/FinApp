# Category Model

## Interface: `ICategory`

Represents a classification for transactions (e.g., "Groceries", "Salary").

```typescript
export enum CategoryType {
  Income = 'INCOME',
  Expense = 'EXPENSE',
  Withdrawal = 'WITHDRAWAL',
  Deposit = 'DEPOSIT',
  Credit = 'CREDIT',
  Transfer = 'TRANSFER',
  Other = 'OTHER',
  Reconciliation = 'RECONCILIATION'
}

export enum CategoryGroups {
  Utilities = 'Bills & Utilities',
  Subscriptions = 'Subscriptions',
  Fees = 'Fees & Surcharges',
  Credit = 'Credit',
  Meals = 'Food & Drink',
  Health = 'Health & Medical',
  Shopping = 'Shopping',
  Government = 'Government',
  Entertainment = 'Entertainment',
  ProfessionalServices = 'Professional Services',
  Travel = 'Transport and Activites',
  CashManagement = 'Cash Management',
  Unknown = 'Unknown',
  Reconciliation = 'Reconciliation'
}

export const ExpenseTree = {
  Expense: {
    // ... mappings of ExpenseTypes to CategoryGroups ...
    Reconciliation: { name: ExpenseTypes.Reconciliation, category: CategoryGroups.Reconciliation }
  }
} as const;

export interface ICategory {
  categoryId: string; // UUID (Primary Key)
  parentCategoryId: string | null; // Foreign Key (for hierarchy)

  name: string;
  type: CategoryType;
}

export class Category implements ICategory {
  // ... implementation ...

  /**
   * Creates a standard hierarchy:
   * - Root 1: "Expense" (Type: Expense)
   *   - Children: Most CategoryGroups (linked to "Expense")
   * - Root 2: "Reconciliation" (Type: Reconciliation)
   *   - Self-contained root, no parent.
   */
  static createStandardCategories(): Category[] {
    const expense = new Category('Expense', CategoryType.Expense);
    const categories = [expense];

    Object.values(CategoryGroups).forEach(name => {
      if (name === CategoryGroups.Reconciliation) {
        // Reconciliation is its own root type
        categories.push(new Category(name, CategoryType.Reconciliation, null));
      } else {
        // Others are children of Expense
        categories.push(new Category(name, CategoryType.Expense, expense.categoryId));
      }
    });

    return categories;
  }
}
```

## Usage
- Transactions link to a single category via `categoryId`.
- Use `Category.createStandardCategories()` to seed the database with a standard two-level hierarchy (Expense -> [Standard Categories]).
- Use `StandardCategoryTree` for type-safe access to standard category names (e.g., `StandardCategoryTree.Expense.FoodDrink`).
