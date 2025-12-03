import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import type { Express } from 'express';

// Define mocks before imports
const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: jest.fn(),
  add: jest.fn(),
};

const firestoreFn = jest.fn(() => mockFirestore);
// @ts-ignore
firestoreFn.FieldValue = {
  serverTimestamp: jest.fn().mockReturnValue('TIMESTAMP'),
};

const mockAdmin = {
  firestore: firestoreFn,
  credential: {
    applicationDefault: jest.fn(),
  },
  initializeApp: jest.fn(),
};

jest.unstable_mockModule('firebase-admin', () => ({
  default: mockAdmin,
}));

jest.unstable_mockModule('../src/provider/quote_providers/alpaca', () => ({
  AlpacaQuoteProvider: jest.fn().mockImplementation(() => ({
    getInstrumentByCusip: jest.fn().mockImplementation(async (cusip) => {
      if (cusip === 'TEST_CUSIP_ENRICH') {
        return {
          cusip: 'TEST_CUSIP_ENRICH',
          name: 'Enriched Name',
          type: 'STOCK',
          ticker: 'ENRICH',
        };
      }
      return null;
    }),
  })),
}));

describe('Instrument Enrichment', () => {
  let app: Express;
  let request: any;
  let db: any;

  beforeAll(async () => {
    // Dynamic imports after mocks
    const express = (await import('express')).default;
    const instrumentRoutes = (await import('../src/routes/instruments')).default;
    const supertest = (await import('supertest')).default;

    request = supertest;

    app = express();
    app.use(express.json());
    app.use('/api/instruments', instrumentRoutes);

    db = mockFirestore;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enrich instrument data when type is unknown', async () => {
    // Mock existing instrument check (not found)
    db.get.mockResolvedValueOnce({ empty: true, docs: [] });
    // Mock add
    db.add.mockResolvedValueOnce({ id: 'NEW_ID' });

    const response = await request(app)
      .post('/api/instruments')
      .send({
        cusip: 'TEST_CUSIP_ENRICH',
        name: 'Unknown Instrument',
        type: 'unknown',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      cusip: 'TEST_CUSIP_ENRICH',
      name: 'Enriched Name', // Should be enriched
      type: 'STOCK', // Should be enriched
      ticker: 'ENRICH',
    });

    // Verify db.add was called with enriched data
    expect(db.add).toHaveBeenCalledWith(expect.objectContaining({
      cusip: 'TEST_CUSIP_ENRICH',
      name: 'Enriched Name',
      type: 'STOCK',
      ticker: 'ENRICH',
    }));
  });

  it('should not enrich if instrument already exists', async () => {
    // Mock existing instrument check (found)
    db.get.mockResolvedValueOnce({
      empty: false,
      docs: [{
        id: 'EXISTING_ID',
        data: () => ({
          cusip: 'EXISTING_CUSIP',
          name: 'Existing Name',
          type: 'BOND',
        }),
      }],
    });

    const response = await request(app)
      .post('/api/instruments')
      .send({
        cusip: 'EXISTING_CUSIP',
        name: 'Existing Name',
        type: 'BOND',
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('EXISTING_ID');
    // Should not call add
    expect(db.add).not.toHaveBeenCalled();
  });
});
