/**
 * Normalizer
 * 
 * Resolves aliases, applies defaults, and validates deep field paths.
 */

import type { AllSchemas } from '@ssot-ui/schemas'
import { validateFieldPath, resolveModel, resolveField } from '@ssot-ui/schemas'

/**
 * Field Resolution Result
 */
export interface FieldResolution {
  original: string
  resolved: string
  valid: boolean
  type?: string
  trace: string[]
  suggestions?: string[]
  confidence: number // 0.0 - 1.0
}

/**
 * Normalize field path with full validation
 */
export function normalizeFieldPath(
  schemas: AllSchemas,
  modelName: string,
  fieldPath: string
): FieldResolution {
  // Resolve through mappings first
  const fullPath = `${modelName}.${fieldPath}`
  const mapped = resolveField(schemas.mappings, fullPath)
  
  // If mapping found, use it
  if (mapped !== fullPath) {
    return {
      original: fieldPath,
      resolved: mapped.split('.').slice(1).join('.'), // Remove model prefix
      valid: true,
      trace: [`Mapping: ${fullPath} → ${mapped}`],
      confidence: 1.0
    }
  }
  
  // Validate against models
  const resolvedModel = resolveModel(schemas.mappings, modelName)
  const validation = validateFieldPath(schemas.models, resolvedModel, fieldPath)
  
  return {
    original: fieldPath,
    resolved: fieldPath,
    valid: validation.valid,
    type: validation.type,
    trace: validation.trace,
    suggestions: validation.suggestions,
    confidence: validation.valid ? 1.0 : (validation.suggestions?.length ? 0.7 : 0.0)
  }
}

/**
 * Apply default values to page configuration
 */
export function applyPageDefaults(page: any): any {
  const defaults: any = { ...page }
  
  // List pages
  if (page.type === 'list') {
    defaults.pagination = page.pagination || { type: 'pages', defaultSize: 20 }
    defaults.layout = page.layout || { type: 'standard' }
    defaults.search = page.search ?? false
    defaults.export = page.export ?? false
  }
  
  // Detail pages
  if (page.type === 'detail') {
    defaults.idParam = page.idParam || 'id'
    defaults.breadcrumbs = page.breadcrumbs ?? false
    defaults.prevNext = page.prevNext ?? false
  }
  
  // Form pages
  if (page.type === 'form') {
    defaults.validation = page.validation || 'zod'
    defaults.confirmBeforeLeave = page.confirmBeforeLeave ?? true
  }
  
  // SEO defaults
  if (!page.seo && page.title) {
    defaults.seo = { title: page.title }
  }
  
  return defaults
}

/**
 * Infer runtime from page type if not specified
 * (Validation should catch missing runtime, but this is a fallback)
 */
export function inferRuntime(page: any): 'server' | 'client' | 'edge' {
  if (page.runtime) return page.runtime
  
  // Forms must be client
  if (page.type === 'form') return 'client'
  
  // Default to server
  return 'server'
}

