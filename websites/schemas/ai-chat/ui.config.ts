/**
 * AI Chat SPA UI Configuration
 * 
 * Single-page application configuration for AI-powered chat interface
 * with WebSocket real-time updates and OpenAI integration
 */

const config = {
  site: {
    name: 'AI Chat',
    description: 'AI-powered chat interface with real-time streaming',
    version: '1.0.0'
  },
  
  theme: {
    mode: 'dark',
    primaryColor: '#10b981', // Emerald green
    secondaryColor: '#3b82f6', // Blue
    accentColor: '#8b5cf6', // Purple
    darkMode: true,
    colors: {
      background: '#0f172a', // Slate 900
      surface: '#1e293b', // Slate 800
      text: '#f1f5f9', // Slate 100
      textSecondary: '#94a3b8', // Slate 400
      border: '#334155', // Slate 700
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      info: '#3b82f6'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        base: '16px',
        sm: '14px',
        lg: '18px',
        xl: '20px'
      }
    },
    spacing: {
      unit: 4,
      chatInputHeight: 120
    }
  },
  
  navigation: {
    type: 'minimal', // Single-page app, minimal nav
    items: [
      {
        label: 'Chat',
        path: '/',
        icon: 'MessageSquare'
      },
      {
        label: 'Settings',
        path: '/settings',
        icon: 'Settings'
      }
    ]
  },
  
  pages: [
    {
      path: '/',
      name: 'Chat',
      type: 'chat',
      layout: 'fullscreen',
      sections: [
        {
          type: 'chat-interface',
          config: {
            enableStreaming: true,
            enableMarkdown: true,
            enableCodeHighlight: true,
            showTokenCount: true,
            showCostEstimate: true,
            placeholder: 'Type your message...',
            maxHeight: 'calc(100vh - 200px)'
          }
        }
      ]
    },
    {
      path: '/settings',
      name: 'Settings',
      type: 'settings',
      layout: 'centered',
      sections: [
        {
          type: 'chat-settings-form',
          config: {
            fields: [
              'defaultProvider',
              'defaultModel',
              'defaultTemperature',
              'defaultMaxTokens',
              'theme',
              'fontSize',
              'showTokenCount',
              'showCostEstimate',
              'enableStreaming',
              'enableMarkdown',
              'enableCodeHighlight'
            ]
          }
        }
      ]
    }
  ],
  
  generation: {
    // Auto-generate CRUD pages for models
    crudPages: {
      enabled: false, // We're building a custom SPA, not CRUD
      models: []
    },
    
    // Dashboard configuration
    dashboard: {
      enabled: false // Single-page app, no dashboard
    },
    
    // Component generation
    components: {
      enabled: true,
      types: [
        'chat-message',
        'chat-input',
        'chat-conversation-list',
        'chat-settings-form',
        'token-counter',
        'cost-estimate',
        'model-selector',
        'provider-selector'
      ]
    },
    
    // WebSocket configuration
    websocket: {
      enabled: true,
      channels: [
        {
          name: 'conversation',
          events: ['message.created', 'message.updated', 'message.streaming', 'conversation.created', 'conversation.updated']
        }
      ],
      realtime: {
        enabled: true,
        models: ['Message', 'Conversation']
      }
    }
  },
  
  // Custom features
  features: {
    streaming: {
      enabled: true,
      chunkSize: 50,
      debounceMs: 100
    },
    markdown: {
      enabled: true,
      syntaxHighlight: true,
      codeTheme: 'github-dark'
    },
    codeHighlight: {
      enabled: true,
      theme: 'github-dark',
      languages: ['javascript', 'typescript', 'python', 'bash', 'json', 'sql']
    },
    tokenTracking: {
      enabled: true,
      showInUI: true
    },
    costEstimation: {
      enabled: true,
      showInUI: true,
      currency: 'USD'
    }
  },
  
  // Plugin configuration (will be merged with ssot.config.ts)
  plugins: {
    openai: {
      enabled: true,
      defaultModel: 'gpt-4-turbo',
      enableStreaming: true,
      enableUsageTracking: true,
      enableCostEstimation: true
    },
    websocket: {
      enabled: true,
      path: '/ws',
      reconnect: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5
    }
  }
}

export default config

