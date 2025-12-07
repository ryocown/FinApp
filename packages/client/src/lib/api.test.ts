import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    deleteTransaction,
    createTransaction,
    updateTransaction,
    searchInstruments
} from './api';

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('API Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('deleteTransaction', () => {
        it('should call DELETE endpoint with correct URL', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            });

            await deleteTransaction('user123', 'tx456');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/transactions/users/user123/transactions/tx456',
                { method: 'DELETE' }
            );
        });

        it('should throw error with server message on failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: () => Promise.resolve(JSON.stringify({ error: 'Transaction not found' })),
            });

            await expect(deleteTransaction('user123', 'non-existent'))
                .rejects.toThrow('Transaction not found');
        });

        it('should throw generic error when JSON parsing fails', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: () => Promise.resolve('not valid json'),
            });

            await expect(deleteTransaction('user123', 'tx123'))
                .rejects.toThrow('Server error: 500 Internal Server Error');
        });
    });

    describe('createTransaction', () => {
        it('should POST transaction and return created transaction', async () => {
            const mockTransaction = {
                transactionId: 'new-tx',
                amount: -50,
                description: 'Coffee',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 201,
                json: () => Promise.resolve(mockTransaction),
            });

            const result = await createTransaction('user123', { amount: -50, description: 'Coffee' });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/transactions/users/user123/transactions',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: -50, description: 'Coffee' }),
                }
            );

            expect(result).toEqual(mockTransaction);
        });

        it('should throw error on validation failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: () => Promise.resolve(JSON.stringify({ error: 'Missing accountId' })),
            });

            await expect(createTransaction('user123', {}))
                .rejects.toThrow('Missing accountId');
        });
    });

    describe('updateTransaction', () => {
        it('should PUT updates to correct endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            });

            await updateTransaction('user123', 'tx789', { amount: -75 });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/transactions/users/user123/transactions/tx789',
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: -75 }),
                }
            );
        });
    });

    describe('searchInstruments', () => {
        it('should encode query parameter', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([{ symbol: 'AAPL', name: 'Apple Inc.' }]),
            });

            await searchInstruments('Apple & Co');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/instruments/search?q=Apple%20%26%20Co'
            );
        });

        it('should return empty array on error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            const result = await searchInstruments('test');

            expect(result).toEqual([]);
        });
    });
});
