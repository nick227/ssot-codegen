/**
 * Feature Plugins - Barrel Export
 */

export * from './plugin.interface.js'
export * from './plugin-manager.js'

// Auth plugins
export * from './auth/google-auth.plugin.js'
export * from './auth/jwt-service.plugin.js'
export * from './auth/api-key-manager.plugin.js'

// Monitoring plugins
export * from './monitoring/usage-tracker.plugin.js'

// AI providers
export * from './ai/openai.plugin.js'
export * from './ai/claude.plugin.js'
export * from './ai/gemini.plugin.js'
export * from './ai/grok.plugin.js'
export * from './ai/openrouter.plugin.js'
export * from './ai/lmstudio.plugin.js'
export * from './ai/ollama.plugin.js'
export * from './ai/chat.plugin.js'

// Voice AI providers
export * from './voice/deepgram.plugin.js'
export * from './voice/elevenlabs.plugin.js'

// Storage providers
export * from './storage/s3.plugin.js'
export * from './storage/r2.plugin.js'
export * from './storage/cloudinary.plugin.js'

// Payment providers
export * from './payments/stripe.plugin.js'
export * from './payments/paypal.plugin.js'

// Email providers
export * from './email/sendgrid.plugin.js'
export * from './email/mailgun.plugin.js'

// Search
export * from './search/full-text-search.plugin.js'

// AI provider interface
export * from './ai/ai-provider.interface.js'

// Security
export * from './rls/index.js'

