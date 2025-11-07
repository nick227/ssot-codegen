/**
 * Plugin Configuration Loader
 * 
 * Loads plugin configuration from multiple sources:
 * 1. ssot.config.ts/js (preferred)
 * 2. Environment variables (fallback)
 * 3. package.json "ssot" field (optional)
 */

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { PluginFeatureConfig } from '../plugins/plugin-manager.js'

export interface PluginConfigFile {
  features?: PluginFeatureConfig
}

/**
 * Load plugin configuration from file system
 * 
 * Looks for config files in order:
 * 1. ssot.config.ts
 * 2. ssot.config.js
 * 3. ssot.config.json
 * 4. package.json "ssot" field
 */
export async function loadPluginConfig(projectRoot: string = process.cwd()): Promise<PluginFeatureConfig | undefined> {
  // Try TypeScript config
  const tsConfig = path.join(projectRoot, 'ssot.config.ts')
  if (fs.existsSync(tsConfig)) {
    return await loadTsConfig(tsConfig)
  }
  
  // Try JavaScript config
  const jsConfig = path.join(projectRoot, 'ssot.config.js')
  if (fs.existsSync(jsConfig)) {
    return await loadJsConfig(jsConfig)
  }
  
  // Try JSON config
  const jsonConfig = path.join(projectRoot, 'ssot.config.json')
  if (fs.existsSync(jsonConfig)) {
    return loadJsonConfig(jsonConfig)
  }
  
  // Try package.json
  const pkgJson = path.join(projectRoot, 'package.json')
  if (fs.existsSync(pkgJson)) {
    return loadPackageJsonConfig(pkgJson)
  }
  
  return undefined
}

/**
 * Load TypeScript config (requires ts-node or tsx)
 */
async function loadTsConfig(filePath: string): Promise<PluginFeatureConfig | undefined> {
  try {
    // Dynamic import for ESM compatibility
    const fileUrl = pathToFileURL(filePath).href
    const module = await import(fileUrl)
    const config = module.default || module
    return config.features
  } catch (error) {
    console.warn(`⚠️  Failed to load ${filePath}:`, (error as Error).message)
    return undefined
  }
}

/**
 * Load JavaScript config
 */
async function loadJsConfig(filePath: string): Promise<PluginFeatureConfig | undefined> {
  try {
    const fileUrl = pathToFileURL(filePath).href
    const module = await import(fileUrl)
    const config = module.default || module
    return config.features
  } catch (error) {
    console.warn(`⚠️  Failed to load ${filePath}:`, (error as Error).message)
    return undefined
  }
}

/**
 * Load JSON config
 */
function loadJsonConfig(filePath: string): PluginFeatureConfig | undefined {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const config = JSON.parse(content) as PluginConfigFile
    return config.features
  } catch (error) {
    console.warn(`⚠️  Failed to load ${filePath}:`, (error as Error).message)
    return undefined
  }
}

/**
 * Load from package.json "ssot" field
 */
function loadPackageJsonConfig(filePath: string): PluginFeatureConfig | undefined {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const pkg = JSON.parse(content)
    return pkg.ssot?.features
  } catch (error) {
    return undefined
  }
}

/**
 * Load plugin configuration from environment variables
 * 
 * Format: SSOT_PLUGIN_<PLUGIN_NAME>_<SETTING>=value
 * 
 * Examples:
 * - SSOT_PLUGIN_OPENAI_ENABLED=true
 * - SSOT_PLUGIN_OPENAI_DEFAULT_MODEL=gpt-4
 * - SSOT_PLUGIN_STRIPE_ENABLED=true
 */
export function loadPluginConfigFromEnv(): PluginFeatureConfig {
  const features: PluginFeatureConfig = {}
  
  // Google Auth (legacy format for backward compatibility)
  if (process.env.ENABLE_GOOGLE_AUTH === 'true') {
    features.googleAuth = {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      strategy: (process.env.AUTH_STRATEGY as 'jwt' | 'session') || 'jwt',
      userModel: process.env.AUTH_USER_MODEL || 'User'
    }
  }
  
  // OpenAI
  if (process.env.SSOT_PLUGIN_OPENAI_ENABLED === 'true') {
    features.openai = {
      enabled: true,
      defaultModel: process.env.SSOT_PLUGIN_OPENAI_DEFAULT_MODEL || 'gpt-4-turbo'
    }
  }
  
  // Claude
  if (process.env.SSOT_PLUGIN_CLAUDE_ENABLED === 'true') {
    features.claude = {
      enabled: true,
      defaultModel: process.env.SSOT_PLUGIN_CLAUDE_DEFAULT_MODEL || 'claude-3-sonnet-20240229'
    }
  }
  
  // Stripe
  if (process.env.SSOT_PLUGIN_STRIPE_ENABLED === 'true') {
    features.stripe = {
      enabled: true
    }
  }
  
  // S3
  if (process.env.SSOT_PLUGIN_S3_ENABLED === 'true') {
    features.s3 = {
      enabled: true,
      region: process.env.SSOT_PLUGIN_S3_REGION,
      bucket: process.env.SSOT_PLUGIN_S3_BUCKET
    }
  }
  
  // SendGrid
  if (process.env.SSOT_PLUGIN_SENDGRID_ENABLED === 'true') {
    features.sendgrid = {
      enabled: true,
      fromEmail: process.env.SSOT_PLUGIN_SENDGRID_FROM_EMAIL
    }
  }
  
  return features
}

/**
 * Merge configuration from multiple sources
 * 
 * Priority (highest to lowest):
 * 1. Explicit config passed to function
 * 2. Config file (ssot.config.ts/js/json)
 * 3. Environment variables
 */
export async function mergePluginConfig(
  explicitConfig?: PluginFeatureConfig,
  projectRoot?: string
): Promise<PluginFeatureConfig> {
  const envConfig = loadPluginConfigFromEnv()
  const fileConfig = await loadPluginConfig(projectRoot)
  
  // Merge: explicit > file > env
  return {
    ...envConfig,
    ...fileConfig,
    ...explicitConfig
  }
}

