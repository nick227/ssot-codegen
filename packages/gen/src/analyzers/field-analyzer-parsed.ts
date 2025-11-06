/**
 * Field Analyzer for ParsedModel
 * Analyzes ParsedField types to determine capabilities
 */

import type { ParsedModel, ParsedField } from '../dmmf-parser.js'
import type { FilterField } from './field-analyzer.js'

const SENSITIVE_PATTERNS = [
  'password',
  'hash',
  'token',
  'secret',
  'key',
  'salt',
  'credential'
]

function isSensitiveField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase()
  return SENSITIVE_PATTERNS.some(pattern => lower.includes(pattern))
}

export function getFilterableFields(model: ParsedModel): FilterField[] {
  return model.fields
    .filter(field => {
      // Skip relations and sensitive fields
      if (field.kind === 'object' || field.kind === 'enum') return false
      if (isSensitiveField(field.name)) return false
      
      // Filterable types
      const type = field.type.toLowerCase()
      return ['int', 'float', 'decimal', 'boolean', 'datetime', 'enum'].includes(type) ||
             type.includes('int') || type.includes('decimal') || type.includes('float')
    })
    .map(field => {
      const type = field.type.toLowerCase()
      let filterType: 'exact' | 'range' | 'boolean' | 'enum' = 'exact'
      
      if (type === 'boolean' || field.type === 'Boolean') {
        filterType = 'boolean'
      } else if (type.includes('int') || type.includes('float') || type.includes('decimal') || type === 'decimal') {
        filterType = 'range'
      } else if (field.kind === 'enum') {
        filterType = 'enum'
      } else if (type === 'datetime') {
        filterType = 'range'
      }
      
      return {
        name: field.name,
        type: filterType,
        fieldType: field.type,
        isRequired: field.isRequired
      }
    })
}

export function getSearchableFields(model: ParsedModel): string[] {
  return model.fields
    .filter(field => {
      // Only String fields
      if (field.type !== 'String') return false
      
      // Skip relations and sensitive fields
      if (field.kind === 'object') return false
      if (isSensitiveField(field.name)) return false
      
      // Skip fields that look like IDs or UUIDs
      const name = field.name.toLowerCase()
      if (name === 'id' || name.includes('uuid') || name.includes('token')) return false
      
      return true
    })
    .map(field => field.name)
}

export function getSortableFields(model: ParsedModel): string[] {
  return model.fields
    .filter(field => {
      // Skip relations
      if (field.kind === 'object') return false
      
      // Sortable types
      const type = field.type.toLowerCase()
      return ['string', 'int', 'float', 'decimal', 'boolean', 'datetime'].includes(type) ||
             type.includes('int') || type.includes('decimal') || type.includes('float')
    })
    .map(field => field.name)
}

