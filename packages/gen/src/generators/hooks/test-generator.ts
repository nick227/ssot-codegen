/**
 * Hooks Test Generator
 * 
 * Generates automated tests for generated hooks
 * Uses React Testing Library + Vitest
 */

import type { ParsedModel, ParsedSchema } from '../../dmmf-parser.js'
import { analyzeModel } from '../../utils/relationship-analyzer.js'

/**
 * Generate React hooks tests for a model
 */
export function generateReactHookTests(
  model: ParsedModel,
  schema: ParsedSchema
): string {
  const analysis = analyzeModel(model, schema)
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  const mockId = idType === 'string' ? "'test-123'" : '123'
  
  const helperTests = generateHelperHookTests(model, analysis)
  
  return `// @generated
// Automated tests for ${modelName} React hooks

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  use${modelName},
  use${modelName}s,
  useCreate${modelName},
  useUpdate${modelName},
  useDelete${modelName},
  useInfinite${modelName}s
} from '../use-${modelLower}'
import * as api from '../../../index'

// Mock the API
vi.mock('../../../index', () => ({
  createSDK: () => ({
    ${modelLower}: {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findOne: vi.fn(),
      count: vi.fn(),
      helpers: {
        findBySlug: vi.fn(),
        listPublished: vi.fn(),
        publish: vi.fn(),
        unpublish: vi.fn(),
        approve: vi.fn(),
        reject: vi.fn()
      }
    }
  })
}))

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('${modelName} React Hooks', () => {
  let mockAPI: any
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Get mocked API
    const sdk = api.createSDK({ baseUrl: 'http://test' })
    mockAPI = sdk.${modelLower}
  })

  // ============================================
  // QUERY HOOKS TESTS
  // ============================================

  describe('use${modelName}', () => {
    it('should fetch single ${modelLower} by ID', async () => {
      const mock${modelName} = { id: ${mockId}, title: 'Test ${modelName}' }
      mockAPI.get.mockResolvedValue(mock${modelName})
      
      const { result } = renderHook(() => use${modelName}(${mockId}), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(mock${modelName})
      expect(mockAPI.get).toHaveBeenCalledWith(${mockId})
    })
    
    it('should handle loading state', () => {
      mockAPI.get.mockImplementation(() => new Promise(() => {}))
      
      const { result } = renderHook(() => use${modelName}(${mockId}), {
        wrapper: createWrapper()
      })
      
      expect(result.current.isPending).toBe(true)
      expect(result.current.data).toBeUndefined()
    })
    
    it('should handle error state', async () => {
      mockAPI.get.mockRejectedValue(new Error('API Error'))
      
      const { result } = renderHook(() => use${modelName}(${mockId}), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isError).toBe(true))
      
      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('use${modelName}s', () => {
    it('should fetch list of ${modelLower}s', async () => {
      const mockList = {
        data: [
          { id: ${mockId}, title: 'Test 1' },
          { id: ${idType === 'string' ? "'test-456'" : '456'}, title: 'Test 2' }
        ],
        meta: { total: 2, skip: 0, take: 20, hasMore: false }
      }
      mockAPI.list.mockResolvedValue(mockList)
      
      const { result } = renderHook(() => use${modelName}s({ take: 20 }), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(mockList)
      expect(mockAPI.list).toHaveBeenCalledWith({ take: 20 })
    })
    
    it('should accept query parameters', async () => {
      mockAPI.list.mockResolvedValue({ data: [], meta: { total: 0 } })
      
      const query = { 
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
      
      const { result } = renderHook(() => use${modelName}s(query), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(mockAPI.list).toHaveBeenCalledWith(query)
    })
  })

  describe('useInfinite${modelName}s', () => {
    it('should fetch pages of ${modelLower}s', async () => {
      const mockPage = {
        data: [{ id: ${mockId}, title: 'Test' }],
        meta: { total: 100, skip: 0, take: 20, hasMore: true }
      }
      mockAPI.list.mockResolvedValue(mockPage)
      
      const { result } = renderHook(() => useInfinite${modelName}s(), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.hasNextPage).toBe(true)
    })
  })

  // ============================================
  // MUTATION HOOKS TESTS
  // ============================================

  describe('useCreate${modelName}', () => {
    it('should create ${modelLower}', async () => {
      const newData = { title: 'New ${modelName}', content: 'Test content' }
      const created${modelName} = { id: ${mockId}, ...newData }
      mockAPI.create.mockResolvedValue(created${modelName})
      
      const { result } = renderHook(() => useCreate${modelName}(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate(newData as any)
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(created${modelName})
      expect(mockAPI.create).toHaveBeenCalledWith(newData)
    })
    
    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      mockAPI.create.mockResolvedValue({ id: ${mockId} })
      
      const { result } = renderHook(() => useCreate${modelName}({ onSuccess }), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({} as any)
      
      await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    })
    
    it('should call onError callback', async () => {
      const onError = vi.fn()
      mockAPI.create.mockRejectedValue(new Error('Create failed'))
      
      const { result } = renderHook(() => useCreate${modelName}({ onError }), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({} as any)
      
      await waitFor(() => expect(onError).toHaveBeenCalled())
    })
  })

  describe('useUpdate${modelName}', () => {
    it('should update ${modelLower}', async () => {
      const updated${modelName} = { id: ${mockId}, title: 'Updated' }
      mockAPI.update.mockResolvedValue(updated${modelName})
      
      const { result } = renderHook(() => useUpdate${modelName}(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({ id: ${mockId}, data: { title: 'Updated' } })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(updated${modelName})
    })
  })

  describe('useDelete${modelName}', () => {
    it('should delete ${modelLower}', async () => {
      mockAPI.delete.mockResolvedValue(true)
      
      const { result } = renderHook(() => useDelete${modelName}(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate(${mockId})
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toBe(true)
      expect(mockAPI.delete).toHaveBeenCalledWith(${mockId})
    })
  })
${helperTests}
})
`
}

/**
 * Generate tests for helper hooks
 */
function generateHelperHookTests(
  model: ParsedModel,
  analysis: ReturnType<typeof analyzeModel>
): string {
  const tests: string[] = []
  const modelName = model.name
  const mockId = model.idField?.type === 'String' ? "'test-123'" : '123'
  
  if (analysis.specialFields.slug) {
    tests.push(`
  describe('use${modelName}BySlug', () => {
    it('should fetch ${model.name.toLowerCase()} by slug', async () => {
      const mock${modelName} = { id: ${mockId}, slug: 'test-slug', title: 'Test' }
      mockAPI.helpers.findBySlug.mockResolvedValue(mock${modelName})
      
      const { use${modelName}BySlug } = await import('../use-${model.name.toLowerCase()}')
      const { result } = renderHook(() => use${modelName}BySlug('test-slug'), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(mock${modelName})
      expect(mockAPI.helpers.findBySlug).toHaveBeenCalledWith('test-slug')
    })
  })`)
  }
  
  if (analysis.specialFields.published) {
    tests.push(`
  describe('usePublish${modelName}', () => {
    it('should publish ${model.name.toLowerCase()}', async () => {
      const published${modelName} = { id: ${mockId}, published: true }
      mockAPI.helpers.publish.mockResolvedValue(published${modelName})
      
      const { usePublish${modelName} } = await import('../use-${model.name.toLowerCase()}')
      const { result } = renderHook(() => usePublish${modelName}(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate(${mockId})
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(published${modelName})
    })
  })`)
  }
  
  if (analysis.specialFields.approved) {
    tests.push(`
  describe('useApprove${modelName}', () => {
    it('should approve ${model.name.toLowerCase()}', async () => {
      const approved${modelName} = { id: ${mockId}, approved: true }
      mockAPI.helpers.approve.mockResolvedValue(approved${modelName})
      
      const { useApprove${modelName} } = await import('../use-${model.name.toLowerCase()}')
      const { result } = renderHook(() => useApprove${modelName}(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate(${mockId})
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data?.approved).toBe(true)
    })
  })`)
  }
  
  return tests.join('\n')
}

/**
 * Generate test setup file
 */
export function generateTestSetup(): string {
  return `// @generated
// Test setup for React hooks

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
process.env.NODE_ENV = 'test'
`
}

/**
 * Generate Vitest config for hooks tests
 */
export function generateVitestConfig(): string {
  return `// @generated
// Vitest configuration for hooks tests

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./gen/sdk/react/__tests__/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['gen/sdk/react/models/**/*.ts'],
      exclude: ['**/*.test.ts', '**/__tests__/**']
    }
  },
  resolve: {
    alias: {
      '@gen': path.resolve(__dirname, './gen'),
      '@': path.resolve(__dirname, './src')
    }
  }
})
`
}

/**
 * Generate test runner script
 */
export function generateTestRunner(): string {
  return `// @generated
// Test runner for generated hooks

import { describe, it } from 'vitest'

/**
 * Run all hook tests
 * 
 * Usage:
 *   pnpm test:hooks
 */

describe('Generated Hooks Test Suite', () => {
  it('should import all hook test files', async () => {
    // Dynamic import all test files
    const testFiles = import.meta.glob('./**/*.test.ts')
    
    for (const path in testFiles) {
      await testFiles[path]()
    }
  })
})
`
}

/**
 * Generate integration test (tests against real API)
 */
export function generateIntegrationTest(
  model: ParsedModel,
  schema: ParsedSchema
): string {
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  
  return `// @generated
// Integration test for ${modelName} hooks (tests against real API)

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { use${modelName}s, useCreate${modelName}, useDelete${modelName} } from '../use-${modelLower}'

// Note: These tests require the server to be running
// Run with: pnpm test:hooks:integration

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe.skip('${modelName} Integration Tests', () => {
  // Skip by default - run explicitly when server is available
  
  let created${modelName}Id: ${idType} | null = null
  
  afterAll(async () => {
    // Cleanup: delete created test data
    if (created${modelName}Id) {
      const { result } = renderHook(() => useDelete${modelName}(), {
        wrapper: createWrapper()
      })
      result.current.mutate(created${modelName}Id)
    }
  })

  it('should fetch ${modelLower}s from real API', async () => {
    const { result } = renderHook(() => use${modelName}s({ take: 5 }), {
      wrapper: createWrapper()
    })
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 5000
    })
    
    expect(result.current.data?.data).toBeDefined()
    expect(Array.isArray(result.current.data?.data)).toBe(true)
  })
  
  it('should create ${modelLower} via real API', async () => {
    const { result } = renderHook(() => useCreate${modelName}(), {
      wrapper: createWrapper()
    })
    
    const testData = {
      title: 'Integration Test ${modelName}',
      // Add required fields based on schema
    }
    
    result.current.mutate(testData as any)
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 5000
    })
    
    expect(result.current.data).toBeDefined()
    created${modelName}Id = result.current.data?.id ?? null
  })
})
`
}


