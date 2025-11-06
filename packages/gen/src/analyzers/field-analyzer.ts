/**
 * Field Analyzer
 * Analyzes Prisma field types to determine capabilities
 */

import type { DMMF } from '@prisma/generator-helper'

export type FilterType = 'exact' | 'range' | 'boolean' | 'enum' | 'array'

export interface FieldCapabilities {
  searchable: boolean
  filterable: boolean
  filterType: FilterType
  sortable: boolean
  isRelation: boolean
  isSensitive: boolean
}

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

export function analyzeField(field: DMMF.Field): FieldCapabilities {
  const capabilities: FieldCapabilities = {
    searchable: false,
    filterable: false,
    filterType: 'exact',
    sortable: false,
    isRelation: field.kind === 'object',
    isSensitive: isSensitiveField(field.name)
  }

  // Skip relations and sensitive fields
  if (capabilities.isRelation || capabilities.isSensitive) {
    return capabilities
  }

  // String fields → searchable and filterable
  if (field.type === 'String') {
    capabilities.searchable = true
    capabilities.filterable = true
    capabilities.filterType = 'exact'
    capabilities.sortable = true
    return capabilities
  }

  // Number fields → range filterable
  if (field.type === 'Int' || field.type === 'Float' || field.type === 'Decimal') {
    capabilities.filterable = true
    capabilities.filterType = 'range'
    capabilities.sortable = true
    return capabilities
  }

  // Boolean fields → boolean filterable
  if (field.type === 'Boolean') {
    capabilities.filterable = true
    capabilities.filterType = 'boolean'
    return capabilities
  }

  // Enum fields → enum filterable
  if (field.kind === 'enum') {
    capabilities.filterable = true
    capabilities.filterType = 'enum'
    capabilities.sortable = true
    return capabilities
  }

  // DateTime fields → range filterable and sortable
  if (field.type === 'DateTime') {
    capabilities.filterable = true
    capabilities.filterType = 'range'
    capabilities.sortable = true
    return capabilities
  }

  return capabilities
}

export interface FilterField {
  name: string
  type: FilterType
  fieldType: string
  isRequired: boolean
}

export function getFilterableFields(model: DMMF.Model): FilterField[] {
  return model.fields
    .map(field => ({
      field,
      capabilities: analyzeField(field)
    }))
    .filter(({ capabilities }) => capabilities.filterable)
    .map(({ field, capabilities }) => ({
      name: field.name,
      type: capabilities.filterType,
      fieldType: field.type,
      isRequired: field.isRequired
    }))
}

export function getSearchableFields(model: DMMF.Model): string[] {
  return model.fields
    .map(field => ({
      field,
      capabilities: analyzeField(field)
    }))
    .filter(({ capabilities }) => capabilities.searchable)
    .map(({ field }) => field.name)
}

export function getSortableFields(model: DMMF.Model): string[] {
  return model.fields
    .map(field => ({
      field,
      capabilities: analyzeField(field)
    }))
    .filter(({ capabilities }) => capabilities.sortable)
    .map(({ field }) => field.name)
}

