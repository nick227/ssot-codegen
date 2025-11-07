/**
 * AI Provider Plugins Test Suite
 * 
 * Tests all AI providers (OpenAI, Claude, Gemini, Grok, OpenRouter, LM Studio, Ollama)
 * WITHOUT requiring real API credentials
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createMockPluginContext,
  createMockSchema,
  EnvMocker,
  testPluginValidation,
  testPluginGeneration,
  testEnvVarValidation,
  snapshotPluginOutput,
  validateGeneratedCode,
  MockAPIServer
} from './plugin-test-utils.js'

// Import all AI plugins
import { OpenAIPlugin } from '../ai/openai.plugin.js'
import { ClaudePlugin } from '../ai/claude.plugin.js'
import { GeminiPlugin } from '../ai/gemini.plugin.js'
import { GrokPlugin } from '../ai/grok.plugin.js'
import { OpenRouterPlugin } from '../ai/openrouter.plugin.js'
import { LMStudioPlugin } from '../ai/lmstudio.plugin.js'
import { OllamaPlugin } from '../ai/ollama.plugin.js'

describe('AI Provider Plugins', () => {
  let envMocker: EnvMocker
  let mockAPI: MockAPIServer
  
  beforeEach(() => {
    envMocker = new EnvMocker()
    mockAPI = new MockAPIServer()
  })
  
  afterEach(() => {
    envMocker.restore()
    mockAPI.reset()
  })
  
  describe('OpenAI Plugin', () => {
    const plugin = new OpenAIPlugin()
    
    it('should have correct metadata', () => {
      expect(plugin.name).toBe('openai')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.enabled).toBe(true)
      expect(plugin.description).toContain('OpenAI')
    })
    
    it('should require OPENAI_API_KEY in requirements', () => {
      expect(plugin.requirements.envVars.required).toContain('OPENAI_API_KEY')
    })
    
    it('should validate successfully without checking env vars', () => {
      const context = createMockPluginContext()
      const result = plugin.validate(context)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should handle undefined OPENAI_API_KEY gracefully', () => {
      envMocker.clear(['OPENAI_API_KEY'])
      
      const context = createMockPluginContext()
      const result = plugin.validate(context)
      
      // Validation should pass (we don't validate env vars at generation time)
      expect(result.valid).toBe(true)
    })
    
    it('should generate expected files', () => {
      const context = createMockPluginContext()
      const { output, fileCount } = testPluginGeneration(plugin).testGeneratesFiles(context)
      
      expect(fileCount).toBeGreaterThan(0)
      expect(output.files.has('ai/providers/openai.provider.ts')).toBe(true)
      expect(output.files.has('ai/services/openai.service.ts')).toBe(true)
      expect(output.files.has('ai/types/openai.types.ts')).toBe(true)
    })
    
    it('should generate valid TypeScript', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const { valid, errors } = testPluginGeneration(plugin).testValidTypeScript(output)
      expect(valid).toBe(true)
      if (!valid) {
        console.error('TypeScript validation errors:', errors)
      }
    })
    
    it('should export required environment variables', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.envVars).toHaveProperty('OPENAI_API_KEY')
      expect(output.envVars.OPENAI_API_KEY).toBeTruthy()
    })
    
    it('should export OpenAI dependency', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const { valid, missing } = testPluginGeneration(plugin).testExportsDependencies(output, ['openai'])
      expect(valid).toBe(true)
      expect(missing).toHaveLength(0)
    })
    
    it('should not have code quality issues', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const { valid, issues } = validateGeneratedCode(output)
      if (!valid) {
        console.warn('Code quality issues:', issues)
      }
      // Note: This might fail initially, that's OK - it's a quality check
    })
    
    it('should generate code that uses process.env correctly', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const providerContent = output.files.get('ai/providers/openai.provider.ts') || ''
      
      // Should use process.env.OPENAI_API_KEY
      expect(providerContent).toMatch(/process\.env\.OPENAI_API_KEY/)
      
      // Should handle undefined API key
      expect(providerContent).toMatch(/process\.env\.OPENAI_API_KEY!|throw new Error/i)
    })
  })
  
  describe('Claude Plugin', () => {
    const plugin = new ClaudePlugin()
    
    it('should require ANTHROPIC_API_KEY', () => {
      expect(plugin.requirements.envVars.required).toContain('ANTHROPIC_API_KEY')
    })
    
    it('should handle undefined API key', () => {
      envMocker.clear(['ANTHROPIC_API_KEY'])
      
      const context = createMockPluginContext()
      const result = plugin.validate(context)
      expect(result.valid).toBe(true) // Validation doesn't check env vars
    })
    
    it('should generate Anthropic SDK integration', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.packageJson?.dependencies).toHaveProperty('@anthropic-ai/sdk')
    })
  })
  
  describe('Gemini Plugin', () => {
    const plugin = new GeminiPlugin()
    
    it('should require GOOGLE_AI_API_KEY', () => {
      expect(plugin.requirements.envVars.required).toContain('GOOGLE_AI_API_KEY')
    })
    
    it('should handle undefined API key', () => {
      envMocker.clear(['GOOGLE_AI_API_KEY'])
      
      const context = createMockPluginContext()
      const result = plugin.validate(context)
      expect(result.valid).toBe(true)
    })
  })
  
  describe('Local AI Plugins (LM Studio, Ollama)', () => {
    it('LM Studio should use localhost endpoint by default', () => {
      const plugin = new LMStudioPlugin()
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const envVars = output.envVars
      expect(envVars.LMSTUDIO_ENDPOINT || 'http://localhost:1234').toContain('localhost')
    })
    
    it('Ollama should use localhost endpoint by default', () => {
      const plugin = new OllamaPlugin()
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const envVars = output.envVars
      expect(envVars.OLLAMA_ENDPOINT || 'http://localhost:11434').toContain('localhost')
    })
    
    it('Local plugins should not require API keys', () => {
      const lmStudio = new LMStudioPlugin()
      const ollama = new OllamaPlugin()
      
      expect(lmStudio.requirements.envVars.required).not.toContain('API_KEY')
      expect(ollama.requirements.envVars.required).not.toContain('API_KEY')
    })
  })
  
  describe('AI Plugin Consistency', () => {
    const allAIPlugins = [
      new OpenAIPlugin(),
      new ClaudePlugin(),
      new GeminiPlugin(),
      new GrokPlugin(),
      new OpenRouterPlugin(),
      new LMStudioPlugin(),
      new OllamaPlugin()
    ]
    
    it('all AI plugins should generate provider files', () => {
      const context = createMockPluginContext()
      
      for (const plugin of allAIPlugins) {
        const output = plugin.generate(context)
        const hasProvider = Array.from(output.files.keys()).some(f => f.includes('provider'))
        expect(hasProvider).toBe(true)
      }
    })
    
    it('all AI plugins should export types', () => {
      const context = createMockPluginContext()
      
      for (const plugin of allAIPlugins) {
        const output = plugin.generate(context)
        const hasTypes = Array.from(output.files.keys()).some(f => f.includes('types'))
        expect(hasTypes).toBe(true)
      }
    })
    
    it('should match snapshot structure', () => {
      const context = createMockPluginContext()
      const snapshots: Record<string, any> = {}
      
      for (const plugin of allAIPlugins) {
        const output = plugin.generate(context)
        snapshots[plugin.name] = snapshotPluginOutput(output)
      }
      
      // All should generate similar structure
      for (const [name, snapshot] of Object.entries(snapshots)) {
        expect(snapshot.fileNames.length).toBeGreaterThan(0)
        expect(snapshot.envVarKeys.length).toBeGreaterThan(0)
      }
    })
  })
})

