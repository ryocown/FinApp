import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors';
import { logger } from '../logger';

/**
 * Global error handler middleware.
 * Catches ApiError instances and formats them consistently.
 * Also handles unexpected errors gracefully.
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Log all errors
    logger.error(`Error handling ${req.method} ${req.url}:`, err);

    // Handle ApiError instances
    if (err instanceof ApiError) {
        res.status(err.statusCode).json(err.toJSON());
        return;
    }

    // Handle validation errors from Zod (via validate middleware)
    if (err.name === 'ZodError') {
        res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: (err as any).errors || err.message
        });
        return;
    }

    // Handle unexpected errors
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        code: 'INTERNAL_ERROR'
    });
}
