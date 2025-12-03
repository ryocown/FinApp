import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import type { Express } from 'express';
import { Sector } from '@finapp/shared/models/financial_instrument';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

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

// Mock Alpaca
jest.unstable_mockModule('../src/provider/quote_providers/alpaca', () => ({
  AlpacaQuoteProvider: jest.fn().mockImplementation(() => ({
    getInstrumentByCusip: jest.fn().mockImplementation(async (cusip: string) => {
      if (cusip === 'TEST_CUSIP_AI') {
        return {
          cusip: 'TEST_CUSIP_AI',
          name: 'Apple Inc',
          type: 'STOCK',
          ticker: 'AAPL',
        };
      }
      return null;
    }),
  })),
}));

// Mock Gemini
const mockGenerateContent = jest.fn();
jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe('AI Sector Enrichment', () => {
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
    process.env.GEMINI_API_KEY = 'TEST_KEY';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enrich sector using Gemini', async () => {
    // Mock existing instrument check (not found)
    db.get.mockResolvedValueOnce({ empty: true, docs: [] });
    // Mock add
    db.add.mockResolvedValueOnce({ id: 'NEW_ID' });

    // Mock Gemini response
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'TECHNOLOGY',
      },
    });

    const response = await request(app)
      .post('/api/instruments')
      .send({
        cusip: 'TEST_CUSIP_AI',
        name: 'Unknown Instrument', // Will be enriched by Alpaca first to "Apple Inc"
        type: 'unknown',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      cusip: 'TEST_CUSIP_AI',
      name: 'Apple Inc',
      type: 'STOCK',
      sector: 'TECHNOLOGY',
    });

    // Verify Gemini was called with correct prompt
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining("Categorize the company 'Apple Inc'")
    );
  });

  it('should handle Gemini errors gracefully', async () => {
    // Mock existing instrument check (not found)
    db.get.mockResolvedValueOnce({ empty: true, docs: [] });
    // Mock add
    db.add.mockResolvedValueOnce({ id: 'NEW_ID' });

    // Mock Gemini error
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini Error'));

    const response = await request(app)
      .post('/api/instruments')
      .send({
        cusip: 'TEST_CUSIP_AI',
        name: 'Unknown Instrument',
        type: 'unknown',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      cusip: 'TEST_CUSIP_AI',
      name: 'Apple Inc',
      type: 'STOCK',
    });
    expect(response.body.sector).toBeUndefined();
  });
});
