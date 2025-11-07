/**
 * Template Registry - Centralized code templates
 * 
 * Standardizes code generation across all generators with reusable patterns
 */

import { TemplateBuilder } from '@/generators/utils/template-builder.js'

// ============================================================================
// COMMON PATTERNS
// ============================================================================

export interface FileOptions {
  header?: boolean  // Add @generated header
  imports?: string[]
  exports?: string[]
}

/**
 * Create a standard generated file template
 */
export function createGeneratedFile(options: FileOptions = {}): TemplateBuilder {
  const builder = new TemplateBuilder()
  
  if (options.header !== false) {
    builder.header()
  }
  
  if (options.imports && options.imports.length > 0) {
    builder.imports(options.imports)
  }
  
  return builder
}

// ============================================================================
// SERVICE TEMPLATES
// ============================================================================

export interface ServiceMethodOptions {
  modelName: string
  modelCamel: string
  methodName: string
  params?: string
  returnType?: string
  body: string
  comment?: string
}

/**
 * Generate a service method
 */
export function generateServiceMethod(options: ServiceMethodOptions): string {
  const { modelName, methodName, params = '', returnType = 'Promise<any>', body, comment } = options
  
  return `  /**
   * ${comment || methodName}
   */
  async ${methodName}(${params})${returnType ? `: ${returnType}` : ''} {
${body}
  }`
}

/**
 * Generate a complete service file
 */
export function generateServiceFile(options: {
  modelName: string
  modelKebab: string
  modelCamel: string
  methods: string[]
  imports?: string[]
}): string {
  const { modelName, modelKebab, modelCamel, methods, imports = [] } = options
  
  const defaultImports = [
    `import prisma from '@/db'`,
    `import type { ${modelName}CreateDTO, ${modelName}UpdateDTO, ${modelName}QueryDTO } from '@/contracts/${modelKebab}'`,
    `import type { Prisma } from '@prisma/client'`,
    `import { logger } from '@/logger'`
  ]
  
  return createGeneratedFile({ imports: [...defaultImports, ...imports] })
    .emptyLine()
    .line(`export const ${modelCamel}Service = {`)
    .line(methods.join(',\n\n'))
    .line(`}`)
    .buildWithNewline()
}

// ============================================================================
// CONTROLLER TEMPLATES
// ============================================================================

export interface ControllerMethodOptions {
  modelName: string
  modelCamel: string
  methodName: string
  httpMethod: 'get' | 'post' | 'put' | 'patch' | 'delete'
  useBody?: boolean
  useParams?: boolean
  validation?: string
  serviceCall: string
  comment?: string
}

/**
 * Generate a controller method
 */
export function generateControllerMethod(options: ControllerMethodOptions): string {
  const { modelName, methodName, useBody, useParams, validation, serviceCall, comment } = options
  
  const requestParsing = []
  if (useBody && validation) {
    requestParsing.push(`    const data = ${validation}.parse(req.body)`)
  }
  if (useParams) {
    requestParsing.push(`    const id = req.params.id`)
  }
  
  return `/**
 * ${comment || methodName}
 */
export const ${methodName} = async (req: Request, res: Response) => {
  try {
${requestParsing.join('\n')}
    const result = await ${serviceCall}
    return res${options.httpMethod === 'post' ? '.status(201)' : ''}.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn({ error: error.errors }, 'Validation error in ${methodName}')
      return res.status(400).json({ error: 'Validation Error', details: error.errors })
    }
    logger.error({ error }, 'Error in ${methodName}')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}`
}

// ============================================================================
// ROUTE TEMPLATES
// ============================================================================

export interface RouteOptions {
  modelName: string
  modelCamel: string
  framework: 'express' | 'fastify'
  routes: Array<{
    method: 'get' | 'post' | 'put' | 'patch' | 'delete'
    path: string
    handler: string
    comment?: string
  }>
}

/**
 * Generate routes file
 */
export function generateRoutesFile(options: RouteOptions): string {
  const { modelName, modelCamel, framework, routes } = options
  
  if (framework === 'express') {
    return generateExpressRoutes(modelName, modelCamel, routes)
  } else {
    return generateFastifyRoutes(modelName, modelCamel, routes)
  }
}

function generateExpressRoutes(
  modelName: string,
  modelCamel: string,
  routes: RouteOptions['routes']
): string {
  const routeLines = routes.map(route => {
    const comment = route.comment ? `// ${route.comment}\n` : ''
    return `${comment}${modelCamel}Router.${route.method}('${route.path}', ${modelCamel}Controller.${route.handler})`
  }).join('\n\n')
  
  return createGeneratedFile({
    imports: [
      `import { Router, type Router as RouterType } from 'express'`,
      `import * as ${modelCamel}Controller from '@/controllers/${toKebabCase(modelName)}/index.js'`
    ]
  })
    .emptyLine()
    .line(`export const ${modelCamel}Router: RouterType = Router()`)
    .emptyLine()
    .line(routeLines)
    .emptyLine()
    .buildWithNewline()
}

function generateFastifyRoutes(
  modelName: string,
  modelCamel: string,
  routes: RouteOptions['routes']
): string {
  // Similar to Express but for Fastify
  return '// TODO: Fastify routes template'
}

// ============================================================================
// DTO TEMPLATES
// ============================================================================

export interface DTOOptions {
  modelName: string
  fields: Array<{
    name: string
    type: string
    optional?: boolean
  }>
  imports?: string[]
}

/**
 * Generate DTO interface
 */
export function generateDTOInterface(options: DTOOptions & { suffix: string }): string {
  const { modelName, suffix, fields, imports = [] } = options
  
  const fieldLines = fields.map(f => {
    const opt = f.optional ? '?' : ''
    return `  ${f.name}${opt}: ${f.type}`
  }).join('\n')
  
  return createGeneratedFile({ imports })
    .line(`export interface ${modelName}${suffix} {`)
    .line(fieldLines)
    .line(`}`)
    .buildWithNewline()
}

// ============================================================================
// VALIDATOR TEMPLATES
// ============================================================================

export interface ValidatorOptions {
  modelName: string
  fields: Array<{
    name: string
    zodType: string
    optional?: boolean
  }>
  imports?: string[]
}

/**
 * Generate Zod validator schema
 */
export function generateZodSchema(options: ValidatorOptions & { suffix: string }): string {
  const { modelName, suffix, fields, imports = [] } = options
  
  const fieldLines = fields.map(f => {
    return `  ${f.name}: ${f.zodType}${f.optional ? '.optional()' : ''}`
  }).join(',\n')
  
  const defaultImports = [`import { z } from 'zod'`]
  
  return createGeneratedFile({ imports: [...defaultImports, ...imports] })
    .emptyLine()
    .line(`export const ${modelName}${suffix} = z.object({`)
    .line(fieldLines)
    .line(`})`)
    .emptyLine()
    .line(`export type ${modelName}${suffix.replace('Schema', '')} = z.infer<typeof ${modelName}${suffix}>`)
    .buildWithNewline()
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Indent code block
 */
export function indent(code: string, spaces: number = 2): string {
  const indentation = ' '.repeat(spaces)
  return code.split('\n').map(line => indentation + line).join('\n')
}

/**
 * Wrap code in try-catch
 */
export function wrapTryCatch(code: string, errorHandler?: string): string {
  return `  try {
${indent(code, 4)}
  } catch (error) {
${indent(errorHandler || '    throw error', 4)}
  }`
}


