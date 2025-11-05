/**
 * Controller Generator V2 - Class-based, testable implementation
 * 
 * Generates request handlers with CRUD operations
 * Supports Express and Fastify via strategy pattern
 */

import { BaseGenerator } from './base-generator.js'
import type { GeneratorOutput } from './generator-interface.js'
import { BarrelBuilder } from './utils/barrel-builder.js'
import { getFrameworkStrategy } from './strategies/framework-strategy.js'

export class ControllerGenerator extends BaseGenerator {
  private strategy = getFrameworkStrategy(this.framework)
  
  /**
   * Generate controller file
   */
  generate(): GeneratorOutput {
    const content = this.createTemplate()
      .importString(this.buildImports())
      .blocks(...this.buildAllHandlers())
      .buildWithNewline()
    
    const files = new Map<string, string>([
      [`${this.modelLower}.controller.ts`, content]
    ])
    
    return {
      files,
      imports: this.getImports(),
      exports: this.getExports(),
      metadata: {
        fileCount: 1,
        lineCount: content.split('\n').length
      }
    }
  }
  
  /**
   * Build imports
   */
  private buildImports(): string {
    const reqRes = this.framework === 'express'
      ? `import type { Request, Response } from 'express'`
      : `import type { FastifyRequest, FastifyReply } from 'fastify'`
    
    return `${reqRes}
import { ${this.modelLower}Service } from '@/services/${this.modelLower}'
import { ${this.modelName}CreateSchema, ${this.modelName}UpdateSchema, ${this.modelName}QuerySchema } from '@/validators/${this.modelLower}'
import { ZodError } from 'zod'

`
  }
  
  /**
   * Build all handler methods
   */
  private buildAllHandlers(): string[] {
    return [
      this.generateListHandler(),
      this.generateGetHandler(),
      this.generateCreateHandler(),
      this.generateUpdateHandler(),
      this.generateDeleteHandler(),
      this.generateCountHandler()
    ]
  }
  
  /**
   * Generate list handler
   */
  generateListHandler(): string {
    const reqVar = this.framework === 'express' ? 'req' : 'request'
    const resVar = this.framework === 'express' ? 'res' : 'reply'
    
    return `/**
 * List all ${this.modelName} records
 */
${this.strategy.generateHandlerSignature(`list${this.modelName}s`)} {
  try {
    const query = ${this.modelName}QuerySchema.parse(${reqVar}.query)
    const result = await ${this.modelLower}Service.list(query)
    ${this.strategy.generateJsonResponse('result')}
  } catch (error) {
    if (error instanceof ZodError) {
      ${this.strategy.generateStatusResponse(400, '{ error: \'Validation Error\', details: error.errors }')}
    }
    console.error(error)
    ${this.strategy.generateStatusResponse(500, '{ error: \'Internal Server Error\' }')}
  }
}`
  }
  
  /**
   * Generate get by ID handler
   */
  generateGetHandler(): string {
    const parseId = this.idType === 'number' 
      ? `parseInt(${this.strategy.getRequestParam('id')}, 10)`
      : this.strategy.getRequestParam('id')
    
    const idValidation = this.idType === 'number' ? `
    if (isNaN(id)) {
      ${this.strategy.generateStatusResponse(400, '{ error: \'Invalid ID format\' }')}
    }
    ` : ''
    
    return `/**
 * Get ${this.modelName} by ID
 */
${this.strategy.generateHandlerSignature(`get${this.modelName}`, '{ id: string }')} {
  try {
    const id = ${parseId}${idValidation}
    const item = await ${this.modelLower}Service.findById(id)
    
    if (!item) {
      ${this.strategy.generateStatusResponse(404, `{ error: '${this.modelName} not found' }`)}
    }
    
    ${this.strategy.generateJsonResponse('item')}
  } catch (error) {
    console.error(error)
    ${this.strategy.generateStatusResponse(500, '{ error: \'Internal Server Error\' }')}
  }
}`
  }
  
  /**
   * Generate create handler
   */
  generateCreateHandler(): string {
    const bodyVar = this.strategy.getRequestBody()
    
    return `/**
 * Create ${this.modelName}
 */
${this.strategy.generateHandlerSignature(`create${this.modelName}`)} {
  try {
    const data = ${this.modelName}CreateSchema.parse(${bodyVar})
    const item = await ${this.modelLower}Service.create(data)
    ${this.strategy.generateStatusResponse(201, 'item')}
  } catch (error) {
    if (error instanceof ZodError) {
      ${this.strategy.generateStatusResponse(400, '{ error: \'Validation Error\', details: error.errors }')}
    }
    console.error(error)
    ${this.strategy.generateStatusResponse(500, '{ error: \'Internal Server Error\' }')}
  }
}`
  }
  
  /**
   * Generate update handler
   */
  generateUpdateHandler(): string {
    const parseId = this.idType === 'number' 
      ? `parseInt(${this.strategy.getRequestParam('id')}, 10)`
      : this.strategy.getRequestParam('id')
    
    const idValidation = this.idType === 'number' ? `
    if (isNaN(id)) {
      ${this.strategy.generateStatusResponse(400, '{ error: \'Invalid ID format\' }')}
    }
    ` : ''
    
    const bodyVar = this.strategy.getRequestBody()
    
    return `/**
 * Update ${this.modelName}
 */
${this.strategy.generateHandlerSignature(`update${this.modelName}`, '{ id: string }')} {
  try {
    const id = ${parseId}${idValidation}
    const data = ${this.modelName}UpdateSchema.parse(${bodyVar})
    const item = await ${this.modelLower}Service.update(id, data)
    
    if (!item) {
      ${this.strategy.generateStatusResponse(404, `{ error: '${this.modelName} not found' }`)}
    }
    
    ${this.strategy.generateJsonResponse('item')}
  } catch (error) {
    if (error instanceof ZodError) {
      ${this.strategy.generateStatusResponse(400, '{ error: \'Validation Error\', details: error.errors }')}
    }
    console.error(error)
    ${this.strategy.generateStatusResponse(500, '{ error: \'Internal Server Error\' }')}
  }
}`
  }
  
  /**
   * Generate delete handler
   */
  generateDeleteHandler(): string {
    const parseId = this.idType === 'number' 
      ? `parseInt(${this.strategy.getRequestParam('id')}, 10)`
      : this.strategy.getRequestParam('id')
    
    const idValidation = this.idType === 'number' ? `
    if (isNaN(id)) {
      ${this.strategy.generateStatusResponse(400, '{ error: \'Invalid ID format\' }')}
    }
    ` : ''
    
    return `/**
 * Delete ${this.modelName}
 */
${this.strategy.generateHandlerSignature(`delete${this.modelName}`, '{ id: string }')} {
  try {
    const id = ${parseId}${idValidation}
    const deleted = await ${this.modelLower}Service.delete(id)
    
    if (!deleted) {
      ${this.strategy.generateStatusResponse(404, `{ error: '${this.modelName} not found' }`)}
    }
    
    ${this.strategy.generateStatusResponse(204)}
  } catch (error) {
    console.error(error)
    ${this.strategy.generateStatusResponse(500, '{ error: \'Internal Server Error\' }')}
  }
}`
  }
  
  /**
   * Generate count handler
   */
  generateCountHandler(): string {
    const reqVar = this.framework === 'express' ? '_req' : '_request'
    const resVar = this.framework === 'express' ? 'res' : 'reply'
    
    return `/**
 * Count ${this.modelName} records
 */
export const count${this.modelName}s = async (${reqVar}: ${this.framework === 'express' ? 'Request' : 'FastifyRequest'}, ${resVar}: ${this.framework === 'express' ? 'Response' : 'FastifyReply'}) => {
  try {
    const total = await ${this.modelLower}Service.count()
    ${this.strategy.generateJsonResponse('{ total }')}
  } catch (error) {
    console.error(error)
    ${this.strategy.generateStatusResponse(500, '{ error: \'Internal Server Error\' }')}
  }
}`
  }
  
  /**
   * Get imports
   */
  getImports(): string[] {
    return this.strategy.getImports(this.modelLower).concat([
      `import { ${this.modelName}CreateSchema, ${this.modelName}UpdateSchema, ${this.modelName}QuerySchema } from '@/validators/${this.modelLower}'`,
      `import { ZodError } from 'zod'`
    ])
  }
  
  /**
   * Get exports
   */
  getExports(): string[] {
    return [
      `list${this.modelName}s`,
      `get${this.modelName}`,
      `create${this.modelName}`,
      `update${this.modelName}`,
      `delete${this.modelName}`,
      `count${this.modelName}s`
    ]
  }
  
  /**
   * Generate barrel
   */
  generateBarrel(): string {
    return BarrelBuilder.simple([`${this.modelLower}.controller`])
  }
}


