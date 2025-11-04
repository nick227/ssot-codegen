/**
 * Framework Strategy - Abstract framework-specific code generation
 * 
 * Enables support for Express, Fastify, and future frameworks
 */

export interface FrameworkStrategy {
  /**
   * Generate framework-specific imports
   */
  getImports(modelLower: string): string[]
  
  /**
   * Generate handler function signature
   */
  generateHandlerSignature(name: string, params?: string): string
  
  /**
   * Generate request parameter access
   */
  getRequestParam(param: string): string
  
  /**
   * Generate request body access
   */
  getRequestBody(): string
  
  /**
   * Generate request query access
   */
  getRequestQuery(): string
  
  /**
   * Generate JSON response
   */
  generateJsonResponse(data: string): string
  
  /**
   * Generate status response
   */
  generateStatusResponse(status: number, data?: string): string
  
  /**
   * Generate router setup
   */
  generateRouterSetup(modelLower: string): string
  
  /**
   * Generate route registration
   */
  generateRoute(method: string, path: string, handler: string): string
}

/**
 * Express Strategy
 */
export class ExpressStrategy implements FrameworkStrategy {
  getImports(modelLower: string): string[] {
    return [
      `import type { Request, Response } from 'express'`,
      `import { ${modelLower}Service } from '@gen/services/${modelLower}'`
    ]
  }
  
  generateHandlerSignature(name: string, params?: string): string {
    const paramsList = params ? `<{ Params: ${params} }>` : ''
    return `export const ${name} = async (req: Request${paramsList}, res: Response)`
  }
  
  getRequestParam(param: string): string {
    return `req.params.${param}`
  }
  
  getRequestBody(): string {
    return 'req.body'
  }
  
  getRequestQuery(): string {
    return 'req.query'
  }
  
  generateJsonResponse(data: string): string {
    return `return res.json(${data})`
  }
  
  generateStatusResponse(status: number, data?: string): string {
    if (data) {
      return `return res.status(${status}).json(${data})`
    } else {
      return `return res.status(${status}).send()`
    }
  }
  
  generateRouterSetup(modelLower: string): string {
    return `import { Router } from 'express'
import * as ${modelLower}Controller from '@gen/controllers/${modelLower}'

export const ${modelLower}Router = Router()`
  }
  
  generateRoute(method: string, path: string, handler: string): string {
    return `${this.getRouterName()}.${method}('${path}', ${handler})`
  }
  
  private getRouterName(): string {
    return 'router'  // Will be replaced with actual router var name
  }
}

/**
 * Fastify Strategy
 */
export class FastifyStrategy implements FrameworkStrategy {
  getImports(modelLower: string): string[] {
    return [
      `import type { FastifyRequest, FastifyReply } from 'fastify'`,
      `import { ${modelLower}Service } from '@gen/services/${modelLower}'`
    ]
  }
  
  generateHandlerSignature(name: string, params?: string): string {
    const paramsList = params ? `<{ Params: ${params} }>` : ''
    return `export const ${name} = async (request: FastifyRequest${paramsList}, reply: FastifyReply)`
  }
  
  getRequestParam(param: string): string {
    return `request.params.${param}`
  }
  
  getRequestBody(): string {
    return 'request.body'
  }
  
  getRequestQuery(): string {
    return 'request.query'
  }
  
  generateJsonResponse(data: string): string {
    return `return ${data}`
  }
  
  generateStatusResponse(status: number, data?: string): string {
    if (data) {
      return `return reply.code(${status}).send(${data})`
    } else {
      return `return reply.code(${status}).send()`
    }
  }
  
  generateRouterSetup(modelLower: string): string {
    return `import type { FastifyInstance } from 'fastify'
import * as ${modelLower}Controller from '@gen/controllers/${modelLower}'

export async function ${modelLower}Routes(fastify: FastifyInstance)`
  }
  
  generateRoute(method: string, path: string, handler: string): string {
    const paramType = path.includes(':id') ? '<{ Params: { id: string } }>' : ''
    return `  fastify.${method}${paramType}('${path}', ${handler})`
  }
}

/**
 * Get framework strategy
 */
export function getFrameworkStrategy(framework: 'express' | 'fastify'): FrameworkStrategy {
  return framework === 'express' ? new ExpressStrategy() : new FastifyStrategy()
}

