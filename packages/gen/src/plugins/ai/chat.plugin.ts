/**
 * Chat Plugin
 * 
 * High-level chat plugin that orchestrates:
 * - AI providers (OpenAI, Claude, etc.)
 * - WebSocket (real-time messages)
 * - Message storage
 * - Conversation management
 * 
 * Features:
 * - Multi-provider support (OpenAI, Claude, Gemini)
 * - Streaming responses
 * - Conversation history
 * - Token usage tracking
 * - Cost estimation
 */

import type {
  FeaturePlugin,
  PluginContext,
  PluginOutput,
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface ChatPluginConfig {
  /** Default AI provider (default: 'openai') */
  defaultProvider?: 'openai' | 'claude' | 'gemini' | 'grok' | 'ollama'
  
  /** Enable WebSocket real-time updates (default: true) */
  enableWebSocket?: boolean
  
  /** Enable conversation memory (default: true) */
  enableMemory?: boolean
  
  /** Max messages to include in context (default: 20) */
  contextWindow?: number
  
  /** Enable streaming responses (default: true) */
  enableStreaming?: boolean
}

export class ChatPlugin implements FeaturePlugin {
  name = 'chat'
  version = '1.0.0'
  description = 'Complete chat system with AI, WebSocket, and conversation management'
  enabled = true
  
  private config: Required<ChatPluginConfig>
  
  constructor(config: ChatPluginConfig = {}) {
    this.config = {
      defaultProvider: config.defaultProvider || 'openai',
      enableWebSocket: config.enableWebSocket !== false,
      enableMemory: config.enableMemory !== false,
      contextWindow: config.contextWindow || 20,
      enableStreaming: config.enableStreaming !== false
    }
  }
  
  requirements: PluginRequirements = {
    models: {
      required: ['Conversation', 'Message'],
      optional: ['User']
    },
    envVars: {
      required: [],  // Depends on AI provider chosen
      optional: []
    },
    dependencies: {
      runtime: {
        '@tanstack/react-query': '^5.0.0',
        'socket.io-client': '^4.8.0'
      },
      dev: {}
    }
  }
  
  /**
   * Validate plugin requirements
   */
  validate(context: PluginContext): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // Check required models
    const hasConversation = context.schema.models.some(m => m.name === 'Conversation')
    const hasMessage = context.schema.models.some(m => m.name === 'Message')
    
    if (!hasConversation) {
      errors.push('Chat plugin requires "Conversation" model in schema')
    }
    
    if (!hasMessage) {
      errors.push('Chat plugin requires "Message" model in schema')
    }
    
    // Check for @@realtime annotation
    const conversationModel = context.schema.models.find(m => m.name === 'Conversation')
    if (conversationModel && !hasRealtimeAnnotation(conversationModel)) {
      warnings.push('Add @@realtime annotation to Conversation model for real-time updates')
    }
    
    const messageModel = context.schema.models.find(m => m.name === 'Message')
    if (messageModel && !hasRealtimeAnnotation(messageModel)) {
      warnings.push('Add @@realtime annotation to Message model for real-time messages')
    }
    
    // Suggest AI provider
    suggestions.push('Configure an AI provider (OpenAI, Claude, Gemini) for chat responses')
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
  
  /**
   * Generate chat system code
   */
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    // Chat service (orchestrates AI + storage)
    files.set('chat/chat.service.ts', this.generateChatService())
    
    // Chat controller (API endpoints)
    files.set('chat/chat.controller.ts', this.generateChatController())
    
    // Chat routes
    files.set('chat/chat.routes.ts', this.generateChatRoutes())
    
    // Chat types
    files.set('chat/chat.types.ts', this.generateChatTypes())
    
    // WebSocket gateway (if enabled)
    if (this.config.enableWebSocket) {
      files.set('chat/chat.gateway.ts', this.generateChatGateway())
    }
    
    // React hooks
    files.set('chat/react/useChat.ts', this.generateReactHook())
    files.set('chat/react/useChatWebSocket.ts', this.generateWebSocketHook())
    
    // Chat UI components
    files.set('chat/ui/ChatInterface.tsx', this.generateChatInterface())
    files.set('chat/ui/MessageList.tsx', this.generateMessageList())
    files.set('chat/ui/MessageInput.tsx', this.generateMessageInput())
    files.set('chat/ui/ConversationList.tsx', this.generateConversationList())
    
    // Barrel exports
    files.set('chat/index.ts', this.generateBarrelExport())
    
    return {
      files,
      routes: [
        {
          method: 'post',
          path: '/api/chat/:conversationId/message',
          handler: 'chatController.sendMessage'
        },
        {
          method: 'get',
          path: '/api/chat/:conversationId/messages',
          handler: 'chatController.getMessages'
        },
        {
          method: 'post',
          path: '/api/chat/conversations',
          handler: 'chatController.createConversation'
        },
        {
          method: 'get',
          path: '/api/chat/conversations',
          handler: 'chatController.listConversations'
        }
      ],
      middleware: [],
      envVars: {},
      packageJson: {
        dependencies: this.requirements.dependencies!.runtime,
        devDependencies: {}
      }
    }
  }
  
  /**
   * Generate chat service
   */
  private generateChatService(): string {
    return `// @generated
// Chat Service - Orchestrates AI providers, storage, and real-time updates

import { prisma } from '@/db'
import { openaiProvider } from '@/ai/providers/openai.provider'
import type { ChatMessage, ChatResponse } from '@/ai/types/ai.types'

export const chatService = {
  /**
   * Send message and get AI response
   */
  async sendMessage(conversationId: string, content: string, userId?: string) {
    // 1. Save user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role: 'USER',
        conversationId,
        authorId: userId
      }
    })
    
    // 2. Get conversation context
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: ${this.config.contextWindow}
        }
      }
    })
    
    if (!conversation) {
      throw new Error('Conversation not found')
    }
    
    // 3. Build chat history
    const messages: ChatMessage[] = conversation.messages
      .reverse()
      .map(m => ({
        role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: m.content
      }))
    
    // Add system prompt if configured
    if (conversation.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: conversation.systemPrompt
      })
    }
    
    // 4. Get AI response
    const aiResponse = await openaiProvider.chat(messages, {
      model: conversation.model || undefined,
      temperature: conversation.temperature || undefined
    })
    
    // 5. Save AI message
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponse.content,
        role: 'ASSISTANT',
        conversationId,
        metadata: {
          usage: aiResponse.usage,
          model: aiResponse.model,
          finishReason: aiResponse.finishReason,
          latency: aiResponse.latency
        }
      }
    })
    
    // 6. Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })
    
    return {
      userMessage,
      aiMessage,
      usage: aiResponse.usage
    }
  },
  
  /**
   * Create new conversation
   */
  async createConversation(data: {
    title: string
    type?: 'DIRECT' | 'GROUP' | 'AI'
    systemPrompt?: string
    model?: string
    temperature?: number
    userIds?: string[]
  }) {
    return prisma.conversation.create({
      data: {
        title: data.title,
        type: data.type || 'AI',
        systemPrompt: data.systemPrompt,
        model: data.model,
        temperature: data.temperature,
        participants: data.userIds ? {
          connect: data.userIds.map(id => ({ id }))
        } : undefined
      }
    })
  },
  
  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string, limit: number = 50) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })
  },
  
  /**
   * List user conversations
   */
  async listConversations(userId?: string) {
    return prisma.conversation.findMany({
      where: userId ? {
        participants: {
          some: { id: userId }
        }
      } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            role: true,
            createdAt: true
          }
        }
      }
    })
  }
}
`
  }
  
  /**
   * Generate chat controller
   */
  private generateChatController(): string {
    return `// @generated
// Chat Controller - HTTP API endpoints

import type { FastifyRequest, FastifyReply } from 'fastify'
import { chatService } from './chat.service'

export const chatController = {
  /**
   * Send message in conversation
   * POST /api/chat/:conversationId/message
   */
  async sendMessage(req: FastifyRequest<{
    Params: { conversationId: string }
    Body: { content: string }
  }>, reply: FastifyReply) {
    try {
      const { conversationId } = req.params
      const { content } = req.body
      const userId = req.user?.id  // From auth middleware
      
      const result = await chatService.sendMessage(conversationId, content, userId)
      
      return reply.code(200).send(result)
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to send message'
      })
    }
  },
  
  /**
   * Get messages in conversation
   * GET /api/chat/:conversationId/messages
   */
  async getMessages(req: FastifyRequest<{
    Params: { conversationId: string }
    Querystring: { limit?: string }
  }>, reply: FastifyReply) {
    try {
      const { conversationId } = req.params
      const limit = req.query.limit ? parseInt(req.query.limit) : 50
      
      const messages = await chatService.getMessages(conversationId, limit)
      
      return reply.code(200).send({ data: messages })
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to fetch messages'
      })
    }
  },
  
  /**
   * Create new conversation
   * POST /api/chat/conversations
   */
  async createConversation(req: FastifyRequest<{
    Body: {
      title: string
      type?: 'DIRECT' | 'GROUP' | 'AI'
      systemPrompt?: string
      model?: string
      temperature?: number
    }
  }>, reply: FastifyReply) {
    try {
      const userId = req.user?.id
      
      const conversation = await chatService.createConversation({
        ...req.body,
        userIds: userId ? [userId] : undefined
      })
      
      return reply.code(201).send(conversation)
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to create conversation'
      })
    }
  },
  
  /**
   * List user conversations
   * GET /api/chat/conversations
   */
  async listConversations(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = req.user?.id
      
      const conversations = await chatService.listConversations(userId)
      
      return reply.code(200).send({ data: conversations })
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to list conversations'
      })
    }
  }
}
`
  }
  
  /**
   * Generate chat routes
   */
  private generateChatRoutes(): string {
    return `// @generated
// Chat Routes

import type { FastifyInstance } from 'fastify'
import { chatController } from './chat.controller'

export async function chatRoutes(fastify: FastifyInstance) {
  // Send message
  fastify.post('/chat/:conversationId/message', chatController.sendMessage)
  
  // Get messages
  fastify.get('/chat/:conversationId/messages', chatController.getMessages)
  
  // Create conversation
  fastify.post('/chat/conversations', chatController.createConversation)
  
  // List conversations
  fastify.get('/chat/conversations', chatController.listConversations)
}
`
  }
  
  /**
   * Generate chat types
   */
  private generateChatTypes(): string {
    return `// @generated
// Chat Type Definitions

export interface ChatMessage {
  id: string
  content: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  conversationId: string
  authorId?: string
  metadata?: any
  createdAt: Date
}

export interface Conversation {
  id: string
  title: string
  type: 'DIRECT' | 'GROUP' | 'AI'
  systemPrompt?: string
  model?: string
  temperature?: number
  createdAt: Date
  updatedAt: Date
}

export interface SendMessageRequest {
  content: string
}

export interface SendMessageResponse {
  userMessage: ChatMessage
  aiMessage: ChatMessage
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost?: number
  }
}
`
  }
  
  /**
   * Generate WebSocket gateway
   */
  private generateChatGateway(): string {
    return `// @generated
// Chat WebSocket Gateway - Real-time message streaming

import type { Server as SocketServer, Socket } from 'socket.io'
import { chatService } from './chat.service'

export function registerChatGateway(io: SocketServer) {
  io.on('connection', (socket: Socket) => {
    console.log('Chat client connected:', socket.id)
    
    // Join conversation room
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(\`conversation:\${conversationId}\`)
      console.log(\`Client \${socket.id} joined conversation \${conversationId}\`)
    })
    
    // Leave conversation room
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(\`conversation:\${conversationId}\`)
    })
    
    // Send message (with AI response)
    socket.on('send-message', async (data: {
      conversationId: string
      content: string
      userId?: string
    }) => {
      try {
        const result = await chatService.sendMessage(
          data.conversationId,
          data.content,
          data.userId
        )
        
        // Broadcast user message to room
        io.to(\`conversation:\${data.conversationId}\`).emit('message', result.userMessage)
        
        // Broadcast AI response to room
        io.to(\`conversation:\${data.conversationId}\`).emit('message', result.aiMessage)
        
      } catch (error) {
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to send message'
        })
      }
    })
    
    socket.on('disconnect', () => {
      console.log('Chat client disconnected:', socket.id)
    })
  })
}
`
  }
  
  /**
   * Generate React hook
   */
  private generateReactHook(): string {
    return `// @generated
// useChat - React hook for chat functionality

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSDK } from '@/gen/sdk/react'

export function useChat(conversationId: string) {
  const sdk = useSDK()
  const queryClient = useQueryClient()
  
  // Get messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat', conversationId, 'messages'],
    queryFn: () => sdk.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { author: true }
    })
  })
  
  // Send message
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(\`/api/chat/\${conversationId}/message\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (!response.ok) throw new Error('Failed to send message')
      return response.json()
    },
    onSuccess: () => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ queryKey: ['chat', conversationId, 'messages'] })
    }
  })
  
  return {
    messages,
    isLoading,
    sendMessage,
    isSending
  }
}
`
  }
  
  /**
   * Generate WebSocket hook
   */
  private generateWebSocketHook(): string {
    return `// @generated
// useChatWebSocket - Real-time message updates

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001/ws')

export function useChatWebSocket(conversationId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Join conversation room
    socket.emit('join-conversation', conversationId)
    
    // Listen for new messages
    socket.on('message', (message) => {
      // Update query cache
      queryClient.setQueryData(
        ['chat', conversationId, 'messages'],
        (old: any[]) => [...(old || []), message]
      )
    })
    
    // Cleanup
    return () => {
      socket.emit('leave-conversation', conversationId)
      socket.off('message')
    }
  }, [conversationId, queryClient])
  
  return {
    sendMessage: (content: string) => {
      socket.emit('send-message', { conversationId, content })
    }
  }
}
`
  }
  
  /**
   * Generate chat interface component
   */
  private generateChatInterface(): string {
    return `// @generated
// ChatInterface - Complete chat UI

'use client'

import { useChat } from '../react/useChat'
import { useChatWebSocket } from '../react/useChatWebSocket'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

export interface ChatInterfaceProps {
  conversationId: string
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const { messages, isLoading, sendMessage, isSending } = useChat(conversationId)
  useChatWebSocket(conversationId)  // Real-time updates
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Chat</h2>
      </div>
      
      {/* Messages */}
      <MessageList messages={messages || []} />
      
      {/* Input */}
      <MessageInput 
        onSend={sendMessage} 
        disabled={isSending} 
      />
    </div>
  )
}
`
  }
  
  /**
   * Generate message list component
   */
  private generateMessageList(): string {
    return `// @generated
// MessageList - Display chat messages

'use client'

import { useEffect, useRef } from 'react'

export interface MessageListProps {
  messages: any[]
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={\`flex \${message.role === 'USER' ? 'justify-end' : 'justify-start'}\`}
        >
          <div
            className={\`
              max-w-xl px-4 py-2 rounded-lg
              \${message.role === 'USER'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
              }
            \`}
          >
            <p className="text-sm">{message.content}</p>
            {message.author && (
              <p className="text-xs mt-1 opacity-70">{message.author.name}</p>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
`
  }
  
  /**
   * Generate message input component
   */
  private generateMessageInput(): string {
    return `// @generated
// MessageInput - Chat message input field

'use client'

import { useState } from 'react'

export interface MessageInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || disabled) return
    
    onSend(content)
    setContent('')
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </form>
  )
}
`
  }
  
  /**
   * Generate conversation list component
   */
  private generateConversationList(): string {
    return `// @generated
// ConversationList - List of conversations

'use client'

import { useQuery } from '@tanstack/react-query'

export function ConversationList() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await fetch('/api/chat/conversations')
      if (!response.ok) throw new Error('Failed to fetch conversations')
      return response.json()
    }
  })
  
  if (isLoading) {
    return <div>Loading conversations...</div>
  }
  
  return (
    <div className="space-y-2">
      {conversations?.data.map((conv: any) => (
        <a
          key={conv.id}
          href={\`/chats/\${conv.id}\`}
          className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <h3 className="font-medium text-gray-900">{conv.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {conv._count.messages} messages
          </p>
        </a>
      ))}
    </div>
  )
}
`
  }
  
  /**
   * Generate barrel export
   */
  private generateBarrelExport(): string {
    return `// @generated
// Chat - Barrel Export

export { chatService } from './chat.service'
export { chatController } from './chat.controller'
export { chatRoutes } from './chat.routes'
export { useChat } from './react/useChat'
export { useChatWebSocket } from './react/useChatWebSocket'
export { ChatInterface } from './ui/ChatInterface'
export { MessageList } from './ui/MessageList'
export { MessageInput } from './ui/MessageInput'
export { ConversationList } from './ui/ConversationList'

export type * from './chat.types'
`
  }
  
  /**
   * Health check
   */
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'chat',
      title: '💬 Chat System',
      icon: '💬',
      checks: [
        {
          id: 'chat-models',
          name: 'Database Models',
          description: 'Validates Conversation and Message models exist',
          testFunction: `
            const hasConversation = context.schema.models.some(m => m.name === 'Conversation')
            const hasMessage = context.schema.models.some(m => m.name === 'Message')
            return {
              success: hasConversation && hasMessage,
              message: hasConversation && hasMessage
                ? 'Chat models configured'
                : 'Missing Conversation or Message model'
            }
          `
        }
      ]
    }
  }
}

function hasRealtimeAnnotation(model: any): boolean {
  return model.annotations?.some((a: any) => a.type === 'realtime') || false
}

