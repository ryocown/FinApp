import { CsvStatementImporter, ICsvMapping } from '../csv_importer';
import { ITransaction, GeneralTransaction, TransactionType, TransferTransaction } from '../../models/transaction';
import { ICurrency } from '../../models/currency';

export class ChaseCsvStatementImporter extends CsvStatementImporter {
  constructor(accountId: string) {
    super({
      dateColumn: 'Posting Date',
      amountColumn: 'Amount',
      descriptionColumn: 'Description',
      merchantColumn: 'Description', // Chase doesn't have a separate merchant column usually
      transactionTypeColumn: 'Type',
    }, {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$'
    }, accountId);
  }

  protected override checkTransactionType(record: any): TransactionType {
    const type = record[this.mapping.transactionTypeColumn];
    if (!type) return TransactionType.General;

    switch (true) {
      case type.includes('ACCT_XFER'):
        return TransactionType.Transfer;
      case type.includes('FEE'):
        return TransactionType.Fees;
      case type.includes('ACH_CREDIT'):
      case type.includes('CHECK_DEPOSIT'):
      case type.includes('MISC_CREDIT'):
      case type.includes('REFUND_TRANSACTION'):
      case type.includes('WIRE_INCOMING'):
      case type.includes('PARTNERFI_TO_CHASE'):
      case type.includes('QUICKPAY_CREDIT'):
        return TransactionType.Deposit;
      case type.includes('ACH_DEBIT'):
      case type.includes('MISC_DEBIT'):
      case type.includes('CHASE_TO_PARTNERFI'):
      case type.includes('QUICKPAY_DEBIT'):
      case type.includes('DEPOSIT_RETURN'):
        return TransactionType.Withdrawal;
      default:
        return TransactionType.General;
    }
  }

  protected override processTransaction(record: any): ITransaction | null {
    const date = new Date(record[this.mapping.dateColumn]);
    const amount = parseFloat(record[this.mapping.amountColumn]);
    const description = record[this.mapping.descriptionColumn];

    if (isNaN(date.getTime()) || isNaN(amount)) {
      return null; // Skip invalid rows
    }

    const transactionType = this.checkTransactionType(record);

    if (transactionType === TransactionType.Transfer) {
      return new TransferTransaction(
        this.accountId,
        'unknown_destination', // TODO: Parse destination from description
        amount,
        this.currency,
        date,
        description,
        undefined, // categoryId
        [] // tagIds
      );
    }

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
      [], // tagIds
      transactionType
    );
  }
}

export class ChaseCreditCsvStatementImporter extends CsvStatementImporter {
  constructor(accountId: string) {
    super({
      dateColumn: 'Transaction Date',
      amountColumn: 'Amount',
      descriptionColumn: 'Description',
      merchantColumn: 'Description',
      transactionTypeColumn: 'Type',
      categoryColumn: 'Category',
    }, {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$'
    }, accountId);
  }

  protected override checkTransactionType(record: any): TransactionType {
    const type = record[this.mapping.transactionTypeColumn];
    if (!type) return TransactionType.General;

    switch (true) {
      case type.includes('Payment'):
        return TransactionType.Transfer; // Payments to credit card are transfers from checking
      case type.includes('Sale'):
        return TransactionType.Withdrawal; // Sales are withdrawals (spending)
      case type.includes('Fee'):
        return TransactionType.Fees;
      case type.includes('Refund'):
        return TransactionType.Deposit;
      default:
        return TransactionType.General;
    }
  }

  protected override processTransaction(record: any): ITransaction | null {
    const date = new Date(record[this.mapping.dateColumn]);
    const amount = parseFloat(record[this.mapping.amountColumn]);
    const description = record[this.mapping.descriptionColumn];
    const category = this.mapping.categoryColumn ? record[this.mapping.categoryColumn] : undefined;

    if (isNaN(date.getTime()) || isNaN(amount)) {
      return null; // Skip invalid rows
    }

    const transactionType = this.checkTransactionType(record);

    if (transactionType === TransactionType.Transfer) {
      return new TransferTransaction(
        'unknown_source', // For credit card payments, money comes from somewhere else
        this.accountId,
        amount,
        this.currency,
        date,
        description,
        category, // categoryId
        [] // tagIds
      );
    }

    return new GeneralTransaction(
      this.accountId,
      amount,
      this.currency,
      date,
      description,
      false, // isTaxDeductable
      false, // hasCapitalGains
      null, // merchant
      category, // categoryId
      [], // tagIds
      transactionType
    );
  }
}
