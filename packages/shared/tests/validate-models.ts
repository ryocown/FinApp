import { TransactionProto, GeneralTransaction, TradeTransaction, TransferTransaction, TransactionType } from '../models/transaction.js';
import { DateProto, toDateProto } from '../models/date-proto.js';
import { StatementProto, Statement } from '../models/statement.js';
import { v4 } from 'uuid';

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`PASS: ${message}`);
}

function testDateProto() {
    const now = new Date();
    const proto = toDateProto(now);
    assert(proto.timestamp === now.getTime(), 'DateProto timestamp matches Date');
    assert(proto.year === now.getFullYear(), 'DateProto year matches');
    assert(proto.month === now.getMonth() + 1, 'DateProto month matches');
}

function testTransaction() {
    const date = new Date('2023-01-01T12:00:00Z');
    const protoDate = toDateProto(date);

    const tx: TransactionProto = {
        transactionId: v4(),
        accountId: 'acc-123',
        userId: 'user-123',
        amount: 100.50,
        currency: { code: 'USD', symbol: '$' },
        date: protoDate,
        description: 'Test Transaction',
        transactionType: TransactionType.General,
        statementId: 'stmt-123',
        tagIds: []
    };

    const generalTx = GeneralTransaction.fromJSON(tx);
    assert(generalTx.amount === 100.50, 'GeneralTransaction amount matches');
    assert(generalTx.date.year === 2023, 'GeneralTransaction date matches');
    assert(generalTx.statementId === 'stmt-123', 'GeneralTransaction statementId matches');

    // Test Trade Transaction
    const tradeTx = TradeTransaction.fromJSON({
        ...tx,
        transactionType: TransactionType.Trade,
        ticker: 'AAPL',
        units: 10,
        unitPrice: 150
    } as any);

    assert(tradeTx instanceof TradeTransaction, 'Is TradeTransaction instance');
    assert(tradeTx.ticker === 'AAPL', 'Ticker matches');
}

function testStatement() {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');

    const stmt: StatementProto = {
        statementId: 'stmt-1',
        accountId: 'acc-1',
        periodStart: toDateProto(startDate),
        periodEnd: toDateProto(endDate),
        openingBalance: 1000,
        closingBalance: 1200,
        isReconciled: true,
        transactions: []
    };

    const stmtObj = Statement.fromJSON(stmt);
    assert(stmtObj.openingBalance === 1000, 'Opening balance matches');
    assert(stmtObj.periodStart.month === 1, 'Start month matches');
    assert(stmtObj.isReconciled === true, 'Is reconciled matches');
}

try {
    console.log('Running Model Validation...');
    testDateProto();
    testTransaction();
    testStatement();
    console.log('All tests passed!');
} catch (e) {
    console.error(e);
    process.exit(1);
}
