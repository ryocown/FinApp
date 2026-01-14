import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import cors from 'cors';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';
import instrumentRoutes from './routes/instruments.js';
import instituteRoutes from './routes/institutes.js';
import analyticsRoutes from './routes/analytics.js';
import currencyRoutes from './routes/currencies.js';
import userRoutes from './routes/users.js';
import metadataRoutes from './routes/metadata.js';
import { logger } from './logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { db } from './firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

// Server entry point (restarted)
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/metadata', metadataRoutes);

// Temporary Migration Route


app.post('/api/migrations/remove-account-balance', async (req, res, next) => {
  try {
    logger.info('Starting migration: Removing balance/balanceDate from Account documents...');
    const usersSnap = await db.collection('users').get();
    let updatedCount = 0;

    for (const userDoc of usersSnap.docs) {
      const institutesSnap = await userDoc.ref.collection('institutes').get();
      for (const instituteDoc of institutesSnap.docs) {
        const accountsSnap = await instituteDoc.ref.collection('accounts').get();
        const batch = db.batch();
        let batchCount = 0;

        for (const accountDoc of accountsSnap.docs) {
          const data = accountDoc.data();
          if (data.balance !== undefined || data.balanceDate !== undefined) {
            batch.update(accountDoc.ref, {
              balance: FieldValue.delete(),
              balanceDate: FieldValue.delete()
            });
            updatedCount++;
            batchCount++;
          }
        }
        if (batchCount > 0) {
          await batch.commit();
        }
      }
    }
    logger.info(`Migration complete. Updated ${updatedCount} accounts.`);
    res.json({ success: true, updatedCount });
  } catch (err) {
    next(err);
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the FinApp server!');
});

// Global error handler (must be after all routes)
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
  logger.info(`FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  logger.info(`FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
  logger.info(`Alpaca API Key ID: ${process.env.APCA_API_KEY_ID ? 'Set' : 'Not Set'}`);
  logger.info(`Alpaca API Secret Key: ${process.env.APCA_API_SECRET_KEY ? 'Set' : 'Not Set'}`);
});
