/**
 * Service Generator - Generates service layer with Prisma queries
 * 
 * REFACTORED: Now uses shared CRUD template to eliminate duplication
 */

import type { ParsedModel } from '../dmmf-parser.js'
import { generateEnhancedServiceMethods } from './service-method-generator.js'
import { generateCRUDService } from '../templates/crud-service.template.js'

/**
 * Generate service with full CRUD operations + auto-detected enhanced methods
 */
export function generateService(model: ParsedModel): string {
  // Generate additional enhanced methods (search, findBySlug, etc.)
  const additionalMethods = generateEnhancedServiceMethods(model)
  
  // Use shared CRUD template (eliminates ~100 lines of duplication)
  return generateCRUDService(model, {
    includeRelationships: false,
    enableLogging: false,
    additionalMethods
  })
}

/**
 * Generate barrel export for service
 */
export function generateServiceBarrel(model: ParsedModel): string {
  return `// @generated barrel
export * from './${model.nameLower}.service.js'
`
}


