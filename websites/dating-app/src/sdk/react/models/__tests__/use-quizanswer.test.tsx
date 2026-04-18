// @generated
// Automated tests for QuizAnswer React hooks

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  useQuizAnswer,
  useQuizAnswers,
  useCreateQuizAnswer,
  useUpdateQuizAnswer,
  useDeleteQuizAnswer,
  useInfiniteQuizAnswers
} from '../use-quizanswer'
import * as api from '../../../index'

// Mock the API
vi.mock('../../../index', () => ({
  createSDK: () => ({
    quizanswer: {
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

describe('QuizAnswer React Hooks', () => {
  let mockAPI: any
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Get mocked API
    const sdk = api.createSDK({ baseUrl: 'http://test' })
    mockAPI = sdk.quizanswer
  })

  // ============================================
  // QUERY HOOKS TESTS
  // ============================================

  describe('useQuizAnswer', () => {
    it('should fetch single quizanswer by ID', async () => {
      const mockQuizAnswer = { id: 'test-123', title: 'Test QuizAnswer' }
      mockAPI.get.mockResolvedValue(mockQuizAnswer)
      
      const { result } = renderHook(() => useQuizAnswer('test-123'), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(mockQuizAnswer)
      expect(mockAPI.get).toHaveBeenCalledWith('test-123')
    })
    
    it('should handle loading state', () => {
      mockAPI.get.mockImplementation(() => new Promise(() => {}))
      
      const { result } = renderHook(() => useQuizAnswer('test-123'), {
        wrapper: createWrapper()
      })
      
      expect(result.current.isPending).toBe(true)
      expect(result.current.data).toBeUndefined()
    })
    
    it('should handle error state', async () => {
      mockAPI.get.mockRejectedValue(new Error('API Error'))
      
      const { result } = renderHook(() => useQuizAnswer('test-123'), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isError).toBe(true))
      
      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useQuizAnswers', () => {
    it('should fetch list of quizanswers', async () => {
      const mockList = {
        data: [
          { id: 'test-123', title: 'Test 1' },
          { id: 'test-456', title: 'Test 2' }
        ],
        meta: { total: 2, skip: 0, take: 20, hasMore: false }
      }
      mockAPI.list.mockResolvedValue(mockList)
      
      const { result } = renderHook(() => useQuizAnswers({ take: 20 }), {
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
      
      const { result } = renderHook(() => useQuizAnswers(query), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(mockAPI.list).toHaveBeenCalledWith(query)
    })
  })

  describe('useInfiniteQuizAnswers', () => {
    it('should fetch pages of quizanswers', async () => {
      const mockPage = {
        data: [{ id: 'test-123', title: 'Test' }],
        meta: { total: 100, skip: 0, take: 20, hasMore: true }
      }
      mockAPI.list.mockResolvedValue(mockPage)
      
      const { result } = renderHook(() => useInfiniteQuizAnswers(), {
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

  describe('useCreateQuizAnswer', () => {
    it('should create quizanswer', async () => {
      const newData = { title: 'New QuizAnswer', content: 'Test content' }
      const createdQuizAnswer = { id: 'test-123', ...newData }
      mockAPI.create.mockResolvedValue(createdQuizAnswer)
      
      const { result } = renderHook(() => useCreateQuizAnswer(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate(newData as any)
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(createdQuizAnswer)
      expect(mockAPI.create).toHaveBeenCalledWith(newData)
    })
    
    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      mockAPI.create.mockResolvedValue({ id: 'test-123' })
      
      const { result } = renderHook(() => useCreateQuizAnswer({ onSuccess }), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({} as any)
      
      await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    })
    
    it('should call onError callback', async () => {
      const onError = vi.fn()
      mockAPI.create.mockRejectedValue(new Error('Create failed'))
      
      const { result } = renderHook(() => useCreateQuizAnswer({ onError }), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({} as any)
      
      await waitFor(() => expect(onError).toHaveBeenCalled())
    })
  })

  describe('useUpdateQuizAnswer', () => {
    it('should update quizanswer', async () => {
      const updatedQuizAnswer = { id: 'test-123', title: 'Updated' }
      mockAPI.update.mockResolvedValue(updatedQuizAnswer)
      
      const { result } = renderHook(() => useUpdateQuizAnswer(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({ id: 'test-123', data: { title: 'Updated' } })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(updatedQuizAnswer)
    })
  })

  describe('useDeleteQuizAnswer', () => {
    it('should delete quizanswer', async () => {
      mockAPI.delete.mockResolvedValue(true)
      
      const { result } = renderHook(() => useDeleteQuizAnswer(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate('test-123')
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toBe(true)
      expect(mockAPI.delete).toHaveBeenCalledWith('test-123')
    })
  })

})
