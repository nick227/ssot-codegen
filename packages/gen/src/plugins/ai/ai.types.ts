/**
 * Common AI Types
 * Shared types used across all AI provider implementations
 */

/**
 * Chat message (universal format)
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

/**
 * Chat options (common across providers)
 */
export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
  user?: string
}

/**
 * Chat response (standardized)
 */
export interface ChatResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost?: number
  }
  model: string
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls'
  provider: string
  latency: number
}

/**
 * Embedding options
 */
export interface EmbeddingOptions {
  model?: string
  dimensions?: number
}

/**
 * Provider information
 */
export interface ProviderInfo {
  name: string
  type: 'commercial' | 'local' | 'gateway'
  endpoint?: string
  modelsAvailable: number
  features: {
    chat: boolean
    completions: boolean
    embeddings: boolean
    vision: boolean
    functions: boolean
    streaming: boolean
  }
}

