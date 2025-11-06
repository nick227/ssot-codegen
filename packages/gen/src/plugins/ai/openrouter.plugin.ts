/**
 * OpenRouter Provider Plugin
 * Unified gateway to 100+ AI models
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class OpenRouterPlugin implements FeaturePlugin {
  name = 'openrouter'
  version = '1.0.0'
  description = 'OpenRouter unified AI gateway (100+ models)'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: [] },
    envVars: { required: ['OPENROUTER_API_KEY'], optional: [] },
    dependencies: { runtime: {}, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('ai/providers/openrouter.provider.ts', `// @generated
import type { ChatMessage, ChatOptions, ChatResponse } from '../types/ai.types.js'

export const openrouterProvider = {
  name: 'openrouter',
  type: 'gateway' as const,
  
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const startTime = Date.now()
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000'
      },
      body: JSON.stringify({
        model: options.model || 'anthropic/claude-3-5-sonnet',
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens
      })
    })
    
    const data = await response.json()
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model: data.model,
      finishReason: 'stop',
      provider: 'openrouter',
      latency: Date.now() - startTime
    }
  },
  
  async listModels(): Promise<string[]> {
    return ['anthropic/claude-3-5-sonnet', 'openai/gpt-4-turbo', 'google/gemini-pro']
  },
  
  getInfo() {
    return {
      name: 'OpenRouter',
      type: 'gateway' as const,
      modelsAvailable: 100,
      features: { chat: true, completions: true, embeddings: false, vision: true, functions: true, streaming: true }
    }
  }
}
`)
    
    files.set('ai/services/openrouter.service.ts', `// @generated
import { openrouterProvider } from '../providers/openrouter.provider.js'

export const openrouterService = {
  async chat(prompt: string, options = {}) {
    const response = await openrouterProvider.chat([{ role: 'user', content: prompt }], options)
    return response.content
  }
}
`)
    
    files.set('ai/openrouter.ts', `// @generated
export { openrouterProvider } from './providers/openrouter.provider.js'
export { openrouterService } from './services/openrouter.service.js'
`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { OPENROUTER_API_KEY: 'your-openrouter-key', APP_URL: 'http://localhost:3000' },
      packageJson: { dependencies: {}, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'openrouter',
      title: '🌐 OpenRouter',
      icon: '🌐',
      checks: [{
        id: 'openrouter-key',
        name: 'API Key',
        description: 'Validates OPENROUTER_API_KEY',
        testFunction: `return { success: !!process.env.OPENROUTER_API_KEY, message: process.env.OPENROUTER_API_KEY ? 'Configured' : 'Not set' }`
      }]
    }
  }
}

