/**
 * Auth Interceptor Tests - Comprehensive
 */

import { describe, it, expect, vi } from 'vitest'
import {
  createAuthInterceptor,
  createRefreshHandler,
  type AuthConfig
} from './auth-interceptor.js'

describe('Auth Interceptor', () => {
  describe('createAuthInterceptor', () => {
    it('should add Bearer token to Authorization header', async () => {
      const authConfig: AuthConfig = {
        token: 'test-token-123'
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({})

      expect(init.headers).toEqual({
        'Authorization': 'Bearer test-token-123'
      })
    })

    it('should handle token function', async () => {
      const tokenFn = vi.fn(() => 'dynamic-token')
      const authConfig: AuthConfig = {
        token: tokenFn
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({})

      expect(tokenFn).toHaveBeenCalled()
      expect(init.headers).toEqual({
        'Authorization': 'Bearer dynamic-token'
      })
    })

    it('should handle async token function', async () => {
      const asyncTokenFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'async-token'
      })

      const authConfig: AuthConfig = {
        token: asyncTokenFn
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({})

      expect(asyncTokenFn).toHaveBeenCalled()
      expect(init.headers).toEqual({
        'Authorization': 'Bearer async-token'
      })
    })

    it('should use custom header name', async () => {
      const authConfig: AuthConfig = {
        token: 'test-token',
        header: 'X-API-Token'
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({})

      expect(init.headers).toEqual({
        'X-API-Token': 'Bearer test-token'
      })
    })

    it('should use custom auth scheme', async () => {
      const authConfig: AuthConfig = {
        token: 'test-token',
        scheme: 'Token'
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({})

      expect(init.headers).toEqual({
        'Authorization': 'Token test-token'
      })
    })

    it('should use custom header and scheme', async () => {
      const authConfig: AuthConfig = {
        token: 'test-token',
        header: 'X-API-Key',
        scheme: 'ApiKey'
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({})

      expect(init.headers).toEqual({
        'X-API-Key': 'ApiKey test-token'
      })
    })

    it('should preserve existing headers', async () => {
      const authConfig: AuthConfig = {
        token: 'test-token'
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': 'req-123'
        }
      })

      expect(init.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Request-ID': 'req-123',
        'Authorization': 'Bearer test-token'
      })
    })

    it('should return original init when no token', async () => {
      const authConfig: AuthConfig = {}

      const interceptor = createAuthInterceptor(authConfig)
      const original = { method: 'GET' }
      const init = await interceptor(original)

      expect(init).toBe(original)
    })

    it('should return original init when token function returns undefined', async () => {
      const authConfig: AuthConfig = {
        token: () => undefined as any
      }

      const interceptor = createAuthInterceptor(authConfig)
      const original = { method: 'GET' }
      const init = await interceptor(original)

      expect(init).toBe(original)
    })

    it('should return original init when async token function returns undefined', async () => {
      const authConfig: AuthConfig = {
        token: async () => undefined as any
      }

      const interceptor = createAuthInterceptor(authConfig)
      const original = { method: 'GET' }
      const init = await interceptor(original)

      expect(init).toBe(original)
    })

    it('should handle empty string token', async () => {
      const authConfig: AuthConfig = {
        token: ''
      }

      const interceptor = createAuthInterceptor(authConfig)
      const original = { method: 'GET' }
      const init = await interceptor(original)

      expect(init).toBe(original)
    })

    it('should preserve all RequestInit properties', async () => {
      const authConfig: AuthConfig = {
        token: 'test-token'
      }

      const interceptor = createAuthInterceptor(authConfig)
      const original: RequestInit = {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        signal: new AbortController().signal
      }

      const init = await interceptor(original)

      expect(init.method).toBe('POST')
      expect(init.body).toBe(original.body)
      expect(init.signal).toBe(original.signal)
    })
  })

  describe('createRefreshHandler', () => {
    it('should return false for non-401 errors', async () => {
      const authConfig: AuthConfig = {
        refreshToken: 'refresh-token',
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      const result = await handler({ status: 404 })

      expect(result).toBe(false)
    })

    it('should return false for 401 without refresh token', async () => {
      const authConfig: AuthConfig = {
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      const result = await handler({ status: 401 })

      expect(result).toBe(false)
    })

    it('should return false for 401 without onRefresh callback', async () => {
      const authConfig: AuthConfig = {
        refreshToken: 'refresh-token'
      }

      const handler = createRefreshHandler(authConfig)
      const result = await handler({ status: 401 })

      expect(result).toBe(false)
    })

    it('should return false when refresh token function returns undefined', async () => {
      const authConfig: AuthConfig = {
        refreshToken: () => undefined as any,
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      const result = await handler({ status: 401 })

      expect(result).toBe(false)
    })

    it('should handle string refresh token', async () => {
      const authConfig: AuthConfig = {
        refreshToken: 'refresh-token-123',
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      const result = await handler({ status: 401 })

      // Currently returns false (TODO in implementation)
      expect(result).toBe(false)
    })

    it('should handle refresh token function', async () => {
      const refreshFn = vi.fn(() => 'fresh-token')
      const authConfig: AuthConfig = {
        refreshToken: refreshFn,
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      await handler({ status: 401 })

      expect(refreshFn).toHaveBeenCalled()
    })

    it('should handle async refresh token function', async () => {
      const asyncRefreshFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'async-fresh-token'
      })

      const authConfig: AuthConfig = {
        refreshToken: asyncRefreshFn,
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      await handler({ status: 401 })

      expect(asyncRefreshFn).toHaveBeenCalled()
    })

    it('should return false on null error', async () => {
      const authConfig: AuthConfig = {
        refreshToken: 'refresh-token',
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      const result = await handler(null)

      expect(result).toBe(false)
    })

    it('should return false on undefined error', async () => {
      const authConfig: AuthConfig = {
        refreshToken: 'refresh-token',
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      const result = await handler(undefined)

      expect(result).toBe(false)
    })

    it('should handle errors during refresh', async () => {
      const authConfig: AuthConfig = {
        refreshToken: () => { throw new Error('Token retrieval failed') },
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      const result = await handler({ status: 401 })

      expect(result).toBe(false)
    })

    it('should handle async errors during refresh', async () => {
      const authConfig: AuthConfig = {
        refreshToken: async () => {
          throw new Error('Async token retrieval failed')
        },
        onRefresh: vi.fn()
      }

      const handler = createRefreshHandler(authConfig)
      const result = await handler({ status: 401 })

      expect(result).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long token', async () => {
      const longToken = 'a'.repeat(1000)
      const authConfig: AuthConfig = {
        token: longToken
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({})

      expect(init.headers).toEqual({
        'Authorization': `Bearer ${longToken}`
      })
    })

    it('should handle token with special characters', async () => {
      const specialToken = 'token-with-special!@#$%^&*()chars'
      const authConfig: AuthConfig = {
        token: specialToken
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({})

      expect(init.headers).toEqual({
        'Authorization': `Bearer ${specialToken}`
      })
    })

    it('should handle token with spaces', async () => {
      const spaceToken = 'token with spaces'
      const authConfig: AuthConfig = {
        token: spaceToken
      }

      const interceptor = createAuthInterceptor(authConfig)
      const init = await interceptor({})

      expect(init.headers).toEqual({
        'Authorization': `Bearer ${spaceToken}`
      })
    })

    it('should handle multiple simultaneous calls', async () => {
      let callCount = 0
      const tokenFn = vi.fn(() => `token-${++callCount}`)
      const authConfig: AuthConfig = {
        token: tokenFn
      }

      const interceptor = createAuthInterceptor(authConfig)
      
      const results = await Promise.all([
        interceptor({}),
        interceptor({}),
        interceptor({})
      ])

      expect(tokenFn).toHaveBeenCalledTimes(3)
      expect(results[0].headers).toEqual({ 'Authorization': 'Bearer token-1' })
      expect(results[1].headers).toEqual({ 'Authorization': 'Bearer token-2' })
      expect(results[2].headers).toEqual({ 'Authorization': 'Bearer token-3' })
    })
  })
})

