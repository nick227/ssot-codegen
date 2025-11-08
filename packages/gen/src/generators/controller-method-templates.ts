/**
 * Controller Method Templates
 * 
 * Framework-agnostic method definitions that can be rendered for Express, Fastify, or other frameworks.
 * Eliminates duplication by defining business logic once and adapting syntax per framework.
 */

import type { ParsedModel } from '../dmmf-parser.js'
import type { ControllerConfig } from './controller-helpers.js'

/**
 * Method template defining framework-agnostic controller logic
 */
export interface MethodTemplate {
  /** Method name (e.g., 'listUsers', 'getUser') */
  name: string
  
  /** HTTP method */
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  
  /** JSDoc comment */
  comment: string
  
  /** Has URL parameters (e.g., :id) */
  hasParams?: boolean
  
  /** Has request body */
  hasBody?: boolean
  
  /** Has query parameters */
  hasQuery?: boolean
  
  /** Parameter validation code (framework-agnostic) */
  validation?: string
  
  /** Service method call */
  serviceCall: string
  
  /** Success status code */
  successCode?: number
  
  /** Error context for logging */
  errorContext: string
  
  /** Special handling (e.g., not found check) */
  notFoundCheck?: {
    variable: string
    message: string
  }
}

/**
 * Generate CRUD method templates for a model
 */
export function getCRUDMethodTemplates(
  model: ParsedModel,
  modelCamel: string,
  config: ControllerConfig
): MethodTemplate[] {
  const modelName = model.name
  const modelPlural = `${modelName}s`
  
  return [
    // LIST
    {
      name: `list${modelPlural}`,
      httpMethod: 'GET',
      comment: `List all ${modelName} records (simple pagination from query string)`,
      hasQuery: true,
      validation: `
    const pagination = parsePagination(query)`,
      serviceCall: `${modelCamel}Service.list(pagination)`,
      successCode: 200,
      errorContext: `listing ${modelPlural}`
    },
    
    // SEARCH
    {
      name: `search${modelPlural}`,
      httpMethod: 'POST',
      comment: `Search ${modelName} records (complex filtering via POST body)`,
      hasBody: true,
      validation: `
    if (!body || typeof body !== 'object') {
      return ERROR_RESPONSE('Request body required', 400)
    }
    
    const query = ${modelName}QuerySchema.parse(body)`,
      serviceCall: `${modelCamel}Service.list(query)`,
      successCode: 200,
      errorContext: `searching ${modelPlural}`
    },
    
    // GET BY ID
    {
      name: `get${modelName}`,
      httpMethod: 'GET',
      comment: `Get ${modelName} by ID`,
      hasParams: true,
      validation: `
    const idResult = parseIdParam(id)
    
    if (!idResult.valid || idResult.id === undefined) {
      logger.warn({ idParam: id }, idResult.error || 'Invalid ID')
      return ERROR_RESPONSE(idResult.error || 'Invalid ID', 400)
    }
    
    const parsedId = idResult.id`,
      serviceCall: `${modelCamel}Service.findById(parsedId)`,
      successCode: 200,
      errorContext: `getting resource`,
      notFoundCheck: {
        variable: 'result',
        message: 'Resource not found'
      }
    },
    
    // CREATE
    {
      name: `create${modelName}`,
      httpMethod: 'POST',
      comment: `Create ${modelName}`,
      hasBody: true,
      validation: `
    if (!body || typeof body !== 'object') {
      return ERROR_RESPONSE('Request body required', 400)
    }
    
    const data = ${modelName}CreateSchema.parse(body)`,
      serviceCall: `${modelCamel}Service.create(data)`,
      successCode: 201,
      errorContext: `creating resource`
    },
    
    // UPDATE
    {
      name: `update${modelName}`,
      httpMethod: 'PUT',
      comment: `Update ${modelName}`,
      hasParams: true,
      hasBody: true,
      validation: `
    if (!body || typeof body !== 'object') {
      return ERROR_RESPONSE('Request body required', 400)
    }
    
    const idResult = parseIdParam(id)
    
    if (!idResult.valid || idResult.id === undefined) {
      return ERROR_RESPONSE(idResult.error || 'Invalid ID', 400)
    }
    
    const parsedId = idResult.id
    const data = ${modelName}UpdateSchema.parse(body)`,
      serviceCall: `${modelCamel}Service.update(parsedId, data)`,
      successCode: 200,
      errorContext: `updating resource`
    },
    
    // DELETE
    {
      name: `delete${modelName}`,
      httpMethod: 'DELETE',
      comment: `Delete ${modelName}`,
      hasParams: true,
      validation: `
    const idResult = parseIdParam(id)
    
    if (!idResult.valid || idResult.id === undefined) {
      return ERROR_RESPONSE(idResult.error || 'Invalid ID', 400)
    }
    
    const parsedId = idResult.id`,
      serviceCall: `${modelCamel}Service.delete(parsedId)`,
      successCode: 204,
      errorContext: `deleting resource`
    },
    
    // COUNT
    {
      name: `count${modelPlural}`,
      httpMethod: 'POST',
      comment: `Count ${modelName} records matching filters`,
      hasBody: true,
      validation: `
    const where = req.body?.where && typeof req.body.where === 'object' 
      ? CountWhereSchema.parse(req.body.where)
      : undefined`,
      serviceCall: `${modelCamel}Service.count(where ? { where } : {})`,
      successCode: 200,
      errorContext: `counting ${modelPlural}`
    },
    
    // EXISTS
    {
      name: `exists${modelName}`,
      httpMethod: 'GET',
      comment: `Check if ${modelName} exists`,
      hasParams: true,
      validation: `
    const idResult = parseIdParam(id)
    
    if (!idResult.valid || idResult.id === undefined) {
      return ERROR_RESPONSE(idResult.error || 'Invalid ID', 400)
    }
    
    const parsedId = idResult.id`,
      serviceCall: `${modelCamel}Service.exists(parsedId)`,
      successCode: 200,
      errorContext: `checking existence`
    }
  ]
}

/**
 * Domain-specific method templates (slug, published, etc.)
 */
export interface DomainMethodConfig {
  hasSlug: boolean
  hasPublished: boolean
  hasViews: boolean
  hasApproved: boolean
}

export function getDomainMethodTemplates(
  model: ParsedModel,
  modelCamel: string,
  domainConfig: DomainMethodConfig
): MethodTemplate[] {
  const templates: MethodTemplate[] = []
  const modelName = model.name
  
  // GET BY SLUG
  if (domainConfig.hasSlug) {
    templates.push({
      name: `get${modelName}BySlug`,
      httpMethod: 'GET',
      comment: `Get ${modelName} by slug`,
      hasParams: true,
      validation: `
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return ERROR_RESPONSE('Invalid slug parameter', 400)
    }`,
      serviceCall: `${modelCamel}Service.findBySlug(slug)`,
      successCode: 200,
      errorContext: `getting ${modelName} by slug`,
      notFoundCheck: {
        variable: 'item',
        message: `${modelName} not found`
      }
    })
  }
  
  // GET PUBLISHED
  if (domainConfig.hasPublished) {
    templates.push({
      name: `getPublished${modelName}s`,
      httpMethod: 'GET',
      comment: `Get published ${modelName} records`,
      hasQuery: true,
      serviceCall: `${modelCamel}Service.getPublished(pagination)`,
      successCode: 200,
      errorContext: `getting published ${modelName}s`
    })
  }
  
  // INCREMENT VIEWS
  if (domainConfig.hasViews) {
    templates.push({
      name: `increment${modelName}Views`,
      httpMethod: 'POST',
      comment: `Increment view count for ${modelName}`,
      hasParams: true,
      validation: `
    const idResult = parseIdParam(id)
    
    if (!idResult.valid || idResult.id === undefined) {
      return ERROR_RESPONSE(idResult.error || 'Invalid ID', 400)
    }
    
    const parsedId = idResult.id`,
      serviceCall: `${modelCamel}Service.incrementViews(parsedId)`,
      successCode: 200,
      errorContext: `incrementing views`
    })
  }
  
  // APPROVE/UNAPPROVE
  if (domainConfig.hasApproved) {
    templates.push(
      {
        name: `approve${modelName}`,
        httpMethod: 'POST',
        comment: `Approve ${modelName}`,
        hasParams: true,
        validation: `
    const idResult = parseIdParam(id)
    
    if (!idResult.valid || idResult.id === undefined) {
      return ERROR_RESPONSE(idResult.error || 'Invalid ID', 400)
    }
    
    const parsedId = idResult.id`,
        serviceCall: `${modelCamel}Service.approve(parsedId)`,
        successCode: 200,
        errorContext: `approving ${modelName}`
      },
      {
        name: `unapprove${modelName}`,
        httpMethod: 'POST',
        comment: `Unapprove ${modelName}`,
        hasParams: true,
        validation: `
    const idResult = parseIdParam(id)
    
    if (!idResult.valid || idResult.id === undefined) {
      return ERROR_RESPONSE(idResult.error || 'Invalid ID', 400)
    }
    
    const parsedId = idResult.id`,
        serviceCall: `${modelCamel}Service.unapprove(parsedId)`,
        successCode: 200,
        errorContext: `unapproving ${modelName}`
      }
    )
  }
  
  return templates
}

