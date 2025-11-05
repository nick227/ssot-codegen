/**
 * API error types
 */
export class APIException extends Error {
    error;
    constructor(error, message) {
        super(message || error.message || error.error);
        this.error = error;
        this.name = 'APIException';
    }
    get status() {
        return this.error.status;
    }
    get isClientError() {
        return this.status >= 400 && this.status < 500;
    }
    get isServerError() {
        return this.status >= 500;
    }
    get isUnauthorized() {
        return this.status === 401;
    }
    get isForbidden() {
        return this.status === 403;
    }
    get isNotFound() {
        return this.status === 404;
    }
    get isValidationError() {
        return this.status === 400 && this.error.error === 'Validation Error';
    }
}
