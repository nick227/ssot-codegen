/**
 * SDK Service Integration Generator - Comprehensive Tests
 */

import { describe, it, expect } from 'vitest'
import {
  generateServiceSDK,
  generateMainSDKWithServices
} from '../sdk-service-generator.js'
import type { ServiceAnnotation } from '../../service-linker.js'
import {
  assertIncludes,
  assertExcludes,
  assertValidTypeScript
} from '../../__tests__/index.js'

// Helper to create service annotation
function createServiceAnnotation(
  name: string,
  methods: string[]
): ServiceAnnotation {
  return { name, methods }
}

describe('SDK Service Integration Generator - Comprehensive Tests', () => {
  describe('Service SDK Generation', () => {
    it('should generate service client class', () => {
      const annotation = createServiceAnnotation('ai-agent', ['sendMessage', 'getHistory'])
      const sdk = generateServiceSDK(annotation)

      assertIncludes(sdk, [
        '// @generated',
        'Service Integration SDK Client for ai-agent',
        'export class AiAgentClient',
        'constructor(private client: BaseAPIClient)'
      ])
    })

    it('should import SDK runtime types', () => {
      const annotation = createServiceAnnotation('file-storage', ['uploadFile'])
      const sdk = generateServiceSDK(annotation)

      expect(sdk).toContain("import type { BaseAPIClient, QueryOptions } from '@ssot-codegen/sdk-runtime'")
    })

    it('should convert kebab-case to camelCase for class name', () => {
      const annotation = createServiceAnnotation('ai-agent', ['sendMessage'])
      const sdk = generateServiceSDK(annotation)

      expect(sdk).toContain('export class AiAgentClient')
    })

    it('should handle single-word service names', () => {
      const annotation = createServiceAnnotation('webhook', ['trigger'])
      const sdk = generateServiceSDK(annotation)

      expect(sdk).toContain('export class WebhookClient')
    })

    it('should generate valid TypeScript', () => {
      const annotation = createServiceAnnotation('email-service', ['send', 'verify'])
      const sdk = generateServiceSDK(annotation)

      assertValidTypeScript(sdk)
    })
  })

  describe('Service Method Generation', () => {
    it('should generate POST method', () => {
      const annotation = createServiceAnnotation('ai-agent', ['sendMessage'])
      const sdk = generateServiceSDK(annotation)

      assertIncludes(sdk, [
        'async sendMessage(data?: any, options?: QueryOptions)',
        "await this.client.post<any>",
        '`/api/ai-agent/message`',
        'return response.data'
      ])
    })

    it('should generate GET method', () => {
      const annotation = createServiceAnnotation('ai-agent', ['getHistory'])
      const sdk = generateServiceSDK(annotation)

      assertIncludes(sdk, [
        'async getHistory(options?: QueryOptions)',
        "await this.client.get<any>",
        '`/api/ai-agent/history`'
      ])
    })

    it('should generate PUT method', () => {
      const annotation = createServiceAnnotation('file-storage', ['updateMetadata'])
      const sdk = generateServiceSDK(annotation)

      assertIncludes(sdk, [
        'async updateMetadata(data?: any, options?: QueryOptions)',
        "await this.client.put<any>"
      ])
    })

    it('should generate DELETE method', () => {
      const annotation = createServiceAnnotation('file-storage', ['deleteFile'])
      const sdk = generateServiceSDK(annotation)

      assertIncludes(sdk, [
        'async deleteFile(options?: QueryOptions)',
        "await this.client.delete<any>"
      ])
    })

    it('should include JSDoc comments', () => {
      const annotation = createServiceAnnotation('ai-agent', ['sendMessage', 'getHistory'])
      const sdk = generateServiceSDK(annotation)

      assertIncludes(sdk, [
        '/**',
        '* sendMessage',
        '* POST /api/ai-agent',
        '/**',
        '* getHistory',
        '* GET /api/ai-agent/history'
      ])
    })

    it('should include QueryOptions in all methods', () => {
      const annotation = createServiceAnnotation('ai-agent', ['sendMessage', 'getHistory'])
      const sdk = generateServiceSDK(annotation)

      const getMethodCount = (sdk.match(/options\?: QueryOptions/g) || []).length
      expect(getMethodCount).toBe(annotation.methods.length)
    })

    it('should pass signal to API client', () => {
      const annotation = createServiceAnnotation('webhook', ['trigger'])
      const sdk = generateServiceSDK(annotation)

      expect(sdk).toContain('{ signal: options?.signal }')
    })
  })

  describe('HTTP Method Inference', () => {
    it('should infer POST for send* methods', () => {
      const annotation = createServiceAnnotation('email', ['sendEmail', 'sendNotification'])
      const sdk = generateServiceSDK(annotation)

      const postCount = (sdk.match(/this\.client\.post/g) || []).length
      expect(postCount).toBe(2)
    })

    it('should infer GET for get* methods', () => {
      const annotation = createServiceAnnotation('data', ['getData', 'getStatus'])
      const sdk = generateServiceSDK(annotation)

      const getCount = (sdk.match(/this\.client\.get/g) || []).length
      expect(getCount).toBe(2)
    })

    it('should infer PUT for update* methods', () => {
      const annotation = createServiceAnnotation('resource', ['updateItem', 'updateSettings'])
      const sdk = generateServiceSDK(annotation)

      const putCount = (sdk.match(/this\.client\.put/g) || []).length
      expect(putCount).toBe(2)
    })

    it('should infer DELETE for delete* methods', () => {
      const annotation = createServiceAnnotation('resource', ['deleteItem', 'deleteAll'])
      const sdk = generateServiceSDK(annotation)

      const deleteCount = (sdk.match(/this\.client\.delete/g) || []).length
      expect(deleteCount).toBe(2)
    })
  })

  describe('Route Path Inference', () => {
    it('should infer path from method name', () => {
      const annotation = createServiceAnnotation('ai-agent', ['sendMessage'])
      const sdk = generateServiceSDK(annotation)

      expect(sdk).toContain('`/api/ai-agent/message`')
    })

    it('should append path for get* methods', () => {
      const annotation = createServiceAnnotation('ai-agent', ['getHistory'])
      const sdk = generateServiceSDK(annotation)

      expect(sdk).toContain('`/api/ai-agent/history`')
    })

    it('should handle multiple path segments', () => {
      const annotation = createServiceAnnotation('ai-agent', ['getUserSettings'])
      const sdk = generateServiceSDK(annotation)

      expect(sdk).toContain('`/api/ai-agent/user-settings`')
    })
  })

  describe('Main SDK with Services', () => {
    it('should generate main SDK with services', () => {
      const modelClients = [
        { name: 'todo', className: 'TodoClient' },
        { name: 'user', className: 'UserClient' }
      ]

      const serviceClients = [
        {
          name: 'ai-agent',
          className: 'AiAgentClient',
          annotation: createServiceAnnotation('ai-agent', ['sendMessage'])
        }
      ]

      const mainSDK = generateMainSDKWithServices(modelClients, serviceClients)

      assertIncludes(mainSDK, [
        '// @generated',
        'import { BaseAPIClient',
        'export function createSDK(config: SDKConfig)',
        'export interface SDK'
      ])
    })

    it('should import all model and service clients', () => {
      const modelClients = [
        { name: 'todo', className: 'TodoClient' }
      ]

      const serviceClients = [
        {
          name: 'ai-agent',
          className: 'AiAgentClient',
          annotation: createServiceAnnotation('ai-agent', ['sendMessage'])
        }
      ]

      const mainSDK = generateMainSDKWithServices(modelClients, serviceClients)

      assertIncludes(mainSDK, [
        "import { TodoClient } from './models/todo.client.js'",
        "import { AiAgentClient } from './services/ai-agent.client.js'"
      ])
    })

    it('should initialize all model and service clients', () => {
      const modelClients = [
        { name: 'todo', className: 'TodoClient' }
      ]

      const serviceClients = [
        {
          name: 'ai-agent',
          className: 'AiAgentClient',
          annotation: createServiceAnnotation('ai-agent', ['sendMessage'])
        }
      ]

      const mainSDK = generateMainSDKWithServices(modelClients, serviceClients)

      assertIncludes(mainSDK, [
        'todo: new TodoClient(client)',
        'aiAgent: new AiAgentClient(client)'
      ])
    })

    it('should use camelCase for service properties', () => {
      const modelClients: any[] = []

      const serviceClients = [
        {
          name: 'file-storage',
          className: 'FileStorageClient',
          annotation: createServiceAnnotation('file-storage', ['upload'])
        }
      ]

      const mainSDK = generateMainSDKWithServices(modelClients, serviceClients)

      expect(mainSDK).toContain('fileStorage: new FileStorageClient(client)')
      expect(mainSDK).toContain('fileStorage: FileStorageClient')
    })

    it('should define SDK type interface with services', () => {
      const modelClients = [
        { name: 'todo', className: 'TodoClient' }
      ]

      const serviceClients = [
        {
          name: 'ai-agent',
          className: 'AiAgentClient',
          annotation: createServiceAnnotation('ai-agent', ['sendMessage'])
        }
      ]

      const mainSDK = generateMainSDKWithServices(modelClients, serviceClients)

      assertIncludes(mainSDK, [
        'export interface SDK {',
        'todo: TodoClient',
        'aiAgent: AiAgentClient'
      ])
    })

    it('should include SDKConfig interface', () => {
      const mainSDK = generateMainSDKWithServices([], [])

      assertIncludes(mainSDK, [
        'export interface SDKConfig {',
        'baseUrl: string',
        'auth?:',
        'timeout?: number'
      ])
    })

    it('should include example in JSDoc', () => {
      const modelClients = [
        { name: 'post', className: 'PostClient' }
      ]

      const serviceClients = [
        {
          name: 'ai-agent',
          className: 'AiAgentClient',
          annotation: createServiceAnnotation('ai-agent', ['sendMessage'])
        },
        {
          name: 'file-storage',
          className: 'FileStorageClient',
          annotation: createServiceAnnotation('file-storage', ['uploadFile'])
        }
      ]

      const mainSDK = generateMainSDKWithServices(modelClients, serviceClients)

      assertIncludes(mainSDK, [
        '* @example',
        '* // Model clients:',
        '* const posts = await api.posts.list',
        '* // Service clients:',
        '* await api.aiAgent.sendMessage',
        '* await api.fileStorage.uploadFile'
      ])
    })

    it('should generate valid TypeScript', () => {
      const modelClients = [
        { name: 'todo', className: 'TodoClient' },
        { name: 'user', className: 'UserClient' }
      ]

      const serviceClients = [
        {
          name: 'ai-agent',
          className: 'AiAgentClient',
          annotation: createServiceAnnotation('ai-agent', ['sendMessage', 'getHistory'])
        },
        {
          name: 'file-storage',
          className: 'FileStorageClient',
          annotation: createServiceAnnotation('file-storage', ['uploadFile', 'deleteFile'])
        }
      ]

      const mainSDK = generateMainSDKWithServices(modelClients, serviceClients)

      assertValidTypeScript(mainSDK)
    })
  })

  describe('Multiple Services', () => {
    it('should handle multiple services', () => {
      const annotation1 = createServiceAnnotation('ai-agent', ['sendMessage', 'getHistory'])
      const annotation2 = createServiceAnnotation('file-storage', ['uploadFile', 'deleteFile'])

      const sdk1 = generateServiceSDK(annotation1)
      const sdk2 = generateServiceSDK(annotation2)

      assertValidTypeScript(sdk1)
      assertValidTypeScript(sdk2)

      expect(sdk1).toContain('export class AiAgentClient')
      expect(sdk2).toContain('export class FileStorageClient')
    })

    it('should handle service with many methods', () => {
      const annotation = createServiceAnnotation('ai-agent', [
        'sendMessage',
        'getHistory',
        'clearHistory',
        'updateSettings',
        'getSettings',
        'deleteConversation'
      ])

      const sdk = generateServiceSDK(annotation)

      assertValidTypeScript(sdk)
      assertIncludes(sdk, [
        'async sendMessage',
        'async getHistory',
        'async clearHistory',
        'async updateSettings',
        'async getSettings',
        'async deleteConversation'
      ])
    })
  })

  describe('Edge Cases', () => {
    it('should handle service with single method', () => {
      const annotation = createServiceAnnotation('webhook', ['trigger'])
      const sdk = generateServiceSDK(annotation)

      assertValidTypeScript(sdk)
      expect(sdk).toContain('async trigger')
    })

    it('should handle service with hyphenated name', () => {
      const annotation = createServiceAnnotation('email-notification-service', ['send'])
      const sdk = generateServiceSDK(annotation)

      expect(sdk).toContain('export class EmailNotificationServiceClient')
    })

    it('should handle service with numeric suffix', () => {
      const annotation = createServiceAnnotation('api-v2', ['execute'])
      const sdk = generateServiceSDK(annotation)

      expect(sdk).toContain('export class ApiV2Client')
    })

    it('should handle main SDK with only models', () => {
      const modelClients = [
        { name: 'todo', className: 'TodoClient' }
      ]

      const mainSDK = generateMainSDKWithServices(modelClients, [])

      assertValidTypeScript(mainSDK)
      expect(mainSDK).toContain('todo: new TodoClient(client)')
    })

    it('should handle main SDK with only services', () => {
      const serviceClients = [
        {
          name: 'ai-agent',
          className: 'AiAgentClient',
          annotation: createServiceAnnotation('ai-agent', ['sendMessage'])
        }
      ]

      const mainSDK = generateMainSDKWithServices([], serviceClients)

      assertValidTypeScript(mainSDK)
      expect(mainSDK).toContain('aiAgent: new AiAgentClient(client)')
    })
  })

  describe('Real-World Service Examples', () => {
    it('should generate AI agent service', () => {
      const annotation = createServiceAnnotation('ai-agent', [
        'sendMessage',
        'getHistory',
        'clearHistory',
        'getConversation',
        'deleteConversation'
      ])

      const sdk = generateServiceSDK(annotation)

      assertValidTypeScript(sdk)
      assertIncludes(sdk, [
        'export class AiAgentClient',
        'POST /api/ai-agent/message',
        'GET /api/ai-agent/history',
        'POST /api/ai-agent/clear-history',
        'GET /api/ai-agent/conversation',
        'DELETE /api/ai-agent/conversation'
      ])
    })

    it('should generate file storage service', () => {
      const annotation = createServiceAnnotation('file-storage', [
        'uploadFile',
        'downloadFile',
        'deleteFile',
        'getMetadata',
        'updateMetadata'
      ])

      const sdk = generateServiceSDK(annotation)

      assertValidTypeScript(sdk)
      assertIncludes(sdk, [
        'export class FileStorageClient',
        'async uploadFile',
        'async downloadFile',
        'async deleteFile',
        'async getMetadata',
        'async updateMetadata'
      ])
    })

    it('should generate notification service', () => {
      const annotation = createServiceAnnotation('notification', [
        'sendEmail',
        'sendSMS',
        'getTemplates',
        'updateTemplate'
      ])

      const sdk = generateServiceSDK(annotation)

      assertValidTypeScript(sdk)
      expect(sdk).toContain('export class NotificationClient')
    })

    it('should generate payment service', () => {
      const annotation = createServiceAnnotation('payment', [
        'createCheckout',
        'getTransaction',
        'updatePaymentMethod',
        'deletePaymentMethod'
      ])

      const sdk = generateServiceSDK(annotation)

      assertValidTypeScript(sdk)
      expect(sdk).toContain('export class PaymentClient')
    })
  })
})


