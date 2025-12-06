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
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import instrumentRoutes from './routes/instruments';
import instituteRoutes from './routes/institutes';
import analyticsRoutes from './routes/analytics';
import currencyRoutes from './routes/currencies';

// Server entry point (restarted)
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the FinApp server!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`Alpaca API Key ID: ${process.env.APCA_API_KEY_ID}`);
  console.log(`Alpaca API Secret Key: ${process.env.APCA_API_SECRET_KEY}`);
});
