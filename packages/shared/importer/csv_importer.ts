import { IStatement, Statement } from "../models/statement";
import { ITransaction, GeneralTransaction } from "../models/transaction";
import { ICurrency } from "../models/currency";
import { IStatementImporter } from "./importer";
import { parse } from 'csv-parse/sync';

export interface ICsvMapping {
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  merchantColumn?: string;
  dateFormat?: string;
}

export class CsvStatementImporter implements IStatementImporter {
  private mapping: ICsvMapping;
  private currency: ICurrency;

  constructor(mapping: ICsvMapping, currency: ICurrency) {
    this.mapping = mapping;
    this.currency = currency;
  }

  async import(source: string, accountId: string): Promise<IStatement> {
    const transactions: ITransaction[] = [];

    const records: any[] = parse(source, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    for (const record of records) {
      const date = new Date(record[this.mapping.dateColumn]);
      const amount = parseFloat(record[this.mapping.amountColumn]);
      const description = record[this.mapping.descriptionColumn];

      if (isNaN(date.getTime()) || isNaN(amount)) {
        continue; // Skip invalid rows
      }

      transactions.push(new GeneralTransaction(
        accountId,
        amount,
        this.currency,
        date,
        description,
        false, // isTaxDeductable
        false, // hasCapitalGains
        null, // merchant
        undefined, // categoryId
        [] // tagIds
      ));
    }

    // Assuming the statement covers the range of transactions
    const sortedTransactions = transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    const startDate = sortedTransactions[0]?.date || new Date();
    const endDate = sortedTransactions[sortedTransactions.length - 1]?.date || new Date();

    return new Statement(accountId, startDate, endDate, transactions);
  }
}
