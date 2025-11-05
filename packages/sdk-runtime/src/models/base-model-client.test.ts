/**
 * Base Model Client Tests - Comprehensive
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BaseModelClient, type QueryOptions } from './base-model-client.js'
import { BaseAPIClient } from '../client/base-client.js'
import { APIException } from '../types/api-error.js'

// Test DTO types
interface TestReadDTO {
  id: number
  name: string
  email: string
}

interface TestCreateDTO {
  name: string
  email: string
}

interface TestUpdateDTO {
  name?: string
  email?: string
}

interface TestQueryDTO {
  skip?: number
  take?: number
  orderBy?: string
  where?: {
    name?: { contains?: string }
    email?: { equals?: string }
    published?: boolean
  }
}

// Test client implementation
class TestClient extends BaseModelClient<
  TestReadDTO,
  TestCreateDTO,
  TestUpdateDTO,
  TestQueryDTO
> {
  constructor(client: BaseAPIClient) {
    super(client, '/api/test')
  }
}

describe('BaseModelClient', () => {
  let apiClient: BaseAPIClient
  let testClient: TestClient

  beforeEach(() => {
    apiClient = new BaseAPIClient({
      baseUrl: 'https://api.example.com'
    })
    testClient = new TestClient(apiClient)
  })

  describe('Constructor', () => {
    it('should create client with base path', () => {
      expect(testClient).toBeInstanceOf(BaseModelClient)
    })

    it('should accept API client and base path', () => {
      const customClient = new TestClient(apiClient)
      expect(customClient).toBeInstanceOf(TestClient)
    })
  })

  describe('list()', () => {
    it('should list records', async () => {
      const mockData = {
        data: [
          { id: 1, name: 'Test 1', email: 'test1@example.com' },
          { id: 2, name: 'Test 2', email: 'test2@example.com' }
        ],
        meta: { total: 2, skip: 0, take: 20, hasMore: false }
      }

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockData,
        status: 200,
        headers: new Headers()
      })

      const result = await testClient.list()

      expect(apiClient.get).toHaveBeenCalledWith('/api/test', { signal: undefined })
      expect(result).toEqual(mockData)
    })

    it('should apply pagination query', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [], meta: { total: 0, skip: 10, take: 5, hasMore: false } },
        status: 200,
        headers: new Headers()
      })

      await testClient.list({ skip: 10, take: 5 })

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/test?skip=10&take=5',
        expect.any(Object)
      )
    })

    it('should apply sorting query', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [], meta: { total: 0, skip: 0, take: 20, hasMore: false } },
        status: 200,
        headers: new Headers()
      })

      await testClient.list({ orderBy: 'name:asc' })

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/test?orderBy=name%3Aasc',
        expect.any(Object)
      )
    })

    it('should apply where filters', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [], meta: { total: 0, skip: 0, take: 20, hasMore: false } },
        status: 200,
        headers: new Headers()
      })

      await testClient.list({
        where: {
          published: true,
          name: { contains: 'test' }
        }
      })

      const call = (apiClient.get as any).mock.calls[0][0]
      expect(call).toContain('where%5Bpublished%5D=true')
      expect(call).toContain('where%5Bname%5D%5Bcontains%5D=test')
    })

    it('should pass abort signal', async () => {
      const controller = new AbortController()

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [], meta: { total: 0, skip: 0, take: 20, hasMore: false } },
        status: 200,
        headers: new Headers()
      })

      await testClient.list(undefined, { signal: controller.signal })

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { signal: controller.signal }
      )
    })
  })

  describe('get()', () => {
    it('should get record by ID', async () => {
      const mockData = { id: 1, name: 'Test', email: 'test@example.com' }

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockData,
        status: 200,
        headers: new Headers()
      })

      const result = await testClient.get(1)

      expect(apiClient.get).toHaveBeenCalledWith('/api/test/1', { signal: undefined })
      expect(result).toEqual(mockData)
    })

    it('should get record by string ID', async () => {
      const mockData = { id: 1, name: 'Test', email: 'test@example.com' }

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: mockData,
        status: 200,
        headers: new Headers()
      })

      const result = await testClient.get('abc-123')

      expect(apiClient.get).toHaveBeenCalledWith('/api/test/abc-123', { signal: undefined })
      expect(result).toEqual(mockData)
    })

    it('should return null on 404', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new APIException({ error: 'NotFound', status: 404 })
      )

      const result = await testClient.get(999)

      expect(result).toBeNull()
    })

    it('should throw on other errors', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new APIException({ error: 'ServerError', status: 500 })
      )

      await expect(testClient.get(1)).rejects.toThrow(APIException)
    })

    it('should pass abort signal', async () => {
      const controller = new AbortController()

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { id: 1, name: 'Test', email: 'test@example.com' },
        status: 200,
        headers: new Headers()
      })

      await testClient.get(1, { signal: controller.signal })

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { signal: controller.signal }
      )
    })
  })

  describe('create()', () => {
    it('should create record', async () => {
      const createData = { name: 'New Test', email: 'new@example.com' }
      const mockResponse = { id: 1, ...createData }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: new Headers()
      })

      const result = await testClient.create(createData)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/test',
        createData,
        { signal: undefined }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should pass abort signal', async () => {
      const controller = new AbortController()
      const createData = { name: 'Test', email: 'test@example.com' }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { id: 1, ...createData },
        status: 201,
        headers: new Headers()
      })

      await testClient.create(createData, { signal: controller.signal })

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        { signal: controller.signal }
      )
    })

    it('should throw on validation error', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(
        new APIException({
          error: 'Validation Error',
          status: 400,
          details: [{ field: 'email', message: 'Invalid email' }]
        })
      )

      await expect(
        testClient.create({ name: 'Test', email: 'invalid' })
      ).rejects.toThrow(APIException)
    })
  })

  describe('update()', () => {
    it('should update record', async () => {
      const updateData = { name: 'Updated' }
      const mockResponse = { id: 1, name: 'Updated', email: 'test@example.com' }

      vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: new Headers()
      })

      const result = await testClient.update(1, updateData)

      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/test/1',
        updateData,
        { signal: undefined }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should update record by string ID', async () => {
      const updateData = { name: 'Updated' }
      const mockResponse = { id: 1, name: 'Updated', email: 'test@example.com' }

      vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: new Headers()
      })

      await testClient.update('abc-123', updateData)

      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/test/abc-123',
        updateData,
        { signal: undefined }
      )
    })

    it('should return null on 404', async () => {
      vi.spyOn(apiClient, 'put').mockRejectedValueOnce(
        new APIException({ error: 'NotFound', status: 404 })
      )

      const result = await testClient.update(999, { name: 'Updated' })

      expect(result).toBeNull()
    })

    it('should throw on other errors', async () => {
      vi.spyOn(apiClient, 'put').mockRejectedValueOnce(
        new APIException({ error: 'ServerError', status: 500 })
      )

      await expect(
        testClient.update(1, { name: 'Updated' })
      ).rejects.toThrow(APIException)
    })

    it('should pass abort signal', async () => {
      const controller = new AbortController()

      vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: { id: 1, name: 'Updated', email: 'test@example.com' },
        status: 200,
        headers: new Headers()
      })

      await testClient.update(1, { name: 'Updated' }, { signal: controller.signal })

      expect(apiClient.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        { signal: controller.signal }
      )
    })
  })

  describe('delete()', () => {
    it('should delete record', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: undefined as any,
        status: 204,
        headers: new Headers()
      })

      const result = await testClient.delete(1)

      expect(apiClient.delete).toHaveBeenCalledWith('/api/test/1', { signal: undefined })
      expect(result).toBe(true)
    })

    it('should delete record by string ID', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: undefined as any,
        status: 204,
        headers: new Headers()
      })

      const result = await testClient.delete('abc-123')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/test/abc-123', { signal: undefined })
      expect(result).toBe(true)
    })

    it('should return false on 404', async () => {
      vi.spyOn(apiClient, 'delete').mockRejectedValueOnce(
        new APIException({ error: 'NotFound', status: 404 })
      )

      const result = await testClient.delete(999)

      expect(result).toBe(false)
    })

    it('should throw on other errors', async () => {
      vi.spyOn(apiClient, 'delete').mockRejectedValueOnce(
        new APIException({ error: 'ServerError', status: 500 })
      )

      await expect(testClient.delete(1)).rejects.toThrow(APIException)
    })

    it('should pass abort signal', async () => {
      const controller = new AbortController()

      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: undefined as any,
        status: 204,
        headers: new Headers()
      })

      await testClient.delete(1, { signal: controller.signal })

      expect(apiClient.delete).toHaveBeenCalledWith(
        expect.any(String),
        { signal: controller.signal }
      )
    })
  })

  describe('count()', () => {
    it('should count records', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { total: 42 },
        status: 200,
        headers: new Headers()
      })

      const result = await testClient.count()

      expect(apiClient.get).toHaveBeenCalledWith('/api/test/meta/count', { signal: undefined })
      expect(result).toBe(42)
    })

    it('should pass abort signal', async () => {
      const controller = new AbortController()

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { total: 10 },
        status: 200,
        headers: new Headers()
      })

      await testClient.count({ signal: controller.signal })

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        { signal: controller.signal }
      )
    })
  })

  describe('buildQueryString()', () => {
    it('should build empty query string', () => {
      const qs = (testClient as any).buildQueryString(undefined)
      expect(qs).toBe('')
    })

    it('should build pagination query', () => {
      const qs = (testClient as any).buildQueryString({ skip: 10, take: 20 })
      expect(qs).toBe('?skip=10&take=20')
    })

    it('should build sorting query', () => {
      const qs = (testClient as any).buildQueryString({ orderBy: 'name:desc' })
      expect(qs).toBe('?orderBy=name%3Adesc')
    })

    it('should build where query with direct values', () => {
      const qs = (testClient as any).buildQueryString({
        where: { published: true }
      })
      expect(qs).toContain('where%5Bpublished%5D=true')
    })

    it('should build where query with operators', () => {
      const qs = (testClient as any).buildQueryString({
        where: {
          name: { contains: 'test' },
          email: { equals: 'test@example.com' }
        }
      })
      expect(qs).toContain('where%5Bname%5D%5Bcontains%5D=test')
      expect(qs).toContain('where%5Bemail%5D%5Bequals%5D=test%40example.com')
    })

    it('should skip null and undefined values', () => {
      const qs = (testClient as any).buildQueryString({
        skip: null,
        take: undefined,
        where: { name: null, email: undefined }
      })
      expect(qs).toBe('')
    })

    it('should handle zero values', () => {
      const qs = (testClient as any).buildQueryString({ skip: 0, take: 0 })
      expect(qs).toBe('?skip=0&take=0')
    })

    it('should build complex query', () => {
      const qs = (testClient as any).buildQueryString({
        skip: 20,
        take: 10,
        orderBy: 'createdAt:desc',
        where: {
          published: true,
          name: { contains: 'test' }
        }
      })
      
      expect(qs).toContain('skip=20')
      expect(qs).toContain('take=10')
      expect(qs).toContain('orderBy=createdAt%3Adesc')
      expect(qs).toContain('where%5Bpublished%5D=true')
      expect(qs).toContain('where%5Bname%5D%5Bcontains%5D=test')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty list response', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [], meta: { total: 0, skip: 0, take: 20, hasMore: false } },
        status: 200,
        headers: new Headers()
      })

      const result = await testClient.list()

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })

    it('should handle very large skip/take values', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [], meta: { total: 0, skip: 10000, take: 1000, hasMore: false } },
        status: 200,
        headers: new Headers()
      })

      await testClient.list({ skip: 10000, take: 1000 })

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('skip=10000&take=1000'),
        expect.any(Object)
      )
    })

    it('should handle special characters in filters', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { data: [], meta: { total: 0, skip: 0, take: 20, hasMore: false } },
        status: 200,
        headers: new Headers()
      })

      await testClient.list({
        where: {
          name: { contains: 'test&special=chars' }
        }
      })

      expect(apiClient.get).toHaveBeenCalled()
    })

    it('should handle numeric IDs', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { id: 123, name: 'Test', email: 'test@example.com' },
        status: 200,
        headers: new Headers()
      })

      await testClient.get(123)

      expect(apiClient.get).toHaveBeenCalledWith('/api/test/123', expect.any(Object))
    })

    it('should handle UUID IDs', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { id: 1, name: 'Test', email: 'test@example.com' },
        status: 200,
        headers: new Headers()
      })

      await testClient.get('550e8400-e29b-41d4-a716-446655440000')

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/test/550e8400-e29b-41d4-a716-446655440000',
        expect.any(Object)
      )
    })
  })
})

