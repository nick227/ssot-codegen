/**
 * Base API Client Tests - Comprehensive
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BaseAPIClient, type BaseClientConfig, type RequestConfig } from './base-client.js'
import { APIException } from '../types/api-error.js'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('BaseAPIClient', () => {
  let client: BaseAPIClient
  let config: BaseClientConfig

  beforeEach(() => {
    config = {
      baseUrl: 'https://api.example.com'
    }
    client = new BaseAPIClient(config)
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Constructor and Configuration', () => {
    it('should create client with base URL', () => {
      expect(client).toBeInstanceOf(BaseAPIClient)
    })

    it('should accept full configuration', () => {
      const fullConfig: BaseClientConfig = {
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        retries: 5,
        headers: { 'X-API-Key': 'test-key' }
      }

      const fullClient = new BaseAPIClient(fullConfig)
      expect(fullClient).toBeInstanceOf(BaseAPIClient)
    })
  })

  describe('GET Requests', () => {
    it('should make GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 1, name: 'Test' })
      })

      const response = await client.get('/users/1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({ method: 'GET' })
      )
      expect(response.data).toEqual({ id: 1, name: 'Test' })
      expect(response.status).toBe(200)
    })

    it('should include configured headers', async () => {
      client = new BaseAPIClient({
        baseUrl: 'https://api.example.com',
        headers: { 'Authorization': 'Bearer token123' }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      })

      await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token123'
          })
        })
      )
    })

    it('should merge request-specific headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      })

      await client.get('/test', {
        headers: { 'X-Request-ID': 'req-123' }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Request-ID': 'req-123'
          })
        })
      )
    })
  })

  describe('POST Requests', () => {
    it('should make POST request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 1, name: 'New User' })
      })

      const body = { name: 'New User', email: 'user@example.com' }
      const response = await client.post('/users', body)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(body)
        })
      )
      expect(response.data).toEqual({ id: 1, name: 'New User' })
      expect(response.status).toBe(201)
    })

    it('should handle POST without body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true })
      })

      await client.post('/action')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined
        })
      )
    })
  })

  describe('PUT Requests', () => {
    it('should make PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 1, name: 'Updated' })
      })

      const body = { name: 'Updated' }
      const response = await client.put('/users/1', body)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(body)
        })
      )
      expect(response.data).toEqual({ id: 1, name: 'Updated' })
    })
  })

  describe('PATCH Requests', () => {
    it('should make PATCH request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 1, name: 'Patched' })
      })

      const body = { name: 'Patched' }
      const response = await client.patch('/users/1', body)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(body)
        })
      )
      expect(response.data).toEqual({ id: 1, name: 'Patched' })
    })
  })

  describe('DELETE Requests', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: async () => { throw new Error('No content') }
      })

      const response = await client.delete('/users/1')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(response.data).toBeNull()
      expect(response.status).toBe(204)
    })
  })

  describe('Response Parsing', () => {
    it('should parse JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ result: 'success' })
      })

      const response = await client.get('/test')

      expect(response.data).toEqual({ result: 'success' })
    })

    it('should handle 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: async () => { throw new Error('No content') }
      })

      const response = await client.get('/test')

      expect(response.data).toBeNull()
      expect(response.status).toBe(204)
    })

    it('should parse text response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Plain text response'
      })

      const response = await client.get('/test')

      expect(response.data).toBe('Plain text response')
    })

    it('should include response headers', async () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'x-request-id': 'abc123'
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers,
        json: async () => ({})
      })

      const response = await client.get('/test')

      expect(response.headers).toBe(headers)
      expect(response.headers.get('x-request-id')).toBe('abc123')
    })
  })

  describe('Error Handling', () => {
    it('should throw APIException on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'NotFound',
          message: 'Resource not found'
        })
      })

      await expect(client.get('/not-found')).rejects.toThrow(APIException)
    })

    it('should handle error without JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        json: async () => { throw new Error('Not JSON') }
      })

      try {
        await client.get('/error')
      } catch (error) {
        expect(error).toBeInstanceOf(APIException)
        expect((error as APIException).error.message).toBe('Internal Server Error')
      }
    })

    it('should call onError callback', async () => {
      const onError = vi.fn()
      client = new BaseAPIClient({
        ...config,
        onError
      })

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'BadRequest' })
      })

      try {
        await client.get('/bad-request')
      } catch {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'BadRequest',
            status: 400
          })
        )
      }
    })
  })

  describe('Retry Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should retry on server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ error: 'ServerError' })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true })
        })

      const promise = client.get('/retry-test')

      // Wait for first attempt
      await vi.advanceTimersByTimeAsync(0)
      
      // Wait for retry backoff (100ms)
      await vi.advanceTimersByTimeAsync(100)

      const response = await promise

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(response.data).toEqual({ success: true })
    })

    it('should not retry on client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'BadRequest' })
      })

      await expect(client.get('/bad-request')).rejects.toThrow(APIException)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should respect maxRetries configuration', async () => {
      client = new BaseAPIClient({
        ...config,
        retries: 1
      })

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'ServerError' })
      })

      const promise = client.get('/always-fails').catch(err => err)

      // Initial attempt
      await vi.advanceTimersByTimeAsync(0)
      
      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100)

      const error = await promise
      expect(error).toBeInstanceOf(APIException)

      // Should be called: 1 initial + 1 retry = 2 total
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should use exponential backoff', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'ServiceUnavailable' })
      })

      const promise = client.get('/unavailable').catch(err => err)

      // Initial attempt
      await vi.advanceTimersByTimeAsync(0)
      
      // First retry: 100ms
      await vi.advanceTimersByTimeAsync(100)
      
      // Second retry: 200ms
      await vi.advanceTimersByTimeAsync(200)
      
      // Third retry: 400ms
      await vi.advanceTimersByTimeAsync(400)

      const error = await promise
      expect(error).toBeInstanceOf(APIException)

      // 1 initial + 3 retries (default)
      expect(mockFetch).toHaveBeenCalledTimes(4)
    })

    it('should not retry on abort', async () => {
      const controller = new AbortController()

      mockFetch.mockImplementationOnce(() => {
        throw new DOMException('Aborted', 'AbortError')
      })

      await expect(
        client.get('/test', { signal: controller.signal })
      ).rejects.toThrow(DOMException)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Request Interceptors', () => {
    it('should apply onRequest interceptor', async () => {
      const onRequest = vi.fn((init: RequestInit) => ({
        ...init,
        headers: {
          ...init.headers,
          'X-Custom-Header': 'custom-value'
        }
      }))

      client = new BaseAPIClient({
        ...config,
        onRequest
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      })

      await client.get('/test')

      expect(onRequest).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value'
          })
        })
      )
    })

    it('should apply async onRequest interceptor', async () => {
      const onRequest = vi.fn(async (init: RequestInit) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return {
          ...init,
          headers: {
            ...init.headers,
            'X-Async-Header': 'async-value'
          }
        }
      })

      client = new BaseAPIClient({
        ...config,
        onRequest
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      })

      await client.get('/test')

      expect(onRequest).toHaveBeenCalled()
    })
  })

  describe('Response Interceptors', () => {
    it('should apply onResponse interceptor', async () => {
      const onResponse = vi.fn((res: Response) => res)

      client = new BaseAPIClient({
        ...config,
        onResponse
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'test' })
      })

      await client.get('/test')

      expect(onResponse).toHaveBeenCalled()
    })

    it('should allow modifying response in interceptor', async () => {
      const modifiedResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ modified: true })
      }

      const onResponse = vi.fn(() => modifiedResponse)

      client = new BaseAPIClient({
        ...config,
        onResponse
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ original: true })
      })

      const response = await client.get('/test')

      expect(response.data).toEqual({ modified: true })
    })
  })

  describe('Timeout Handling', () => {
    it('should apply default timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      })

      await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      )
    })

    it('should use configured timeout', async () => {
      client = new BaseAPIClient({
        ...config,
        timeout: 5000
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      })

      await client.get('/test')

      expect(mockFetch).toHaveBeenCalled()
    })

    it('should use request-specific signal', async () => {
      const controller = new AbortController()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({})
      })

      await client.get('/test', { signal: controller.signal })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: controller.signal
        })
      )
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => null
      })

      const response = await client.get('/empty')

      expect(response.data).toBeNull()
    })

    it('should handle network errors after retries', async () => {
      // Network errors will be retried
      mockFetch.mockRejectedValue(new TypeError('Network error'))

      const promise = client.get('/network-error').catch(err => err)

      // Run through all retry attempts
      for (let i = 0; i < 4; i++) {
        await vi.advanceTimersByTimeAsync(Math.pow(2, i) * 100)
      }

      const error = await promise
      expect(error).toBeInstanceOf(TypeError)
    })

    it('should handle malformed JSON after retries', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => { throw new SyntaxError('Malformed JSON') }
      })

      const promise = client.get('/malformed').catch(err => err)

      // Run through all retry attempts
      for (let i = 0; i < 4; i++) {
        await vi.advanceTimersByTimeAsync(Math.pow(2, i) * 100)
      }

      const error = await promise
      expect(error).toBeInstanceOf(SyntaxError)
    })
  })
})

