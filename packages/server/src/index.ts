import express, { type Request, type Response } from 'express';
import cors from 'cors';
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the FinApp server!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
