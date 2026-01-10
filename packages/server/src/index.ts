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
