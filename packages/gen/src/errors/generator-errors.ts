/**
 * Generator Error Classes
 * 
 * Typed errors for better error handling and debugging
 */

export class GeneratorError extends Error {
  constructor(
    message: string,
    public readonly phase?: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'GeneratorError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class PhaseError extends GeneratorError {
  constructor(phase: string, cause: Error) {
    super(
      `Phase '${phase}' failed: ${cause.message}`,
      phase,
      { cause }
    )
    this.name = 'PhaseError'
    
    // Preserve original stack trace
    if (cause.stack) {
      this.stack = `${this.stack}\n\nCaused by:\n${cause.stack}`
    }
  }
}

export class ConfigValidationError extends GeneratorError {
  constructor(message: string, invalidFields?: string[]) {
    super(
      message,
      undefined,
      { invalidFields }
    )
    this.name = 'ConfigValidationError'
  }
}

export class SchemaValidationError extends GeneratorError {
  constructor(message: string, schemaPath?: string) {
    super(
      message,
      'parseSchema',
      { schemaPath }
    )
    this.name = 'SchemaValidationError'
  }
}

