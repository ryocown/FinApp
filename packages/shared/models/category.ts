import { v4 } from "uuid";



export enum CategoryType {
  Income = 'INCOME',
  Expense = 'EXPENSE',
  Widthdrawal = 'WIDTHDRAWAL',
  Deposit = 'DEPOSIT',
  Credit = 'CREDIT',
  Transfer = 'TRANSFER',
  Other = 'OTHER'
}

export enum CategoryGroups {
  Utilities = 'Bills & Utilities',    // Non-Government Rates (ie body corp, rent morgage electricity, insurance etc).
  Subscriptions = 'Subscriptions',    // General Subscriptions like Netflix, Spotify etc.
  Fees = 'Fees & Surcharges',         // General Fees & Surcharges (ie ATM, Stock Trading, Bank Fees etc).
  Credit = 'Credit',                  // Catch general account credits (ie Credit card bonus').
  Meals = 'Food & Drink',             // All meal and drink expenses.
  Health = 'Health & Medical',        // Health & Medical expenses, including pharmacy, cosmetic etc.
  Shopping = 'Shopping',              // General Shopping expenses (including Groceries). 
  Government = 'Government',          // Licenses, registrations, Tax, rates.
  Entertainment = 'Entertainment',
  ProfessionalServices = 'Professional Services',
  Travel = 'Transport and Activites',  // Cost of transportation, hotels and activities.
  CashManagement = 'Cash Management',  // Tracking of the movement of cash within statements.
  Unknown = 'Unknown'
}

export enum ExpenseTypes {
  Atm = 'ATM Cash Withdrawal',
  InvestingTransfer = 'Stock Account Transfer',
  PersonalPayment = 'Personal Payment',
  BankTransfer = 'Bank Transfer',
  Salary = 'Salary',
  Refund = 'Refund',
  CreditInterest = 'Credit Interest',
  GovernmentSubsidy = 'Government Subsidy',
  CreditCardPayment = 'Credit Card Payment',
  CreditBenefit = 'Credit Benefit',
  TransactionFees = 'Transaction Fees',
  ForeignSurchage = 'Foreign Surchage',
  ExchangeFees = 'Exchange Fees',
  BankFees = 'Bank Fees',
  DebitInterest = 'Debit Interest',
  CardVerification = 'Card Verification',     // Card verification fees/Temporary Charges appearing on statements.
  MealsSelf = 'Meals Self',
  MealsSocial = 'Meals Social',
  Gifts = 'Gifts',
  TaxPayment = 'Tax Payment',
  IdentityRegistrations = 'License & Registrations',
  PassportFees = 'Passport Fees',
  Medical = 'Health & Medical',
  GymExercise = 'Gym & Exercise',
  RentalPayment = 'Rental Payment',
  Electronics = 'Electronics',
  ElectronicsNonTaxable = 'Electronics - Non-Taxable',
  EntertainmentMedia = 'Entertainment & Media',
  Groceries = 'Groceries',
  ClothesHomeware = 'Clothes & Homeware',
  MiscShopping = 'Misc Shopping',
  HomeOffice = 'Home Office',
  ConvienceStore = 'Convience Store',
  Insurance = 'Insurance',
  Furniture = 'Furniture',
  PersoanlSubscriptions = 'Personal Subscriptions',
  PhoneInternet = 'Phone & Internet',
  RoamingInternet = 'Roaming Internet',
  TransportFoodSubscriptions = 'Transport & Food Subscriptions',
  EntertainmentSubscriptions = 'Entertainment Subscriptions',
  TravelAgency = 'Travel Agency',
  Airlines = 'Airlines',
  HotelsAccommodation = 'Hotels & Accommodation',
  TaxiTransport = 'Taxi & Transport',
  Parking = 'Parking',
  ServiceStations = 'Service Stations / Fuel',
  Activities = 'Activities',
  Cruise = 'Cruise',
  Unsorted = 'Unsorted',
  Utilities = 'Utilities',
  CreditCardFees = 'Credit Card Fees',
  Unknown = 'Unknown'
}

export const ExpenseTree = {
  Expense: {
    Atm: { name: ExpenseTypes.Atm, category: CategoryGroups.CashManagement },
    InvestingTransfer: { name: ExpenseTypes.InvestingTransfer, category: CategoryGroups.CashManagement },
    PersonalPayment: { name: ExpenseTypes.PersonalPayment, category: CategoryGroups.CashManagement },
    BankTransfer: { name: ExpenseTypes.BankTransfer, category: CategoryGroups.CashManagement },

    Salary: { name: ExpenseTypes.Salary, category: CategoryGroups.Credit },
    Refund: { name: ExpenseTypes.Refund, category: CategoryGroups.Credit },
    CreditInterest: { name: ExpenseTypes.CreditInterest, category: CategoryGroups.Credit },
    GovernmentSubsidy: { name: ExpenseTypes.GovernmentSubsidy, category: CategoryGroups.Credit },
    CreditCardPayment: { name: ExpenseTypes.CreditCardPayment, category: CategoryGroups.Credit },
    CreditBenefit: { name: ExpenseTypes.CreditBenefit, category: CategoryGroups.Credit },

    CreditCardFees: { name: ExpenseTypes.CreditCardFees, category: CategoryGroups.Fees },
    TransactionFees: { name: ExpenseTypes.TransactionFees, category: CategoryGroups.Fees },
    ForeignSurchage: { name: ExpenseTypes.ForeignSurchage, category: CategoryGroups.Fees },
    ExchangeFees: { name: ExpenseTypes.ExchangeFees, category: CategoryGroups.Fees },
    BankFees: { name: ExpenseTypes.BankFees, category: CategoryGroups.Fees },
    DebitInterest: { name: ExpenseTypes.DebitInterest, category: CategoryGroups.Fees },
    CardVerification: { name: ExpenseTypes.CardVerification, category: CategoryGroups.Fees },

    MealsSelf: { name: ExpenseTypes.MealsSelf, category: CategoryGroups.Meals },
    MealsSocial: { name: ExpenseTypes.MealsSocial, category: CategoryGroups.Meals },
    Gifts: { name: ExpenseTypes.Gifts, category: CategoryGroups.Meals },

    TaxPayment: { name: ExpenseTypes.TaxPayment, category: CategoryGroups.Government },
    IdentityRegistrations: { name: ExpenseTypes.IdentityRegistrations, category: CategoryGroups.Government },
    PassportFees: { name: ExpenseTypes.PassportFees, category: CategoryGroups.Government },

    Medical: { name: ExpenseTypes.Medical, category: CategoryGroups.Health },
    GymExercise: { name: ExpenseTypes.GymExercise, category: CategoryGroups.Health },

    RentalPayment: { name: ExpenseTypes.RentalPayment, category: CategoryGroups.Utilities },
    Insurance: { name: ExpenseTypes.Insurance, category: CategoryGroups.Utilities },
    Utilities: { name: ExpenseTypes.Utilities, category: CategoryGroups.Utilities },

    Electronics: { name: ExpenseTypes.Electronics, category: CategoryGroups.Shopping },
    EntertainmentMedia: { name: ExpenseTypes.EntertainmentMedia, category: CategoryGroups.Shopping },
    Groceries: { name: ExpenseTypes.Groceries, category: CategoryGroups.Shopping },
    ClothesHomeware: { name: ExpenseTypes.ClothesHomeware, category: CategoryGroups.Shopping },
    MiscShopping: { name: ExpenseTypes.MiscShopping, category: CategoryGroups.Shopping },
    HomeOffice: { name: ExpenseTypes.HomeOffice, category: CategoryGroups.Shopping },
    ConvienceStore: { name: ExpenseTypes.ConvienceStore, category: CategoryGroups.Shopping },
    Furniture: { name: ExpenseTypes.Furniture, category: CategoryGroups.Shopping },

    PersoanlSubscriptions: { name: ExpenseTypes.PersoanlSubscriptions, category: CategoryGroups.Subscriptions },
    PhoneInternet: { name: ExpenseTypes.PhoneInternet, category: CategoryGroups.Subscriptions },
    RoamingInternet: { name: ExpenseTypes.RoamingInternet, category: CategoryGroups.Subscriptions },
    TransportFoodSubscriptions: { name: ExpenseTypes.TransportFoodSubscriptions, category: CategoryGroups.Subscriptions },
    EntertainmentSubscriptions: { name: ExpenseTypes.EntertainmentSubscriptions, category: CategoryGroups.Subscriptions },


    TravelAgency: { name: ExpenseTypes.TravelAgency, category: CategoryGroups.Travel },
    Airlines: { name: ExpenseTypes.Airlines, category: CategoryGroups.Travel },
    HotelsAccommodation: { name: ExpenseTypes.HotelsAccommodation, category: CategoryGroups.Travel },
    TaxiTransport: { name: ExpenseTypes.TaxiTransport, category: CategoryGroups.Travel },
    Parking: { name: ExpenseTypes.Parking, category: CategoryGroups.Travel },
    ServiceStations: { name: ExpenseTypes.ServiceStations, category: CategoryGroups.Travel },
    Activities: { name: ExpenseTypes.Activities, category: CategoryGroups.Travel },
    Cruise: { name: ExpenseTypes.Cruise, category: CategoryGroups.Travel },

    Unsorted: { name: ExpenseTypes.Unknown, category: CategoryGroups.Unknown },
  }
} as const;

export const StandardCategoryTree = {
  Expense: {
    Utilities: CategoryGroups.Utilities,
    Subscriptions: CategoryGroups.Subscriptions,
    Fees: CategoryGroups.Fees,
    Credit: CategoryGroups.Credit,
    Meals: CategoryGroups.Meals,
    Shopping: CategoryGroups.Shopping,
    Entertainment: CategoryGroups.Entertainment,
    ProfessionalServices: CategoryGroups.ProfessionalServices,
    Travel: CategoryGroups.Travel,
    Government: CategoryGroups.Government
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
      ...Object.values(CategoryGroups).map(name => new Category(name, CategoryType.Expense, expense.categoryId))
    ];
  }
}
