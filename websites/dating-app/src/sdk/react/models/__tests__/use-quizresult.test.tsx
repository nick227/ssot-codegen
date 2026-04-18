// @generated
// Automated tests for QuizResult React hooks

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  useQuizResult,
  useQuizResults,
  useCreateQuizResult,
  useUpdateQuizResult,
  useDeleteQuizResult,
  useInfiniteQuizResults
} from '../use-quizresult'
import * as api from '../../../index'

// Mock the API
vi.mock('../../../index', () => ({
  createSDK: () => ({
    quizresult: {
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

describe('QuizResult React Hooks', () => {
  let mockAPI: any
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Get mocked API
    const sdk = api.createSDK({ baseUrl: 'http://test' })
    mockAPI = sdk.quizresult
  })

  // ============================================
  // QUERY HOOKS TESTS
  // ============================================

  describe('useQuizResult', () => {
    it('should fetch single quizresult by ID', async () => {
      const mockQuizResult = { id: 'test-123', title: 'Test QuizResult' }
      mockAPI.get.mockResolvedValue(mockQuizResult)
      
      const { result } = renderHook(() => useQuizResult('test-123'), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(mockQuizResult)
      expect(mockAPI.get).toHaveBeenCalledWith('test-123')
    })
    
    it('should handle loading state', () => {
      mockAPI.get.mockImplementation(() => new Promise(() => {}))
      
      const { result } = renderHook(() => useQuizResult('test-123'), {
        wrapper: createWrapper()
      })
      
      expect(result.current.isPending).toBe(true)
      expect(result.current.data).toBeUndefined()
    })
    
    it('should handle error state', async () => {
      mockAPI.get.mockRejectedValue(new Error('API Error'))
      
      const { result } = renderHook(() => useQuizResult('test-123'), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isError).toBe(true))
      
      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useQuizResults', () => {
    it('should fetch list of quizresults', async () => {
      const mockList = {
        data: [
          { id: 'test-123', title: 'Test 1' },
          { id: 'test-456', title: 'Test 2' }
        ],
        meta: { total: 2, skip: 0, take: 20, hasMore: false }
      }
      mockAPI.list.mockResolvedValue(mockList)
      
      const { result } = renderHook(() => useQuizResults({ take: 20 }), {
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
      
      const { result } = renderHook(() => useQuizResults(query), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(mockAPI.list).toHaveBeenCalledWith(query)
    })
  })

  describe('useInfiniteQuizResults', () => {
    it('should fetch pages of quizresults', async () => {
      const mockPage = {
        data: [{ id: 'test-123', title: 'Test' }],
        meta: { total: 100, skip: 0, take: 20, hasMore: true }
      }
      mockAPI.list.mockResolvedValue(mockPage)
      
      const { result } = renderHook(() => useInfiniteQuizResults(), {
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

  describe('useCreateQuizResult', () => {
    it('should create quizresult', async () => {
      const newData = { title: 'New QuizResult', content: 'Test content' }
      const createdQuizResult = { id: 'test-123', ...newData }
      mockAPI.create.mockResolvedValue(createdQuizResult)
      
      const { result } = renderHook(() => useCreateQuizResult(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate(newData as any)
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(createdQuizResult)
      expect(mockAPI.create).toHaveBeenCalledWith(newData)
    })
    
    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      mockAPI.create.mockResolvedValue({ id: 'test-123' })
      
      const { result } = renderHook(() => useCreateQuizResult({ onSuccess }), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({} as any)
      
      await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    })
    
    it('should call onError callback', async () => {
      const onError = vi.fn()
      mockAPI.create.mockRejectedValue(new Error('Create failed'))
      
      const { result } = renderHook(() => useCreateQuizResult({ onError }), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({} as any)
      
      await waitFor(() => expect(onError).toHaveBeenCalled())
    })
  })

  describe('useUpdateQuizResult', () => {
    it('should update quizresult', async () => {
      const updatedQuizResult = { id: 'test-123', title: 'Updated' }
      mockAPI.update.mockResolvedValue(updatedQuizResult)
      
      const { result } = renderHook(() => useUpdateQuizResult(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({ id: 'test-123', data: { title: 'Updated' } })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(updatedQuizResult)
    })
  })

  describe('useDeleteQuizResult', () => {
    it('should delete quizresult', async () => {
      mockAPI.delete.mockResolvedValue(true)
      
      const { result } = renderHook(() => useDeleteQuizResult(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate('test-123')
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toBe(true)
      expect(mockAPI.delete).toHaveBeenCalledWith('test-123')
    })
  })

})
