/**
 * Controller Method Renderer
 * 
 * Renders framework-agnostic method templates into framework-specific code.
 * Eliminates duplication by using adapters for framework syntax.
 */

import type { MethodTemplate } from './controller-method-templates.js'

/**
 * Framework adapter interface
 */
export interface FrameworkAdapter {
  /** Framework name */
  name: 'express' | 'fastify'
  
  /** Generate function signature with proper types */
  renderFunctionSignature(name: string, hasParams?: boolean, hasBody?: boolean, hasQuery?: boolean): string
  
  /** Extract parameters from request */
  renderParamExtraction(paramName: string): string
  
  /** Extract body from request */
  renderBodyExtraction(): string
  
  /** Extract query from request */
  renderQueryExtraction(): string
  
  /** Render success response */
  renderSuccessResponse(dataVar: string, statusCode: number): string
  
  /** Render error response */
  renderErrorResponse(message: string, statusCode: number): string
}

/**
 * Express adapter
 */
export const expressAdapter: FrameworkAdapter = {
  name: 'express',
  
  renderFunctionSignature(name: string, hasParams = false, hasBody = false, hasQuery = false): string {
    const typeParams: string[] = []
    
    if (hasParams) typeParams.push('Params')
    if (hasQuery) typeParams.push('unknown, unknown, PaginationQuery')
    
    const typeStr = typeParams.length > 0 
      ? hasQuery && !hasParams
        ? `<Record<string, never>, ${typeParams.join(', ')}>`
        : `<{${typeParams.join(', ')}}>`
      : hasBody 
        ? '<Record<string, never>, unknown, unknown>'
        : ''
    
    return `export const ${name} = async (\n  req: Request${typeStr},\n  res: Response\n)`
  },
  
  renderParamExtraction(paramName: string): string {
    return `const ${paramName} = req.params.${paramName}`
  },
  
  renderBodyExtraction(): string {
    return `const body = req.body`
  },
  
  renderQueryExtraction(): string {
    return `const query = req.query`
  },
  
  renderSuccessResponse(dataVar: string, statusCode: number): string {
    if (statusCode === 200) {
      return `return res.json(${dataVar})`
    } else if (statusCode === 204) {
      return `return res.status(204).send()`
    } else {
      return `return res.status(${statusCode}).json(${dataVar})`
    }
  },
  
  renderErrorResponse(message: string, statusCode: number): string {
    return `return res.status(${statusCode}).json({ error: ${message} })`
  }
}

/**
 * Fastify adapter
 */
export const fastifyAdapter: FrameworkAdapter = {
  name: 'fastify',
  
  renderFunctionSignature(name: string, hasParams = false, hasBody = false, hasQuery = false): string {
    const typeParams: string[] = []
    
    if (hasParams) typeParams.push('Params: { id: string }')
    if (hasQuery) typeParams.push('Querystring: PaginationQuery')
    
    const typeStr = typeParams.length > 0 ? `<{${typeParams.join('; ')}}>` : ''
    
    return `export const ${name} = async (req: FastifyRequest${typeStr}, reply: FastifyReply)`
  },
  
  renderParamExtraction(paramName: string): string {
    return `const ${paramName} = req.params.${paramName}`
  },
  
  renderBodyExtraction(): string {
    return `const body = req.body`
  },
  
  renderQueryExtraction(): string {
    return `const query = req.query as Record<string, unknown>`
  },
  
  renderSuccessResponse(dataVar: string, statusCode: number): string {
    if (statusCode === 200) {
      return `return reply.send(${dataVar})`
    } else if (statusCode === 204) {
      return `return reply.code(204).send()`
    } else {
      return `return reply.code(${statusCode}).send(${dataVar})`
    }
  },
  
  renderErrorResponse(message: string, statusCode: number): string {
    return `return reply.code(${statusCode}).send({ error: ${message} })`
  }
}

/**
 * Render a method template into framework-specific code
 */
export function renderMethod(template: MethodTemplate, adapter: FrameworkAdapter): string {
  const { name, comment, hasParams, hasBody, hasQuery, validation, serviceCall, successCode = 200, errorContext, notFoundCheck } = template
  
  // Function signature
  const signature = adapter.renderFunctionSignature(name, hasParams, hasBody, hasQuery)
  
  // Parameter extraction
  const extractions: string[] = []
  if (hasParams) extractions.push(adapter.renderParamExtraction('id'))
  if (hasBody) extractions.push(adapter.renderBodyExtraction())
  if (hasQuery) extractions.push(adapter.renderQueryExtraction())
  
  // Replace placeholders in validation code
  let validationCode = validation || ''
  if (validationCode) {
    // Replace ERROR_RESPONSE placeholder with actual framework code
    validationCode = validationCode.replace(
      /ERROR_RESPONSE\(([^,]+),\s*(\d+)\)/g,
      (_, msg, code) => adapter.renderErrorResponse(msg, parseInt(code)).replace(/^return /, '')
    )
  }
  
  // Not found check
  const notFoundCode = notFoundCheck ? `
    if (!${notFoundCheck.variable}) {
      logger.info({ item: parsedId }, '${notFoundCheck.message}')
      ${adapter.renderErrorResponse(`'${notFoundCheck.message}'`, 404).replace('result', notFoundCheck.variable)}
    }
` : ''
  
  // Success response
  const successResponse = adapter.renderSuccessResponse('result', successCode)
  
  // Error handler
  const errorHandler = adapter.name === 'express'
    ? `handleError(error, res, '${errorContext}', { operation: '${name}' })`
    : `handleError(error, reply, '${errorContext}', {})`
  
  return `
/**
 * ${comment}
 */
${signature} => {
  try {
    ${extractions.join('\n    ')}
    ${validationCode}
    const result = await ${serviceCall}
    ${notFoundCode}
    ${successResponse}
  } catch (error) {
    return ${errorHandler}
  }
}
`
}

/**
 * Render all methods from templates
 */
export function renderMethods(templates: MethodTemplate[], adapter: FrameworkAdapter): string {
  return templates.map(t => renderMethod(t, adapter)).join('\n')
}

/**
 * Get adapter by framework name
 */
export function getAdapter(framework: 'express' | 'fastify'): FrameworkAdapter {
  return framework === 'express' ? expressAdapter : fastifyAdapter
}

