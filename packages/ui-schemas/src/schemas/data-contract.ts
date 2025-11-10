/**
 * Data Contract Schema
 * 
 * Defines query/mutation signatures, pagination policies, and
 * whitelists for filterable/sortable fields per model.
 */

import { z } from 'zod'

// ============================================================================
// Pagination
// ============================================================================

export const PaginationConfigSchema = z.object({
  type: z.enum(['cursor', 'offset']),
  maxPageSize: z.number().int().positive().max(1000).default(100),
  defaultPageSize: z.number().int().positive().default(20)
})

export type PaginationConfig = z.infer<typeof PaginationConfigSchema>

// ============================================================================
// Filter/Sort Whitelists
// ============================================================================

export const FilterableFieldSchema = z.object({
  field: z.string(),
  ops: z.array(z.enum(['eq', 'ne', 'in', 'lt', 'lte', 'gt', 'gte', 'contains', 'startsWith', 'endsWith', 'between'])),
  enum: z.array(z.string()).optional() // For enum fields
})

export const SortableFieldSchema = z.string()

export const SearchConfigSchema = z.object({
  fields: z.array(z.string()),
  strategy: z.enum(['fulltext', 'like', 'trigram']).optional()
})

// ============================================================================
// List Operations
// ============================================================================

export const ListOperationsSchema = z.object({
  pagination: PaginationConfigSchema,
  filterable: z.array(z.union([z.string(), FilterableFieldSchema])),
  sortable: z.array(SortableFieldSchema),
  defaultSort: z.array(z.object({
    field: z.string(),
    dir: z.enum(['asc', 'desc'])
  })).optional(),
  search: SearchConfigSchema.optional()
})

export type ListOperations = z.infer<typeof ListOperationsSchema>

// ============================================================================
// Mutations
// ============================================================================

export const MutationsConfigSchema = z.object({
  create: z.boolean().default(false),
  update: z.boolean().default(false),
  delete: z.boolean().default(false)
})

export type MutationsConfig = z.infer<typeof MutationsConfigSchema>

// ============================================================================
// Field-Level ACL
// ============================================================================

export const FieldACLSchema = z.object({
  readRoles: z.array(z.string()).optional(),
  writeRoles: z.array(z.string()).optional()
})

export type FieldACL = z.infer<typeof FieldACLSchema>

// ============================================================================
// Model Configuration
// ============================================================================

export const ModelConfigSchema = z.object({
  list: ListOperationsSchema.optional(),
  detail: z.object({
    relations: z.array(z.string()).optional() // Allowed includes
  }).optional(),
  mutations: MutationsConfigSchema.optional(),
  fields: z.record(FieldACLSchema).optional() // Field-level permissions
})

export type ModelConfig = z.infer<typeof ModelConfigSchema>

// ============================================================================
// Data Contract (Root)
// ============================================================================

export const DataContractSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  
  models: z.record(ModelConfigSchema)
})

export type DataContract = z.infer<typeof DataContractSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateDataContract(data: unknown) {
  const result = DataContractSchema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code
    }))
    
    return {
      valid: false as const,
      errors
    }
  }
  
  return {
    valid: true as const,
    data: result.data
  }
}

/**
 * Check if a field is filterable with specific operator
 */
export function isFieldFilterable(
  contract: DataContract,
  model: string,
  field: string,
  op: string
): boolean {
  const modelConfig = contract.models[model]
  if (!modelConfig?.list?.filterable) return false
  
  const filterConfig = modelConfig.list.filterable.find(f => 
    typeof f === 'string' ? f === field : f.field === field
  )
  
  if (!filterConfig) return false
  
  // If string, allow all ops
  if (typeof filterConfig === 'string') return true
  
  // Check specific ops
  return filterConfig.ops.includes(op as any)
}

/**
 * Check if a field is sortable
 */
export function isFieldSortable(
  contract: DataContract,
  model: string,
  field: string
): boolean {
  const modelConfig = contract.models[model]
  if (!modelConfig?.list?.sortable) return false
  
  return modelConfig.list.sortable.includes(field)
}

/**
 * Get max page size for a model
 */
export function getMaxPageSize(contract: DataContract, model: string): number {
  return contract.models[model]?.list?.pagination.maxPageSize ?? 100
}

