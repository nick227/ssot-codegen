/**
 * Route Generator V2 - Class-based, testable implementation
 * 
 * Generates Express/Fastify routes using strategy pattern
 */

import { BaseGenerator } from './base-generator.js'
import type { GeneratorOutput } from './generator-interface.js'
import { BarrelBuilder } from './utils/barrel-builder.js'

export class RouteGenerator extends BaseGenerator {
  /**
   * Generate route file
   */
  generate(): GeneratorOutput {
    const content = this.framework === 'express'
      ? this.generateExpressRoutes()
      : this.generateFastifyRoutes()
    
    const files = new Map<string, string>([
      [`${this.modelLower}.routes.ts`, content]
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
   * Generate Express routes
   */
  private generateExpressRoutes(): string {
    const routes = [
      { method: 'get', path: '/', handler: `${this.modelLower}Controller.list${this.modelName}s`, comment: `List all ${this.modelName} records` },
      { method: 'get', path: '/:id', handler: `${this.modelLower}Controller.get${this.modelName}`, comment: `Get ${this.modelName} by ID` },
      { method: 'post', path: '/', handler: `${this.modelLower}Controller.create${this.modelName}`, comment: `Create ${this.modelName}` },
      { method: 'put', path: '/:id', handler: `${this.modelLower}Controller.update${this.modelName}`, comment: `Update ${this.modelName}` },
      { method: 'patch', path: '/:id', handler: `${this.modelLower}Controller.update${this.modelName}`, comment: `Partial update ${this.modelName}` },
      { method: 'delete', path: '/:id', handler: `${this.modelLower}Controller.delete${this.modelName}`, comment: `Delete ${this.modelName}` },
      { method: 'get', path: '/meta/count', handler: `${this.modelLower}Controller.count${this.modelName}s`, comment: `Count ${this.modelName} records` }
    ]
    
    const routeLines = routes.map(r => `// ${r.comment}\n${this.modelLower}Router.${r.method}('${r.path}', ${r.handler})`)
    
    return this.createTemplate()
      .imports([
        `import { Router } from 'express'`,
        `import * as ${this.modelLower}Controller from '@gen/controllers/${this.modelLower}'`
      ])
      .block(`export const ${this.modelLower}Router = Router()`)
      .blocks(...routeLines)
      .buildWithNewline()
  }
  
  /**
   * Generate Fastify routes
   */
  private generateFastifyRoutes(): string {
    const routes = [
      { method: 'get', path: '/', handler: `${this.modelLower}Controller.list${this.modelName}s`, comment: `List all ${this.modelName} records` },
      { method: 'get', path: '/:id', handler: `${this.modelLower}Controller.get${this.modelName}`, comment: `Get ${this.modelName} by ID`, typed: true },
      { method: 'post', path: '/', handler: `${this.modelLower}Controller.create${this.modelName}`, comment: `Create ${this.modelName}` },
      { method: 'put', path: '/:id', handler: `${this.modelLower}Controller.update${this.modelName}`, comment: `Update ${this.modelName}`, typed: true },
      { method: 'patch', path: '/:id', handler: `${this.modelLower}Controller.update${this.modelName}`, comment: `Partial update`, typed: true },
      { method: 'delete', path: '/:id', handler: `${this.modelLower}Controller.delete${this.modelName}`, comment: `Delete ${this.modelName}`, typed: true },
      { method: 'get', path: '/meta/count', handler: `${this.modelLower}Controller.count${this.modelName}s`, comment: `Count records` }
    ]
    
    const routeLines = routes.map(r => {
      const typeParam = r.typed ? '<{ Params: { id: string } }>' : ''
      return `  // ${r.comment}\n  fastify.${r.method}${typeParam}('${r.path}', ${r.handler})`
    })
    
    return this.createTemplate()
      .imports([
        `import type { FastifyInstance } from 'fastify'`,
        `import * as ${this.modelLower}Controller from '@gen/controllers/${this.modelLower}'`
      ])
      .block(`export async function ${this.modelLower}Routes(fastify: FastifyInstance) {`)
      .blocks(...routeLines)
      .line('}')
      .buildWithNewline()
  }
  
  /**
   * Get imports
   */
  getImports(): string[] {
    if (this.framework === 'express') {
      return [
        `import { Router } from 'express'`,
        `import * as ${this.modelLower}Controller from '@gen/controllers/${this.modelLower}'`
      ]
    } else {
      return [
        `import type { FastifyInstance } from 'fastify'`,
        `import * as ${this.modelLower}Controller from '@gen/controllers/${this.modelLower}'`
      ]
    }
  }
  
  /**
   * Get exports
   */
  getExports(): string[] {
    return this.framework === 'express'
      ? [`${this.modelLower}Router`]
      : [`${this.modelLower}Routes`]
  }
  
  /**
   * Generate barrel
   */
  generateBarrel(): string {
    return BarrelBuilder.simple([`${this.modelLower}.routes`])
  }
}

