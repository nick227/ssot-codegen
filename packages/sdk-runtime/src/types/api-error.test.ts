/**
 * API Error Tests - Comprehensive
 */

import { describe, it, expect } from 'vitest'
import { APIException, type APIError } from './api-error.js'

describe('APIError Types', () => {
  describe('APIError Interface', () => {
    it('should define complete error structure', () => {
      const error: APIError = {
        error: 'TestError',
        message: 'Test message',
        details: [{ field: 'name', message: 'Required' }],
        status: 400
      }

      expect(error.error).toBe('TestError')
      expect(error.message).toBe('Test message')
      expect(error.details).toHaveLength(1)
      expect(error.status).toBe(400)
    })

    it('should allow minimal error structure', () => {
      const error: APIError = {
        error: 'MinimalError',
        status: 500
      }

      expect(error.error).toBe('MinimalError')
      expect(error.message).toBeUndefined()
      expect(error.details).toBeUndefined()
      expect(error.status).toBe(500)
    })
  })

  describe('APIException', () => {
    it('should create exception from APIError', () => {
      const apiError: APIError = {
        error: 'NotFound',
        message: 'Resource not found',
        status: 404
      }

      const exception = new APIException(apiError)

      expect(exception).toBeInstanceOf(Error)
      expect(exception).toBeInstanceOf(APIException)
      expect(exception.name).toBe('APIException')
      expect(exception.message).toBe('Resource not found')
      expect(exception.error).toEqual(apiError)
    })

    it('should use custom message', () => {
      const apiError: APIError = {
        error: 'Error',
        message: 'Original message',
        status: 500
      }

      const exception = new APIException(apiError, 'Custom message')

      expect(exception.message).toBe('Custom message')
    })

    it('should fallback to error.message', () => {
      const apiError: APIError = {
        error: 'Error',
        message: 'Error message',
        status: 500
      }

      const exception = new APIException(apiError)

      expect(exception.message).toBe('Error message')
    })

    it('should fallback to error.error', () => {
      const apiError: APIError = {
        error: 'ErrorCode',
        status: 500
      }

      const exception = new APIException(apiError)

      expect(exception.message).toBe('ErrorCode')
    })

    it('should expose status property', () => {
      const apiError: APIError = {
        error: 'Error',
        status: 422
      }

      const exception = new APIException(apiError)

      expect(exception.status).toBe(422)
    })
  })

  describe('Error Type Helpers', () => {
    it('should detect client errors (4xx)', () => {
      const errors = [400, 401, 403, 404, 422, 429].map(status =>
        new APIException({ error: 'Error', status })
      )

      errors.forEach(err => {
        expect(err.isClientError).toBe(true)
        expect(err.isServerError).toBe(false)
      })
    })

    it('should detect server errors (5xx)', () => {
      const errors = [500, 502, 503, 504].map(status =>
        new APIException({ error: 'Error', status })
      )

      errors.forEach(err => {
        expect(err.isServerError).toBe(true)
        expect(err.isClientError).toBe(false)
      })
    })

    it('should detect unauthorized (401)', () => {
      const exception = new APIException({ error: 'Unauthorized', status: 401 })

      expect(exception.isUnauthorized).toBe(true)
      expect(exception.isForbidden).toBe(false)
      expect(exception.isNotFound).toBe(false)
    })

    it('should detect forbidden (403)', () => {
      const exception = new APIException({ error: 'Forbidden', status: 403 })

      expect(exception.isForbidden).toBe(true)
      expect(exception.isUnauthorized).toBe(false)
      expect(exception.isNotFound).toBe(false)
    })

    it('should detect not found (404)', () => {
      const exception = new APIException({ error: 'Not Found', status: 404 })

      expect(exception.isNotFound).toBe(true)
      expect(exception.isUnauthorized).toBe(false)
      expect(exception.isForbidden).toBe(false)
    })

    it('should detect validation error', () => {
      const exception = new APIException({
        error: 'Validation Error',
        status: 400,
        details: [{ field: 'email', message: 'Invalid email' }]
      })

      expect(exception.isValidationError).toBe(true)
    })

    it('should not detect validation error with different error string', () => {
      const exception = new APIException({
        error: 'Bad Request',
        status: 400
      })

      expect(exception.isValidationError).toBe(false)
    })

    it('should not detect validation error with different status', () => {
      const exception = new APIException({
        error: 'Validation Error',
        status: 422
      })

      expect(exception.isValidationError).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle 3xx status codes', () => {
      const exception = new APIException({ error: 'Redirect', status: 301 })

      expect(exception.isClientError).toBe(false)
      expect(exception.isServerError).toBe(false)
    })

    it('should handle 2xx status codes', () => {
      const exception = new APIException({ error: 'Success', status: 200 })

      expect(exception.isClientError).toBe(false)
      expect(exception.isServerError).toBe(false)
    })

    it('should handle error details array', () => {
      const exception = new APIException({
        error: 'Validation Error',
        status: 400,
        details: [
          { field: 'name', message: 'Required' },
          { field: 'email', message: 'Invalid format' }
        ]
      })

      expect(exception.error.details).toHaveLength(2)
      expect(exception.error.details?.[0].field).toBe('name')
      expect(exception.error.details?.[1].field).toBe('email')
    })

    it('should handle empty error details', () => {
      const exception = new APIException({
        error: 'Error',
        status: 400,
        details: []
      })

      expect(exception.error.details).toEqual([])
    })
  })
})

