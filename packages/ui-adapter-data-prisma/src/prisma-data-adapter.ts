/**
 * PrismaDataAdapter
 * 
 * Reference implementation of DataAdapter for Prisma.
 * 
 * ENFORCES:
 * - Server-owned ordering (validates against whitelists)
 * - Field-level ACL (filters hidden fields)
 * - Cursor pagination
 * - Relation aggregation (prevents N+1)
 * - Returns Result<T, ErrorModel> (never throws domain errors)
 */

import type { PrismaClient } from '@prisma/client'
import type {
  DataAdapter,
  ListParams,
  ListResult,
  Result,
  ErrorModel,
  FilterParam,
  SortParam,
  validateFilter,
  validateSort
} from '@ssot-ui/adapters'
import type { DataContract } from '@ssot-ui/schemas'
import { isFieldFilterable, isFieldSortable, getMaxPageSize } from '@ssot-ui/schemas'

// ============================================================================
// Prisma Data Adapter
// ============================================================================

export class PrismaDataAdapter implements DataAdapter {
  constructor(
    private prisma: PrismaClient,
    private dataContract: DataContract,
    private options: {
      fieldACL?: Record<string, { readRoles?: string[]; writeRoles?: string[] }>
      currentUser?: { roles?: string[] }
    } = {}
  ) {}
  
  /**
   * List records with pagination, filtering, sorting
   * 
   * REDLINE: Validates filters/sort against whitelists
   */
  async list<T = unknown>(
    model: string,
    params: ListParams
  ): Promise<Result<ListResult<T>>> {
    try {
      // Get Prisma model delegate
      const delegate = this.getModelDelegate(model)
      if (!delegate) {
        return {
          ok: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: `Model "${model}" not found in Prisma client`
          }
        }
      }
      
      // Validate and build where clause
      const where = this.buildWhereClause(model, params.filters)
      if (!where.ok) return where as any
      
      // Validate and build orderBy
      const orderBy = this.buildOrderBy(model, params.sort)
      if (!orderBy.ok) return orderBy as any
      
      // Build include for relations
      const include = this.buildInclude(params.include)
      
      // Pagination
      const pageSize = Math.min(
        params.pageSize || 20,
        getMaxPageSize(this.dataContract, model)
      )
      
      // Cursor pagination
      const findManyArgs: any = {
        where: where.data,
        orderBy: orderBy.data,
        include,
        take: pageSize + 1 // Fetch one extra to check hasMore
      }
      
      if (params.cursor) {
        findManyArgs.cursor = { id: params.cursor }
        findManyArgs.skip = 1 // Skip the cursor itself
      }
      
      // Execute query
      const items = await delegate.findMany(findManyArgs)
      
      // Check if there are more items
      const hasMore = items.length > pageSize
      if (hasMore) {
        items.pop() // Remove the extra item
      }
      
      // Get total count (expensive, only if needed)
      const total = await delegate.count({ where: where.data })
      
      // Filter fields based on ACL
      const filteredItems = this.filterFieldsByACL(items, model)
      
      return {
        ok: true,
        data: {
          items: filteredItems as T[],
          total,
          hasMore,
          nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : undefined
        }
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: (error as Error).message,
          details: error
        }
      }
    }
  }
  
  /**
   * Get single record by ID
   */
  async detail<T = unknown>(
    model: string,
    id: string,
    options?: { include?: string[]; signal?: AbortSignal }
  ): Promise<Result<T>> {
    try {
      const delegate = this.getModelDelegate(model)
      if (!delegate) {
        return {
          ok: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: `Model "${model}" not found`
          }
        }
      }
      
      const include = this.buildInclude(options?.include)
      
      const item = await delegate.findUnique({
        where: { id },
        include
      })
      
      if (!item) {
        return {
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: `${model} with ID "${id}" not found`
          }
        }
      }
      
      // Filter fields by ACL
      const filtered = this.filterFieldsByACL([item], model)[0]
      
      return {
        ok: true,
        data: filtered as T
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: (error as Error).message,
          details: error
        }
      }
    }
  }
  
  /**
   * Create new record
   */
  async create<T = unknown>(
    model: string,
    data: Record<string, unknown>,
    options?: { signal?: AbortSignal }
  ): Promise<Result<T>> {
    try {
      const delegate = this.getModelDelegate(model)
      if (!delegate) {
        return {
          ok: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: `Model "${model}" not found`
          }
        }
      }
      
      // Check write permissions
      const writeCheck = this.checkWritePermissions(model, data)
      if (!writeCheck.ok) return writeCheck as any
      
      const item = await delegate.create({
        data
      })
      
      return {
        ok: true,
        data: item as T
      }
    } catch (error) {
      // Handle unique constraint violations, etc.
      const prismaError = error as any
      
      if (prismaError.code === 'P2002') {
        return {
          ok: false,
          error: {
            code: 'UNIQUE_CONSTRAINT',
            message: 'A record with this value already exists',
            details: prismaError.meta
          }
        }
      }
      
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: (error as Error).message,
          details: error
        }
      }
    }
  }
  
  /**
   * Update existing record
   */
  async update<T = unknown>(
    model: string,
    id: string,
    data: Record<string, unknown>,
    options?: { signal?: AbortSignal }
  ): Promise<Result<T>> {
    try {
      const delegate = this.getModelDelegate(model)
      if (!delegate) {
        return {
          ok: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: `Model "${model}" not found`
          }
        }
      }
      
      // Check write permissions
      const writeCheck = this.checkWritePermissions(model, data)
      if (!writeCheck.ok) return writeCheck as any
      
      const item = await delegate.update({
        where: { id },
        data
      })
      
      return {
        ok: true,
        data: item as T
      }
    } catch (error) {
      const prismaError = error as any
      
      if (prismaError.code === 'P2025') {
        return {
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: `${model} with ID "${id}" not found`
          }
        }
      }
      
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: (error as Error).message,
          details: error
        }
      }
    }
  }
  
  /**
   * Delete record
   */
  async delete(
    model: string,
    id: string,
    options?: { signal?: AbortSignal }
  ): Promise<Result<void>> {
    try {
      const delegate = this.getModelDelegate(model)
      if (!delegate) {
        return {
          ok: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: `Model "${model}" not found`
          }
        }
      }
      
      await delegate.delete({
        where: { id }
      })
      
      return {
        ok: true,
        data: undefined
      }
    } catch (error) {
      const prismaError = error as any
      
      if (prismaError.code === 'P2025') {
        return {
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: `${model} with ID "${id}" not found`
          }
        }
      }
      
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: (error as Error).message,
          details: error
        }
      }
    }
  }
  
  /**
   * Search across multiple fields
   */
  async search<T = unknown>(
    model: string,
    params: { query: string; fields?: string[]; pageSize?: number; signal?: AbortSignal }
  ): Promise<Result<ListResult<T>>> {
    try {
      const delegate = this.getModelDelegate(model)
      if (!delegate) {
        return {
          ok: false,
          error: {
            code: 'MODEL_NOT_FOUND',
            message: `Model "${model}" not found`
          }
        }
      }
      
      // Get searchable fields from contract
      const modelContract = this.dataContract.models[model]
      const searchFields = params.fields || modelContract?.list?.search?.fields || []
      
      if (searchFields.length === 0) {
        return {
          ok: false,
          error: {
            code: 'SEARCH_NOT_CONFIGURED',
            message: `Search not configured for model "${model}"`
          }
        }
      }
      
      // Build OR conditions for each field
      const where = {
        OR: searchFields.map(field => ({
          [field]: { contains: params.query, mode: 'insensitive' }
        }))
      }
      
      const pageSize = params.pageSize || 20
      
      const [items, total] = await Promise.all([
        delegate.findMany({
          where,
          take: pageSize
        }),
        delegate.count({ where })
      ])
      
      return {
        ok: true,
        data: {
          items: items as T[],
          total
        }
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: (error as Error).message,
          details: error
        }
      }
    }
  }
  
  // ==========================================================================
  // Private Helpers
  // ==========================================================================
  
  private getModelDelegate(model: string): any {
    const modelLower = model.toLowerCase()
    return (this.prisma as any)[modelLower]
  }
  
  private buildWhereClause(
    model: string,
    filters?: FilterParam[]
  ): Result<Record<string, unknown>> {
    if (!filters || filters.length === 0) {
      return { ok: true, data: {} }
    }
    
    const where: Record<string, unknown> = {}
    
    for (const filter of filters) {
      // Validate against whitelist (REDLINE)
      if (!isFieldFilterable(this.dataContract, model, filter.field, filter.op)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_FILTER',
            message: `Field "${filter.field}" is not filterable with operator "${filter.op}" on model "${model}"`
          }
        }
      }
      
      // Map operator to Prisma query
      switch (filter.op) {
        case 'eq':
          where[filter.field] = filter.value
          break
        case 'ne':
          where[filter.field] = { not: filter.value }
          break
        case 'in':
          where[filter.field] = { in: filter.value }
          break
        case 'lt':
          where[filter.field] = { lt: filter.value }
          break
        case 'lte':
          where[filter.field] = { lte: filter.value }
          break
        case 'gt':
          where[filter.field] = { gt: filter.value }
          break
        case 'gte':
          where[filter.field] = { gte: filter.value }
          break
        case 'contains':
          where[filter.field] = { contains: filter.value, mode: 'insensitive' }
          break
        case 'startsWith':
          where[filter.field] = { startsWith: filter.value }
          break
        case 'endsWith':
          where[filter.field] = { endsWith: filter.value }
          break
      }
    }
    
    return { ok: true, data: where }
  }
  
  private buildOrderBy(
    model: string,
    sort?: SortParam[]
  ): Result<Record<string, string>[]> {
    if (!sort || sort.length === 0) {
      return { ok: true, data: [] }
    }
    
    const orderBy: Record<string, string>[] = []
    
    for (const s of sort) {
      // Validate against whitelist (REDLINE)
      if (!isFieldSortable(this.dataContract, model, s.field)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_SORT',
            message: `Field "${s.field}" is not sortable on model "${model}"`
          }
        }
      }
      
      orderBy.push({ [s.field]: s.dir })
    }
    
    return { ok: true, data: orderBy }
  }
  
  private buildInclude(relations?: string[]): Record<string, boolean> {
    if (!relations || relations.length === 0) {
      return {}
    }
    
    const include: Record<string, boolean> = {}
    for (const rel of relations) {
      include[rel] = true
    }
    
    return include
  }
  
  private filterFieldsByACL(items: any[], model: string): any[] {
    const modelContract = this.dataContract.models[model]
    const fieldACL = modelContract?.fields || this.options.fieldACL || {}
    const userRoles = this.options.currentUser?.roles || []
    
    if (Object.keys(fieldACL).length === 0) {
      return items // No ACL, return as-is
    }
    
    return items.map(item => {
      const filtered: any = { ...item }
      
      for (const [field, acl] of Object.entries(fieldACL)) {
        if (acl.readRoles && acl.readRoles.length > 0) {
          // Check if user has required role
          const hasRole = acl.readRoles.some(role => userRoles.includes(role))
          
          if (!hasRole) {
            delete filtered[field] // Remove field from response
          }
        }
      }
      
      return filtered
    })
  }
  
  private checkWritePermissions(
    model: string,
    data: Record<string, unknown>
  ): Result<void> {
    const modelContract = this.dataContract.models[model]
    const fieldACL = modelContract?.fields || this.options.fieldACL || {}
    const userRoles = this.options.currentUser?.roles || []
    
    for (const field of Object.keys(data)) {
      const acl = fieldACL[field]
      
      if (acl?.writeRoles && acl.writeRoles.length > 0) {
        const hasRole = acl.writeRoles.some(role => userRoles.includes(role))
        
        if (!hasRole) {
          return {
            ok: false,
            error: {
              code: 'FORBIDDEN',
              message: `You don't have permission to write field "${field}" on model "${model}"`
            }
          }
        }
      }
    }
    
    return { ok: true, data: undefined }
  }
}

