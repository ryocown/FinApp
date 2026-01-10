import { v4 } from "uuid";
export var CategoryType;
(function (CategoryType) {
    CategoryType["Income"] = "INCOME";
    CategoryType["Expense"] = "EXPENSE";
    CategoryType["Withdrawal"] = "WITHDRAWAL";
    CategoryType["Deposit"] = "DEPOSIT";
    CategoryType["Credit"] = "CREDIT";
    CategoryType["Transfer"] = "TRANSFER";
    CategoryType["Other"] = "OTHER";
    CategoryType["Reconciliation"] = "RECONCILIATION";
})(CategoryType || (CategoryType = {}));
export var CategoryGroups;
(function (CategoryGroups) {
    CategoryGroups["Utilities"] = "Bills & Utilities";
    CategoryGroups["Subscriptions"] = "Subscriptions";
    CategoryGroups["Fees"] = "Fees & Surcharges";
    CategoryGroups["Credit"] = "Credit";
    CategoryGroups["Meals"] = "Food & Drink";
    CategoryGroups["Health"] = "Health & Medical";
    CategoryGroups["Shopping"] = "Shopping";
    CategoryGroups["Government"] = "Government";
    CategoryGroups["Entertainment"] = "Entertainment";
    CategoryGroups["ProfessionalServices"] = "Professional Services";
    CategoryGroups["Travel"] = "Transport and Activites";
    CategoryGroups["CashManagement"] = "Cash Management";
    CategoryGroups["Unknown"] = "Unknown";
    CategoryGroups["Reconciliation"] = "Reconciliation";
})(CategoryGroups || (CategoryGroups = {}));
export var ExpenseTypes;
(function (ExpenseTypes) {
    ExpenseTypes["Atm"] = "ATM Cash Withdrawal";
    ExpenseTypes["InvestingTransfer"] = "Stock Account Transfer";
    ExpenseTypes["PersonalPayment"] = "Personal Payment";
    ExpenseTypes["BankTransfer"] = "Bank Transfer";
    ExpenseTypes["Salary"] = "Salary";
    ExpenseTypes["Refund"] = "Refund";
    ExpenseTypes["CreditInterest"] = "Credit Interest";
    ExpenseTypes["GovernmentSubsidy"] = "Government Subsidy";
    ExpenseTypes["CreditCardPayment"] = "Credit Card Payment";
    ExpenseTypes["CreditBenefit"] = "Credit Benefit";
    ExpenseTypes["TransactionFees"] = "Transaction Fees";
    ExpenseTypes["ForeignSurcharge"] = "Foreign Surcharge";
    ExpenseTypes["ExchangeFees"] = "Exchange Fees";
    ExpenseTypes["BankFees"] = "Bank Fees";
    ExpenseTypes["DebitInterest"] = "Debit Interest";
    ExpenseTypes["CardVerification"] = "Card Verification";
    ExpenseTypes["MealsSelf"] = "Meals Self";
    ExpenseTypes["MealsSocial"] = "Meals Social";
    ExpenseTypes["Gifts"] = "Gifts";
    ExpenseTypes["TaxPayment"] = "Tax Payment";
    ExpenseTypes["IdentityRegistrations"] = "License & Registrations";
    ExpenseTypes["PassportFees"] = "Passport Fees";
    ExpenseTypes["Medical"] = "Health & Medical";
    ExpenseTypes["GymExercise"] = "Gym & Exercise";
    ExpenseTypes["RentalPayment"] = "Rental Payment";
    ExpenseTypes["Electronics"] = "Electronics";
    ExpenseTypes["ElectronicsNonTaxable"] = "Electronics - Non-Taxable";
    ExpenseTypes["EntertainmentMedia"] = "Entertainment & Media";
    ExpenseTypes["Groceries"] = "Groceries";
    ExpenseTypes["ClothesHomeware"] = "Clothes & Homeware";
    ExpenseTypes["MiscShopping"] = "Misc Shopping";
    ExpenseTypes["HomeOffice"] = "Home Office";
    ExpenseTypes["ConvenienceStore"] = "Convenience Store";
    ExpenseTypes["Insurance"] = "Insurance";
    ExpenseTypes["Furniture"] = "Furniture";
    ExpenseTypes["PersonalSubscriptions"] = "Personal Subscriptions";
    ExpenseTypes["PhoneInternet"] = "Phone & Internet";
    ExpenseTypes["RoamingInternet"] = "Roaming Internet";
    ExpenseTypes["TransportFoodSubscriptions"] = "Transport & Food Subscriptions";
    ExpenseTypes["EntertainmentSubscriptions"] = "Entertainment Subscriptions";
    ExpenseTypes["TravelAgency"] = "Travel Agency";
    ExpenseTypes["Airlines"] = "Airlines";
    ExpenseTypes["HotelsAccommodation"] = "Hotels & Accommodation";
    ExpenseTypes["TaxiTransport"] = "Taxi & Transport";
    ExpenseTypes["Parking"] = "Parking";
    ExpenseTypes["ServiceStations"] = "Service Stations / Fuel";
    ExpenseTypes["Activities"] = "Activities";
    ExpenseTypes["Cruise"] = "Cruise";
    ExpenseTypes["Unsorted"] = "Unsorted";
    ExpenseTypes["Utilities"] = "Utilities";
    ExpenseTypes["CreditCardFees"] = "Credit Card Fees";
    ExpenseTypes["Unknown"] = "Unknown";
    ExpenseTypes["Reconciliation"] = "Reconciliation";
})(ExpenseTypes || (ExpenseTypes = {}));
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
        ForeignSurcharge: { name: ExpenseTypes.ForeignSurcharge, category: CategoryGroups.Fees },
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
        ConvienceStore: { name: ExpenseTypes.ConvenienceStore, category: CategoryGroups.Shopping },
        Furniture: { name: ExpenseTypes.Furniture, category: CategoryGroups.Shopping },
        PersoanlSubscriptions: { name: ExpenseTypes.PersonalSubscriptions, category: CategoryGroups.Subscriptions },
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
        Reconciliation: { name: ExpenseTypes.Reconciliation, category: CategoryGroups.Reconciliation }
    }
};
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
        Government: CategoryGroups.Government,
        Reconciliation: CategoryGroups.Reconciliation
    }
};
export class Category {
    categoryId;
    parentCategoryId;
    name;
    type;
    constructor(name, type, parentCategoryId = null) {
        this.categoryId = v4();
        this.name = name;
        this.type = type;
        this.parentCategoryId = parentCategoryId;
    }
    static createStandardCategories() {
        const expense = new Category('Expense', CategoryType.Expense);
        const categories = [expense];
        Object.values(CategoryGroups).forEach(name => {
            if (name === CategoryGroups.Reconciliation) {
                categories.push(new Category(name, CategoryType.Reconciliation, null));
            }
            else {
                categories.push(new Category(name, CategoryType.Expense, expense.categoryId));
            }
        });
        return categories;
    }
}
