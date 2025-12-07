/**
 * Custom API error class for standardized error responses.
 * Provides structured error handling across all routes.
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: ErrorCode;
    public readonly details?: Record<string, unknown>;

    constructor(
        message: string,
        statusCode: number = 500,
        code: ErrorCode = ErrorCode.INTERNAL_ERROR,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        if (details !== undefined) {
            this.details = details;
        }

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Creates a 400 Bad Request error
     */
    static badRequest(message: string, details?: Record<string, unknown>): ApiError {
        return new ApiError(message, 400, ErrorCode.BAD_REQUEST, details);
    }

    /**
     * Creates a 401 Unauthorized error
     */
    static unauthorized(message: string = 'Unauthorized'): ApiError {
        return new ApiError(message, 401, ErrorCode.UNAUTHORIZED);
    }

    /**
     * Creates a 403 Forbidden error
     */
    static forbidden(message: string = 'Forbidden'): ApiError {
        return new ApiError(message, 403, ErrorCode.FORBIDDEN);
    }

    /**
     * Creates a 404 Not Found error
     */
    static notFound(resource: string): ApiError {
        return new ApiError(`${resource} not found`, 404, ErrorCode.NOT_FOUND);
    }

    /**
     * Creates a 409 Conflict error
     */
    static conflict(message: string): ApiError {
        return new ApiError(message, 409, ErrorCode.CONFLICT);
    }

    /**
     * Creates a 422 Validation error
     */
    static validation(message: string, details?: Record<string, unknown>): ApiError {
        return new ApiError(message, 422, ErrorCode.VALIDATION_ERROR, details);
    }

    /**
     * Creates a 500 Internal Server error
     */
    static internal(message: string = 'Internal server error'): ApiError {
        return new ApiError(message, 500, ErrorCode.INTERNAL_ERROR);
    }

    /**
     * Converts the error to a JSON response object
     */
    toJSON(): { error: string; code: ErrorCode; details?: Record<string, unknown> } {
        return {
            error: this.message,
            code: this.code,
            ...(this.details && { details: this.details })
        };
    }
}

/**
 * Error codes for consistent error identification
 */
export enum ErrorCode {
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INTERNAL_ERROR = 'INTERNAL_ERROR'
}
