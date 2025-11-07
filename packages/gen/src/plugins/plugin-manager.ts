/**
 * Plugin Manager
 * Orchestrates feature plugins during code generation
 */

import type { ParsedSchema } from '../dmmf-parser.js'
import type { FeaturePlugin, PluginContext, PluginOutput, ValidationResult, HealthCheckSection } from './plugin.interface.js'

// Auth plugins
import { GoogleAuthPlugin } from './auth/google-auth.plugin.js'
import { JWTServicePlugin } from './auth/jwt-service.plugin.js'
import { ApiKeyManagerPlugin } from './auth/api-key-manager.plugin.js'

// Monitoring plugins
import { UsageTrackerPlugin } from './monitoring/usage-tracker.plugin.js'

// AI providers
import { OpenAIPlugin } from './ai/openai.plugin.js'
import { ClaudePlugin } from './ai/claude.plugin.js'
import { GeminiPlugin } from './ai/gemini.plugin.js'
import { GrokPlugin } from './ai/grok.plugin.js'
import { OpenRouterPlugin } from './ai/openrouter.plugin.js'
import { LMStudioPlugin } from './ai/lmstudio.plugin.js'
import { OllamaPlugin } from './ai/ollama.plugin.js'

// Voice AI providers
import { DeepgramPlugin } from './voice/deepgram.plugin.js'
import { ElevenLabsPlugin } from './voice/elevenlabs.plugin.js'

// Storage providers
import { S3Plugin } from './storage/s3.plugin.js'
import { R2Plugin } from './storage/r2.plugin.js'
import { CloudinaryPlugin } from './storage/cloudinary.plugin.js'

// Payment providers
import { StripePlugin } from './payments/stripe.plugin.js'
import { PayPalPlugin } from './payments/paypal.plugin.js'

// Email providers
import { SendGridPlugin } from './email/sendgrid.plugin.js'
import { MailgunPlugin } from './email/mailgun.plugin.js'

export interface PluginManagerConfig {
  schema: ParsedSchema
  projectName: string
  framework: 'express' | 'fastify'
  outputDir: string
  
  // Feature configurations
  features?: {
    // Auth plugins
    googleAuth?: { enabled: boolean; clientId?: string; clientSecret?: string; callbackURL?: string; strategy?: 'jwt' | 'session'; userModel?: string }
    jwtService?: { enabled: boolean }
    apiKeyManager?: { enabled: boolean }
    
    // Monitoring
    usageTracker?: { enabled: boolean }
    
    // AI providers
    openai?: { enabled: boolean; defaultModel?: string }
    claude?: { enabled: boolean; defaultModel?: string }
    gemini?: { enabled: boolean; defaultModel?: string }
    grok?: { enabled: boolean }
    openrouter?: { enabled: boolean; defaultModel?: string }
    lmstudio?: { enabled: boolean; endpoint?: string }
    ollama?: { enabled: boolean; endpoint?: string; models?: string[] }
    
    // Voice AI
    deepgram?: { enabled: boolean; defaultModel?: string }
    elevenlabs?: { enabled: boolean; defaultVoice?: string }
    
    // Storage
    s3?: { enabled: boolean; region?: string; bucket?: string }
    r2?: { enabled: boolean; accountId?: string; bucket?: string }
    cloudinary?: { enabled: boolean; cloudName?: string }
    
    // Payments
    stripe?: { enabled: boolean }
    paypal?: { enabled: boolean; mode?: 'sandbox' | 'live' }
    
    // Email
    sendgrid?: { enabled: boolean; fromEmail?: string }
    mailgun?: { enabled: boolean; domain?: string }
  }
}

/**
 * Plugin Manager - Manages all feature plugins
 */
export class PluginManager {
  private plugins: Map<string, FeaturePlugin> = new Map()
  private context: PluginContext
  
  constructor(config: PluginManagerConfig) {
    this.context = {
      schema: config.schema,
      projectName: config.projectName,
      framework: config.framework,
      outputDir: config.outputDir,
      config: config.features || {}
    }
    
    // Register plugins based on config
    this.registerPlugins(config)
  }
  
  /**
   * Get all registered plugins (for health checks, etc.)
   */
  getPlugins(): Map<string, FeaturePlugin> {
    return this.plugins
  }
  
  /**
   * Register enabled plugins
   */
  private registerPlugins(config: PluginManagerConfig): void {
    const features = config.features || {}
    
    // Auth plugins
    if (features.googleAuth?.enabled) {
      this.plugins.set('google-auth', new GoogleAuthPlugin({
        clientId: features.googleAuth.clientId || process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
        clientSecret: features.googleAuth.clientSecret || process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE',
        callbackURL: features.googleAuth.callbackURL,
        strategy: features.googleAuth.strategy || 'jwt',
        userModel: features.googleAuth.userModel || 'User'
      }))
    }
    
    if (features.jwtService?.enabled) {
      this.plugins.set('jwt-service', new JWTServicePlugin())
    }
    
    if (features.apiKeyManager?.enabled) {
      this.plugins.set('api-key-manager', new ApiKeyManagerPlugin())
    }
    
    // Monitoring
    if (features.usageTracker?.enabled) {
      this.plugins.set('usage-tracker', new UsageTrackerPlugin())
    }
    
    // AI providers
    if (features.openai?.enabled) {
      this.plugins.set('openai', new OpenAIPlugin(
        features.openai.defaultModel ? { defaultModel: features.openai.defaultModel } : undefined
      ))
    }
    
    if (features.claude?.enabled) {
      this.plugins.set('claude', new ClaudePlugin(
        features.claude.defaultModel ? { defaultModel: features.claude.defaultModel } : undefined
      ))
    }
    
    if (features.gemini?.enabled) {
      this.plugins.set('gemini', new GeminiPlugin())
    }
    
    if (features.grok?.enabled) {
      this.plugins.set('grok', new GrokPlugin())
    }
    
    if (features.openrouter?.enabled) {
      this.plugins.set('openrouter', new OpenRouterPlugin())
    }
    
    if (features.lmstudio?.enabled) {
      this.plugins.set('lmstudio', new LMStudioPlugin())
    }
    
    if (features.ollama?.enabled) {
      this.plugins.set('ollama', new OllamaPlugin())
    }
    
    // Voice AI
    if (features.deepgram?.enabled) {
      this.plugins.set('deepgram', new DeepgramPlugin(
        features.deepgram.defaultModel ? { defaultModel: features.deepgram.defaultModel } : undefined
      ))
    }
    
    if (features.elevenlabs?.enabled) {
      this.plugins.set('elevenlabs', new ElevenLabsPlugin(
        features.elevenlabs.defaultVoice ? { defaultVoice: features.elevenlabs.defaultVoice } : undefined
      ))
    }
    
    // Storage
    if (features.s3?.enabled) {
      this.plugins.set('s3', new S3Plugin())
    }
    
    if (features.r2?.enabled) {
      this.plugins.set('r2', new R2Plugin())
    }
    
    if (features.cloudinary?.enabled) {
      this.plugins.set('cloudinary', new CloudinaryPlugin())
    }
    
    // Payments
    if (features.stripe?.enabled) {
      this.plugins.set('stripe', new StripePlugin())
    }
    
    if (features.paypal?.enabled) {
      this.plugins.set('paypal', new PayPalPlugin())
    }
    
    // Email
    if (features.sendgrid?.enabled) {
      this.plugins.set('sendgrid', new SendGridPlugin())
    }
    
    if (features.mailgun?.enabled) {
      this.plugins.set('mailgun', new MailgunPlugin())
    }
  }
  
  /**
   * Get all enabled plugins
   */
  getEnabled(): FeaturePlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled)
  }
  
  /**
   * Get plugin by name
   */
  get(name: string): FeaturePlugin | undefined {
    return this.plugins.get(name)
  }
  
  /**
   * Validate all plugins (synchronous)
   */
  validateAll(): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>()
    
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) continue
      
      const result = plugin.validate(this.context)
      results.set(name, result)
      
      // Log validation results
      if (!result.valid) {
        console.error(`\n❌ Plugin '${name}' validation failed:`)
        result.errors.forEach(e => console.error(`   - ${e}`))
      }
      if (result.warnings.length > 0) {
        console.warn(`\n⚠️  Plugin '${name}' warnings:`)
        result.warnings.forEach(w => console.warn(`   - ${w}`))
      }
      if (result.suggestions && result.suggestions.length > 0) {
        console.info(`\n💡 Suggestions:`)
        result.suggestions.forEach(s => console.info(`   ${s}`))
      }
    }
    
    return results
  }
  
  /**
   * Generate code for all plugins (synchronous)
   */
  generateAll(): Map<string, PluginOutput> {
    const outputs = new Map<string, PluginOutput>()
    
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) continue
      
      console.log(`\n🔌 Generating plugin: ${plugin.description}`)
      
      // Validate first
      const validation = plugin.validate(this.context)
      if (!validation.valid) {
        console.error(`   ❌ Validation failed - skipping plugin`)
        continue
      }
      
      // Generate (hooks are optional and will be handled in async context if needed)
      const output = plugin.generate(this.context)
      outputs.set(name, output)
      
      console.log(`   ✅ Generated ${output.files.size} files`)
      console.log(`   ✅ Added ${output.routes.length} routes`)
      console.log(`   ✅ Added ${output.middleware.length} middleware`)
    }
    
    return outputs
  }
  
  /**
   * Get health check sections from all plugins
   */
  getHealthCheckSections(): HealthCheckSection[] {
    return this.getEnabled()
      .filter(p => p.healthCheck)
      .map(p => p.healthCheck!(this.context))
  }
  
  /**
   * Get combined package.json additions
   */
  getPackageJsonAdditions(): {
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
    scripts: Record<string, string>
  } {
    const deps: Record<string, string> = {}
    const devDeps: Record<string, string> = {}
    const scripts: Record<string, string> = {}
    
    for (const plugin of this.getEnabled()) {
      const output = plugin.generate(this.context)
      
      if (output.packageJson?.dependencies) {
        Object.assign(deps, output.packageJson.dependencies)
      }
      if (output.packageJson?.devDependencies) {
        Object.assign(devDeps, output.packageJson.devDependencies)
      }
      if (output.packageJson?.scripts) {
        Object.assign(scripts, output.packageJson.scripts)
      }
    }
    
    return { dependencies: deps, devDependencies: devDeps, scripts }
  }
  
  /**
   * Get combined environment variables
   */
  getEnvironmentVariables(): Record<string, string> {
    const envVars: Record<string, string> = {}
    
    for (const plugin of this.getEnabled()) {
      const output = plugin.generate(this.context)
      Object.assign(envVars, output.envVars)
    }
    
    return envVars
  }
  
  /**
   * Get all routes from plugins
   */
  getAllRoutes(): Array<{ plugin: string, routes: any[] }> {
    const allRoutes: Array<{ plugin: string, routes: any[] }> = []
    
    for (const [name, plugin] of this.plugins) {
      if (!plugin.enabled) continue
      
      const output = plugin.generate(this.context)
      if (output.routes.length > 0) {
        allRoutes.push({ plugin: name, routes: output.routes })
      }
    }
    
    return allRoutes
  }
}

