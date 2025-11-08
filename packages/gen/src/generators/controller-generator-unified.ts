/**
 * Unified Controller Generator
 * 
 * Generates controllers using framework-agnostic templates.
 * This eliminates 80% duplication between Express and Fastify.
 */

import type { ParsedModel } from '../dmmf-parser.js'
import type { ControllerConfig } from './controller-helpers.js'
import { generateTypeInterfaces, generateWhereValidator } from './controller-helpers.js'
import { getCRUDMethodTemplates, getDomainMethodTemplates, type DomainMethodConfig } from './controller-method-templates.js'
import { renderMethods, getAdapter } from './controller-method-renderer.js'

/**
 * Generate CRUD methods using unified templates (replaces generateExpressBaseMethods/generateFastifyBaseMethods)
 */
export function generateUnifiedCRUDMethods(
  model: ParsedModel,
  modelCamel: string,
  framework: 'express' | 'fastify',
  config: ControllerConfig
): string {
  // Type definitions (same for both frameworks)
  const typeInterfaces = generateTypeInterfaces(model.name)
  const whereValidator = generateWhereValidator(model.name)
  
  // Get method templates
  const templates = getCRUDMethodTemplates(model, modelCamel, config)
  
  // Get framework adapter
  const adapter = getAdapter(framework)
  
  // Render methods
  const methods = renderMethods(templates, adapter)
  
  return `${typeInterfaces}
${whereValidator}

${methods}
`
}

/**
 * Generate domain-specific methods (slug, published, etc.)
 */
export function generateUnifiedDomainMethods(
  model: ParsedModel,
  modelCamel: string,
  framework: 'express' | 'fastify',
  domainConfig: DomainMethodConfig
): string {
  // Get domain method templates
  const templates = getDomainMethodTemplates(model, modelCamel, domainConfig)
  
  // Get framework adapter
  const adapter = getAdapter(framework)
  
  // Render methods
  return renderMethods(templates, adapter)
}

/**
 * Generate bulk operation methods
 */
export function generateUnifiedBulkMethods(
  model: ParsedModel,
  modelCamel: string,
  framework: 'express' | 'fastify'
): string {
  // For now, return empty string - bulk operations can be added later
  // This is a placeholder to show where bulk ops would go
  return ''
}

