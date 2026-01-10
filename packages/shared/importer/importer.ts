import { type IStatement } from "../models/statement.js";
import { type ITransaction, TransactionType } from "../models/transaction.js";
import { type ICurrency } from "../models/currency.js";

export interface ICsvMapping {
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  merchantColumn?: string;
  transactionTypeColumn: string;
  categoryColumn?: string;
  quantityColumn?: string;
  priceColumn?: string;
  cusipColumn?: string;
  symbolColumn?: string;
}

export interface IStatementImporter {
  import(source: any): Promise<IStatement>;
}

export abstract class StatementImporter implements IStatementImporter {
  protected accountId: string;
  protected userId: string;
  protected mapping: ICsvMapping;
  protected currency: ICurrency;
  protected transactionTypeColumn: string;

  constructor(accountId: string, userId: string, mapping: ICsvMapping, currency: ICurrency) {
    this.accountId = accountId;
    this.userId = userId;
    this.mapping = mapping;

    this.currency = currency;
    this.transactionTypeColumn = mapping.transactionTypeColumn;
  }

  async import(source: string): Promise<IStatement> {
    throw new Error("StatementImporter is deprecated. Use TransactionProcessor.");
  }

  protected abstract checkTransactionType(record: any): TransactionType;

  protected async processTransaction(record: any): Promise<ITransaction | null> {
    return null;
  }
}