// @generated
// Automated tests for PersonalityDimension React hooks

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { 
  usePersonalityDimension,
  usePersonalityDimensions,
  useCreatePersonalityDimension,
  useUpdatePersonalityDimension,
  useDeletePersonalityDimension,
  useInfinitePersonalityDimensions
} from '../use-personalitydimension'
import * as api from '../../../index'

// Mock the API
vi.mock('../../../index', () => ({
  createSDK: () => ({
    personalitydimension: {
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

describe('PersonalityDimension React Hooks', () => {
  let mockAPI: any
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Get mocked API
    const sdk = api.createSDK({ baseUrl: 'http://test' })
    mockAPI = sdk.personalitydimension
  })

  // ============================================
  // QUERY HOOKS TESTS
  // ============================================

  describe('usePersonalityDimension', () => {
    it('should fetch single personalitydimension by ID', async () => {
      const mockPersonalityDimension = { id: 'test-123', title: 'Test PersonalityDimension' }
      mockAPI.get.mockResolvedValue(mockPersonalityDimension)
      
      const { result } = renderHook(() => usePersonalityDimension('test-123'), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(mockPersonalityDimension)
      expect(mockAPI.get).toHaveBeenCalledWith('test-123')
    })
    
    it('should handle loading state', () => {
      mockAPI.get.mockImplementation(() => new Promise(() => {}))
      
      const { result } = renderHook(() => usePersonalityDimension('test-123'), {
        wrapper: createWrapper()
      })
      
      expect(result.current.isPending).toBe(true)
      expect(result.current.data).toBeUndefined()
    })
    
    it('should handle error state', async () => {
      mockAPI.get.mockRejectedValue(new Error('API Error'))
      
      const { result } = renderHook(() => usePersonalityDimension('test-123'), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isError).toBe(true))
      
      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('usePersonalityDimensions', () => {
    it('should fetch list of personalitydimensions', async () => {
      const mockList = {
        data: [
          { id: 'test-123', title: 'Test 1' },
          { id: 'test-456', title: 'Test 2' }
        ],
        meta: { total: 2, skip: 0, take: 20, hasMore: false }
      }
      mockAPI.list.mockResolvedValue(mockList)
      
      const { result } = renderHook(() => usePersonalityDimensions({ take: 20 }), {
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
      
      const { result } = renderHook(() => usePersonalityDimensions(query), {
        wrapper: createWrapper()
      })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(mockAPI.list).toHaveBeenCalledWith(query)
    })
  })

  describe('useInfinitePersonalityDimensions', () => {
    it('should fetch pages of personalitydimensions', async () => {
      const mockPage = {
        data: [{ id: 'test-123', title: 'Test' }],
        meta: { total: 100, skip: 0, take: 20, hasMore: true }
      }
      mockAPI.list.mockResolvedValue(mockPage)
      
      const { result } = renderHook(() => useInfinitePersonalityDimensions(), {
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

  describe('useCreatePersonalityDimension', () => {
    it('should create personalitydimension', async () => {
      const newData = { title: 'New PersonalityDimension', content: 'Test content' }
      const createdPersonalityDimension = { id: 'test-123', ...newData }
      mockAPI.create.mockResolvedValue(createdPersonalityDimension)
      
      const { result } = renderHook(() => useCreatePersonalityDimension(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate(newData as any)
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(createdPersonalityDimension)
      expect(mockAPI.create).toHaveBeenCalledWith(newData)
    })
    
    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      mockAPI.create.mockResolvedValue({ id: 'test-123' })
      
      const { result } = renderHook(() => useCreatePersonalityDimension({ onSuccess }), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({} as any)
      
      await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    })
    
    it('should call onError callback', async () => {
      const onError = vi.fn()
      mockAPI.create.mockRejectedValue(new Error('Create failed'))
      
      const { result } = renderHook(() => useCreatePersonalityDimension({ onError }), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({} as any)
      
      await waitFor(() => expect(onError).toHaveBeenCalled())
    })
  })

  describe('useUpdatePersonalityDimension', () => {
    it('should update personalitydimension', async () => {
      const updatedPersonalityDimension = { id: 'test-123', title: 'Updated' }
      mockAPI.update.mockResolvedValue(updatedPersonalityDimension)
      
      const { result } = renderHook(() => useUpdatePersonalityDimension(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate({ id: 'test-123', data: { title: 'Updated' } })
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toEqual(updatedPersonalityDimension)
    })
  })

  describe('useDeletePersonalityDimension', () => {
    it('should delete personalitydimension', async () => {
      mockAPI.delete.mockResolvedValue(true)
      
      const { result } = renderHook(() => useDeletePersonalityDimension(), {
        wrapper: createWrapper()
      })
      
      result.current.mutate('test-123')
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      
      expect(result.current.data).toBe(true)
      expect(mockAPI.delete).toHaveBeenCalledWith('test-123')
    })
  })

})
