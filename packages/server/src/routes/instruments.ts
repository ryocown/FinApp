import { Router, type Request, type Response } from 'express';
import admin from 'firebase-admin';
import { AlpacaQuoteProvider } from '../provider/quote_providers/alpaca';
import { GeminiAIProvider } from '../provider/ai_providers/gemini';
import { InstrumentType } from '@finapp/shared/models/financial_instrument';
import { getInstrumentsRef } from '../firebase';
import { logger } from '../logger';

const router = Router();

// Lazy instantiation to ensure env vars are loaded
let _quoteProvider: AlpacaQuoteProvider;
let _aiProvider: GeminiAIProvider;

function getQuoteProvider() {
  if (!_quoteProvider) {
    _quoteProvider = new AlpacaQuoteProvider();
  }
  return _quoteProvider;
}

function getAiProvider() {
  if (!_aiProvider) {
    _aiProvider = new GeminiAIProvider();
  }
  return _aiProvider;
}

// Get instrument by CUSIP
router.get('/', async (req: Request, res: Response) => {
  const { cusip } = req.query;

  if (!cusip || typeof cusip !== 'string') {
    res.status(400).json({ error: 'CUSIP query parameter is required and must be a string' });
    return;
  }

  try {
    const snapshot = await getInstrumentsRef().where('cusip', '==', cusip).limit(1).get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'Instrument not found' });
      return;
    }

    const doc = snapshot.docs[0];
    if (!doc) {
      res.status(404).json({ error: 'Instrument not found' });
      return;
    }

    res.json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    logger.error('Error fetching instrument:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new instrument
router.post('/', async (req: Request, res: Response) => {
  const { cusip, name, type } = req.body;

  if (!cusip || typeof cusip !== 'string') {
    res.status(400).json({ error: 'CUSIP is required and must be a string' });
    return;
  }

  // If name is provided, we use it. If not, we might want to fetch it.
  // But the current logic requires name.
  // We should relax the name requirement if we can fetch it.
  // However, the user said "when the instrument is not found... create a new one".
  // The user flow implies we might have a name from the statement (e.g. "Unknown Instrument...").
  // Let's keep the name requirement for now but allow enrichment to overwrite/augment if the type is unknown.

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Name is required and must be a string' });
    return;
  }

  try {
    // Check if instrument already exists
    const snapshot = await getInstrumentsRef().where('cusip', '==', cusip).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      if (!doc) {
        res.status(500).json({ error: 'Internal server error: Document found but undefined' });
        return;
      }
      res.json({
        id: doc.id,
        ...doc.data()
      });
      return;
    }

    // Enrich with Quote Provider if type is unknown or missing
    let enrichedData: any = {};
    let instrumentName = name;

    if (!type || type === 'unknown' || type === InstrumentType.Unknown) {
      try {
        const quote = await getQuoteProvider().getInstrumentByCusip(cusip);
        if (quote) {
          enrichedData = {
            ...quote,
            // We prefer the provider's name if available and better than "Unknown..."
            // But for now let's just use what we got if it's valid
          };
          if (quote.name) {
            instrumentName = quote.name;
          }
        }
      } catch (err) {
        logger.warn(`Failed to enrich instrument ${cusip}:`, err);
      }
    }

    // Enrich with AI Provider for Sector
    // We do this if we have a valid name (either provided or enriched)
    if (instrumentName && instrumentName !== 'Unknown Instrument') {
      try {
        const sector = await getAiProvider().getSector(instrumentName);
        if (sector) {
          enrichedData.sector = sector;
        }
      } catch (err) {
        logger.warn(`Failed to categorize sector for ${instrumentName}:`, err);
      }
    }

    // Create new instrument
    const newInstrument = {
      cusip,
      name,
      type: type || 'unknown', // Default to unknown if not provided
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...enrichedData, // Override with enriched data (e.g. type, ticker, better name, sector)
    };

    const docRef = await getInstrumentsRef().add(newInstrument);

    res.status(201).json({
      id: docRef.id,
      ...newInstrument
    });
  } catch (error) {
    logger.error('Error creating instrument:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
