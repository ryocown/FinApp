import { type Request, type Response, type NextFunction } from 'express';
import { type ZodObject, ZodError } from 'zod';

export const validate = (schema: ZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.issues,
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
