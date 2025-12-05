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

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/institutes', instituteRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the FinApp server!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
