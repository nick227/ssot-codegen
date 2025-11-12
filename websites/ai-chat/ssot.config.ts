/**
 * SSOT Codegen Configuration for AI Chat SPA
 * 
 * Enables OpenAI plugin and WebSocket support
 */

export default {
  features: {
    // Authentication
    jwtService: {
      enabled: true
    },
    
    // OpenAI Integration
    openai: {
      enabled: true,
      defaultModel: 'gpt-4-turbo',
      enableUsageTracking: true,
      enableCostEstimation: true,
      maxRetries: 3,
      timeout: 60000
    },
    
    // WebSocket for real-time chat
    websocket: {
      enabled: true,
      path: '/ws',
      reconnect: true
    },
    
    // Optional: Other AI providers
    claude: {
      enabled: false
    },
    gemini: {
      enabled: false
    }
  }
}

