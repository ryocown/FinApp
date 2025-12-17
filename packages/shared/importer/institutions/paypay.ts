import { StatementImporter } from "../importer";
import { type ITransaction, GeneralTransaction, TransactionType } from "../../models/transaction";
import { CategoryType } from "../../models/category";
import { parseJSTDateToUTC } from "../../lib/date_utils";

export class PayPayStatementImporter extends StatementImporter {
  constructor(accountId: string, userId: string) {
    super(accountId, userId, {
      dateColumn: '取引日',
      amountColumn: '出金金額（円）', // Primary, but we check both
      descriptionColumn: '取引先',
      transactionTypeColumn: '取引内容',
    }, {
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥'
    });
  }

  protected override checkTransactionType(record: any): TransactionType {
    const type = record['取引内容'];
    if (!type) return TransactionType.Unknown;

    if (type === '支払い') {
      return TransactionType.Withdrawal;
    }
    // Add other types if known, e.g. refund, deposit
    // For now default to Unknown if not '支払い'
    return TransactionType.Unknown;
  }

  protected override async processTransaction(record: any): Promise<ITransaction | null> {
    const dateStr = record['取引日'];
    const date = parseJSTDateToUTC(dateStr);

    let amount = 0;
    const withdrawalStr = record['出金金額（円）'];
    const depositStr = record['入金金額（円）'];

    if (withdrawalStr && withdrawalStr !== '-') {
      amount = -1 * parseFloat(withdrawalStr.replace(/,/g, ''));
    } else if (depositStr && depositStr !== '-') {
      amount = parseFloat(depositStr.replace(/,/g, ''));
    }

    // If amount is 0, maybe skip? Or keep as 0?
    // Usually skip if invalid.
    if (isNaN(amount) || amount === 0) {
      // Check if it really was 0 or just failed parse
      if (amount === 0 && (withdrawalStr === '0' || depositStr === '0')) {
        // keep 0
      } else if (amount === 0) {
        // If both are empty or '-'
        return null;
      }
    }

    if (isNaN(date.getTime())) {
      return null;
    }

    const description = record['取引先'] || record['取引内容'];
    const transactionType = this.checkTransactionType(record);

    // PayPay is treated as Credit Card, so mostly GeneralTransaction
    // If we identify transfers (e.g. payment from bank), we might want TransferTransaction
    // But for now, user said "treat the whole paypay app as one single account".

    return new GeneralTransaction(
      this.accountId,
      this.userId,
      amount,
      this.currency,
      date,
      description,
      false, // isTaxDeductable
      false, // hasCapitalGains
      null, // merchant
      CategoryType.Other,
      [], // tagIds
      transactionType === TransactionType.Unknown ? TransactionType.General : transactionType
    );
  }
}