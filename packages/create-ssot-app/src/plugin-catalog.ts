/**
 * Plugin Catalog for CLI Selection
 * 
 * Centralized registry of all available plugins with metadata
 * for the create-ssot-app CLI tool.
 */

export type PluginCategory = 'auth' | 'ai' | 'voice' | 'storage' | 'payments' | 'email' | 'monitoring' | 'search'

export interface CLIPluginInfo {
  id: string
  name: string
  description: string
  category: PluginCategory
  envVarsRequired: string[]
  envVarsOptional?: string[]
  popular?: boolean
  requiresModel?: string
  dependencies: Record<string, string>
  configKey: string
  setupInstructions?: string
}

export const PLUGIN_CATALOG: CLIPluginInfo[] = [
  // ============================================================================
  // 🔐 AUTHENTICATION
  // ============================================================================
  {
    id: 'google-auth',
    name: 'Google OAuth',
    description: 'Google Sign-In integration with Passport.js',
    category: 'auth',
    envVarsRequired: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    envVarsOptional: ['GOOGLE_CALLBACK_URL'],
    popular: false,
    requiresModel: 'User',
    dependencies: {
      'passport': '^0.7.0',
      'passport-google-oauth20': '^2.0.0',
      'express-session': '^1.17.3'
    },
    configKey: 'googleAuth',
    setupInstructions: 'Get credentials from https://console.cloud.google.com/apis/credentials'
  },
  {
    id: 'jwt-service',
    name: 'JWT Service',
    description: 'JSON Web Token authentication',
    category: 'auth',
    envVarsRequired: ['JWT_SECRET'],
    envVarsOptional: ['JWT_EXPIRES_IN'],
    popular: true,
    dependencies: {
      'jsonwebtoken': '^9.0.0',
      '@types/jsonwebtoken': '^9.0.0'
    },
    configKey: 'jwtService'
  },
  {
    id: 'api-key-manager',
    name: 'API Key Manager',
    description: 'API key generation and validation',
    category: 'auth',
    envVarsRequired: [],
    dependencies: {},
    configKey: 'apiKeyManager'
  },
  
  // ============================================================================
  // 🤖 AI PROVIDERS
  // ============================================================================
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, DALL-E integration',
    category: 'ai',
    envVarsRequired: ['OPENAI_API_KEY'],
    envVarsOptional: ['OPENAI_ORG_ID'],
    popular: true,
    dependencies: {
      'openai': '^4.0.0'
    },
    configKey: 'openai',
    setupInstructions: 'Get API key from https://platform.openai.com/api-keys'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Claude 3 Opus, Sonnet, Haiku models',
    category: 'ai',
    envVarsRequired: ['ANTHROPIC_API_KEY'],
    popular: false,
    dependencies: {
      '@anthropic-ai/sdk': '^0.9.0'
    },
    configKey: 'claude',
    setupInstructions: 'Get API key from https://console.anthropic.com/'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro, Gemini Ultra models',
    category: 'ai',
    envVarsRequired: ['GOOGLE_AI_API_KEY'],
    dependencies: {
      '@google/generative-ai': '^0.1.0'
    },
    configKey: 'gemini',
    setupInstructions: 'Get API key from https://makersuite.google.com/app/apikey'
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    description: 'Grok-1 model access',
    category: 'ai',
    envVarsRequired: ['XAI_API_KEY'],
    dependencies: {},
    configKey: 'grok',
    setupInstructions: 'Get API key from https://console.x.ai/ (when available)'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 100+ AI models through one API',
    category: 'ai',
    envVarsRequired: ['OPENROUTER_API_KEY'],
    dependencies: {},
    configKey: 'openrouter',
    setupInstructions: 'Get API key from https://openrouter.ai/keys'
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    description: 'Local AI models (offline, free)',
    category: 'ai',
    envVarsRequired: [],
    envVarsOptional: ['LMSTUDIO_ENDPOINT'],
    dependencies: {},
    configKey: 'lmstudio',
    setupInstructions: 'Download LM Studio from https://lmstudio.ai/ and start local server'
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run Llama 2, Mistral, CodeLlama locally',
    category: 'ai',
    envVarsRequired: [],
    envVarsOptional: ['OLLAMA_ENDPOINT'],
    dependencies: {},
    configKey: 'ollama',
    setupInstructions: 'Install Ollama from https://ollama.ai/'
  },
  
  // ============================================================================
  // 🎤 VOICE AI
  // ============================================================================
  {
    id: 'deepgram',
    name: 'Deepgram',
    description: 'Real-time speech-to-text',
    category: 'voice',
    envVarsRequired: ['DEEPGRAM_API_KEY'],
    dependencies: {
      '@deepgram/sdk': '^3.0.0'
    },
    configKey: 'deepgram',
    setupInstructions: 'Get API key from https://console.deepgram.com/'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'High-quality text-to-speech',
    category: 'voice',
    envVarsRequired: ['ELEVENLABS_API_KEY'],
    dependencies: {
      'elevenlabs': '^0.5.0'
    },
    configKey: 'elevenlabs',
    setupInstructions: 'Get API key from https://elevenlabs.io/app/settings'
  },
  
  // ============================================================================
  // 💾 STORAGE
  // ============================================================================
  {
    id: 's3',
    name: 'AWS S3',
    description: 'Amazon S3 file storage',
    category: 'storage',
    envVarsRequired: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'],
    dependencies: {
      '@aws-sdk/client-s3': '^3.0.0',
      '@aws-sdk/s3-request-presigner': '^3.0.0'
    },
    configKey: 's3',
    setupInstructions: 'Get credentials from https://console.aws.amazon.com/iam/'
  },
  {
    id: 'r2',
    name: 'Cloudflare R2',
    description: 'S3-compatible storage (no egress fees)',
    category: 'storage',
    envVarsRequired: ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'],
    dependencies: {
      '@aws-sdk/client-s3': '^3.0.0',
      '@aws-sdk/s3-request-presigner': '^3.0.0'
    },
    configKey: 'r2',
    setupInstructions: 'Get credentials from https://dash.cloudflare.com/'
  },
  {
    id: 'cloudinary',
    name: 'Cloudinary',
    description: 'Image/video optimization and CDN',
    category: 'storage',
    envVarsRequired: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    popular: true,
    dependencies: {
      'cloudinary': '^1.40.0'
    },
    configKey: 'cloudinary'
  },
  
  // ============================================================================
  // 💳 PAYMENTS
  // ============================================================================
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing, subscriptions',
    category: 'payments',
    envVarsRequired: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    envVarsOptional: ['STRIPE_WEBHOOK_SECRET'],
    popular: false,
    dependencies: {
      'stripe': '^14.0.0'
    },
    configKey: 'stripe',
    setupInstructions: 'Get API keys from https://dashboard.stripe.com/apikeys'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'PayPal payment integration',
    category: 'payments',
    envVarsRequired: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
    envVarsOptional: ['PAYPAL_MODE'],
    dependencies: {
      '@paypal/checkout-server-sdk': '^1.0.3'
    },
    configKey: 'paypal',
    setupInstructions: 'Get credentials from https://developer.paypal.com/dashboard/applications'
  },
  
  // ============================================================================
  // 📧 EMAIL
  // ============================================================================
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional email service',
    category: 'email',
    envVarsRequired: ['SENDGRID_API_KEY'],
    envVarsOptional: ['SENDGRID_FROM_EMAIL'],
    popular: false,
    dependencies: {
      '@sendgrid/mail': '^7.7.0'
    },
    configKey: 'sendgrid',
    setupInstructions: 'Get API key from https://app.sendgrid.com/settings/api_keys'
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    description: 'Email API service',
    category: 'email',
    envVarsRequired: ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'],
    dependencies: {
      'mailgun.js': '^9.0.0'
    },
    configKey: 'mailgun',
    setupInstructions: 'Get API key from https://app.mailgun.com/settings/api_security'
  },
  
  // ============================================================================
  // 📊 MONITORING
  // ============================================================================
  {
    id: 'usage-tracker',
    name: 'Usage Tracker',
    description: 'API usage analytics and rate limiting',
    category: 'monitoring',
    envVarsRequired: [],
    popular: true,
    dependencies: {},
    configKey: 'usageTracker'
  },
  
  // ============================================================================
  // 🔍 SEARCH
  // ============================================================================
  {
    id: 'full-text-search',
    name: 'Full-Text Search',
    description: 'Configurable search with ranking',
    category: 'search',
    envVarsRequired: [],
    dependencies: {
      '@ssot-codegen/sdk-runtime': '^1.0.0'
    },
    configKey: 'fullTextSearch'
  }
]

// ============================================================================
// CATEGORY METADATA
// ============================================================================

export const CATEGORY_ICONS: Record<PluginCategory, string> = {
  auth: '🔐',
  ai: '🤖',
  voice: '🎤',
  storage: '💾',
  payments: '💳',
  email: '📧',
  monitoring: '📊',
  search: '🔍'
}

export const CATEGORY_LABELS: Record<PluginCategory, string> = {
  auth: 'Authentication',
  ai: 'AI Providers',
  voice: 'Voice AI',
  storage: 'Storage',
  payments: 'Payments',
  email: 'Email',
  monitoring: 'Monitoring',
  search: 'Search'
}

export const CATEGORY_ORDER: PluginCategory[] = [
  'auth',
  'ai',
  'voice',
  'storage',
  'payments',
  'email',
  'monitoring',
  'search'
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Group plugins by category
 */
export function groupPluginsByCategory(plugins: CLIPluginInfo[]): Record<PluginCategory, CLIPluginInfo[]> {
  return plugins.reduce((acc, plugin) => {
    if (!acc[plugin.category]) acc[plugin.category] = []
    acc[plugin.category].push(plugin)
    return acc
  }, {} as Record<PluginCategory, CLIPluginInfo[]>)
}

/**
 * Get plugin by ID
 */
export function getPluginById(id: string): CLIPluginInfo | undefined {
  return PLUGIN_CATALOG.find(p => p.id === id)
}

/**
 * Get popular plugins (pre-selected by default)
 */
export function getPopularPlugins(): CLIPluginInfo[] {
  return PLUGIN_CATALOG.filter(p => p.popular)
}

/**
 * Get plugins that require a specific model
 */
export function getPluginsRequiringModel(modelName: string): CLIPluginInfo[] {
  return PLUGIN_CATALOG.filter(p => p.requiresModel === modelName)
}

/**
 * Get all dependencies for selected plugins
 */
export function getPluginDependencies(pluginIds: string[]): Record<string, string> {
  const deps: Record<string, string> = {}
  
  for (const id of pluginIds) {
    const plugin = getPluginById(id)
    if (!plugin) continue
    
    Object.assign(deps, plugin.dependencies)
  }
  
  return deps
}

/**
 * Get all required environment variables for selected plugins
 */
export function getRequiredEnvVars(pluginIds: string[]): Map<string, string[]> {
  const envVars = new Map<string, string[]>()
  
  for (const id of pluginIds) {
    const plugin = getPluginById(id)
    if (!plugin) continue
    
    envVars.set(plugin.name, plugin.envVarsRequired)
  }
  
  return envVars
}

/**
 * Validate plugin selection (check for conflicts, missing requirements, etc.)
 */
export interface PluginValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
}

export function validatePluginSelection(
  pluginIds: string[],
  options: {
    includeExamples: boolean
    hasUserModel?: boolean
  }
): PluginValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  
  const plugins = pluginIds.map(id => getPluginById(id)).filter(Boolean) as CLIPluginInfo[]
  
  // Check for plugins requiring User model
  const requireUserModel = plugins.filter(p => p.requiresModel === 'User')
  if (requireUserModel.length > 0 && !options.includeExamples && !options.hasUserModel) {
    warnings.push(
      `The following plugins require a User model: ${requireUserModel.map(p => p.name).join(', ')}. ` +
      `Consider enabling "Include examples" or add a User model manually.`
    )
  }
  
  // Warn about paid services
  const paidPlugins = plugins.filter(p => p.envVarsRequired.some(v => v.includes('API_KEY')))
  if (paidPlugins.length > 0) {
    warnings.push(
      `Some selected plugins require paid API keys: ${paidPlugins.map(p => p.name).join(', ')}`
    )
  }
  
  // Check for multiple plugins in same category (potential conflicts)
  const grouped = groupPluginsByCategory(plugins)
  for (const [category, categoryPlugins] of Object.entries(grouped)) {
    if (category === 'email' && categoryPlugins.length > 1) {
      warnings.push(
        `Multiple email providers selected: ${categoryPlugins.map(p => p.name).join(', ')}. ` +
        `You may only need one.`
      )
    }
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors
  }
}

