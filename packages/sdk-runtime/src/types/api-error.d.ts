/**
 * API error types
 */
export interface APIError {
    error: string;
    message?: string;
    details?: any[];
    status: number;
}
export declare class APIException extends Error {
    readonly error: APIError;
    constructor(error: APIError, message?: string);
    get status(): number;
    get isClientError(): boolean;
    get isServerError(): boolean;
    get isUnauthorized(): boolean;
    get isForbidden(): boolean;
    get isNotFound(): boolean;
    get isValidationError(): boolean;
}
