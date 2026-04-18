// @generated
// React Query + SDK Context provider

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { createSDK, type SDKConfig, type SDK } from '../index'

/**
 * Default QueryClient configuration
 * Configurable via SDKProvider props
 */
export const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      retry: 1,
    },
  },
})

/**
 * SDK Context - Provides configured SDK instance to hooks
 */
const SDKContext = createContext<SDK | null>(null)

/**
 * useSDK hook - Access the configured SDK instance
 * 
 * @example
 * ```typescript
 * import { useSDK } from './gen/sdk/react'
 * 
 * function MyComponent() {
 *   const api = useSDK()
 *   
 *   const handleClick = () => {
 *     api.post.create({ title: 'Hello' })
 *   }
 *   
 *   return <button onClick={handleClick}>Create</button>
 * }
 * ```
 */
export function useSDK(): SDK {
  const context = useContext(SDKContext)
  if (!context) {
    throw new Error('useSDK must be used within SDKProvider')
  }
  return context
}

export interface SDKProviderProps {
  children: ReactNode
  /** SDK configuration - baseUrl, auth, headers, etc. */
  config: SDKConfig
  /** Custom QueryClient (optional) */
  queryClient?: QueryClient
  /** Query client default options (optional, overrides defaults) */
  queryConfig?: {
    staleTime?: number
    retry?: number | boolean
    refetchOnWindowFocus?: boolean
  }
  /** Show React Query DevTools (default: development only) */
  showDevtools?: boolean
}

/**
 * SDK Provider - Wraps app with React Query + SDK Context
 * 
 * Provides both React Query client and configured SDK instance to all hooks.
 * 
 * @example Basic
 * ```typescript
 * import { SDKProvider } from './gen/sdk/react'
 * 
 * function App() {
 *   return (
 *     <SDKProvider config={{ baseUrl: 'http://localhost:3000' }}>
 *       <YourApp />
 *     </SDKProvider>
 *   )
 * }
 * ```
 * 
 * @example With Auth
 * ```typescript
 * <SDKProvider 
 *   config={{ 
 *     baseUrl: import.meta.env.VITE_API_URL,
 *     auth: {
 *       token: () => localStorage.getItem('token'),
 *       onRefresh: (token) => localStorage.setItem('token', token)
 *     }
 *   }}
 * >
 *   <YourApp />
 * </SDKProvider>
 * ```
 * 
 * @example Custom Query Settings
 * ```typescript
 * <SDKProvider 
 *   config={{ baseUrl: 'http://localhost:3000' }}
 *   queryConfig={{
 *     staleTime: 1000 * 60 * 10,  // 10 minutes
 *     retry: 3,
 *     refetchOnWindowFocus: false
 *   }}
 * >
 *   <YourApp />
 * </SDKProvider>
 * ```
 */
export function SDKProvider({ 
  children,
  config,
  queryClient,
  queryConfig,
  showDevtools = process.env.NODE_ENV === 'development'
}: SDKProviderProps) {
  // Create SDK instance (memoized by config) with environment-aware defaults
  const sdk = useMemo(() => createSDK({
    ...config,
    baseUrl: config.baseUrl || getDefaultBaseUrl()
  }), [
    config.baseUrl,
    config.timeout,
    config.retries,
    config.auth
  ])
  
  // Create or use provided QueryClient
  const client = useMemo(() => {
    if (queryClient) return queryClient
    
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: queryConfig?.staleTime ?? 1000 * 60 * 5,
          retry: queryConfig?.retry ?? 1,
          refetchOnWindowFocus: queryConfig?.refetchOnWindowFocus ?? true,
        },
      },
    })
  }, [queryClient, queryConfig])
  
  return (
    <SDKContext.Provider value={sdk}>
      <QueryClientProvider client={client}>
        {children}
        {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </SDKContext.Provider>
  )
}
