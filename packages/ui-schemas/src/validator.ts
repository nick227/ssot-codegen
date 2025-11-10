/**
 * Validation Orchestrator
 * 
 * Coordinates validation across all 7 JSON schemas.
 * Provides unified error reporting and cross-schema validation.
 */

import { checkVersionCompatibility } from './version.js'
import { validateTemplate, validateTemplateRules, type Template } from './schemas/template.js'
import { validateDataContract, type DataContract } from './schemas/data-contract.js'
import { validateCapabilities, validateCapabilitiesRules, type Capabilities } from './schemas/capabilities.js'
import { validateMappings, type Mappings } from './schemas/mappings.js'
import { validateModels, validateFieldPath, type Models } from './schemas/models.js'
import { validateTheme, validateThemeRules, type Theme } from './schemas/theme.js'
import { validateI18n, validateI18nRules, type I18n } from './schemas/i18n.js'

// ============================================================================
// Validation Error
// ============================================================================

export interface ValidationError {
  file: string
  path: string
  message: string
  code: string
  suggestions?: string[]
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

// ============================================================================
// Individual File Validation
// ============================================================================

export function validateTemplateFile(data: unknown): ValidationResult {
  const result = validateTemplate(data)
  
  if (!result.valid) {
    return {
      valid: false,
      errors: result.errors.map(e => ({
        file: 'template.json',
        path: e.path,
        message: e.message,
        code: e.code
      })),
      warnings: []
    }
  }
  
  // Additional rule validation
  const warnings = validateTemplateRules(result.data)
  
  return {
    valid: true,
    errors: [],
    warnings
  }
}

export function validateDataContractFile(data: unknown): ValidationResult {
  const result = validateDataContract(data)
  
  if (!result.valid) {
    return {
      valid: false,
      errors: result.errors.map(e => ({
        file: 'data-contract.json',
        path: e.path,
        message: e.message,
        code: e.code
      })),
      warnings: []
    }
  }
  
  return {
    valid: true,
    errors: [],
    warnings: []
  }
}

export function validateCapabilitiesFile(data: unknown): ValidationResult {
  const result = validateCapabilities(data)
  
  if (!result.valid) {
    return {
      valid: false,
      errors: result.errors.map(e => ({
        file: 'capabilities.json',
        path: e.path,
        message: e.message,
        code: e.code
      })),
      warnings: []
    }
  }
  
  const warnings = validateCapabilitiesRules(result.data)
  
  return {
    valid: true,
    errors: [],
    warnings
  }
}

export function validateMappingsFile(data: unknown): ValidationResult {
  const result = validateMappings(data)
  
  if (!result.valid) {
    return {
      valid: false,
      errors: result.errors.map(e => ({
        file: 'mappings.json',
        path: e.path,
        message: e.message,
        code: e.code
      })),
      warnings: []
    }
  }
  
  return {
    valid: true,
    errors: [],
    warnings: []
  }
}

export function validateModelsFile(data: unknown): ValidationResult {
  const result = validateModels(data)
  
  if (!result.valid) {
    return {
      valid: false,
      errors: result.errors.map(e => ({
        file: 'models.json',
        path: e.path,
        message: e.message,
        code: e.code
      })),
      warnings: []
    }
  }
  
  return {
    valid: true,
    errors: [],
    warnings: []
  }
}

export function validateThemeFile(data: unknown): ValidationResult {
  const result = validateTheme(data)
  
  if (!result.valid) {
    return {
      valid: false,
      errors: result.errors.map(e => ({
        file: 'theme.json',
        path: e.path,
        message: e.message,
        code: e.code
      })),
      warnings: []
    }
  }
  
  const warnings = validateThemeRules(result.data)
  
  return {
    valid: true,
    errors: [],
    warnings
  }
}

export function validateI18nFile(data: unknown): ValidationResult {
  const result = validateI18n(data)
  
  if (!result.valid) {
    return {
      valid: false,
      errors: result.errors.map(e => ({
        file: 'i18n.json',
        path: e.path,
        message: e.message,
        code: e.code
      })),
      warnings: []
    }
  }
  
  const warnings = validateI18nRules(result.data)
  
  return {
    valid: true,
    errors: [],
    warnings
  }
}

// ============================================================================
// Cross-Schema Validation
// ============================================================================

export interface AllSchemas {
  template: Template
  dataContract: DataContract
  capabilities: Capabilities
  mappings: Mappings
  models: Models
  theme: Theme
  i18n: I18n
}

/**
 * Validate cross-schema relationships
 */
export function validateCrossSchema(
  schemas: AllSchemas,
  runtimeVersion: string
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  
  // 1. Version compatibility (REDLINE)
  const versionCheck = checkVersionCompatibility(runtimeVersion, schemas.template.runtimeVersion)
  if (!versionCheck.compatible) {
    if (versionCheck.level === 'error') {
      errors.push({
        file: 'template.json',
        path: 'runtimeVersion',
        message: versionCheck.message,
        code: 'VERSION_MISMATCH'
      })
    } else {
      warnings.push(versionCheck.message)
    }
  }
  
  // 2. Validate field paths against models
  for (const page of schemas.template.pages) {
    if (page.type === 'detail') {
      for (const field of page.fields) {
        const validation = validateFieldPath(
          schemas.models,
          page.model,
          field.field
        )
        
        if (!validation.valid) {
          errors.push({
            file: 'template.json',
            path: `pages[].fields[].field`,
            message: 
              `Field path "${field.field}" on model "${page.model}" is invalid:\n\n` +
              validation.trace.join('\n') +
              (validation.suggestions?.length ? `\n\n💡 Did you mean: ${validation.suggestions.join(', ')}` : ''),
            code: 'INVALID_FIELD_PATH',
            suggestions: validation.suggestions
          })
        }
      }
    }
  }
  
  // 3. Validate HTML fields have sanitize policy
  for (const page of schemas.template.pages) {
    if (page.type === 'detail') {
      for (const field of page.fields) {
        if (field.format === 'html' && !field.sanitizePolicy) {
          errors.push({
            file: 'template.json',
            path: `pages[].fields[]`,
            message: 
              `Field "${field.field}" uses format "html" but has no sanitizePolicy.\n\n` +
              `💡 Add sanitizePolicy: "${schemas.capabilities.sanitize.policy}"`,
            code: 'MISSING_SANITIZE_POLICY'
          })
        }
      }
    }
  }
  
  // 4. Validate filterable/sortable fields exist in models
  for (const [modelName, config] of Object.entries(schemas.dataContract.models)) {
    if (config.list) {
      for (const field of config.list.filterable) {
        const fieldName = typeof field === 'string' ? field : field.field
        const validation = validateFieldPath(schemas.models, modelName, fieldName)
        
        if (!validation.valid) {
          warnings.push(
            `data-contract.json: Filterable field "${fieldName}" on model "${modelName}" may not exist. ` +
            `Suggestions: ${validation.suggestions?.join(', ') || 'none'}`
          )
        }
      }
      
      for (const field of config.list.sortable) {
        const validation = validateFieldPath(schemas.models, modelName, field)
        
        if (!validation.valid) {
          warnings.push(
            `data-contract.json: Sortable field "${field}" on model "${modelName}" may not exist. ` +
            `Suggestions: ${validation.suggestions?.join(', ') || 'none'}`
          )
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// Format Error Messages
// ============================================================================

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return ''
  
  const grouped = new Map<string, ValidationError[]>()
  for (const error of errors) {
    if (!grouped.has(error.file)) {
      grouped.set(error.file, [])
    }
    grouped.get(error.file)!.push(error)
  }
  
  let output = '\n❌ Validation Errors:\n\n'
  
  for (const [file, fileErrors] of grouped) {
    output += `📄 ${file}\n`
    for (const error of fileErrors) {
      output += `  • At ${error.path}:\n`
      output += `    ${error.message}\n\n`
    }
  }
  
  return output
}

export function formatValidationWarnings(warnings: string[]): string {
  if (warnings.length === 0) return ''
  
  let output = '\n⚠️  Warnings:\n\n'
  for (const warning of warnings) {
    output += `  • ${warning}\n`
  }
  output += '\n'
  
  return output
}

