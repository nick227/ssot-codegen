/**
 * Service Generator - Generates service layer with Prisma queries
 * 
 * REFACTORED: Now uses shared CRUD template to eliminate duplication
 * ENHANCED: Automatically detects soft-delete and auto-includes via unified-analyzer
 */

import type { ParsedModel, ParsedSchema } from '../dmmf-parser.js'
import { generateEnhancedServiceMethods } from './service-method-generator.js'
import { generateCRUDService } from '@/templates/crud-service.template.js'

export { generateServiceBarrel } from './barrel-generator.js'

/**
 * Generate service with full CRUD operations + auto-detected enhanced methods
 * 
 * Now accepts optional schema for:
 * - Soft-delete filtering (auto-detects deletedAt field)
 * - Auto-includes for required M:1 relations (controlled by autoIncludeRequiredOnly)
 * - Bounded includes to prevent N+1 queries
 */
export function generateService(model: ParsedModel, schema?: ParsedSchema): string {
  // Generate additional enhanced methods (search, findBySlug, etc.)
  const enhancedResult = generateEnhancedServiceMethods(model, new Set(), schema?.models || [], schema)
  const additionalMethods = enhancedResult.methods
  const enumImports = enhancedResult.enumImports.length > 0 
    ? `\nimport { ${enhancedResult.enumImports.join(', ')} } from '@prisma/client'`
    : ''
  
  // Use shared CRUD template (eliminates ~100 lines of duplication)
  const serviceCode = generateCRUDService(model, schema, {
    includeRelationships: false,
    enableLogging: false,
    additionalMethods
  })
  
  // Inject enum imports if needed
  if (enumImports) {
    return serviceCode.replace(
      "import type { Prisma } from '@prisma/client'",
      `import type { Prisma } from '@prisma/client'${enumImports}`
    )
  }
  
  return serviceCode
}

