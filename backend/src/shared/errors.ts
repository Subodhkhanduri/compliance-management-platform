export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}

export class ValidationError extends DomainError {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends DomainError {
    constructor(resource: string, id: string) {
        super(`${resource} not found: ${id}`);
        this.name = 'NotFoundError';
    }
}

export class InsufficientBalanceError extends DomainError {
    constructor(available: number, requested: number) {
        super(
            `Insufficient balance. Available: ${available.toFixed(2)}, ` +
            `Requested: ${requested.toFixed(2)}`
        );
        this.name = 'InsufficientBalanceError';
    }
}

export class InvalidPoolError extends DomainError {
    constructor(message: string) {
        super(`Invalid pool: ${message}`);
        this.name = 'InvalidPoolError';
    }
}
