/**
 * Unified AI Provider Interface
 * 
 * Common interface that works across ALL AI/LLM providers
 * (OpenAI, Claude, Gemini, Grok, OpenRouter, LM Studio, Ollama)
 */

/**
 * Chat message (universal format)
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string  // Optional name for multi-user chats
}

/**
 * Chat options (common across providers)
 */
export interface ChatOptions {
  model?: string
  temperature?: number        // 0-1
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
  user?: string              // User ID for tracking
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
    estimatedCost?: number  // USD
  }
  model: string
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls'
  provider: string
  latency: number  // milliseconds
}

/**
 * Text completion options
 */
export interface CompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stop?: string[]
}

/**
 * Model information
 */
export interface ModelInfo {
  id: string
  name: string
  contextWindow: number
  costPerPromptToken: number   // USD
  costPerCompletionToken: number  // USD
  supportsFunctions?: boolean
  supportsVision?: boolean
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

/**
 * Embedding options
 */
export interface EmbeddingOptions {
  model?: string
  dimensions?: number
}

/**
 * Unified AI Provider Interface
 * All providers implement this
 */
export interface AIProvider {
  /** Provider name */
  name: string
  
  /** Provider type */
  type: 'commercial' | 'local' | 'gateway'
  
  /**
   * Chat completion
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>
  
  /**
   * Streaming chat
   */
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterator<string>
  
  /**
   * Text completion (legacy)
   */
  complete(prompt: string, options?: CompletionOptions): Promise<string>
  
  /**
   * Generate embeddings
   */
  embed(text: string | string[], options?: EmbeddingOptions): Promise<number[] | number[][]>
  
  /**
   * List available models
   */
  listModels(): Promise<ModelInfo[]>
  
  /**
   * Count tokens (for cost estimation)
   */
  countTokens(text: string, model?: string): number
  
  /**
   * Get provider info
   */
  getInfo(): ProviderInfo
  
  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>
}

/**
 * AI Router - Routes requests to optimal provider
 */
export interface AIRouter {
  /**
   * Route to best provider based on criteria
   */
  routeChat(
    messages: ChatMessage[],
    criteria?: {
      preferCost?: boolean       // Route to cheapest
      preferSpeed?: boolean      // Route to fastest
      preferQuality?: boolean    // Route to best model
      maxCost?: number          // Cost limit
      fallback?: string[]       // Fallback providers
    }
  ): Promise<ChatResponse>
  
  /**
   * Try multiple providers with fallback
   */
  chatWithFallback(
    messages: ChatMessage[],
    providers: string[],
    options?: ChatOptions
  ): Promise<ChatResponse>
  
  /**
   * A/B test different providers
   */
  compareProviders(
    messages: ChatMessage[],
    providers: string[]
  ): Promise<Map<string, ChatResponse>>
}

/**
 * Cost tracking
 */
export interface CostTracker {
  trackUsage(provider: string, usage: ChatResponse['usage']): void
  getTotalCost(provider?: string): number
  getUsageStats(provider?: string): UsageStats
}

export interface UsageStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageLatency: number
  byModel: Map<string, {
    requests: number
    tokens: number
    cost: number
  }>
}

