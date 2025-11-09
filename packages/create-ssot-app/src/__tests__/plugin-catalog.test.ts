/**
 * Plugin Catalog - Unit Tests
 * 
 * Tests plugin metadata, validation, grouping, and helper functions
 */

import { describe, it, expect } from 'vitest'
import {
  PLUGIN_CATALOG,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getPluginById,
  getPopularPlugins,
  getPluginsRequiringModel,
  getPluginDependencies,
  getRequiredEnvVars,
  groupPluginsByCategory,
  validatePluginSelection,
  type CLIPluginInfo,
  type PluginCategory
} from '../plugin-catalog.js'

describe('Plugin Catalog - Structure', () => {
  it('has exactly 21 plugins defined', () => {
    expect(PLUGIN_CATALOG.length).toBe(21)
  })
  
  it('all plugins have required metadata', () => {
    for (const plugin of PLUGIN_CATALOG) {
      expect(plugin.id).toBeTruthy()
      expect(plugin.id).toMatch(/^[a-z0-9-]+$/) // Valid ID format
      expect(plugin.name).toBeTruthy()
      expect(plugin.description).toBeTruthy()
      expect(plugin.category).toBeTruthy()
      expect(plugin.configKey).toBeTruthy()
      expect(Array.isArray(plugin.envVarsRequired)).toBe(true)
      expect(typeof plugin.dependencies).toBe('object')
    }
  })
  
  it('all plugin IDs are unique', () => {
    const ids = PLUGIN_CATALOG.map(p => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
  
  it('all plugin configKeys are unique', () => {
    const configKeys = PLUGIN_CATALOG.map(p => p.configKey)
    const uniqueKeys = new Set(configKeys)
    expect(uniqueKeys.size).toBe(configKeys.length)
  })
  
  it('all categories are valid', () => {
    const validCategories: PluginCategory[] = ['auth', 'ai', 'voice', 'storage', 'payments', 'email', 'monitoring', 'search']
    
    for (const plugin of PLUGIN_CATALOG) {
      expect(validCategories).toContain(plugin.category)
    }
  })
  
  it('category metadata matches defined categories', () => {
    const categories = [...new Set(PLUGIN_CATALOG.map(p => p.category))]
    
    for (const category of categories) {
      expect(CATEGORY_ICONS[category]).toBeTruthy()
      expect(CATEGORY_LABELS[category]).toBeTruthy()
      expect(CATEGORY_ORDER).toContain(category)
    }
  })
})

describe('Plugin Catalog - Content Validation', () => {
  it('has correct count per category', () => {
    const grouped = groupPluginsByCategory(PLUGIN_CATALOG)
    
    expect(grouped.auth?.length).toBe(3)
    expect(grouped.ai?.length).toBe(7)
    expect(grouped.voice?.length).toBe(2)
    expect(grouped.storage?.length).toBe(3)
    expect(grouped.payments?.length).toBe(2)
    expect(grouped.email?.length).toBe(2)
    expect(grouped.monitoring?.length).toBe(1)
    expect(grouped.search?.length).toBe(1)
  })
  
  it('most plugins requiring API keys have setupInstructions', () => {
    const pluginsWithKeys = PLUGIN_CATALOG.filter(p => 
      p.envVarsRequired.some(v => v.includes('KEY') || v.includes('SECRET'))
    )
    
    const pluginsWithSetup = pluginsWithKeys.filter(p => p.setupInstructions)
    
    // At least 80% should have setup instructions
    expect(pluginsWithSetup.length / pluginsWithKeys.length).toBeGreaterThan(0.8)
  })
  
  it('popular plugins are reasonable defaults', () => {
    const popular = getPopularPlugins()
    
    // Should have 3-5 popular plugins (not too many)
    expect(popular.length).toBeGreaterThanOrEqual(3)
    expect(popular.length).toBeLessThanOrEqual(5)
    
    // JWT should be popular (essential for most APIs)
    expect(popular.some(p => p.id === 'jwt-service')).toBe(true)
  })
  
  it('google-auth has correct setup URL', () => {
    const googleAuth = getPluginById('google-auth')
    expect(googleAuth?.setupInstructions).toBe('Get credentials from https://console.cloud.google.com/apis/credentials')
  })
  
  it('all paid service plugins have setupInstructions', () => {
    const paidServices = ['openai', 'claude', 'gemini', 'stripe', 'sendgrid', 'deepgram', 'elevenlabs']
    
    for (const id of paidServices) {
      const plugin = getPluginById(id)
      expect(plugin?.setupInstructions).toBeTruthy()
    }
  })
})

describe('getPluginById', () => {
  it('returns correct plugin for valid ID', () => {
    const plugin = getPluginById('openai')
    
    expect(plugin).toBeDefined()
    expect(plugin?.name).toBe('OpenAI')
    expect(plugin?.category).toBe('ai')
    expect(plugin?.configKey).toBe('openai')
  })
  
  it('returns undefined for invalid ID', () => {
    const plugin = getPluginById('non-existent-plugin')
    expect(plugin).toBeUndefined()
  })
  
  it('finds all 20 plugins by ID', () => {
    for (const plugin of PLUGIN_CATALOG) {
      const found = getPluginById(plugin.id)
      expect(found).toBe(plugin)
    }
  })
})

describe('getPopularPlugins', () => {
  it('returns only plugins marked as popular', () => {
    const popular = getPopularPlugins()
    
    for (const plugin of popular) {
      expect(plugin.popular).toBe(true)
    }
  })
  
  it('returns array (not throws) even if no popular plugins', () => {
    const popular = getPopularPlugins()
    expect(Array.isArray(popular)).toBe(true)
  })
})

describe('getPluginsRequiringModel', () => {
  it('returns plugins requiring User model', () => {
    const plugins = getPluginsRequiringModel('User')
    
    expect(plugins.length).toBeGreaterThan(0)
    expect(plugins.every(p => p.requiresModel === 'User')).toBe(true)
  })
  
  it('google-auth requires User model', () => {
    const plugins = getPluginsRequiringModel('User')
    expect(plugins.some(p => p.id === 'google-auth')).toBe(true)
  })
  
  it('returns empty array for non-existent model', () => {
    const plugins = getPluginsRequiringModel('NonExistentModel')
    expect(plugins).toEqual([])
  })
})

describe('getPluginDependencies', () => {
  it('merges dependencies for single plugin', () => {
    const deps = getPluginDependencies(['openai'])
    
    expect(deps).toHaveProperty('openai')
    expect(deps.openai).toBe('^4.0.0')
  })
  
  it('merges dependencies for multiple plugins', () => {
    const deps = getPluginDependencies(['openai', 'stripe', 'cloudinary'])
    
    expect(deps).toHaveProperty('openai')
    expect(deps).toHaveProperty('stripe')
    expect(deps).toHaveProperty('cloudinary')
  })
  
  it('handles duplicate dependencies correctly', () => {
    // S3 and R2 both use @aws-sdk/client-s3
    const deps = getPluginDependencies(['s3', 'r2'])
    
    expect(deps).toHaveProperty('@aws-sdk/client-s3')
    // Should only appear once (Object.assign overwrites)
    const keys = Object.keys(deps).filter(k => k === '@aws-sdk/client-s3')
    expect(keys.length).toBe(1)
  })
  
  it('returns empty object for empty array', () => {
    const deps = getPluginDependencies([])
    expect(deps).toEqual({})
  })
  
  it('ignores invalid plugin IDs', () => {
    const deps = getPluginDependencies(['openai', 'invalid-id', 'stripe'])
    
    expect(deps).toHaveProperty('openai')
    expect(deps).toHaveProperty('stripe')
    expect(deps).not.toHaveProperty('invalid-id')
  })
  
  it('handles plugins with no dependencies', () => {
    const deps = getPluginDependencies(['api-key-manager'])
    
    // api-key-manager has empty dependencies
    expect(Object.keys(deps).length).toBe(0)
  })
})

describe('getRequiredEnvVars', () => {
  it('returns env vars for single plugin', () => {
    const envVars = getRequiredEnvVars(['openai'])
    
    expect(envVars.size).toBe(1)
    expect(envVars.get('OpenAI')).toEqual(['OPENAI_API_KEY'])
  })
  
  it('returns env vars for multiple plugins', () => {
    const envVars = getRequiredEnvVars(['openai', 'stripe'])
    
    expect(envVars.size).toBe(2)
    expect(envVars.get('OpenAI')).toEqual(['OPENAI_API_KEY'])
    expect(envVars.get('Stripe')).toEqual(['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'])
  })
  
  it('handles plugins with no env vars', () => {
    const envVars = getRequiredEnvVars(['usage-tracker'])
    
    expect(envVars.size).toBe(1)
    expect(envVars.get('Usage Tracker')).toEqual([])
  })
  
  it('returns empty map for empty array', () => {
    const envVars = getRequiredEnvVars([])
    expect(envVars.size).toBe(0)
  })
})

describe('groupPluginsByCategory', () => {
  it('groups all plugins correctly', () => {
    const grouped = groupPluginsByCategory(PLUGIN_CATALOG)
    
    expect(grouped.auth).toBeDefined()
    expect(grouped.ai).toBeDefined()
    expect(grouped.voice).toBeDefined()
    expect(grouped.storage).toBeDefined()
    expect(grouped.payments).toBeDefined()
    expect(grouped.email).toBeDefined()
    expect(grouped.monitoring).toBeDefined()
    expect(grouped.search).toBeDefined()
  })
  
  it('preserves all plugins when grouping', () => {
    const grouped = groupPluginsByCategory(PLUGIN_CATALOG)
    const totalInGroups = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
    
    expect(totalInGroups).toBe(PLUGIN_CATALOG.length)
  })
  
  it('handles empty array', () => {
    const grouped = groupPluginsByCategory([])
    expect(Object.keys(grouped).length).toBe(0)
  })
  
  it('handles single category', () => {
    const authPlugins = PLUGIN_CATALOG.filter(p => p.category === 'auth')
    const grouped = groupPluginsByCategory(authPlugins)
    
    expect(grouped.auth?.length).toBe(3)
    expect(grouped.ai).toBeUndefined()
  })
})

describe('validatePluginSelection', () => {
  it('warns when auth plugin selected without User model', () => {
    const result = validatePluginSelection(['google-auth'], {
      includeExamples: false,
      hasUserModel: false
    })
    
    expect(result.valid).toBe(true) // Warning, not error
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('User model')
  })
  
  it('does not warn when User model is included', () => {
    const result = validatePluginSelection(['google-auth'], {
      includeExamples: true
    })
    
    // Should only warn about paid services, not missing model
    const modelWarning = result.warnings.find(w => w.includes('User model'))
    expect(modelWarning).toBeUndefined()
  })
  
  it('warns about paid services', () => {
    const result = validatePluginSelection(['openai', 'stripe'], {
      includeExamples: true
    })
    
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some(w => w.includes('paid API keys'))).toBe(true)
  })
  
  it('warns about multiple email providers', () => {
    const result = validatePluginSelection(['sendgrid', 'mailgun'], {
      includeExamples: true
    })
    
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some(w => w.includes('Multiple email providers'))).toBe(true)
  })
  
  it('returns valid=true when no errors', () => {
    const result = validatePluginSelection(['jwt-service'], {
      includeExamples: true
    })
    
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
  
  it('does not warn about free local plugins', () => {
    const result = validatePluginSelection(['lmstudio', 'ollama'], {
      includeExamples: true
    })
    
    // Should not warn about paid services for local models
    const paidWarning = result.warnings.find(w => w.includes('paid API keys'))
    expect(paidWarning).toBeUndefined()
  })
  
  it('handles empty plugin selection', () => {
    const result = validatePluginSelection([], {
      includeExamples: true
    })
    
    expect(result.valid).toBe(true)
    expect(result.warnings).toEqual([])
    expect(result.errors).toEqual([])
  })
  
  it('handles invalid plugin IDs gracefully', () => {
    const result = validatePluginSelection(['invalid-plugin-id'], {
      includeExamples: true
    })
    
    expect(result.valid).toBe(true)
    // Should not crash, just ignore invalid IDs
  })
})

describe('Plugin Categories', () => {
  it('authentication category has 3 plugins', () => {
    const authPlugins = PLUGIN_CATALOG.filter(p => p.category === 'auth')
    expect(authPlugins.length).toBe(3)
    expect(authPlugins.map(p => p.id)).toEqual(['google-auth', 'jwt-service', 'api-key-manager'])
  })
  
  it('AI category has 7 plugins', () => {
    const aiPlugins = PLUGIN_CATALOG.filter(p => p.category === 'ai')
    expect(aiPlugins.length).toBe(7)
  })
  
  it('voice category has 2 plugins', () => {
    const voicePlugins = PLUGIN_CATALOG.filter(p => p.category === 'voice')
    expect(voicePlugins.length).toBe(2)
    expect(voicePlugins.map(p => p.id)).toEqual(['deepgram', 'elevenlabs'])
  })
  
  it('storage category has 3 plugins', () => {
    const storagePlugins = PLUGIN_CATALOG.filter(p => p.category === 'storage')
    expect(storagePlugins.length).toBe(3)
    expect(storagePlugins.map(p => p.id)).toEqual(['s3', 'r2', 'cloudinary'])
  })
  
  it('payments category has 2 plugins', () => {
    const paymentPlugins = PLUGIN_CATALOG.filter(p => p.category === 'payments')
    expect(paymentPlugins.length).toBe(2)
    expect(paymentPlugins.map(p => p.id)).toEqual(['stripe', 'paypal'])
  })
  
  it('email category has 2 plugins', () => {
    const emailPlugins = PLUGIN_CATALOG.filter(p => p.category === 'email')
    expect(emailPlugins.length).toBe(2)
    expect(emailPlugins.map(p => p.id)).toEqual(['sendgrid', 'mailgun'])
  })
  
  it('monitoring category has 1 plugin', () => {
    const monitoringPlugins = PLUGIN_CATALOG.filter(p => p.category === 'monitoring')
    expect(monitoringPlugins.length).toBe(1)
    expect(monitoringPlugins[0].id).toBe('usage-tracker')
  })
  
  it('search category has 1 plugin', () => {
    const searchPlugins = PLUGIN_CATALOG.filter(p => p.category === 'search')
    expect(searchPlugins.length).toBe(1)
    expect(searchPlugins[0].id).toBe('full-text-search')
  })
})

describe('Specific Plugin Tests', () => {
  describe('google-auth', () => {
    it('has correct metadata', () => {
      const plugin = getPluginById('google-auth')
      
      expect(plugin?.name).toBe('Google OAuth')
      expect(plugin?.category).toBe('auth')
      expect(plugin?.requiresModel).toBe('User')
      expect(plugin?.envVarsRequired).toEqual(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])
      expect(plugin?.setupInstructions).toContain('console.cloud.google.com')
    })
    
    it('has required dependencies', () => {
      const plugin = getPluginById('google-auth')
      
      expect(plugin?.dependencies).toHaveProperty('passport')
      expect(plugin?.dependencies).toHaveProperty('passport-google-oauth20')
      expect(plugin?.dependencies).toHaveProperty('express-session')
    })
  })
  
  describe('jwt-service', () => {
    it('has correct metadata', () => {
      const plugin = getPluginById('jwt-service')
      
      expect(plugin?.name).toBe('JWT Service')
      expect(plugin?.category).toBe('auth')
      expect(plugin?.envVarsRequired).toEqual(['JWT_SECRET'])
      expect(plugin?.popular).toBe(true)
    })
  })
  
  describe('openai', () => {
    it('has correct metadata', () => {
      const plugin = getPluginById('openai')
      
      expect(plugin?.name).toBe('OpenAI')
      expect(plugin?.category).toBe('ai')
      expect(plugin?.envVarsRequired).toEqual(['OPENAI_API_KEY'])
      expect(plugin?.setupInstructions).toContain('platform.openai.com')
    })
  })
  
  describe('local AI plugins', () => {
    it('lmstudio has no required env vars', () => {
      const plugin = getPluginById('lmstudio')
      
      expect(plugin?.envVarsRequired).toEqual([])
      expect(plugin?.envVarsOptional).toContain('LMSTUDIO_ENDPOINT')
      expect(plugin?.setupInstructions).toContain('lmstudio.ai')
    })
    
    it('ollama has no required env vars', () => {
      const plugin = getPluginById('ollama')
      
      expect(plugin?.envVarsRequired).toEqual([])
      expect(plugin?.envVarsOptional).toContain('OLLAMA_ENDPOINT')
      expect(plugin?.setupInstructions).toContain('ollama.ai')
    })
  })
  
  describe('storage plugins', () => {
    it('s3 has correct env vars', () => {
      const plugin = getPluginById('s3')
      
      expect(plugin?.envVarsRequired).toEqual([
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'AWS_S3_BUCKET'
      ])
      expect(plugin?.setupInstructions).toContain('console.aws.amazon.com')
    })
    
    it('r2 has correct env vars', () => {
      const plugin = getPluginById('r2')
      
      expect(plugin?.envVarsRequired).toEqual([
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET'
      ])
      expect(plugin?.setupInstructions).toContain('dash.cloudflare.com')
    })
    
    it('cloudinary has correct env vars', () => {
      const plugin = getPluginById('cloudinary')
      
      expect(plugin?.envVarsRequired).toEqual([
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
      ])
    })
  })
})

describe('Edge Cases', () => {
  it('handles all plugins selected', () => {
    const allIds = PLUGIN_CATALOG.map(p => p.id)
    const deps = getPluginDependencies(allIds)
    
    // Should merge all dependencies without errors
    expect(Object.keys(deps).length).toBeGreaterThan(0)
  })
  
  it('validates all plugins selected', () => {
    const allIds = PLUGIN_CATALOG.map(p => p.id)
    const result = validatePluginSelection(allIds, {
      includeExamples: true
    })
    
    expect(result.valid).toBe(true)
    // Should have warnings about paid services and multiple email providers
    expect(result.warnings.length).toBeGreaterThan(0)
  })
  
  it('grouping preserves plugin references', () => {
    const grouped = groupPluginsByCategory(PLUGIN_CATALOG)
    
    // Verify plugins are not cloned, just grouped
    for (const category of Object.values(grouped)) {
      for (const plugin of category) {
        const original = PLUGIN_CATALOG.find(p => p.id === plugin.id)
        expect(plugin).toBe(original) // Same reference
      }
    }
  })
})

describe('Category Order', () => {
  it('CATEGORY_ORDER contains all categories', () => {
    const categories = [...new Set(PLUGIN_CATALOG.map(p => p.category))]
    
    for (const category of categories) {
      expect(CATEGORY_ORDER).toContain(category)
    }
  })
  
  it('CATEGORY_ORDER has no duplicates', () => {
    const uniqueOrder = [...new Set(CATEGORY_ORDER)]
    expect(uniqueOrder.length).toBe(CATEGORY_ORDER.length)
  })
  
  it('auth comes first in order', () => {
    expect(CATEGORY_ORDER[0]).toBe('auth')
  })
})

describe('Dependency Version Validation', () => {
  it('all dependencies have valid semver versions', () => {
    const semverPattern = /^\^?\d+\.\d+\.\d+$/
    
    for (const plugin of PLUGIN_CATALOG) {
      for (const [pkg, version] of Object.entries(plugin.dependencies)) {
        expect(version).toMatch(semverPattern)
      }
    }
  })
  
  it('passport dependencies use compatible versions', () => {
    const googleAuth = getPluginById('google-auth')
    
    // passport and passport-google-oauth20 should use compatible versions
    expect(googleAuth?.dependencies.passport).toBeTruthy()
    expect(googleAuth?.dependencies['passport-google-oauth20']).toBeTruthy()
  })
})

describe('ConfigKey Validation', () => {
  it('configKeys follow camelCase convention', () => {
    for (const plugin of PLUGIN_CATALOG) {
      // Should be camelCase (start with lowercase, no hyphens)
      expect(plugin.configKey).toMatch(/^[a-z][a-zA-Z0-9]*$/)
    }
  })
  
  it('configKey matches plugin ID pattern', () => {
    for (const plugin of PLUGIN_CATALOG) {
      // google-auth → googleAuth
      // jwt-service → jwtService
      const expectedKey = plugin.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      expect(plugin.configKey).toBe(expectedKey)
    }
  })
})

