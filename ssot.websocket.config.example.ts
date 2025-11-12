/**
 * SSOT CodeGen - WebSocket Configuration Example
 * 
 * Enable WebSocket support for real-time updates
 */

import { defineConfig } from '@ssot/gen'

export default defineConfig({
  // ... your existing config ...
  
  // WebSocket configuration (optional)
  websockets: {
    enabled: true,
    port: 3001,
    path: '/ws',
    
    // Pub/Sub configuration
    pubsub: {
      models: {
        // Messages need real-time updates
        'Message': {
          subscribe: ['list', 'item'],  // What to subscribe to
          broadcast: ['created', 'updated', 'deleted'],  // What to broadcast
          permissions: {
            list: 'authenticated',       // Any logged-in user
            item: 'isParticipant'        // Custom permission
          }
        },
        
        // Notifications
        'Notification': {
          subscribe: ['list'],
          broadcast: ['created'],
          permissions: {
            list: 'isOwner'              // User's own notifications only
          }
        }
        
        // Other models not listed here use HTTP only
      },
      
      // Custom channels (optional)
      channels: {
        'chat:room:{roomId}': {
          events: ['message', 'typing', 'join', 'leave'],
          permission: 'isRoomMember'
        }
      }
    },
    
    // Reconnection settings (optional)
    reconnect: {
      maxAttempts: 5,
      backoff: 'exponential',  // or 'linear'
      baseDelay: 1000          // ms
    },
    
    // Update batching (optional)
    batching: {
      enabled: true,
      flushInterval: 100,      // ms
      maxBatchSize: 50
    }
  }
})

