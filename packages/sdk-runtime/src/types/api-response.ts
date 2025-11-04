/**
 * Standard API response types
 */

export interface APIResponse<T> {
  data: T
  status: number
  headers: Headers
}

export interface ListResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface PaginationMeta {
  total: number
  skip: number
  take: number
  hasMore: boolean
}

export interface CountResponse {
  total: number
}

