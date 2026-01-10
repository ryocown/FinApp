export declare enum CategoryType {
    Income = "INCOME",
    Expense = "EXPENSE",
    Withdrawal = "WITHDRAWAL",
    Deposit = "DEPOSIT",
    Credit = "CREDIT",
    Transfer = "TRANSFER",
    Other = "OTHER",
    Reconciliation = "RECONCILIATION"
}
export declare enum CategoryGroups {
    Utilities = "Bills & Utilities",// Non-Government Rates (ie body corp, rent morgage electricity, insurance etc).
    Subscriptions = "Subscriptions",// General Subscriptions like Netflix, Spotify etc.
    Fees = "Fees & Surcharges",// General Fees & Surcharges (ie ATM, Stock Trading, Bank Fees etc).
    Credit = "Credit",// Catch general account credits (ie Credit card bonus').
    Meals = "Food & Drink",// All meal and drink expenses.
    Health = "Health & Medical",// Health & Medical expenses, including pharmacy, cosmetic etc.
    Shopping = "Shopping",// General Shopping expenses (including Groceries). 
    Government = "Government",// Licenses, registrations, Tax, rates.
    Entertainment = "Entertainment",
    ProfessionalServices = "Professional Services",
    Travel = "Transport and Activites",// Cost of transportation, hotels and activities.
    CashManagement = "Cash Management",// Tracking of the movement of cash within statements.
    Unknown = "Unknown",
    Reconciliation = "Reconciliation"
}
export declare enum ExpenseTypes {
    Atm = "ATM Cash Withdrawal",
    InvestingTransfer = "Stock Account Transfer",
    PersonalPayment = "Personal Payment",
    BankTransfer = "Bank Transfer",
    Salary = "Salary",
    Refund = "Refund",
    CreditInterest = "Credit Interest",
    GovernmentSubsidy = "Government Subsidy",
    CreditCardPayment = "Credit Card Payment",
    CreditBenefit = "Credit Benefit",
    TransactionFees = "Transaction Fees",
    ForeignSurcharge = "Foreign Surcharge",
    ExchangeFees = "Exchange Fees",
    BankFees = "Bank Fees",
    DebitInterest = "Debit Interest",
    CardVerification = "Card Verification",// Card verification fees/Temporary Charges appearing on statements.
    MealsSelf = "Meals Self",
    MealsSocial = "Meals Social",
    Gifts = "Gifts",
    TaxPayment = "Tax Payment",
    IdentityRegistrations = "License & Registrations",
    PassportFees = "Passport Fees",
    Medical = "Health & Medical",
    GymExercise = "Gym & Exercise",
    RentalPayment = "Rental Payment",
    Electronics = "Electronics",
    ElectronicsNonTaxable = "Electronics - Non-Taxable",
    EntertainmentMedia = "Entertainment & Media",
    Groceries = "Groceries",
    ClothesHomeware = "Clothes & Homeware",
    MiscShopping = "Misc Shopping",
    HomeOffice = "Home Office",
    ConvenienceStore = "Convenience Store",
    Insurance = "Insurance",
    Furniture = "Furniture",
    PersonalSubscriptions = "Personal Subscriptions",
    PhoneInternet = "Phone & Internet",
    RoamingInternet = "Roaming Internet",
    TransportFoodSubscriptions = "Transport & Food Subscriptions",
    EntertainmentSubscriptions = "Entertainment Subscriptions",
    TravelAgency = "Travel Agency",
    Airlines = "Airlines",
    HotelsAccommodation = "Hotels & Accommodation",
    TaxiTransport = "Taxi & Transport",
    Parking = "Parking",
    ServiceStations = "Service Stations / Fuel",
    Activities = "Activities",
    Cruise = "Cruise",
    Unsorted = "Unsorted",
    Utilities = "Utilities",
    CreditCardFees = "Credit Card Fees",
    Unknown = "Unknown",
    Reconciliation = "Reconciliation"
}
export declare const ExpenseTree: {
    readonly Expense: {
        readonly Atm: {
            readonly name: ExpenseTypes.Atm;
            readonly category: CategoryGroups.CashManagement;
        };
        readonly InvestingTransfer: {
            readonly name: ExpenseTypes.InvestingTransfer;
            readonly category: CategoryGroups.CashManagement;
        };
        readonly PersonalPayment: {
            readonly name: ExpenseTypes.PersonalPayment;
            readonly category: CategoryGroups.CashManagement;
        };
        readonly BankTransfer: {
            readonly name: ExpenseTypes.BankTransfer;
            readonly category: CategoryGroups.CashManagement;
        };
        readonly Salary: {
            readonly name: ExpenseTypes.Salary;
            readonly category: CategoryGroups.Credit;
        };
        readonly Refund: {
            readonly name: ExpenseTypes.Refund;
            readonly category: CategoryGroups.Credit;
        };
        readonly CreditInterest: {
            readonly name: ExpenseTypes.CreditInterest;
            readonly category: CategoryGroups.Credit;
        };
        readonly GovernmentSubsidy: {
            readonly name: ExpenseTypes.GovernmentSubsidy;
            readonly category: CategoryGroups.Credit;
        };
        readonly CreditCardPayment: {
            readonly name: ExpenseTypes.CreditCardPayment;
            readonly category: CategoryGroups.Credit;
        };
        readonly CreditBenefit: {
            readonly name: ExpenseTypes.CreditBenefit;
            readonly category: CategoryGroups.Credit;
        };
        readonly CreditCardFees: {
            readonly name: ExpenseTypes.CreditCardFees;
            readonly category: CategoryGroups.Fees;
        };
        readonly TransactionFees: {
            readonly name: ExpenseTypes.TransactionFees;
            readonly category: CategoryGroups.Fees;
        };
        readonly ForeignSurcharge: {
            readonly name: ExpenseTypes.ForeignSurcharge;
            readonly category: CategoryGroups.Fees;
        };
        readonly ExchangeFees: {
            readonly name: ExpenseTypes.ExchangeFees;
            readonly category: CategoryGroups.Fees;
        };
        readonly BankFees: {
            readonly name: ExpenseTypes.BankFees;
            readonly category: CategoryGroups.Fees;
        };
        readonly DebitInterest: {
            readonly name: ExpenseTypes.DebitInterest;
            readonly category: CategoryGroups.Fees;
        };
        readonly CardVerification: {
            readonly name: ExpenseTypes.CardVerification;
            readonly category: CategoryGroups.Fees;
        };
        readonly MealsSelf: {
            readonly name: ExpenseTypes.MealsSelf;
            readonly category: CategoryGroups.Meals;
        };
        readonly MealsSocial: {
            readonly name: ExpenseTypes.MealsSocial;
            readonly category: CategoryGroups.Meals;
        };
        readonly Gifts: {
            readonly name: ExpenseTypes.Gifts;
            readonly category: CategoryGroups.Meals;
        };
        readonly TaxPayment: {
            readonly name: ExpenseTypes.TaxPayment;
            readonly category: CategoryGroups.Government;
        };
        readonly IdentityRegistrations: {
            readonly name: ExpenseTypes.IdentityRegistrations;
            readonly category: CategoryGroups.Government;
        };
        readonly PassportFees: {
            readonly name: ExpenseTypes.PassportFees;
            readonly category: CategoryGroups.Government;
        };
        readonly Medical: {
            readonly name: ExpenseTypes.Medical;
            readonly category: CategoryGroups.Health;
        };
        readonly GymExercise: {
            readonly name: ExpenseTypes.GymExercise;
            readonly category: CategoryGroups.Health;
        };
        readonly RentalPayment: {
            readonly name: ExpenseTypes.RentalPayment;
            readonly category: CategoryGroups.Utilities;
        };
        readonly Insurance: {
            readonly name: ExpenseTypes.Insurance;
            readonly category: CategoryGroups.Utilities;
        };
        readonly Utilities: {
            readonly name: ExpenseTypes.Utilities;
            readonly category: CategoryGroups.Utilities;
        };
        readonly Electronics: {
            readonly name: ExpenseTypes.Electronics;
            readonly category: CategoryGroups.Shopping;
        };
        readonly EntertainmentMedia: {
            readonly name: ExpenseTypes.EntertainmentMedia;
            readonly category: CategoryGroups.Shopping;
        };
        readonly Groceries: {
            readonly name: ExpenseTypes.Groceries;
            readonly category: CategoryGroups.Shopping;
        };
        readonly ClothesHomeware: {
            readonly name: ExpenseTypes.ClothesHomeware;
            readonly category: CategoryGroups.Shopping;
        };
        readonly MiscShopping: {
            readonly name: ExpenseTypes.MiscShopping;
            readonly category: CategoryGroups.Shopping;
        };
        readonly HomeOffice: {
            readonly name: ExpenseTypes.HomeOffice;
            readonly category: CategoryGroups.Shopping;
        };
        readonly ConvienceStore: {
            readonly name: ExpenseTypes.ConvenienceStore;
            readonly category: CategoryGroups.Shopping;
        };
        readonly Furniture: {
            readonly name: ExpenseTypes.Furniture;
            readonly category: CategoryGroups.Shopping;
        };
        readonly PersoanlSubscriptions: {
            readonly name: ExpenseTypes.PersonalSubscriptions;
            readonly category: CategoryGroups.Subscriptions;
        };
        readonly PhoneInternet: {
            readonly name: ExpenseTypes.PhoneInternet;
            readonly category: CategoryGroups.Subscriptions;
        };
        readonly RoamingInternet: {
            readonly name: ExpenseTypes.RoamingInternet;
            readonly category: CategoryGroups.Subscriptions;
        };
        readonly TransportFoodSubscriptions: {
            readonly name: ExpenseTypes.TransportFoodSubscriptions;
            readonly category: CategoryGroups.Subscriptions;
        };
        readonly EntertainmentSubscriptions: {
            readonly name: ExpenseTypes.EntertainmentSubscriptions;
            readonly category: CategoryGroups.Subscriptions;
        };
        readonly TravelAgency: {
            readonly name: ExpenseTypes.TravelAgency;
            readonly category: CategoryGroups.Travel;
        };
        readonly Airlines: {
            readonly name: ExpenseTypes.Airlines;
            readonly category: CategoryGroups.Travel;
        };
        readonly HotelsAccommodation: {
            readonly name: ExpenseTypes.HotelsAccommodation;
            readonly category: CategoryGroups.Travel;
        };
        readonly TaxiTransport: {
            readonly name: ExpenseTypes.TaxiTransport;
            readonly category: CategoryGroups.Travel;
        };
        readonly Parking: {
            readonly name: ExpenseTypes.Parking;
            readonly category: CategoryGroups.Travel;
        };
        readonly ServiceStations: {
            readonly name: ExpenseTypes.ServiceStations;
            readonly category: CategoryGroups.Travel;
        };
        readonly Activities: {
            readonly name: ExpenseTypes.Activities;
            readonly category: CategoryGroups.Travel;
        };
        readonly Cruise: {
            readonly name: ExpenseTypes.Cruise;
            readonly category: CategoryGroups.Travel;
        };
        readonly Unsorted: {
            readonly name: ExpenseTypes.Unknown;
            readonly category: CategoryGroups.Unknown;
        };
        readonly Reconciliation: {
            readonly name: ExpenseTypes.Reconciliation;
            readonly category: CategoryGroups.Reconciliation;
        };
    };
};
export declare const StandardCategoryTree: {
    readonly Expense: {
        readonly Utilities: CategoryGroups.Utilities;
        readonly Subscriptions: CategoryGroups.Subscriptions;
        readonly Fees: CategoryGroups.Fees;
        readonly Credit: CategoryGroups.Credit;
        readonly Meals: CategoryGroups.Meals;
        readonly Shopping: CategoryGroups.Shopping;
        readonly Entertainment: CategoryGroups.Entertainment;
        readonly ProfessionalServices: CategoryGroups.ProfessionalServices;
        readonly Travel: CategoryGroups.Travel;
        readonly Government: CategoryGroups.Government;
        readonly Reconciliation: CategoryGroups.Reconciliation;
    };
};
export interface ICategory {
    categoryId: string;
    parentCategoryId: string | null;
    name: string;
    type: CategoryType;
}
export declare class Category implements ICategory {
    categoryId: string;
    parentCategoryId: string | null;
    name: string;
    type: CategoryType;
    constructor(name: string, type: CategoryType, parentCategoryId?: string | null);
    static createStandardCategories(): Category[];
}
