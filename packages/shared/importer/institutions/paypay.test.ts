import { PayPayStatementImporter } from './paypay';
import { TransactionType } from '../../models/transaction';

const csvData = `取引日,出金金額（円）,入金金額（円）,海外出金金額,通貨,変換レート（円）,利用国,取引内容,取引先,取引方法,支払い区分,利用者,取引番号
2025/12/07 13:02:19,"4,980",-,-,-,-,-,支払い,キャットマニア,PayPayカード VISA 3109,ー回払い,本人,PPCD_A_2025120713021900812890
2025/12/06 23:44:34,460,-,-,-,-,-,支払い,MEGAドン・キホーテ大森山王店*,PayPayカード ゴールド VISA 8442,ー回払い,本人,PPCD_A_2025120623443400824664
2025/12/05 01:50:54,"3,843",-,-,-,-,-,支払い,UQ mobileご利用料金,PayPayカード VISA 5233,ー回払い,本人,PPCD_A_2025120501505400428868`;

describe('PayPayStatementImporter', () => {
  it('should import transactions correctly', async () => {
    const importer = new PayPayStatementImporter('test-account', 'test-user');
    const statement = await importer.import(csvData);

    expect(statement.transactions).toHaveLength(3);

    // Sort by date descending to match CSV order usually, but importer sorts by date ascending
    // 2025/12/05 is earliest
    const tx1 = statement.transactions[0]; // 2025/12/05
    const tx2 = statement.transactions[1]; // 2025/12/06
    const tx3 = statement.transactions[2]; // 2025/12/07

    expect(tx3.description).toBe('キャットマニア');
    expect(tx3.amount).toBe(-4980);
    // 2025/12/07 13:02:19 JST -> 2025/12/07 04:02:19 UTC
    expect(tx3.date.toISOString()).toBe('2025-12-07T04:02:19.000Z');

    expect(tx2.description).toBe('MEGAドン・キホーテ大森山王店*');
    expect(tx2.amount).toBe(-460);
    // 2025/12/06 23:44:34 JST -> 2025/12/06 14:44:34 UTC
    expect(tx2.date.toISOString()).toBe('2025-12-06T14:44:34.000Z');

    expect(tx1.description).toBe('UQ mobileご利用料金');
    expect(tx1.amount).toBe(-3843);
  });
});
