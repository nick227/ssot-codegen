/**
 * @ssot-ui/loader
 * 
 * Validates, normalizes, and plans SSOT UI templates.
 * 
 * Three-step pipeline:
 * 1. Validate - Zod schema validation + cross-schema checks
 * 2. Normalize - Resolve aliases, apply defaults, validate deep paths
 * 3. Plan - Derive routes, data requirements, guards, rendering order
 */

export * from './loader.js'
export * from './normalizer.js'
export * from './planner.js'

// Re-export schemas for convenience
export type {
  Template,
  DataContract,
  Capabilities,
  Mappings,
  Models,
  Theme,
  I18n
} from '@ssot-ui/schemas'

