import { type IStatement, Statement } from "../models/statement";
import { type ITransaction, GeneralTransaction, TransactionType, TradeTransaction, TransferTransaction } from "../models/transaction";
import { type ICurrency } from "../models/currency";
import { type IStatementImporter } from "./importer";
import { parse } from 'csv-parse/sync';

export interface ICsvMapping {
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  merchantColumn?: string;
  transactionTypeColumn: string;
  categoryColumn?: string;
}

export abstract class CsvStatementImporter implements IStatementImporter {
  protected accountId: string;
  protected mapping: ICsvMapping;
  protected currency: ICurrency;
  protected transactionTypeColumn: string;

  constructor(mapping: ICsvMapping, currency: ICurrency, accountId: string) {
    this.accountId = accountId;
    this.mapping = mapping;
    this.currency = currency;
    this.transactionTypeColumn = mapping.transactionTypeColumn;
  }

  async import(source: string): Promise<IStatement> {
    const transactions: ITransaction[] = [];

    const records: any[] = parse(source, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    for (const record of records) {
      const transaction = this.processTransaction(record);
      if (transaction) {
        transactions.push(transaction);
      }
    }

    // Assuming the statement covers the range of transactions
    const sortedTransactions = transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    const startDate = sortedTransactions[0]?.date || new Date();
    const endDate = sortedTransactions[sortedTransactions.length - 1]?.date || new Date();

    return new Statement(this.accountId, startDate, endDate, transactions);
  }

  protected abstract checkTransactionType(record: any): TransactionType;

  protected processTransaction(record: any): ITransaction | null {
    const date = new Date(record[this.mapping.dateColumn]);
    const amount = parseFloat(record[this.mapping.amountColumn]);
    const description = record[this.mapping.descriptionColumn];

    if (isNaN(date.getTime()) || isNaN(amount)) {
      return null; // Skip invalid rows
    }

    const transactionType = this.checkTransactionType(record);

    if (transactionType === TransactionType.General) {
      return new GeneralTransaction(
        this.accountId,
        amount,
        this.currency,
        date,
        description,
        false, // isTaxDeductable
        false, // hasCapitalGains
        null, // merchant
        undefined, // categoryId
        [] // tagIds
      );
    }
    // Base class doesn't handle other types, subclasses should override
    return null;
  }
}
