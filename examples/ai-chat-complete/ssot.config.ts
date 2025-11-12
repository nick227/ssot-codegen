/**
 * AI Chat - SSOT Configuration
 * 
 * Complete integration of:
 * - WebSockets (real-time messages)
 * - AI Plugins (OpenAI, Claude, etc.)
 * - React Hooks (data management)
 * - UI Templates (chat interface)
 */

import type { SsotConfig } from '@ssot-codegen/gen'
import { OpenAIPlugin } from '@ssot-codegen/gen'

const config: SsotConfig = {
  // Prisma schema
  prisma: {
    schemaPath: './schema.prisma'
  },
  
  // API framework
  framework: 'fastify',  // or 'express'
  
  // Plugins
  plugins: [
    // AI Provider - OpenAI (GPT-4, GPT-3.5)
    new OpenAIPlugin({
      defaultModel: 'gpt-4-turbo',
      enableUsageTracking: true,
      enableCostEstimation: true,
      maxRetries: 3
    })
    
    // You can add more AI providers:
    // new ClaudePlugin({ defaultModel: 'claude-3-opus' }),
    // new GeminiPlugin({ defaultModel: 'gemini-pro' }),
  ],
  
  // WebSocket configuration (real-time)
  websocket: {
    enabled: true,
    port: 3001,
    path: '/ws',
    
    // Pub/Sub configuration
    pubsub: {
      models: {
        // Conversations - real-time list updates
        Conversation: {
          subscribe: ['list', 'get'],
          broadcast: ['created', 'updated', 'deleted'],
          permissions: {
            list: 'authenticated',
            item: 'authenticated'
          }
        },
        
        // Messages - real-time message streaming
        Message: {
          subscribe: ['list'],
          broadcast: ['created', 'updated', 'deleted'],
          permissions: {
            list: 'authenticated'
          }
        }
      }
    },
    
    // Reconnection strategy
    reconnect: {
      maxAttempts: 10,
      backoff: 'exponential',
      baseDelay: 1000
    },
    
    // Message batching (optimize network)
    batching: {
      enabled: true,
      flushInterval: 100,
      maxBatchSize: 50
    }
  },
  
  // React hooks configuration
  hooks: {
    frameworks: ['react'],
    generateTests: true
  },
  
  // API settings
  api: {
    port: 3000,
    cors: {
      enabled: true,
      origins: ['http://localhost:5173', 'http://localhost:3000']
    },
    rateLimit: {
      enabled: true,
      max: 100,
      windowMs: 60000
    }
  }
}

export default config

