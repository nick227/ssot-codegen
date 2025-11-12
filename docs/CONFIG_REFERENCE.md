# Configuration Reference

**Version**: 2.0  
**Date**: November 12, 2025  
**Status**: Complete Reference  

---

## Overview

SSOT CodeGen configuration via `ssot.config.ts` in project root.

---

## Complete Configuration

```typescript
import { defineConfig } from '@ssot/gen'

export default defineConfig({
  // ============================================================================
  // CORE
  // ============================================================================
  
  schema: './schema.prisma',        // Prisma schema path
  output: './generated',            // Output directory
  framework: 'express',             // 'express' | 'fastify'
  
  // ============================================================================
  // GENERATION MODES
  // ============================================================================
  
  useRegistry: true,                // Unified CRUD (78% less code)
  generateUI: true,                 // Generate Next.js UI
  generateSDK: true,                // Generate client SDK
  generateOpenAPI: true,            // Generate OpenAPI spec
  generateTests: true,              // Generate test scaffolds
  
  // ============================================================================
  // UI CONFIGURATION
  // ============================================================================
  
  ui: {
    template: 'data-browser',      // 'data-browser' | 'blog' | 'chatbot' | 'ecommerce'
    mode: 'v2-codegen',            // 'v2-codegen' | 'v3-runtime'
    models: ['User', 'Post'],      // Optional: filter models for UI
    components: {
      generateDataTable: true,
      generateForms: true,
      generateLayouts: true
    }
  },
  
  // ============================================================================
  // WEBSOCKET CONFIGURATION
  // ============================================================================
  
  websockets: {
    enabled: true,                  // Enable WebSocket support
    port: 3001,                     // WebSocket server port
    path: '/ws',                    // WebSocket endpoint path
    
    pubsub: {
      // Per-model real-time configuration
      models: {
        'Message': {
          subscribe: ['list', 'item'],
          broadcast: ['created', 'updated', 'deleted'],
          permissions: {
            list: 'authenticated',
            item: 'isParticipant'
          }
        }
      },
      
      // Custom channels (optional)
      channels: {
        'chat:room:{roomId}': {
          events: ['message', 'typing', 'join', 'leave'],
          permission: 'isRoomMember'
        }
      }
    },
    
    // Reconnection settings
    reconnect: {
      maxAttempts: 5,
      backoff: 'exponential',     // 'linear' | 'exponential'
      baseDelay: 1000             // Base delay in ms
    },
    
    // Update batching
    batching: {
      enabled: true,
      flushInterval: 100,         // Flush every 100ms
      maxBatchSize: 50            // Max updates per batch
    }
  },
  
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  
  auth: {
    provider: 'NextAuth',          // 'JWT' | 'NextAuth' | 'Clerk' | 'Supabase'
    strategy: 'Bearer',            // 'Bearer' | 'Cookie' | 'Session'
    
    jwt: {
      secret: process.env.JWT_SECRET,
      expiry: '7d',
      refresh: true,
      algorithm: 'HS256'
    },
    
    session: {
      store: 'redis',              // 'memory' | 'redis' | 'database'
      maxAge: 86400                // 24 hours
    }
  },
  
  // ============================================================================
  // SECURITY
  // ============================================================================
  
  security: {
    rls: {
      enabled: true,                // Row-level security
      mode: 'fail-closed',          // 'fail-closed' | 'fail-open'
      cacheResults: true            // Cache permission checks
    },
    
    cors: {
      enabled: true,
      origins: ['http://localhost:3000', 'https://myapp.com'],
      credentials: true
    },
    
    rateLimit: {
      enabled: true,
      windowMs: 60000,              // 1 minute
      maxRequests: 100,             // 100 requests per minute
      strategy: 'sliding-window'    // 'fixed-window' | 'sliding-window'
    }
  },
  
  // ============================================================================
  // PLUGINS
  // ============================================================================
  
  plugins: [
    // Storage
    {
      name: 'S3',
      enabled: true,
      config: {
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION,
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
      }
    },
    
    // AI
    {
      name: 'OpenAI',
      enabled: true,
      config: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4',
        maxTokens: 1000
      }
    },
    
    // Payments
    {
      name: 'Stripe',
      enabled: true,
      config: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      }
    },
    
    // Search
    {
      name: 'FullTextSearch',
      enabled: true,
      config: {
        engine: 'native',           // 'native' | 'elasticsearch' | 'typesense'
        indexOnWrite: true
      }
    }
  ],
  
  // ============================================================================
  // DATABASE
  // ============================================================================
  
  database: {
    provider: 'postgresql',         // From Prisma schema
    url: process.env.DATABASE_URL,
    
    pooling: {
      min: 2,
      max: 10,
      idleTimeout: 30000            // 30 seconds
    },
    
    migrations: {
      autoRun: false,               // Don't auto-run in production
      directory: './prisma/migrations'
    }
  },
  
  // ============================================================================
  // PERFORMANCE
  // ============================================================================
  
  performance: {
    caching: {
      enabled: true,
      ttl: 60,                      // 60 seconds default
      strategy: 'memory',           // 'memory' | 'redis'
      patterns: {
        '/api/users': 300,          // Cache users for 5 minutes
        '/api/posts': 60            // Cache posts for 1 minute
      }
    },
    
    compression: {
      enabled: true,
      threshold: 1024               // Compress responses > 1KB
    }
  },
  
  // ============================================================================
  // LOGGING & MONITORING
  // ============================================================================
  
  logging: {
    level: 'info',                  // 'debug' | 'info' | 'warn' | 'error'
    format: 'json',                 // 'json' | 'pretty'
    
    // PII redaction
    redact: {
      enabled: true,
      fields: ['password', 'ssn', 'creditCard', 'apiKey', 'token']
    },
    
    // Request tracking
    requestId: {
      enabled: true,
      header: 'X-Request-ID'
    }
  },
  
  monitoring: {
    enabled: true,
    provider: 'UsageTracker',       // Built-in usage tracking
    
    metrics: {
      requests: true,
      errors: true,
      latency: true,
      memory: true
    }
  },
  
  // ============================================================================
  // ENVIRONMENT
  // ============================================================================
  
  env: {
    generateTemplate: true,         // Generate .env.template
    required: [                     // Required env vars
      'DATABASE_URL',
      'JWT_SECRET',
      'API_URL'
    ]
  },
  
  // ============================================================================
  // DEVELOPMENT
  // ============================================================================
  
  dev: {
    hotReload: true,                // Watch for schema changes
    port: 3000,                     // API server port
    uiPort: 3001,                   // Next.js port
    
    mock: {
      enabled: false,               // Generate mock data
      count: 100                    // Records per model
    }
  }
})
```

---

## Quick Configs

### Minimal (API Only)

```typescript
export default defineConfig({
  schema: './schema.prisma',
  output: './generated',
  framework: 'express'
})
```

---

### Full-Stack (API + UI)

```typescript
export default defineConfig({
  schema: './schema.prisma',
  output: './generated',
  framework: 'express',
  generateUI: true,
  ui: {
    template: 'data-browser'
  }
})
```

---

### Real-Time App (Chat, Notifications)

```typescript
export default defineConfig({
  schema: './schema.prisma',
  output: './generated',
  framework: 'express',
  generateUI: true,
  
  websockets: {
    enabled: true,
    pubsub: {
      // Use @@realtime annotations in schema instead!
      // Config here overrides annotations
    }
  }
})
```

---

### Enterprise (Full Security)

```typescript
export default defineConfig({
  schema: './schema.prisma',
  output: './generated',
  framework: 'express',
  
  auth: {
    provider: 'NextAuth',
    strategy: 'Bearer'
  },
  
  security: {
    rls: { enabled: true },
    cors: {
      enabled: true,
      origins: process.env.ALLOWED_ORIGINS?.split(',') || []
    },
    rateLimit: {
      enabled: true,
      maxRequests: 100
    }
  }
})
```

---

## Configuration Priority

1. **CLI flags** (highest)
2. **ssot.config.ts** (project config)
3. **Schema annotations** (@@realtime, @@auth, etc.)
4. **Defaults** (lowest)

**Example**:
```bash
pnpm ssot generate --framework fastify --no-ui
# Overrides config.framework and config.generateUI
```

---

## Environment Variables

Generated `.env.template`:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Authentication
JWT_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# API
API_URL="http://localhost:3000"
WEBSOCKET_URL="ws://localhost:3001/ws"

# Services (if using plugins)
OPENAI_API_KEY="sk-..."
STRIPE_SECRET_KEY="sk_test_..."
S3_BUCKET="my-bucket"
S3_REGION="us-east-1"
```

---

## Validation

Config is validated at generation time:

**Valid**:
```typescript
framework: 'express'  // ✅
```

**Invalid**:
```typescript
framework: 'koa'  // ❌ Error: Unsupported framework
```

**Warnings**:
```typescript
websockets: { enabled: true }  // ⚠️ No models configured
```

---

## Schema Annotations vs Config

**Prefer annotations** for model-specific settings:

```prisma
model Message {
  /// @@realtime(subscribe: ["list"], broadcast: ["created"])
  /// @@policy("read", rule: "authenticated")
}
```

**Use config** for global settings:

```typescript
export default defineConfig({
  websockets: {
    port: 3001,
    reconnect: { maxAttempts: 10 }
  }
})
```

**Why**: Annotations live with schema (version controlled), config handles environment-specific settings.

---

## Migration Guide

### From Hardcoded to Config

**Before**:
```typescript
// Hardcoded in code
const PORT = 3000
const WS_PORT = 3001
```

**After**:
```typescript
// ssot.config.ts
export default defineConfig({
  dev: { port: 3000, uiPort: 3001 }
})
```

---

### From Config to Annotations

**Before**:
```typescript
websockets: {
  pubsub: {
    models: {
      'Message': { subscribe: ['list'], broadcast: ['created'] }
    }
  }
}
```

**After**:
```prisma
model Message {
  /// @@realtime(subscribe: ["list"], broadcast: ["created"])
}
```

---

## Troubleshooting

**Config not loading?**
- Ensure `ssot.config.ts` in project root
- Check `export default defineConfig({})`
- Verify TypeScript compilation

**Validation errors?**
- Check required fields present
- Verify enum values correct
- Review error messages in console

**Plugins not activating?**
- Check `enabled: true`
- Verify required env vars set
- Check plugin name matches exactly

---

**Status**: ✅ Complete Reference  
**See Also**: SCHEMA_ANNOTATIONS_GUIDE.md for annotation-based config  

