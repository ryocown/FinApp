import { jest, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
// Mock firebase-admin and db
jest.unstable_mockModule('../src/firebase', () => {
  const mockDb: any = {
    collection: jest.fn(),
    doc: jest.fn(),
    get: jest.fn(),
    add: jest.fn(),
  };
  mockDb.collection.mockReturnValue(mockDb);
  mockDb.doc.mockReturnValue(mockDb);
  mockDb.get.mockResolvedValue({ docs: [] });
  mockDb.add.mockResolvedValue({ id: 'mock-id' });
  mockDb.add.mockResolvedValue({ id: 'mock-id' });
  return {
    db: mockDb,
    getUserRef: jest.fn().mockReturnValue(mockDb),
    getAccountRef: jest.fn().mockReturnValue({ ref: mockDb, instituteId: 'mock-institute-id' }),
    getInstrumentsRef: jest.fn().mockReturnValue(mockDb),
    getCategoriesRef: jest.fn().mockReturnValue(mockDb),
  };
});

const { default: accountRoutes } = await import('../src/routes/accounts');
const { default: transactionRoutes } = await import('../src/routes/transactions');
const { default: categoryRoutes } = await import('../src/routes/categories');

const app = express();
app.use(express.json());
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

describe('API Endpoints', () => {
  it('GET /api/accounts should return 200', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/transactions should return 200', async () => {
    const res = await request(app).get('/api/transactions/users/mock-user/transactions');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ transactions: [], nextPageToken: null });
  });

  it('GET /api/categories should return 200', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });
});
