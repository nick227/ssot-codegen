/**
 * SSOT Codegen Configuration - AI Chat Example
 * 
 * This example demonstrates:
 * - OpenAI plugin for chat completions
 * - Claude plugin for alternative AI provider
 * - JWT authentication
 * - Usage tracking
 */

export default {
  features: {
    // AI Providers
    openai: {
      enabled: true,
      defaultModel: 'gpt-4-turbo'
    },
    
    claude: {
      enabled: true,
      defaultModel: 'claude-3-sonnet-20240229'
    },
    
    // Authentication
    jwtService: {
      enabled: true
    },
    
    // Monitoring
    usageTracker: {
      enabled: true
    }
  }
}

