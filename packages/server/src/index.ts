import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the FinApp server!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
