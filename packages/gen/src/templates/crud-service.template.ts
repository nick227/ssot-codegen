/**
 * CRUD Service Template
 * 
 * Centralized CRUD operations template to eliminate 600+ lines of duplication
 * across service-generator.ts, service-generator-enhanced.ts, and registry-generator.ts
 * 
 * This template provides the core CRUD operations that are identical across all generators:
 * - list() with pagination
 * - findById()
 * - create() with error handling
 * - update() with P2025 (not found) handling
 * - delete() with P2025 (not found) handling
 * - count()
 * - exists()
 */

import type { ParsedModel } from '../dmmf-parser.js'

export { generateServiceBarrel } from '../generators/barrel-generator.js'

export interface CRUDServiceConfig {
  /** Model name (e.g., "User") */
  modelName: string
  
  /** Model name in lowercase (e.g., "user") */
  modelLower: string
  
  /** ID field type */
  idType: 'string' | 'number'
  
  /** Whether to include relationships (for enhanced services) */
  includeRelationships?: boolean
  
  /** Include statement for relationships (e.g., ", include: { posts: true }") */
  includeStatement?: string
  
  /** Whether to add logging */
  enableLogging?: boolean
}

/**
 * Generate list() method with pagination
 */
export function generateListMethod(config: CRUDServiceConfig): string {
  const {modelName, modelLower, includeStatement = '', enableLogging = false} = config
  
  // If includeStatement exists, don't add dynamic include/select (they conflict)
  const dynamicIncludes = includeStatement ? '' : `,
        include: include as Prisma.${modelName}Include | undefined,
        select: select as Prisma.${modelName}Select | undefined`
  
  return `  /**
   * List ${modelName} records with pagination${config.includeRelationships ? ' and relationships' : ''}
   */
  async list(query: ${modelName}QueryDTO) {
    const { skip = 0, take = 20, orderBy, where${includeStatement ? '' : ', include, select'} } = query
    ${enableLogging ? `
    logger.debug({ skip, take }, 'Listing ${modelName} records')` : ''}
    
    const [items, total] = await Promise.all([
      prisma.${modelLower}.findMany({
        skip,
        take,
        orderBy: orderBy as Prisma.${modelName}OrderByWithRelationInput,
        where: where as Prisma.${modelName}WhereInput${dynamicIncludes}${includeStatement}
      }),
      prisma.${modelLower}.count({
        where: where as Prisma.${modelName}WhereInput,
      })
    ])
    
    return {
      data: items,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total
      }
    }
  }`
}

/**
 * Generate findById() method
 */
export function generateFindByIdMethod(config: CRUDServiceConfig): string {
  const {modelName, modelLower, idType, includeStatement = ''} = config
  
  return `  /**
   * Find ${modelName} by ID${config.includeRelationships ? ' with relationships' : ''}
   */
  async findById(id: ${idType}) {
    return prisma.${modelLower}.findUnique({
      where: { id }${includeStatement ? includeStatement : ''}
    })
  }`
}

/**
 * Generate create() method
 */
export function generateCreateMethod(config: CRUDServiceConfig): string {
  const {modelName, modelLower, includeStatement = '', enableLogging = false} = config
  
  return `  /**
   * Create ${modelName}
   */
  async create(data: ${modelName}CreateDTO) {
    try {
      const item = await prisma.${modelLower}.create({
        data${includeStatement ? includeStatement : ''}
      })${enableLogging ? `
      logger.info({ ${modelLower}Id: item.id }, '${modelName} created')` : ''}
      return item
    } catch (error) {${enableLogging ? `
      logger.error({ error, data }, 'Failed to create ${modelName}')` : ''}
      throw error
    }
  }`
}

/**
 * Generate update() method with P2025 error handling
 */
export function generateUpdateMethod(config: CRUDServiceConfig): string {
  const {modelName, modelLower, idType, includeStatement = '', enableLogging = false} = config
  
  return `  /**
   * Update ${modelName}
   */
  async update(id: ${idType}, data: ${modelName}UpdateDTO) {
    try {
      const item = await prisma.${modelLower}.update({
        where: { id },
        data${includeStatement ? includeStatement : ''}
      })${enableLogging ? `
      logger.info({ ${modelLower}Id: id }, '${modelName} updated')` : ''}
      return item
    } catch (error: any) {
      if (error.code === 'P2025') {${enableLogging ? `
        logger.warn({ ${modelLower}Id: id }, '${modelName} not found for update')` : ''}
        return null  // Not found
      }${enableLogging ? `
      logger.error({ error, ${modelLower}Id: id, data }, 'Failed to update ${modelName}')` : ''}
      throw error
    }
  }`
}

/**
 * Generate delete() method with P2025 error handling
 */
export function generateDeleteMethod(config: CRUDServiceConfig): string {
  const {modelName, modelLower, idType, enableLogging = false} = config
  
  return `  /**
   * Delete ${modelName}
   */
  async delete(id: ${idType}) {
    try {
      await prisma.${modelLower}.delete({
        where: { id }
      })${enableLogging ? `
      logger.info({ ${modelLower}Id: id }, '${modelName} deleted')` : ''}
      return true
    } catch (error: any) {
      if (error.code === 'P2025') {${enableLogging ? `
        logger.warn({ ${modelLower}Id: id }, '${modelName} not found for delete')` : ''}
        return false  // Not found
      }${enableLogging ? `
      logger.error({ error, ${modelLower}Id: id }, 'Failed to delete ${modelName}')` : ''}
      throw error
    }
  }`
}

/**
 * Generate count() method
 */
export function generateCountMethod(config: CRUDServiceConfig): string {
  const {modelName, modelLower} = config
  
  return `  /**
   * Count ${modelName} records
   */
  async count(where?: Prisma.${modelName}WhereInput) {
    return prisma.${modelLower}.count({ where })
  }`
}

/**
 * Generate exists() method
 */
export function generateExistsMethod(config: CRUDServiceConfig): string {
  const {modelName, modelLower, idType} = config
  
  return `  /**
   * Check if ${modelName} exists
   */
  async exists(id: ${idType}) {
    const count = await prisma.${modelLower}.count({
      where: { id }
    })
    return count > 0
  }`
}

/**
 * Generate complete CRUD service methods
 * 
 * This is the main function that generates all CRUD operations
 * Used by all service generators to eliminate duplication
 * 
 * @example
 * const crudMethods = generateCRUDServiceMethods({
 *   modelName: 'User',
 *   modelLower: 'user',
 *   idType: 'number',
 *   enableLogging: true
 * })
 */
export function generateCRUDServiceMethods(config: CRUDServiceConfig): string {
  return [
    generateListMethod(config),
    generateFindByIdMethod(config),
    generateCreateMethod(config),
    generateUpdateMethod(config),
    generateDeleteMethod(config),
    generateCountMethod(config),
    generateExistsMethod(config)
  ].join(',\n  \n')
}

/**
 * Generate complete service file with CRUD methods
 * 
 * @example
 * const serviceFile = generateCRUDService(model, {
 *   includeRelationships: false,
 *   enableLogging: false
 * })
 */
export function generateCRUDService(
  model: ParsedModel,
  options: {
    includeRelationships?: boolean
    includeStatement?: string
    enableLogging?: boolean
    additionalMethods?: string
  } = {}
): string {
  const modelLower = model.nameLower
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  const {includeRelationships = false, includeStatement = '', enableLogging = false, additionalMethods = ''} = options
  
  const config: CRUDServiceConfig = {
    modelName: model.name,
    modelLower,
    idType,
    includeRelationships,
    includeStatement,
    enableLogging
  }
  
  const crudMethods = generateCRUDServiceMethods(config)
  
  const loggerImport = enableLogging ? "\nimport { logger } from '@/logger'" : ''
  
  return `// @generated
// This file is automatically generated. Do not edit manually.

import prisma from '@/db'
import type { ${model.name}CreateDTO, ${model.name}UpdateDTO, ${model.name}QueryDTO } from '@/contracts/${modelLower}'
import type { Prisma } from '@prisma/client'${loggerImport}

export const ${modelLower}Service = {
${crudMethods}${additionalMethods ? ',\n  \n' + additionalMethods : ''}
}
`
}

/**
 * Helper to extract ID type from model
 */
export function getIdType(model: ParsedModel): 'string' | 'number' {
  return model.idField?.type === 'String' ? 'string' : 'number'
}
