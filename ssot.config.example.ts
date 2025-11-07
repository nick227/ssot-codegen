/**
 * SSOT Codegen Plugin Configuration Example
 * 
 * This file demonstrates how to configure feature plugins for code generation.
 * 
 * USAGE:
 * 1. Copy this file to your project root as `ssot.config.js` (JavaScript format recommended)
 * 2. Enable the plugins you want to use
 * 3. Run: pnpm ssot generate your-schema.prisma
 * 
 * Configuration Priority:
 * 1. Explicit config passed to generator (highest)
 * 2. This config file (ssot.config.js/json/package.json)
 * 3. Environment variables (lowest)
 * 
 * NOTE: For JavaScript version, remove type imports and change to:
 *   export default { features: { ... } }
 */

const config = {
  features: {
    // ========================================
    // Authentication Providers
    // ========================================
    
    // Google OAuth 2.0
    googleAuth: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      strategy: 'jwt',  // 'jwt' | 'session'
      userModel: 'User'  // Prisma model name for users
    },
    
    // JWT Service
    jwtService: {
      enabled: true
    },
    
    // API Key Manager
    apiKeyManager: {
      enabled: false
    },
    
    // ========================================
    // AI Providers
    // ========================================
    
    // OpenAI (GPT-4, GPT-3.5, Embeddings)
    openai: {
      enabled: true,
      defaultModel: 'gpt-4-turbo'
    },
    
    // Claude (Anthropic)
    claude: {
      enabled: true,
      defaultModel: 'claude-3-sonnet-20240229'
    },
    
    // Google Gemini
    gemini: {
      enabled: false,
      defaultModel: 'gemini-pro'
    },
    
    // xAI Grok
    grok: {
      enabled: false
    },
    
    // OpenRouter (unified gateway)
    openrouter: {
      enabled: false,
      defaultModel: 'anthropic/claude-3-opus'
    },
    
    // LM Studio (local)
    lmstudio: {
      enabled: false,
      endpoint: 'http://localhost:1234/v1'
    },
    
    // Ollama (local)
    ollama: {
      enabled: false,
      endpoint: 'http://localhost:11434',
      models: ['llama2', 'mistral']
    },
    
    // ========================================
    // Voice AI
    // ========================================
    
    // Deepgram (Speech-to-Text)
    deepgram: {
      enabled: false,
      defaultModel: 'nova-2'
    },
    
    // ElevenLabs (Text-to-Speech)
    elevenlabs: {
      enabled: false,
      defaultVoice: 'rachel'
    },
    
    // ========================================
    // Storage Providers
    // ========================================
    
    // AWS S3
    s3: {
      enabled: false,
      region: 'us-east-1',
      bucket: 'my-bucket'
    },
    
    // Cloudflare R2
    r2: {
      enabled: false,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      bucket: 'my-r2-bucket'
    },
    
    // Cloudinary
    cloudinary: {
      enabled: false,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    },
    
    // ========================================
    // Payment Processors
    // ========================================
    
    // Stripe
    stripe: {
      enabled: true
    },
    
    // PayPal
    paypal: {
      enabled: false,
      mode: 'sandbox'  // 'sandbox' | 'live'
    },
    
    // ========================================
    // Email Services
    // ========================================
    
    // SendGrid
    sendgrid: {
      enabled: true,
      fromEmail: 'noreply@example.com'
    },
    
    // Mailgun
    mailgun: {
      enabled: false,
      domain: 'mg.example.com'
    },
    
    // ========================================
    // Monitoring
    // ========================================
    
    // Usage Tracker
    usageTracker: {
      enabled: true
    }
  }
}

export default config

