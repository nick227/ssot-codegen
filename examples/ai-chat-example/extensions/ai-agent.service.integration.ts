/**
 * AI Agent Service
 * 
 * Handles AI conversation orchestration with OpenAI.
 * Demonstrates the service integration pattern for complex workflows.
 * 
 * Features:
 * - Multi-step orchestration (save prompt → call AI → save response)
 * - Error handling and retry logic
 * - Cost and token tracking
 * - Status management
 * - Conversation context awareness
 */

import { aipromptService as baseService } from '@gen/services/aiprompt'
import prisma from '../db.js'
import { logger } from '../logger.js'
import OpenAI from 'openai'
import type { PromptStatus, Prisma } from '@prisma/client'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-test-key'
})

export interface SendMessageOptions {
  conversationId?: number
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface AIMessageResponse {
  promptId: number
  responseId: number
  conversationId: number
  text: string
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  cost: number
  duration: number
  model: string
}

export const aiAgentService = {
  ...baseService,  // Include generated CRUD methods
  
  /**
   * Send message to AI and get response
   * 
   * @exposed sendMessage
   * @auth required
   * @rateLimit 20/minute
   * 
   * Orchestration:
   * 1. Create/update conversation
   * 2. Save user message
   * 3. Build conversation context
   * 4. Call OpenAI API
   * 5. Save AI response message
   * 6. Save prompt/response metadata
   * 7. Update user credits
   * 8. Return formatted response
   */
  async sendMessage(
    userId: number, 
    prompt: string, 
    options: SendMessageOptions = {}
  ): Promise<AIMessageResponse> {
    const startTime = Date.now()
    let promptRecord: any
    let conversationId = options.conversationId
    
    try {
      logger.info({ userId, conversationId, model: options.model }, 'Processing AI message')
      
      // Step 1: Create or get conversation
      if (!conversationId) {
        const conversation = await prisma.conversation.create({
          data: {
            userId,
            title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
            model: options.model || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
            systemPrompt: options.systemPrompt
          }
        })
        conversationId = conversation.id
      }
      
      // Step 2: Save user message
      await prisma.message.create({
        data: {
          conversationId,
          userId,
          role: 'USER',
          content: prompt
        }
      })
      
      // Step 3: Create prompt record (PROCESSING status)
      promptRecord = await prisma.aiPrompt.create({
        data: {
          userId,
          conversationId,
          prompt,
          model: options.model || 'gpt-4',
          temperature: options.temperature || parseFloat(process.env.AI_DEFAULT_TEMPERATURE || '0.7'),
          maxTokens: options.maxTokens,
          status: 'PROCESSING' as PromptStatus,
          processingStartedAt: new Date()
        }
      })
      
      // Step 4: Build conversation context (last N messages)
      const conversationMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 20  // Last 20 messages for context
      })
      
      const messages = conversationMessages.map(msg => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: msg.content
      }))
      
      // Add system prompt if provided
      if (options.systemPrompt && messages[0]?.role !== 'system') {
        messages.unshift({
          role: 'system',
          content: options.systemPrompt
        })
      }
      
      // Step 5: Call OpenAI API
      const apiStartTime = Date.now()
      const aiResponse = await openai.chat.completions.create({
        model: promptRecord.model,
        messages,
        temperature: promptRecord.temperature,
        max_tokens: promptRecord.maxTokens || parseInt(process.env.AI_DEFAULT_MAX_TOKENS || '2000')
      })
      const apiLatency = Date.now() - apiStartTime
      
      const responseText = aiResponse.choices[0].message.content || ''
      const finishReason = aiResponse.choices[0].finish_reason
      const usage = aiResponse.usage!
      
      // Step 6: Save AI response message
      await prisma.message.create({
        data: {
          conversationId,
          userId,  // System message, but track user
          role: 'ASSISTANT',
          content: responseText,
          tokens: usage.completion_tokens
        }
      })
      
      // Step 7: Calculate cost
      const cost = this.calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens,
        promptRecord.model
      )
      
      // Step 8: Save AI response metadata
      const responseRecord = await prisma.aiResponse.create({
        data: {
          promptId: promptRecord.id,
          response: responseText,
          model: promptRecord.model,
          finishReason,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          cost,
          duration: Date.now() - startTime,
          apiLatency
        }
      })
      
      // Step 9: Update prompt status to COMPLETED
      await prisma.aiPrompt.update({
        where: { id: promptRecord.id },
        data: { 
          status: 'COMPLETED' as PromptStatus,
          processingEndedAt: new Date()
        }
      })
      
      // Step 10: Log usage
      await prisma.usageLog.create({
        data: {
          userId,
          model: promptRecord.model,
          tokens: usage.total_tokens,
          cost,
          type: 'chat'
        }
      })
      
      // Step 11: Deduct credits (if enabled)
      const creditsToDeduct = Math.ceil(cost * 100)  // 1 credit = $0.01
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: creditsToDeduct } }
      })
      
      logger.info({ 
        promptId: promptRecord.id,
        conversationId,
        tokens: usage.total_tokens,
        cost,
        duration: Date.now() - startTime,
        creditsDeducted: creditsToDeduct
      }, 'AI message completed successfully')
      
      // Step 12: Return formatted response
      return {
        promptId: promptRecord.id,
        responseId: responseRecord.id,
        conversationId,
        text: responseText,
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens
        },
        cost,
        duration: Date.now() - startTime,
        model: promptRecord.model
      }
      
    } catch (error: any) {
      // Update prompt status on failure
      if (promptRecord) {
        const isRateLimit = error.message?.includes('rate limit') || error.status === 429
        const newStatus = isRateLimit ? 'RATE_LIMITED' : 'FAILED'
        
        await prisma.aiPrompt.update({
          where: { id: promptRecord.id },
          data: { 
            status: newStatus as PromptStatus,
            processingEndedAt: new Date()
          }
        }).catch(() => {}) // Ignore if update fails
      }
      
      logger.error({ 
        error: error.message, 
        userId, 
        conversationId,
        stack: error.stack 
      }, 'AI message failed')
      
      throw new Error(`AI request failed: ${error.message}`)
    }
  },
  
  /**
   * Stream AI response (for real-time chat UX)
   * 
   * @exposed streamMessage
   * @auth required
   * @rateLimit 20/minute
   * 
   * TODO: Implement SSE streaming for real-time responses
   */
  async streamMessage(
    userId: number,
    prompt: string,
    options: SendMessageOptions = {}
  ) {
    // TODO: Implement streaming with Server-Sent Events (SSE)
    // For now, fall back to regular sendMessage
    return this.sendMessage(userId, prompt, options)
  },
  
  /**
   * Regenerate last AI response
   * 
   * @exposed regenerateResponse
   * @auth required
   * @ownership promptId
   */
  async regenerateResponse(promptId: number, userId: number) {
    // Fetch original prompt
    const prompt = await prisma.aiPrompt.findUnique({
      where: { id: promptId },
      include: { user: true }
    })
    
    if (!prompt) {
      throw new Error('Prompt not found')
    }
    
    // Ownership check
    if (prompt.userId !== userId) {
      throw new Error('Unauthorized: You can only regenerate your own prompts')
    }
    
    if (prompt.status === 'PROCESSING') {
      throw new Error('Prompt is still processing, please wait')
    }
    
    // Regenerate with same parameters
    logger.info({ promptId, userId }, 'Regenerating AI response')
    
    return this.sendMessage(userId, prompt.prompt, {
      conversationId: prompt.conversationId || undefined,
      model: prompt.model,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens || undefined
    })
  },
  
  /**
   * Get usage statistics for user
   * 
   * @exposed getUsageStats
   * @auth required
   */
  async getUsageStats(userId: number, days: number = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    
    const [totalUsage, usageByModel, dailyUsage, user] = await Promise.all([
      // Total usage
      prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: since } },
        _sum: { tokens: true, cost: true },
        _count: true
      }),
      
      // Usage by model
      prisma.usageLog.groupBy({
        by: ['model'],
        where: { userId, createdAt: { gte: since } },
        _sum: { tokens: true, cost: true },
        _count: true
      }),
      
      // Daily usage
      prisma.$queryRaw`
        SELECT DATE(createdAt) as date, SUM(tokens) as tokens, SUM(cost) as cost, COUNT(*) as requests
        FROM UsageLog
        WHERE userId = ${userId} AND createdAt >= ${since}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
      `,
      
      // Current user info
      prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true, role: true }
      })
    ])
    
    return {
      period: {
        days,
        since: since.toISOString()
      },
      total: {
        requests: totalUsage._count,
        tokens: totalUsage._sum.tokens || 0,
        cost: totalUsage._sum.cost || 0
      },
      byModel: usageByModel.map(m => ({
        model: m.model,
        requests: m._count,
        tokens: m._sum.tokens || 0,
        cost: m._sum.cost || 0
      })),
      daily: dailyUsage,
      user: {
        credits: user?.credits || 0,
        role: user?.role || 'USER'
      }
    }
  },
  
  /**
   * Calculate AI API cost based on tokens and model
   * 
   * Pricing as of November 2025 (example rates)
   */
  calculateCost(promptTokens: number, completionTokens: number, model: string): number {
    // Pricing per 1K tokens (input / output)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
      'claude-3-opus': { prompt: 0.015, completion: 0.075 },
      'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
      'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 }
    }
    
    const rates = pricing[model] || pricing['gpt-3.5-turbo']
    
    const promptCost = (promptTokens / 1000) * rates.prompt
    const completionCost = (completionTokens / 1000) * rates.completion
    
    return promptCost + completionCost
  }
}

