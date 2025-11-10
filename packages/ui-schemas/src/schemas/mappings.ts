/**
 * Mappings Schema
 * 
 * User-defined aliases bridging template field names to actual schema fields.
 * Example: template uses "post.title" but schema has "blogPost.heading"
 */

import { z } from 'zod'

// ============================================================================
// Mappings
// ============================================================================

export const MappingsSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  
  // Model name mappings
  // e.g., { "post": "BlogPost", "user": "Author" }
  models: z.record(z.string()),
  
  // Field path mappings with dot notation
  // e.g., { "post.title": "blogPost.heading", "post.author.name": "blogPost.writer.fullName" }
  fields: z.record(z.string())
})

export type Mappings = z.infer<typeof MappingsSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateMappings(data: unknown) {
  const result = MappingsSchema.safeParse(data)
  
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
 * Resolve model name through mappings
 */
export function resolveModel(mappings: Mappings, templateModelName: string): string {
  return mappings.models[templateModelName] || templateModelName
}

/**
 * Resolve field path through mappings
 */
export function resolveField(mappings: Mappings, templateFieldPath: string): string {
  return mappings.fields[templateFieldPath] || templateFieldPath
}

/**
 * Get all mapped models
 */
export function getMappedModels(mappings: Mappings): string[] {
  return Object.keys(mappings.models)
}

/**
 * Get all mapped fields for a model
 */
export function getMappedFieldsForModel(mappings: Mappings, modelName: string): string[] {
  const prefix = `${modelName}.`
  return Object.keys(mappings.fields).filter(path => path.startsWith(prefix))
}

