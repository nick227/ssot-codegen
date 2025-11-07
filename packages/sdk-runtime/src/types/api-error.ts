/**
 * API error types
 */

export interface APIError {
  error: string
  message?: string
  details?: Record<string, unknown>[]
  status: number
}

export class APIException extends Error {
  constructor(
    public readonly error: APIError,
    message?: string
  ) {
    super(message || error.message || error.error)
    this.name = 'APIException'
  }
  
  get status(): number {
    return this.error.status
  }
  
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }
  
  get isServerError(): boolean {
    return this.status >= 500
  }
  
  get isUnauthorized(): boolean {
    return this.status === 401
  }
  
  get isForbidden(): boolean {
    return this.status === 403
  }
  
  get isNotFound(): boolean {
    return this.status === 404
  }
  
  get isValidationError(): boolean {
    return this.status === 400 && this.error.error === 'Validation Error'
  }
}

