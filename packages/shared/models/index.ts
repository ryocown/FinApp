// Barrel exports for shared models
// Enables cleaner imports: import { Account, ITransaction } from '@finapp/shared/models'

// Accounts
export { type AccountProp, Account, InvestmentAccount, AccountType, AccountTag, BankAccount } from './account.js';

// Transactions
export { type TransactionProto, type GeneralTransactionProto, type TradeTransactionProto, type TransferTransactionProto, GeneralTransaction, TradeTransaction, TransferTransaction, TransactionType, generateTransactionId } from './transaction.js';

// Categories
export { type ICategory, Category, CategoryType, CategoryGroups, ExpenseTypes, ExpenseTree, StandardCategoryTree } from './category.js';

// Financial Instruments
export { type IFinancialInstrument, type StockInstrument, type BondInstrument, type OptionInstrument, type UnderlyingAsset, InstrumentType, Sector, BondType, OptionType } from './financial_instrument.js';

// Currency
export { type ICurrency, Currency } from './currency.js';

// Institutions
export { type InstituteProp, type SupportedInstituteProp, Institute, InstituteTypes } from './institute.js';
export * from './supported_institutes.js';

// Balance Checkpoints
export { type IBalanceCheckpoint, BalanceCheckpointType } from './balance_checkpoint.js';

// Budgets
export { type IBudget, Budget, BudgetManager, BudgetPeriod } from './budget.js';

// Merchants
export { type MerchantProp, type KnownMerchant, Merchant } from './merchant.js';
export * from './known_merchants.js';

// Statements
export { type StatementProto, Statement } from './statement.js';

// Balance History
export { type BalanceEntryProto, type YearlyBalanceDocProto } from './balance-history.js';

// Tags
export { type ITag, Tag } from './tag.js';

// Lots
export { type ILot, Lot } from './lot.js';

// Price History
export { type IPricePoint, PricePoint } from './price_history.js';

// Recurring Transactions
export { type RecurringTransactionProto, type RecurrenceFrequency, RecurringTransaction } from './recurring_transaction.js';

// Users
export { type IUser, User } from './user.js';

// Date Utils
export * as DateUtils from '../lib/date_utils.js';

// Importer
export * from '../importer/index.js';

// Date Protos
export { type DateProto, toDateProto } from './date-proto.js';
