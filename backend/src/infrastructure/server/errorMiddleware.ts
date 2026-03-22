import { Request, Response, NextFunction } from 'express';
import {
    DomainError,
    NotFoundError,
    ValidationError,
    InsufficientBalanceError,
    InvalidPoolError,
} from '../../shared/errors';

export function errorMiddleware(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
    }
    if (
        err instanceof ValidationError ||
        err instanceof InsufficientBalanceError ||
        err instanceof InvalidPoolError
    ) {
        res.status(400).json({ error: err.message });
        return;
    }
    if (err instanceof DomainError) {
        res.status(422).json({ error: err.message });
        return;
    }

    // Unexpected errors — don't leak stack traces in production
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : String(err),
    });
}
