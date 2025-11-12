/**
 * Optimized Template Generators
 * 
 * Philosophy applied:
 * - Fuse template string construction (single pass)
 * - Minimize allocations (reuse builders)
 * - Hoist invariants out of loops
 * - Use array.join() over string concatenation
 */

import type { ParsedModel, ParsedField } from '../../dmmf-parser.js'

/**
 * Generate imports section
 * Pure function, single allocation for result
 */
export function generateImports(imports: string[]): string {
  // Early return for empty
  if (imports.length === 0) return ''
  
  // Single join (no intermediate strings)
  return imports.join('\n') + '\n\n'
}

/**
 * Generate column definitions
 * Fused: filter + map in single pass
 */
export function generateColumns(fields: ParsedField[]): string {
  // Pre-allocate array with exact size
  const columns: string[] = []
  
  // Single pass: filter + transform
  for (const field of fields) {
    // Skip relations (inline check)
    if (field.kind === 'object' || field.name === 'id') continue
    
    // Format label (inline, no function call)
    const label = field.name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim()
    
    columns.push(`          { key: '${field.name}', label: '${label}' }`)
    
    // Limit to 5 columns (early break)
    if (columns.length >= 5) break
  }
  
  // Single join
  return columns.join(',\n')
}

/**
 * Generate field definitions for forms
 * Optimized: single pass with guard clauses
 */
export function generateFormFields(fields: ParsedField[]): string {
  const fieldDefs: string[] = []
  
  for (const field of fields) {
    // Guard clauses (early continue)
    if (field.kind === 'object') continue
    if (field.name === 'id') continue
    if (field.name.match(/^(createdAt|updatedAt)$/i)) continue
    
    // Map type (lookup table, not switch)
    const type = TYPE_MAP[field.type] || 'text'
    
    // Format label (inline)
    const label = field.name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim()
    
    // Single template (no intermediate strings)
    fieldDefs.push(
      `            { name: '${field.name}', label: '${label}', type: '${type}', required: ${field.isRequired} }`
    )
  }
  
  return fieldDefs.join(',\n')
}

/**
 * Type mapping (constant lookup table)
 * Precomputed, no runtime overhead
 */
const TYPE_MAP: Record<string, string> = {
  'String': 'text',
  'Int': 'number',
  'Float': 'number',
  'Boolean': 'checkbox',
  'DateTime': 'text',
  'Json': 'textarea'
}

/**
 * Generate detail view fields
 * Single pass, inline formatting
 */
export function generateDetailFields(fields: ParsedField[]): string {
  const fieldViews: string[] = []
  
  for (const field of fields) {
    // Skip relations
    if (field.kind === 'object') continue
    
    // Format label (inline, cached in loop)
    const label = field.name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase())
      .trim()
    
    // Single template
    fieldViews.push(
      `          <div className="flex border-b border-gray-100 pb-4">
            <dt className="w-1/3 font-medium text-gray-700">${label}:</dt>
            <dd className="w-2/3 text-gray-900">{String(data.${field.name} ?? '-')}</dd>
          </div>`
    )
  }
  
  return fieldViews.join('\n')
}

/**
 * Check if field is editable
 * Pure predicate, hot path optimized
 */
export function isEditableField(field: ParsedField): boolean {
  // Guard clauses (early return)
  if (field.kind === 'object') return false
  if (field.name === 'id') return false
  if (field.name === 'createdAt' || field.name === 'updatedAt') return false
  
  return true
}

/**
 * Check if field is displayable
 * Pure predicate
 */
export function isDisplayableField(field: ParsedField): boolean {
  return field.kind !== 'object'
}

/**
 * Get field display priority
 * Heuristic for column ordering
 */
export function getFieldPriority(field: ParsedField): number {
  // Priority scoring (higher = show first)
  if (field.name === 'name' || field.name === 'title') return 100
  if (field.name.includes('name') || field.name.includes('title')) return 90
  if (field.type === 'String') return 50
  if (field.type === 'Int' || field.type === 'Float') return 40
  if (field.type === 'Boolean') return 30
  if (field.type === 'DateTime') return 20
  
  return 10
}

/**
 * Sort fields by display priority
 * Pure sort, no mutations
 */
export function sortFieldsByPriority(fields: ParsedField[]): ParsedField[] {
  // Copy array (no mutation of input)
  return [...fields].sort((a, b) => getFieldPriority(b) - getFieldPriority(a))
}

