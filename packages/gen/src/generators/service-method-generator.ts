/**
 * Service Method Generator
 * Generates additional service methods based on detected model capabilities
 */

import type { ParsedModel } from '../dmmf-parser.js'
import { analyzeModelUnified, type ModelCapabilities } from '@/analyzers/index.js'
import { mapPrismaToTypeScript } from '../type-mapper.js'
import { toCamelCase } from '@/utils/naming.js'

/**
 * Generate enhanced service methods based on detected capabilities
 * @param model - ParsedModel to analyze
 * @param existingMethods - Optional set of method names already generated (to prevent duplicates)
 */
export function generateEnhancedServiceMethods(
  model: ParsedModel,
  existingMethods: Set<string> = new Set(),
  allModels: readonly ParsedModel[] = []
): string {
  // Create minimal ParsedSchema for analyzer
  const schema = {
    models: allModels,
    enums: [],
    modelMap: new Map(allModels.map(m => [m.name, m])) as ReadonlyMap<string, ParsedModel>,
    enumMap: new Map() as ReadonlyMap<string, any>,
    reverseRelationMap: new Map() as ReadonlyMap<string, readonly any[]>
  }
  const analysis = analyzeModelUnified(model, schema, {})
  const caps = analysis.capabilities
  const methods: string[] = []
  
  // Generate search method
  if (caps.hasSearch && !existingMethods.has('search')) {
    methods.push(generateSearchMethod(model, caps))
  }
  
  // Generate findBySlug method (skip if already exists in domain methods)
  if (caps.hasFindBySlug && !existingMethods.has('findBySlug')) {
    methods.push(generateFindBySlugMethod(model))
  }
  
  // Generate getFeatured method
  if (caps.hasFeatured && !existingMethods.has('getFeatured')) {
    methods.push(generateGetFeaturedMethod(model, caps.hasActive))
  }
  
  // Generate getActive method (skip if getFeatured exists, they're similar)
  if (caps.hasActive && !caps.hasFeatured && !existingMethods.has('getActive')) {
    methods.push(generateGetActiveMethod(model))
  }
  
  // Generate getPublished method (skip if listPublished already exists)
  if (caps.hasPublished && !existingMethods.has('getPublished') && !existingMethods.has('listPublished')) {
    methods.push(generateGetPublishedMethod(model))
  }
  
  // Generate getBy{Relation} methods for foreign keys
  for (const fk of caps.foreignKeys) {
    const relationName = fk.relationName || fk.relationAlias
    const methodName = `getBy${capitalize(relationName)}`
    if (!existingMethods.has(methodName)) {
      methods.push(generateGetByRelationMethod(model, relationName, fk.fieldNames[0], caps.hasActive))
    }
  }
  
  // Generate hierarchical methods
  if (caps.hasParentChild) {
    if (!existingMethods.has('getChildren') && !existingMethods.has('getTree')) {
      methods.push(generateHierarchyMethods(model))
    }
  }
  
  return methods.length > 0 ? ',\n\n  ' + methods.join(',\n\n  ') : ''
}

function generateSearchMethod(model: ParsedModel, caps: ModelCapabilities): string {
  const modelName = model.name
  const modelCamel = toCamelCase(model.name)
  const searchConditions = caps.searchFields.map(field => 
    `            { ${field}: { contains: params.q, mode: 'insensitive' } }`
  ).join(',\n')
  
  const filterConditions = caps.filterFields
    .map(field => {
      if (field.type === 'range') {
        return `        params.min${capitalize(field.name)} ? { ${field.name}: { gte: params.min${capitalize(field.name)} } } : {},
        params.max${capitalize(field.name)} ? { ${field.name}: { lte: params.max${capitalize(field.name)} } } : {}`
      } else if (field.type === 'boolean') {
        return `        params.${field.name} !== undefined ? { ${field.name}: params.${field.name} } : {}`
      } else if (field.type === 'enum') {
        return `        params.${field.name} ? { ${field.name}: params.${field.name} } : {}`
      } else {
        return `        params.${field.name} ? { ${field.name}: params.${field.name} } : {}`
      }
    })
    .join(',\n')
  
  return `/**
   * Search ${modelName}s with text query and filters
   * Auto-generated from searchable fields: ${caps.searchFields.join(', ')}
   */
  async search(params: {
    q: string
${generateSearchParams(caps)}
    skip?: number
    take?: number
  }) {
    const where: Prisma.${modelName}WhereInput = {
      AND: [
        params.q ? {
          OR: [
${searchConditions}
          ]
        } : {},
${filterConditions}
      ].filter(condition => Object.keys(condition).length > 0)
    }
    
    return prisma.${modelCamel}.findMany({
      where,
      skip: params.skip || 0,
      take: Math.min(params.take || 20, 100)
    })
  }`
}

function generateSearchParams(caps: ModelCapabilities): string {
  return caps.filterFields
    .map(field => {
      // Map Prisma types to TypeScript types
      const tsType = field.fieldType === 'Int' ? 'number' :
                     field.fieldType === 'Float' || field.fieldType === 'Decimal' ? 'number' :
                     field.fieldType === 'DateTime' ? 'Date | string' :
                     field.fieldType === 'Boolean' ? 'boolean' :
                     field.fieldType
      
      if (field.type === 'range') {
        return `    min${capitalize(field.name)}?: ${tsType}\n    max${capitalize(field.name)}?: ${tsType}`
      } else if (field.type === 'boolean') {
        return `    ${field.name}?: boolean`
      } else if (field.type === 'enum') {
        return `    ${field.name}?: ${tsType}`
      } else {
        return `    ${field.name}?: ${tsType}`
      }
    })
    .join('\n')
}

function generateFindBySlugMethod(model: ParsedModel): string {
  const modelName = model.name
  const modelCamel = toCamelCase(model.name)
  
  return `/**
   * Find ${modelName} by slug
   * Auto-generated from 'slug' field detection
   */
  async findBySlug(slug: string) {
    return prisma.${modelCamel}.findUnique({
      where: { slug }
    })
  }`
}

function generateGetFeaturedMethod(model: ParsedModel, hasActive: boolean): string {
  const modelName = model.name
  const modelCamel = toCamelCase(model.name)
  const activeFilter = hasActive ? '\n        isActive: true,' : ''
  
  return `/**
   * Get featured ${modelName}s
   * Auto-generated from 'isFeatured' field detection
   */
  async getFeatured(limit = 10) {
    return prisma.${modelCamel}.findMany({
      where: {${activeFilter}
        isFeatured: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  }`
}

function generateGetActiveMethod(model: ParsedModel): string {
  const modelName = model.name
  const modelCamel = toCamelCase(model.name)
  
  return `/**
   * Get active ${modelName}s
   * Auto-generated from 'isActive' field detection
   */
  async getActive(query?: Prisma.${modelName}WhereInput) {
    return prisma.${modelCamel}.findMany({
      where: {
        isActive: true,
        ...query
      }
    })
  }`
}

function generateGetPublishedMethod(model: ParsedModel): string {
  const modelName = model.name
  const modelCamel = toCamelCase(model.name)
  
  return `/**
   * Get published ${modelName}s
   * Auto-generated from 'publishedAt' field detection
   */
  async getPublished(query?: Prisma.${modelName}WhereInput) {
    return prisma.${modelCamel}.findMany({
      where: {
        publishedAt: { lte: new Date() },
        ...query
      },
      orderBy: { publishedAt: 'desc' }
    })
  }`
}

function generateGetByRelationMethod(
  model: ParsedModel,
  relationName: string,
  fieldName: string,
  hasActive: boolean
): string {
  const modelName = model.name
  const modelCamel = toCamelCase(model.name)
  const methodName = `getBy${capitalize(relationName)}`
  const activeFilter = hasActive ? ',\n        isActive: true' : ''
  
  // Get the actual field type from the model
  const field = model.fields.find(f => f.name === fieldName)
  const fieldType = field ? mapPrismaToTypeScript(field) : 'string'
  
  return `/**
   * Get ${modelName}s by ${relationName}
   * Auto-generated from foreign key detection: ${fieldName}
   */
  async ${methodName}(${fieldName}: ${fieldType}, options?: {
    skip?: number
    take?: number
  }) {
    return prisma.${modelCamel}.findMany({
      where: { ${fieldName}${activeFilter} },
      skip: options?.skip || 0,
      take: options?.take || 20
    })
  }`
}

function generateHierarchyMethods(model: ParsedModel): string {
  const modelName = model.name
  const modelCamel = toCamelCase(model.name)
  
  return `/**
   * Get children of parent ${modelName}
   * Auto-generated from self-referential relation detection
   */
  async getChildren(parentId: number) {
    return prisma.${modelCamel}.findMany({
      where: { parentId }
    })
  },

  /**
   * Get full ${modelName} tree/hierarchy
   * Auto-generated from self-referential relation detection
   */
  async getTree() {
    const items = await prisma.${modelCamel}.findMany({
      orderBy: { id: 'asc' }
    })
    
    const buildTree = (parentId: number | null): any[] => {
      return items
        .filter(item => (item as any).parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(item.id)
        }))
    }
    
    return buildTree(null)
  }`
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

