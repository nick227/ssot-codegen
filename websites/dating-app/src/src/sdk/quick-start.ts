// @generated
// Quick Start - Get started in 30 seconds

import { createSDK } from './index.js'

/**
 * Create SDK with minimal config
 * 
 * @example
 * ```typescript
 * import { quickSDK } from './gen/sdk'
 * 
 * const api = quickSDK('http://localhost:3000')
 * const records = await api.post.list()
 * ```
 */
export function quickSDK(baseUrl: string) {
  return createSDK({ baseUrl })
}

/**
 * Create SDK with auth token
 * 
 * @example
 * ```typescript
 * import { quickSDKWithAuth } from './gen/sdk'
 * 
 * const api = quickSDKWithAuth('http://localhost:3000', myToken)
 * const records = await api.post.create({ ... })
 * ```
 */
export function quickSDKWithAuth(baseUrl: string, token: string) {
  return createSDK({
    baseUrl,
    auth: { token }
  })
}

/**
 * Create SDK with dynamic token (for browsers)
 * 
 * @example
 * ```typescript
 * import { quickSDKBrowser } from './gen/sdk'
 * 
 * const api = quickSDKBrowser('http://localhost:3000', {
 *   getToken: () => localStorage.getItem('token'),
 *   setToken: (token) => localStorage.setItem('token', token)
 * })
 * ```
 */
export function quickSDKBrowser(
  baseUrl: string, 
  storage: { 
    getToken: () => string | null,
    setToken: (token: string) => void 
  }
) {
  return createSDK({
    baseUrl,
    auth: {
      token: () => storage.getToken() || '',
      onRefresh: storage.setToken
    }
  })
}

// Re-export for convenience
export { createSDK } from './index.js'
export type { SDK, SDKConfig } from './index.js'
