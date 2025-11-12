/**
 * @ssot-ui/schemas
 * 
 * JSON schemas and Zod validators for SSOT UI templates.
 * Provides type-safe validation for all 7 core JSON contracts.
 */

// ============================================================================
// Export All Schemas
// ============================================================================

export * from './schemas/expressions.js'
export * from './schemas/template.js'
export * from './schemas/data-contract.js'
export * from './schemas/capabilities.js'
export * from './schemas/mappings.js'
export * from './schemas/models.js'
export * from './schemas/theme.js'
export * from './schemas/i18n.js'

// ============================================================================
// Export Version Validation
// ============================================================================

export * from './version.js'

// ============================================================================
// Export Validation Orchestrator
// ============================================================================

export * from './validator.js'

