# Frontend SDK Integration Review

**Date**: Current  
**Status**: ⚠️ **NEEDS IMPROVEMENTS**

---

## 🔍 Current Architecture Analysis

### SDK Setup Flow
```
main.tsx
  ↓
SDKProvider (config: { baseUrl })
  ↓
SDKContext (useMemo → createSDKInstance)
  ↓
lib/sdk.ts (createSDKInstance → createSDK)
  ↓
Backend SDK (createSDK with BaseAPIClient)
  ↓
HTTP Transport (fetch API)
```

---

## ✅ What's Working Well

### 1. Context Pattern ✅
- ✅ SDKProvider wraps app correctly
- ✅ useSDK() hook provides SDK instance
- ✅ Memoization prevents recreation on every render
- ✅ Centralized configuration

### 2. Hook Abstraction ✅
- ✅ All hooks abstract SDK calls
- ✅ Consistent React Query usage
- ✅ Loading/error states handled
- ✅ Type-safe interfaces

### 3. SDK Features Available ✅
- ✅ SDK supports auth tokens (sync/async)
- ✅ Request/response interceptors available
- ✅ Error handlers available
- ✅ Retry logic built-in
- ✅ Timeout support

---

## ⚠️ Critical Issues

### 1. **SDK Singleton Pattern** ⚠️ **ISSUE**

**Current Code**:
```typescript
// lib/sdk.ts
let sdkInstance: SDK | null = null

export function createSDKInstance(config: SDKConfig): SDK {
  sdkInstance = createSDK(config) // ❌ Always creates new instance
  return sdkInstance
}
```

**Problem**: 
- Always creates new SDK instance, overwriting previous
- No check if config changed
- No reuse of existing instance

**Should be**:
```typescript
let sdkInstance: SDK | null = null
let currentConfig: SDKConfig | null = null

export function createSDKInstance(config: SDKConfig): SDK {
  // Reuse if config hasn't changed
  if (sdkInstance && currentConfig && 
      currentConfig.baseUrl === config.baseUrl) {
    return sdkInstance
  }
  
  sdkInstance = createSDK(config)
  currentConfig = config
  return sdkInstance
}
```

### 2. **Authentication Not Integrated** ⚠️ **CRITICAL**

**Current**: No auth token passed to SDK
```typescript
// SDKContext.tsx
const sdk = useMemo(() => createSDKInstance(config), [config])
// ❌ No auth config
```

**SDK Supports Auth**:
```typescript
// SDK supports this:
createSDK({
  baseUrl: '...',
  auth: {
    token: () => localStorage.getItem('jwt'),
    refreshToken: () => localStorage.getItem('refreshToken'),
    onRefresh: (newToken) => localStorage.setItem('jwt', newToken),
  }
})
```

**Should integrate**:
```typescript
const auth = useAuth()
const sdk = useMemo(() => createSDKInstance({
  baseUrl: config.baseUrl,
  auth: {
    token: () => auth.token,
    refreshToken: () => auth.refreshToken,
    onRefresh: (newToken) => auth.setToken(newToken),
  }
}), [config.baseUrl, auth.token])
```

### 3. **No Error Handling Interceptors** ⚠️ **MISSING**

**Current**: No global error handling
```typescript
// SDK created without error handler
createSDKInstance({ baseUrl })
```

**Should have**:
```typescript
createSDKInstance({
  baseUrl,
  onError: (error) => {
    // Handle 401 (unauthorized) - redirect to login
    if (error.status === 401) {
      auth.logout()
      window.location.href = '/login'
    }
    // Handle 403 (forbidden) - show error
    if (error.status === 403) {
      toast.error('You do not have permission')
    }
    // Log other errors
    console.error('API Error:', error)
  }
})
```

### 4. **No Request/Response Logging** ⚠️ **MISSING**

**Current**: No interceptors for debugging
```typescript
// No logging configured
```

**Should have**:
```typescript
createSDKInstance({
  baseUrl,
  onRequest: (init) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('→', init.method, init.url)
    }
    return init
  },
  onResponse: (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('←', response.status, response.url)
    }
    return response
  }
})
```

### 5. **No Retry Configuration** ⚠️ **MISSING**

**Current**: Uses SDK defaults
```typescript
// No retry config
```

**Should configure**:
```typescript
createSDKInstance({
  baseUrl,
  retries: 3, // Retry failed requests 3 times
  timeout: 30000, // 30 second timeout
})
```

### 6. **No WebSocket Transport** ⚠️ **MISSING**

**Current**: HTTP-only
```typescript
// Only HTTP transport used
```

**SDK Runtime Supports**:
- `HTTPTransport` (current)
- `WebSocketTransport` (available)
- `HybridDataClient` (HTTP + WebSocket)

**Should add**:
```typescript
import { HybridDataClient, HTTPTransport, WebSocketTransport } from '@ssot-codegen/sdk-runtime'

const httpTransport = new HTTPTransport(baseClient, '/api')
const wsTransport = new WebSocketTransport({
  url: wsUrl,
  reconnect: true,
})

const hybridClient = new HybridDataClient(httpTransport, wsTransport)
```

---

## 📊 Current vs. Optimal

### Current Implementation
```typescript
// lib/sdk.ts
export function createSDKInstance(config: SDKConfig): SDK {
  sdkInstance = createSDK(config) // ❌ Always new
  return sdkInstance
}

// SDKContext.tsx
export function SDKProvider({ config, children }) {
  const sdk = useMemo(() => createSDKInstance(config), [config])
  // ❌ No auth, no error handling, no logging
  return <SDKContext.Provider value={{ sdk }}>{children}</SDKContext.Provider>
}
```

### Optimal Implementation
```typescript
// lib/sdk.ts
let sdkInstance: SDK | null = null
let currentConfig: SDKConfig | null = null

export function createSDKInstance(config: SDKConfig): SDK {
  // ✅ Reuse if config unchanged
  if (sdkInstance && currentConfig?.baseUrl === config.baseUrl) {
    return sdkInstance
  }
  
  sdkInstance = createSDK({
    ...config,
    retries: 3,
    timeout: 30000,
    onRequest: (init) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('→', init.method, init.url)
      }
      return init
    },
    onResponse: (response) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('←', response.status)
      }
      return response
    },
    onError: (error) => {
      // Handle auth errors
      if (error.status === 401) {
        // Redirect to login
      }
      // Log errors
      console.error('API Error:', error)
    }
  })
  
  currentConfig = config
  return sdkInstance
}

// SDKContext.tsx
export function SDKProvider({ config, children }) {
  const auth = useAuth() // Get auth context
  
  const sdk = useMemo(() => {
    return createSDKInstance({
      baseUrl: config.baseUrl,
      auth: {
        token: () => auth.token || null,
        refreshToken: () => auth.refreshToken || null,
        onRefresh: (newToken) => auth.setToken(newToken),
      }
    })
  }, [config.baseUrl, auth.token]) // ✅ Memoized with auth
  
  return <SDKContext.Provider value={{ sdk }}>{children}</SDKContext.Provider>
}
```

---

## 🎯 Recommended Fixes

### Priority 1: Critical (Do Now)

#### 1.1 Fix SDK Singleton Pattern
```typescript
// lib/sdk.ts
let sdkInstance: SDK | null = null
let currentConfig: SDKConfig | null = null

export function createSDKInstance(config: SDKConfig): SDK {
  // Reuse instance if config unchanged
  if (sdkInstance && currentConfig?.baseUrl === config.baseUrl) {
    return sdkInstance
  }
  
  sdkInstance = createSDK(config)
  currentConfig = config
  return sdkInstance
}
```

#### 1.2 Integrate Authentication
```typescript
// SDKContext.tsx
export function SDKProvider({ config, children }) {
  const auth = useAuth()
  
  const sdk = useMemo(() => {
    return createSDKInstance({
      baseUrl: config.baseUrl,
      auth: auth.token ? {
        token: () => auth.token!,
        refreshToken: () => auth.refreshToken || undefined,
        onRefresh: (newToken) => auth.setToken(newToken),
      } : undefined,
    })
  }, [config.baseUrl, auth.token])
  
  return <SDKContext.Provider value={{ sdk }}>{children}</SDKContext.Provider>
}
```

#### 1.3 Add Error Handling
```typescript
// lib/sdk.ts
export function createSDKInstance(config: SDKConfig & { onAuthError?: () => void }): SDK {
  const { onAuthError, ...sdkConfig } = config
  
  return createSDK({
    ...sdkConfig,
    onError: (error) => {
      if (error.status === 401 && onAuthError) {
        onAuthError() // Redirect to login
      }
      console.error('API Error:', error)
    }
  })
}
```

### Priority 2: Important (Do Soon)

#### 2.1 Add Request/Response Logging
```typescript
// lib/sdk.ts
export function createSDKInstance(config: SDKConfig): SDK {
  return createSDK({
    ...config,
    onRequest: (init) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('→', init.method, init.url)
      }
      return config.onRequest ? config.onRequest(init) : init
    },
    onResponse: (response) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('←', response.status, response.url)
      }
      return config.onResponse ? config.onResponse(response) : response
    },
  })
}
```

#### 2.2 Configure Retries and Timeout
```typescript
// lib/sdk.ts
export function createSDKInstance(config: SDKConfig): SDK {
  return createSDK({
    retries: 3,
    timeout: 30000,
    ...config,
  })
}
```

### Priority 3: Enhancements (Do Later)

#### 3.1 Add WebSocket Transport
```typescript
// lib/sdk.ts
import { HybridDataClient, HTTPTransport, WebSocketTransport } from '@ssot-codegen/sdk-runtime'

// For real-time features (messages, matches)
// This requires SDK runtime support for hybrid transport
```

#### 3.2 Add Request Deduplication
```typescript
// Already handled by React Query, but ensure consistent usage
```

---

## 📋 Action Items

### Immediate (Critical)
1. ✅ Fix SDK singleton pattern (reuse instance)
2. ✅ Integrate authentication (token support)
3. ✅ Add error handling (401 redirect)
4. ✅ Add request/response logging (dev only)

### Short-term (Important)
5. ⏳ Configure retries and timeout
6. ⏳ Add error boundaries
7. ⏳ Improve error messages

### Long-term (Enhancements)
8. ⏳ Add WebSocket transport
9. ⏳ Add request deduplication
10. ⏳ Add performance monitoring

---

## ✅ Summary

**Current State**: Functional but missing critical features  
**Priority**: Fix singleton, auth, and error handling first  
**Impact**: High - affects security, performance, and UX

**Key Findings**:
- ✅ SDK structure is good (supports auth, interceptors)
- ⚠️ Not using SDK features (auth, error handling)
- ⚠️ Singleton pattern broken
- ⚠️ No WebSocket transport

**Next Steps**:
1. Fix SDK singleton pattern
2. Integrate authentication
3. Add error handling
4. Add logging (dev only)
5. Configure retries/timeout
