/**
 * DataAdapter Interface
 * 
 * REDLINE: All data operations through this interface only.
 * 
 * CONTRACT:
 * - Returns Result<T, ErrorModel> (never throws domain errors)
 * - Supports AbortSignal for cancellation
 * - Filters hidden fields server-side (field-level ACL)
 * - Validates against whitelists (filterable/sortable)
 * - Prevents N+1 through relation aggregation
 */

// ============================================================================
// Error Model (Standardized)
// ============================================================================

export interface ErrorModel {
  code: string          // e.g., "UNAUTHORIZED", "NOT_FOUND", "RATE_LIMITED"
  message: string       // Human-readable message
  details?: unknown     // Additional context
  retryAfter?: number   // Seconds (for 429 errors)
}

export type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: ErrorModel }

// ============================================================================
// Query Parameters
// ============================================================================

export interface SortParam {
  field: string
  dir: 'asc' | 'desc'
}

export interface FilterParam {
  field: string
  op: 'eq' | 'ne' | 'in' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'startsWith' | 'endsWith' | 'between'
  value: unknown
}

export interface SearchParam {
  query: string
  fields?: string[]  // Explicit fields to search
}

export interface ListParams {
  // Pagination (cursor-based)
  cursor?: string
  pageSize?: number
  
  // Or offset-based
  page?: number
  
  // Sorting
  sort?: SortParam[]
  
  // Filtering
  filters?: FilterParam[]
  
  // Search
  search?: SearchParam
  
  // Relations
  include?: string[]
  
  // Cancellation
  signal?: AbortSignal
}

// ============================================================================
// Query Results
// ============================================================================

export interface ListResult<T> {
  items: T[]
  total: number
  nextCursor?: string  // For cursor pagination
  prevCursor?: string
  hasMore?: boolean
}

// ============================================================================
// DataAdapter Interface
// ============================================================================

export interface DataAdapter {
  /**
   * List records with pagination, filtering, sorting
   * 
   * SERVER-OWNED ORDERING: Validates filters/sort against whitelists
   */
  list<T = unknown>(
    model: string,
    params: ListParams
  ): Promise<Result<ListResult<T>>>
  
  /**
   * Get single record by ID
   */
  detail<T = unknown>(
    model: string,
    id: string,
    options?: {
      include?: string[]
      signal?: AbortSignal
    }
  ): Promise<Result<T>>
  
  /**
   * Create new record
   */
  create<T = unknown>(
    model: string,
    data: Record<string, unknown>,
    options?: {
      signal?: AbortSignal
    }
  ): Promise<Result<T>>
  
  /**
   * Update existing record
   */
  update<T = unknown>(
    model: string,
    id: string,
    data: Record<string, unknown>,
    options?: {
      signal?: AbortSignal
    }
  ): Promise<Result<T>>
  
  /**
   * Delete record
   */
  delete(
    model: string,
    id: string,
    options?: {
      signal?: AbortSignal
    }
  ): Promise<Result<void>>
  
  /**
   * Search across multiple fields
   */
  search<T = unknown>(
    model: string,
    params: SearchParam & {
      pageSize?: number
      signal?: AbortSignal
    }
  ): Promise<Result<ListResult<T>>>
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate filter against whitelist
 */
export function validateFilter(
  filter: FilterParam,
  whitelist: Array<string | { field: string; ops: string[] }>
): boolean {
  const config = whitelist.find(w => 
    typeof w === 'string' ? w === filter.field : w.field === filter.field
  )
  
  if (!config) return false
  
  // If string, all ops allowed
  if (typeof config === 'string') return true
  
  // Check specific ops
  return config.ops.includes(filter.op)
}

/**
 * Validate sort against whitelist
 */
export function validateSort(sort: SortParam, whitelist: string[]): boolean {
  return whitelist.includes(sort.field)
}

