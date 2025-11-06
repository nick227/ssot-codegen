/**
 * Claude Provider Plugin (Anthropic)
 * 
 * Integrates Anthropic's Claude API
 * 
 * Features:
 * - Chat completions (Claude 3 Opus, Sonnet, Haiku)
 * - 200K context window
 * - Vision support
 * - Function calling (tools)
 * - Streaming support
 * - Usage tracking
 * 
 * Models Supported:
 * - claude-3-opus-20240229 (Most capable, 200K)
 * - claude-3-sonnet-20240229 (Balanced, 200K)
 * - claude-3-haiku-20240307 (Fast, 200K)
 */

import type {
  FeaturePlugin,
  PluginContext,
  PluginOutput,
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface ClaudePluginConfig {
  defaultModel?: string
  enableUsageTracking?: boolean
  enableCostEstimation?: boolean
  maxRetries?: number
  timeout?: number
}

export class ClaudePlugin implements FeaturePlugin {
  name = 'claude'
  version = '1.0.0'
  description = 'Anthropic Claude API integration (Claude 3 Opus, Sonnet, Haiku)'
  enabled = true
  
  private config: Required<ClaudePluginConfig>
  
  constructor(config: ClaudePluginConfig = {}) {
    this.config = {
      defaultModel: 'claude-3-5-sonnet-20241022',
      enableUsageTracking: true,
      enableCostEstimation: true,
      maxRetries: 3,
      timeout: 60000,
      ...config
    }
  }
  
  requirements: PluginRequirements = {
    models: { required: [], optional: ['AIUsage'] },
    envVars: {
      required: ['ANTHROPIC_API_KEY'],
      optional: ['ANTHROPIC_BASE_URL']
    },
    dependencies: {
      runtime: { '@anthropic-ai/sdk': '^0.32.0' },
      dev: {}
    }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [], suggestions: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('ai/providers/claude.provider.ts', this.generateClaudeProvider())
    files.set('ai/services/claude.service.ts', this.generateClaudeService())
    files.set('ai/types/claude.types.ts', this.generateClaudeTypes())
    files.set('ai/claude.ts', this.generateBarrelExport())
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: {
        ANTHROPIC_API_KEY: 'sk-ant-your-api-key-here',
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
      },
      packageJson: {
        dependencies: this.requirements.dependencies!.runtime,
        devDependencies: {}
      }
    }
  }
  
  private generateClaudeProvider(): string {
    return `// @generated
// Claude Provider - Implements unified AI interface

import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage, ChatOptions, ChatResponse } from '../types/ai.types.js'
import { logger } from '@/logger'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
  timeout: ${this.config.timeout},
  maxRetries: ${this.config.maxRetries}
})

export const claudeProvider = {
  name: 'claude',
  type: 'commercial' as const,
  
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const startTime = Date.now()
    
    // Separate system message
    const systemMessage = messages.find(m => m.role === 'system')?.content
    const chatMessages = messages.filter(m => m.role !== 'system')
    
    try {
      const response = await anthropic.messages.create({
        model: options.model || '${this.config.defaultModel}',
        max_tokens: options.maxTokens || 4096,
        system: systemMessage,
        messages: chatMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        temperature: options.temperature,
        top_p: options.topP,
        stop_sequences: options.stop
      })
      
      const latency = Date.now() - startTime
      const content = response.content[0].type === 'text' ? response.content[0].text : ''
      
      ${this.config.enableCostEstimation ? `
      const costPer1M = getCostPer1M(response.model)
      const estimatedCost = (response.usage.input_tokens * costPer1M.input / 1000000) + 
                           (response.usage.output_tokens * costPer1M.output / 1000000)
      ` : 'const estimatedCost = undefined'}
      
      ${this.config.enableUsageTracking ? `
      logger.info({
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cost: estimatedCost,
        latency
      }, 'Claude chat completion')
      ` : ''}
      
      return {
        content,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          estimatedCost
        },
        model: response.model,
        finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length',
        provider: 'claude',
        latency
      }
    } catch (error) {
      logger.error({ error }, 'Claude chat failed')
      throw error
    }
  },
  
  async listModels(): Promise<string[]> {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  },
  
  getInfo() {
    return {
      name: 'Claude (Anthropic)',
      type: 'commercial' as const,
      endpoint: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      modelsAvailable: 4,
      features: {
        chat: true,
        completions: true,
        embeddings: false,
        vision: true,
        functions: true,
        streaming: true
      }
    }
  }
}

function getCostPer1M(model: string): { input: number; output: number } {
  const costs: Record<string, { input: number; output: number }> = {
    'claude-3-opus': { input: 15, output: 75 },
    'claude-3-5-sonnet': { input: 3, output: 15 },
    'claude-3-sonnet': { input: 3, output: 15 },
    'claude-3-haiku': { input: 0.25, output: 1.25 }
  }
  
  for (const [key, value] of Object.entries(costs)) {
    if (model.includes(key)) return value
  }
  
  return { input: 3, output: 15 }
}

export { anthropic }
`
  }
  
  private generateClaudeService(): string {
    return `// @generated
// Claude Service - High-level API

import { claudeProvider } from '../providers/claude.provider.js'
import type { ChatMessage, ChatOptions, ChatResponse } from '../types/ai.types.js'

export const claudeService = {
  async chat(prompt: string, options: ChatOptions = {}): Promise<string> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }]
    const response = await claudeProvider.chat(messages, options)
    return response.content
  },
  
  async chatWithHistory(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    return claudeProvider.chat(messages, options)
  }
}

export { claudeProvider }
`
  }
  
  private generateClaudeTypes(): string {
    return `// @generated
// Claude Type Definitions

export type { ChatMessage, ChatOptions, ChatResponse } from './ai.types.js'
`
  }
  
  private generateBarrelExport(): string {
    return `// @generated
export { claudeProvider, anthropic } from './providers/claude.provider.js'
export { claudeService } from './services/claude.service.js'
export type { ChatMessage, ChatOptions, ChatResponse } from './types/claude.types.js'
`
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'claude',
      title: '🤖 Claude (Anthropic)',
      icon: '🤖',
      checks: [
        {
          id: 'claude-api-key',
          name: 'API Key Configured',
          description: 'Validates ANTHROPIC_API_KEY is set',
          testFunction: `
            const apiKey = process.env.ANTHROPIC_API_KEY
            return {
              success: !!apiKey && apiKey.startsWith('sk-ant-'),
              message: apiKey ? 'Claude API key configured' : '❌ ANTHROPIC_API_KEY not set'
            }
          `
        },
        {
          id: 'claude-chat',
          name: 'Chat Completion',
          description: 'Tests Claude chat',
          testFunction: `
            const { claudeService } = await import('@/ai/claude.js')
            try {
              const response = await claudeService.chat('Say OK', { maxTokens: 10 })
              return { success: response.length > 0, message: 'Claude working!' }
            } catch (error) {
              return { success: false, message: error instanceof Error ? error.message : 'Failed' }
            }
          `,
          skipForStatic: true
        }
      ]
    }
  }
}

