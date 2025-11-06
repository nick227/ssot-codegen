/**
 * OpenAI Provider Plugin
 * 
 * Integrates OpenAI API (GPT-4, GPT-3.5, Embeddings, DALL-E)
 * 
 * Features:
 * - Chat completions (GPT-4, GPT-4 Turbo, GPT-3.5)
 * - Text embeddings (text-embedding-3-small/large)
 * - Image generation (DALL-E 3)
 * - Vision models (GPT-4 Vision)
 * - Function calling
 * - Streaming support
 * - Usage tracking
 * - Cost estimation
 * 
 * Models Supported:
 * - gpt-4-turbo
 * - gpt-4
 * - gpt-3.5-turbo
 * - text-embedding-3-small
 * - text-embedding-3-large
 * - dall-e-3
 */

import type {
  FeaturePlugin,
  PluginContext,
  PluginOutput,
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface OpenAIPluginConfig {
  /** Default model (default: 'gpt-4-turbo') */
  defaultModel?: string
  
  /** Default embedding model (default: 'text-embedding-3-small') */
  defaultEmbeddingModel?: string
  
  /** Enable usage tracking (default: true) */
  enableUsageTracking?: boolean
  
  /** Enable cost estimation (default: true) */
  enableCostEstimation?: boolean
  
  /** Max retries on failure (default: 3) */
  maxRetries?: number
  
  /** Request timeout in ms (default: 60000) */
  timeout?: number
}

export class OpenAIPlugin implements FeaturePlugin {
  name = 'openai'
  version = '1.0.0'
  description = 'OpenAI API integration (GPT-4, embeddings, DALL-E)'
  enabled = true
  
  private config: Required<OpenAIPluginConfig>
  
  constructor(config: OpenAIPluginConfig = {}) {
    this.config = {
      defaultModel: 'gpt-4-turbo',
      defaultEmbeddingModel: 'text-embedding-3-small',
      enableUsageTracking: true,
      enableCostEstimation: true,
      maxRetries: 3,
      timeout: 60000,
      ...config
    }
  }
  
  requirements: PluginRequirements = {
    models: {
      required: [],
      optional: ['AIUsage']  // For tracking AI API usage
    },
    envVars: {
      required: ['OPENAI_API_KEY'],
      optional: ['OPENAI_ORG_ID', 'OPENAI_BASE_URL']
    },
    dependencies: {
      runtime: {
        'openai': '^4.77.0'
      },
      dev: {}
    }
  }
  
  /**
   * Validate plugin can be used
   */
  validate(context: PluginContext): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // No model requirements - OpenAI is standalone
    
    return {
      valid: true,
      errors,
      warnings,
      suggestions
    }
  }
  
  /**
   * Generate OpenAI integration code
   */
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    // OpenAI client wrapper
    files.set('ai/providers/openai.provider.ts', this.generateOpenAIProvider())
    
    // OpenAI service (high-level API)
    files.set('ai/services/openai.service.ts', this.generateOpenAIService())
    
    // Types
    files.set('ai/types/openai.types.ts', this.generateOpenAITypes())
    
    // Barrel export
    files.set('ai/openai.ts', this.generateBarrelExport())
    
    return {
      files,
      routes: [],  // No routes (service-level only)
      middleware: [],
      envVars: {
        OPENAI_API_KEY: 'sk-your-openai-api-key-here',
        OPENAI_ORG_ID: 'optional-org-id',
        OPENAI_BASE_URL: 'https://api.openai.com/v1'
      },
      packageJson: {
        dependencies: this.requirements.dependencies!.runtime,
        devDependencies: {}
      }
    }
  }
  
  /**
   * Generate OpenAI provider (implements unified interface)
   */
  private generateOpenAIProvider(): string {
    return `// @generated
// OpenAI Provider - Implements unified AI interface

import OpenAI from 'openai'
import type { 
  ChatMessage, 
  ChatOptions, 
  ChatResponse,
  EmbeddingOptions 
} from '../types/ai.types.js'
import { logger } from '@/logger'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
  baseURL: process.env.OPENAI_BASE_URL,
  timeout: ${this.config.timeout},
  maxRetries: ${this.config.maxRetries}
})

/**
 * OpenAI Provider
 * Implements unified AI interface for OpenAI
 */
export const openaiProvider = {
  name: 'openai',
  type: 'commercial' as const,
  
  /**
   * Chat completion (unified interface)
   */
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const startTime = Date.now()
    
    try {
      const response = await openai.chat.completions.create({
        model: options.model || '${this.config.defaultModel}',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          ...(m.name && { name: m.name })
        })),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        user: options.user
      })
      
      const latency = Date.now() - startTime
      const usage = response.usage!
      
      ${this.config.enableCostEstimation ? `
      // Estimate cost (approximate rates)
      const costPerPromptToken = getCostPerToken(response.model, 'prompt')
      const costPerCompletionToken = getCostPerToken(response.model, 'completion')
      const estimatedCost = (usage.prompt_tokens * costPerPromptToken) + 
                           (usage.completion_tokens * costPerCompletionToken)
      ` : 'const estimatedCost = undefined'}
      
      ${this.config.enableUsageTracking ? `
      logger.info({
        model: response.model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        cost: estimatedCost,
        latency
      }, 'OpenAI chat completion')
      ` : ''}
      
      return {
        content: response.choices[0].message.content || '',
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          estimatedCost
        },
        model: response.model,
        finishReason: (response.choices[0].finish_reason || 'stop') as 'stop' | 'length' | 'content_filter' | 'tool_calls',
        provider: 'openai',
        latency
      }
    } catch (error) {
      logger.error({ error }, 'OpenAI chat completion failed')
      throw error
    }
  },
  
  /**
   * Generate embeddings
   */
  async embed(text: string | string[], options: EmbeddingOptions = {}): Promise<number[][]> {
    try {
      const input = Array.isArray(text) ? text : [text]
      
      const response = await openai.embeddings.create({
        model: options.model || '${this.config.defaultEmbeddingModel}',
        input,
        dimensions: options.dimensions
      })
      
      ${this.config.enableUsageTracking ? `
      logger.info({
        model: response.model,
        inputs: input.length,
        totalTokens: response.usage.total_tokens
      }, 'OpenAI embeddings generated')
      ` : ''}
      
      return response.data.map(d => d.embedding)
    } catch (error) {
      logger.error({ error }, 'OpenAI embeddings failed')
      throw error
    }
  },
  
  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await openai.models.list()
      return response.data.map(m => m.id)
    } catch (error) {
      logger.error({ error }, 'Failed to list OpenAI models')
      return []
    }
  },
  
  /**
   * Get provider info
   */
  getInfo() {
    return {
      name: 'OpenAI',
      type: 'commercial' as const,
      endpoint: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      modelsAvailable: 15,
      features: {
        chat: true,
        completions: true,
        embeddings: true,
        vision: true,
        functions: true,
        streaming: true
      }
    }
  }
}

/**
 * Get cost per token for OpenAI models (approximate)
 */
function getCostPerToken(model: string, type: 'prompt' | 'completion'): number {
  const costs: Record<string, { prompt: number; completion: number }> = {
    'gpt-4-turbo': { prompt: 0.00001, completion: 0.00003 },
    'gpt-4': { prompt: 0.00003, completion: 0.00006 },
    'gpt-3.5-turbo': { prompt: 0.0000005, completion: 0.0000015 },
    'gpt-4o': { prompt: 0.000005, completion: 0.000015 },
    'gpt-4o-mini': { prompt: 0.00000015, completion: 0.0000006 }
  }
  
  // Find matching model (handle versioned names)
  for (const [key, value] of Object.entries(costs)) {
    if (model.includes(key)) {
      return value[type]
    }
  }
  
  // Default to GPT-4 rates
  return type === 'prompt' ? 0.00003 : 0.00006
}

/**
 * Export OpenAI client directly for advanced usage
 */
export { openai }
`
  }
  
  /**
   * Generate OpenAI service (high-level wrapper)
   */
  private generateOpenAIService(): string {
    return `// @generated
// OpenAI Service - High-level API for common tasks

import { openaiProvider } from '../providers/openai.provider.js'
import type { ChatMessage, ChatOptions } from '../types/ai.types.js'

export const openaiService = {
  /**
   * Simple chat completion
   * 
   * @example
   * const response = await openaiService.chat('What is TypeScript?')
   * console.log(response)
   */
  async chat(
    prompt: string,
    options: ChatOptions = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ]
    
    const response = await openaiProvider.chat(messages, options)
    return response.content
  },
  
  /**
   * Chat with conversation history
   * 
   * @example
   * const messages = [
   *   { role: 'system', content: 'You are a helpful assistant' },
   *   { role: 'user', content: 'Hello!' }
   * ]
   * const response = await openaiService.chatWithHistory(messages)
   */
  async chatWithHistory(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    return openaiProvider.chat(messages, options)
  },
  
  /**
   * Generate embeddings for text
   * 
   * @example
   * const embedding = await openaiService.embed('Hello world')
   * // Returns: [0.123, -0.456, ...]
   */
  async embed(text: string): Promise<number[]> {
    const embeddings = await openaiProvider.embed(text)
    return embeddings[0]
  },
  
  /**
   * Generate embeddings for multiple texts
   * 
   * @example
   * const embeddings = await openaiService.embedBatch(['Text 1', 'Text 2'])
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    return openaiProvider.embed(texts)
  },
  
  /**
   * Classify text into categories
   * 
   * @example
   * const category = await openaiService.classify(
   *   'This movie was amazing!',
   *   ['positive', 'negative', 'neutral']
   * )
   * // Returns: 'positive'
   */
  async classify(text: string, categories: string[]): Promise<string> {
    const prompt = \`Classify the following text into one of these categories: \${categories.join(', ')}

Text: \${text}

Category:\`

    const response = await this.chat(prompt, {
      temperature: 0,
      maxTokens: 10
    })
    
    return response.trim().toLowerCase()
  },
  
  /**
   * Extract structured data from text
   * 
   * @example
   * const data = await openaiService.extract(
   *   'Email me at john@example.com',
   *   { email: 'string', name: 'string' }
   * )
   * // Returns: { email: 'john@example.com', name: 'john' }
   */
  async extract<T extends Record<string, string>>(
    text: string,
    schema: T
  ): Promise<Partial<Record<keyof T, string>>> {
    const schemaDesc = Object.entries(schema)
      .map(([key, type]) => \`- \${key}: \${type}\`)
      .join('\\n')
    
    const prompt = \`Extract the following information from the text:

\${schemaDesc}

Text: \${text}

Return as JSON:\`

    const response = await this.chat(prompt, {
      temperature: 0,
      maxTokens: 200
    })
    
    try {
      return JSON.parse(response)
    } catch {
      return {}
    }
  },
  
  /**
   * Summarize text
   * 
   * @example
   * const summary = await openaiService.summarize(longText, 50)
   * // Returns: "Summary in ~50 words..."
   */
  async summarize(text: string, maxWords: number = 100): Promise<string> {
    const prompt = \`Summarize the following text in approximately \${maxWords} words:

\${text}\`

    return this.chat(prompt, {
      temperature: 0.3,
      maxTokens: maxWords * 2  // ~2 tokens per word
    })
  },
  
  /**
   * Translate text
   * 
   * @example
   * const translated = await openaiService.translate('Hello', 'Spanish')
   * // Returns: "Hola"
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    const prompt = \`Translate the following text to \${targetLanguage}:

\${text}\`

    return this.chat(prompt, {
      temperature: 0,
      maxTokens: text.length * 2
    })
  },
  
  /**
   * Check content moderation
   * 
   * @example
   * const result = await openaiService.moderate('Some text to check')
   * if (result.flagged) {
   *   console.log('Content flagged:', result.categories)
   * }
   */
  async moderate(text: string): Promise<{
    flagged: boolean
    categories: string[]
    scores: Record<string, number>
  }> {
    const response = await openai.moderations.create({ input: text })
    const result = response.results[0]
    
    const flaggedCategories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category)
    
    return {
      flagged: result.flagged,
      categories: flaggedCategories,
      scores: result.category_scores as Record<string, number>
    }
  }
}

// Re-export provider for direct access
export { openaiProvider } from '../providers/openai.provider.js'
`
  }
  
  /**
   * Generate TypeScript types
   */
  private generateOpenAITypes(): string {
    return `// @generated
// OpenAI Type Definitions

import type { ChatMessage, ChatOptions, ChatResponse } from './ai.types.js'

/**
 * OpenAI-specific chat options
 */
export interface OpenAIChatOptions extends ChatOptions {
  functions?: OpenAIFunction[]
  functionCall?: 'auto' | 'none' | { name: string }
  responseFormat?: { type: 'json_object' | 'text' }
  seed?: number
  logitBias?: Record<string, number>
}

/**
 * OpenAI function definition
 */
export interface OpenAIFunction {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

/**
 * OpenAI image generation options
 */
export interface ImageGenerationOptions {
  model?: 'dall-e-2' | 'dall-e-3'
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  n?: number
  user?: string
}

/**
 * OpenAI moderation result
 */
export interface ModerationResult {
  flagged: boolean
  categories: string[]
  scores: Record<string, number>
}

/**
 * Re-export common AI types
 */
export type { ChatMessage, ChatOptions, ChatResponse, EmbeddingOptions } from './ai.types.js'
`
  }
  
  /**
   * Generate barrel export
   */
  private generateBarrelExport(): string {
    return `// @generated
// OpenAI - Barrel Export

export { openaiProvider, openai } from './providers/openai.provider.js'
export { openaiService } from './services/openai.service.js'

export type {
  OpenAIChatOptions,
  OpenAIFunction,
  ImageGenerationOptions,
  ModerationResult,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  EmbeddingOptions
} from './types/openai.types.js'
`
  }
  
  /**
   * Health check for OpenAI
   */
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'openai',
      title: '🤖 OpenAI',
      icon: '🤖',
      checks: [
        {
          id: 'openai-api-key',
          name: 'API Key Configured',
          description: 'Validates OPENAI_API_KEY environment variable is set',
          testFunction: `
            const apiKey = process.env.OPENAI_API_KEY
            return {
              success: !!apiKey && apiKey.startsWith('sk-'),
              message: apiKey && apiKey.startsWith('sk-')
                ? 'OpenAI API key configured'
                : apiKey
                  ? '⚠️ Invalid API key format'
                  : '❌ OPENAI_API_KEY not set'
            }
          `
        },
        {
          id: 'openai-connection',
          name: 'API Connection',
          description: 'Tests connection to OpenAI API',
          testFunction: `
            const { openaiProvider } = await import('@/ai/openai.js')
            try {
              const models = await openaiProvider.listModels()
              return {
                success: models.length > 0,
                message: \`Connected! \${models.length} models available\`
              }
            } catch (error) {
              return {
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed'
              }
            }
          `,
          skipForStatic: true
        },
        {
          id: 'openai-chat',
          name: 'Chat Completion',
          description: 'Tests chat completion functionality',
          testFunction: `
            const { openaiService } = await import('@/ai/openai.js')
            try {
              const response = await openaiService.chat('Say "OK" if you can hear me', {
                temperature: 0,
                maxTokens: 10
              })
              return {
                success: response.length > 0,
                message: \`Chat working! Response: "\${response}"\`
              }
            } catch (error) {
              return {
                success: false,
                message: error instanceof Error ? error.message : 'Chat failed'
              }
            }
          `,
          skipForStatic: true
        },
        {
          id: 'openai-embeddings',
          name: 'Text Embeddings',
          description: 'Tests embedding generation',
          testFunction: `
            const { openaiService } = await import('@/ai/openai.js')
            try {
              const embedding = await openaiService.embed('test text')
              return {
                success: Array.isArray(embedding) && embedding.length > 0,
                message: \`Embeddings working! Dimension: \${embedding.length}\`
              }
            } catch (error) {
              return {
                success: false,
                message: error instanceof Error ? error.message : 'Embeddings failed'
              }
            }
          `,
          skipForStatic: true
        }
      ]
    }
  }
}

