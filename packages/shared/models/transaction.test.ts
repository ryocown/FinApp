import { describe, it, expect } from '@jest/globals';
import {
    GeneralTransaction,
    TradeTransaction,
    TransferTransaction,
    TransactionType
} from './transaction';
import { Currency } from './currency';
import { Merchant } from './merchant';

describe('GeneralTransaction', () => {
    const usd = new Currency('US Dollar', '$', 'USD');
    const date = new Date('2025-01-15T12:00:00Z');

    it('should generate deterministic transaction ID based on content', () => {
        const tx1 = new GeneralTransaction(
            'acc1', 'user1', -50.00, usd, date,
            'Coffee Shop', false, false, null
        );
        const tx2 = new GeneralTransaction(
            'acc1', 'user1', -50.00, usd, date,
            'Coffee Shop', false, false, null
        );

        // Same input should produce same ID
        expect(tx1.transactionId).toBe(tx2.transactionId);
    });

    it('should generate different IDs for different amounts', () => {
        const tx1 = new GeneralTransaction(
            'acc1', 'user1', -50.00, usd, date,
            'Coffee Shop', false, false, null
        );
        const tx2 = new GeneralTransaction(
            'acc1', 'user1', -51.00, usd, date,
            'Coffee Shop', false, false, null
        );

        expect(tx1.transactionId).not.toBe(tx2.transactionId);
    });

    it('should serialize and deserialize via fromJSON', () => {
        const merchant = new Merchant('Starbucks', 'Food & Drink', 'Restaurant');
        const original = new GeneralTransaction(
            'acc1', 'user1', -5.75, usd, date,
            'Morning coffee', false, false, merchant, 'cat-food'
        );

        const json = JSON.parse(JSON.stringify(original));
        const restored = GeneralTransaction.fromJSON(json);

        expect(restored.transactionId).toBe(original.transactionId);
        expect(restored.amount).toBe(-5.75);
        expect(restored.description).toBe('Morning coffee');
        expect(restored.categoryId).toBe('cat-food');
        expect(restored.merchant?.name).toBe('Starbucks');
    });
});

describe('TradeTransaction', () => {
    const usd = new Currency('US Dollar', '$', 'USD');
    const date = new Date('2025-01-15T12:00:00Z');

    it('should include instrumentId, quantity, price in transaction ID', () => {
        const tx1 = new TradeTransaction(
            'acc1', 'user1', -1000, usd, date,
            'Buy AAPL', false, true,
            'AAPL', 10, 100
        );
        const tx2 = new TradeTransaction(
            'acc1', 'user1', -1000, usd, date,
            'Buy AAPL', false, true,
            'AAPL', 5, 200 // Different quantity/price, same total
        );

        // Different trade details = different ID
        expect(tx1.transactionId).not.toBe(tx2.transactionId);
    });

    it('should always have TransactionType.Trade', () => {
        const tx = new TradeTransaction(
            'acc1', 'user1', -500, usd, date,
            'Buy stock', false, true, 'MSFT', 5, 100
        );

        expect(tx.transactionType).toBe(TransactionType.Trade);
    });

    it('should serialize and deserialize via fromJSON', () => {
        const original = new TradeTransaction(
            'acc1', 'user1', -1500, usd, date,
            'Buy GOOG', false, true, 'GOOG', 10, 150
        );

        const json = JSON.parse(JSON.stringify(original));
        const restored = TradeTransaction.fromJSON(json);

        expect(restored.transactionId).toBe(original.transactionId);
        expect(restored.instrumentId).toBe('GOOG');
        expect(restored.quantity).toBe(10);
        expect(restored.price).toBe(150);
    });
});

describe('TransferTransaction', () => {
    const usd = new Currency('US Dollar', '$', 'USD');
    const aud = new Currency('Australian Dollar', 'A$', 'AUD');
    const date = new Date('2025-01-15T12:00:00Z');

    describe('createTransferPair', () => {
        it('should create linked pair with matching IDs', () => {
            const [source, dest] = TransferTransaction.createTransferPair(
                'acc-usd', 'acc-checking',
                'user1',
                -100, usd,
                100, usd,
                date, 'Transfer to checking'
            );

            // IDs should be linked bidirectionally
            expect(source.linkedTransactionId).toBe(dest.transactionId);
            expect(dest.linkedTransactionId).toBe(source.transactionId);
        });

        it('should calculate exchange rate correctly', () => {
            const [source, dest] = TransferTransaction.createTransferPair(
                'acc-usd', 'acc-aud',
                'user1',
                -100, usd,
                150, aud,
                date, 'Convert to AUD'
            );

            // Rate = destination / |source| = 150 / 100 = 1.5
            expect(source.exchangeRate).toBe(1.5);
            expect(dest.exchangeRate).toBe(1.5);
        });

        it('should preserve negative source and positive destination amounts', () => {
            const [source, dest] = TransferTransaction.createTransferPair(
                'acc-usd', 'acc-eur',
                'user1',
                -200, usd,
                180, new Currency('Euro', '€', 'EUR'),
                date, 'Transfer'
            );

            expect(source.amount).toBe(-200);
            expect(dest.amount).toBe(180);
        });

        it('should set transactionType to Transfer', () => {
            const [source, dest] = TransferTransaction.createTransferPair(
                'a', 'b', 'user', -50, usd, 50, usd, date, 'test'
            );

            expect(source.transactionType).toBe(TransactionType.Transfer);
            expect(dest.transactionType).toBe(TransactionType.Transfer);
        });
    });

    it('should serialize and deserialize via fromJSON', () => {
        const original = new TransferTransaction(
            'acc1', 'linked-tx-123', 'user1',
            -250, usd, date, 'Transfer out',
            'cat-transfer', ['tag1'], 1.0
        );

        const json = JSON.parse(JSON.stringify(original));
        const restored = TransferTransaction.fromJSON(json);

        expect(restored.transactionId).toBe(original.transactionId);
        expect(restored.linkedTransactionId).toBe('linked-tx-123');
        expect(restored.exchangeRate).toBe(1.0);
        expect(restored.categoryId).toBe('cat-transfer');
    });

    it('should NOT include linkedTransactionId in hash (to allow linking after creation)', () => {
        const tx1 = new TransferTransaction(
            'acc1', 'link-a', 'user1',
            -100, usd, date, 'Transfer'
        );
        const tx2 = new TransferTransaction(
            'acc1', 'link-b', 'user1',
            -100, usd, date, 'Transfer'
        );

        // Same content except linkedTransactionId should produce same ID
        // This allows the ID to be stable before linking
        expect(tx1.transactionId).toBe(tx2.transactionId);
    });
});
