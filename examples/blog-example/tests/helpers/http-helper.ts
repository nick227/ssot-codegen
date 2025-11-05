/**
 * HTTP Test Helpers
 * Utilities for making authenticated requests and common assertions
 */

import request from 'supertest'
import type { Express } from 'express'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/**
 * Create authenticated request helper
 */
export function createAuthRequest(app: Express, token: string) {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
  }
}

/**
 * Register a test user and return tokens
 */
export async function registerTestUser(
  app: Express,
  userData: { email: string; password: string; name?: string }
): Promise<{ user: { id: number; email: string }; tokens: AuthTokens }> {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData)
    .expect(201)

  return {
    user: response.body.user,
    tokens: {
      accessToken: response.body.accessToken,
      refreshToken: response.body.refreshToken
    }
  }
}

/**
 * Login and return tokens
 */
export async function loginUser(
  app: Express,
  credentials: { email: string; password: string }
): Promise<AuthTokens> {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials)
    .expect(200)

  return {
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken
  }
}

/**
 * Common assertion helpers
 */
export const assertions = {
  hasPagedResponse: (body: unknown) => {
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('meta')
    expect(Array.isArray((body as { data: unknown }).data)).toBe(true)
  },

  hasErrorResponse: (body: unknown) => {
    expect(body).toHaveProperty('error')
    expect(typeof (body as { error: unknown }).error).toBe('string')
  },

  hasPagination: (meta: unknown) => {
    expect(meta).toHaveProperty('total')
    expect(meta).toHaveProperty('take')
    expect(meta).toHaveProperty('skip')
  },

  isValidTimestamp: (timestamp: string) => {
    const date = new Date(timestamp)
    expect(date.toString()).not.toBe('Invalid Date')
    expect(date.getTime()).toBeGreaterThan(0)
  }
}

/**
 * Wait for async operations (useful for webhooks, jobs, etc.)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a request until it succeeds or max attempts reached
 */
export async function retryRequest(
  requestFn: () => Promise<{ status: number }>,
  maxAttempts = 3,
  delayMs = 100
): Promise<{ status: number }> {
  let lastError: Error | null = null

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await requestFn()
      if (response.status < 500) {
        return response
      }
    } catch (error) {
      lastError = error as Error
    }

    if (i < maxAttempts - 1) {
      await wait(delayMs)
    }
  }

  throw lastError || new Error('Request failed after max attempts')
}

