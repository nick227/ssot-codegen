/**
 * Framework Adapter for Controller Generation
 * 
 * Eliminates 80% duplication between Express and Fastify by isolating
 * framework-specific syntax while sharing business logic
 */

export interface FrameworkAdapter {
  readonly name: string
  
  // Type imports
  generateTypeImports(): string
  
  // Function signatures
  generateFunctionParams(hasParams?: boolean, hasBody?: boolean, hasQuery?: boolean): string
  generateAsyncFunctionSignature(name: string, params: string): string
  
  // Parameter extraction
  renderParamsExtraction(): string
  renderBodyExtraction(): string
  renderQueryExtraction(): string
  
  // Response rendering
  renderSuccessResponse(data: string, statusCode?: number): string
  renderErrorResponse(message: string, statusCode?: number): string
  renderValidationErrorResponse(): string
  
  // Error handling
  renderErrorHandler(sanitize: boolean): string
  renderTryCatchBlock(tryBody: string, errorVar: string, errorHandler: string): string
}

/**
 * Express Framework Adapter
 */
export class ExpressAdapter implements FrameworkAdapter {
  readonly name = 'express'
  
  generateTypeImports(): string {
    return `import type { Request, Response } from 'express'`
  }
  
  generateFunctionParams(hasParams = false, hasBody = false, hasQuery = false): string {
    const parts: string[] = []
    
    if (hasParams) parts.push('Params')
    if (hasBody) parts.push('ResBody, ReqBody')
    if (hasQuery) parts.push('ReqQuery')
    
    const typeParam = parts.length > 0 ? `<{${parts.join(', ')}}>` : ''
    return `req: Request${typeParam}, res: Response`
  }
  
  generateAsyncFunctionSignature(name: string, params: string): string {
    return `export const ${name} = async (${params})`
  }
  
  renderParamsExtraction(): string {
    return `const { id } = req.params`
  }
  
  renderBodyExtraction(): string {
    return `const body = req.body`
  }
  
  renderQueryExtraction(): string {
    return `const query = req.query`
  }
  
  renderSuccessResponse(data: string, statusCode = 200): string {
    return `return res.status(${statusCode}).json({ data: ${data} })`
  }
  
  renderErrorResponse(message: string, statusCode = 500): string {
    return `return res.status(${statusCode}).json({ error: ${message} })`
  }
  
  renderValidationErrorResponse(): string {
    return `return res.status(400).json({ error: 'Validation failed', details: error.errors })`
  }
  
  renderErrorHandler(sanitize: boolean): string {
    const errorMsg = sanitize 
      ? `'An error occurred'` 
      : `error instanceof Error ? error.message : 'Unknown error'`
    
    return `
function handleError(error: unknown, res: Response, context: string): Response {
  logger.error(context, { error })
  const message = ${errorMsg}
  return res.status(500).json({ error: message })
}`
  }
  
  renderTryCatchBlock(tryBody: string, errorVar: string, errorHandler: string): string {
    return `
  try {
${tryBody}
  } catch (${errorVar}) {
${errorHandler}
  }`
  }
}

/**
 * Fastify Framework Adapter
 */
export class FastifyAdapter implements FrameworkAdapter {
  readonly name = 'fastify'
  
  generateTypeImports(): string {
    return `import type { FastifyRequest, FastifyReply } from 'fastify'`
  }
  
  generateFunctionParams(hasParams = false, hasBody = false, hasQuery = false): string {
    const types: string[] = []
    
    if (hasParams) types.push('Params: ParamsType')
    if (hasBody) types.push('Body: BodyType')
    if (hasQuery) types.push('Querystring: QueryType')
    
    const typeParam = types.length > 0 ? `<{${types.join('; ')}}>` : ''
    return `req: FastifyRequest${typeParam}, reply: FastifyReply`
  }
  
  generateAsyncFunctionSignature(name: string, params: string): string {
    return `export const ${name} = async (${params})`
  }
  
  renderParamsExtraction(): string {
    return `const { id } = req.params`
  }
  
  renderBodyExtraction(): string {
    return `const body = req.body`
  }
  
  renderQueryExtraction(): string {
    return `const query = req.query`
  }
  
  renderSuccessResponse(data: string, statusCode = 200): string {
    return `return reply.code(${statusCode}).send({ data: ${data} })`
  }
  
  renderErrorResponse(message: string, statusCode = 500): string {
    return `return reply.code(${statusCode}).send({ error: ${message} })`
  }
  
  renderValidationErrorResponse(): string {
    return `return reply.code(400).send({ error: 'Validation failed', details: error.errors })`
  }
  
  renderErrorHandler(sanitize: boolean): string {
    const errorMsg = sanitize 
      ? `'An error occurred'` 
      : `error instanceof Error ? error.message : 'Unknown error'`
    
    return `
function handleError(error: unknown, reply: FastifyReply, context: string): FastifyReply {
  logger.error(context, { error })
  const message = ${errorMsg}
  return reply.code(500).send({ error: message })
}`
  }
  
  renderTryCatchBlock(tryBody: string, errorVar: string, errorHandler: string): string {
    return `
  try {
${tryBody}
  } catch (${errorVar}) {
${errorHandler}
  }`
  }
}

/**
 * Get framework adapter by name
 */
export function getFrameworkAdapter(framework: 'express' | 'fastify'): FrameworkAdapter {
  return framework === 'express' ? new ExpressAdapter() : new FastifyAdapter()
}

/**
 * Framework-agnostic method template
 */
export interface MethodTemplate {
  name: string
  hasParams?: boolean
  hasBody?: boolean
  hasQuery?: boolean
  validation?: string
  serviceCall: string
  successCode?: number
  errorContext: string
}

/**
 * Generate method using framework adapter
 */
export function generateMethodFromTemplate(
  template: MethodTemplate,
  adapter: FrameworkAdapter
): string {
  const params = adapter.generateFunctionParams(
    template.hasParams,
    template.hasBody,
    template.hasQuery
  )
  
  const signature = adapter.generateAsyncFunctionSignature(template.name, params)
  
  const paramExtraction = template.hasParams ? adapter.renderParamsExtraction() : ''
  const bodyExtraction = template.hasBody ? adapter.renderBodyExtraction() : ''
  const queryExtraction = template.hasQuery ? adapter.renderQueryExtraction() : ''
  
  const validation = template.validation || ''
  
  const tryBody = `    const result = await ${template.serviceCall}
    ${adapter.renderSuccessResponse('result', template.successCode || 200)}`
  
  const errorHandler = adapter.name === 'express'
    ? `    return handleError(error, res, '${template.errorContext}')`
    : `    return handleError(error, reply, '${template.errorContext}')`
  
  const tryCatch = adapter.renderTryCatchBlock(tryBody, 'error', errorHandler)
  
  return `
${signature} => {
  ${paramExtraction}
  ${bodyExtraction}
  ${queryExtraction}
  ${validation}
${tryCatch}
}
`
}

