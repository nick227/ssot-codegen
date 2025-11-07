/**
 * OpenAPI 3.1 Generator
 * 
 * Generates complete OpenAPI specifications from Prisma models with:
 * - Request/response schemas from DTOs
 * - Security schemes
 * - Error responses
 * - Examples
 * - Full CRUD operation definitions
 */

import type { ParsedModel, ParsedField } from '../dmmf-parser.js'
import { mapPrismaToTypeScript } from '../type-mapper.js'
import { toKebabCase } from '../utils/naming.js'

export interface OpenAPIConfig {
  title: string
  version: string
  description?: string
  servers?: Array<{ url: string; description: string }>
  includeAuth?: boolean
  authType?: 'bearer' | 'apiKey' | 'oauth2'
}

export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers: Array<{ url: string; description: string }>
  paths: Record<string, any>
  components: {
    schemas: Record<string, any>
    securitySchemes?: Record<string, any>
    responses: Record<string, any>
  }
  security?: Array<Record<string, string[]>>
}

/**
 * Generate complete OpenAPI specification from models
 */
export function generateOpenAPISpec(
  models: ParsedModel[],
  config: OpenAPIConfig
): OpenAPISpec {
  const spec: OpenAPISpec = {
    openapi: '3.1.0',
    info: {
      title: config.title,
      version: config.version,
      description: config.description || 'Auto-generated from Prisma schema'
    },
    servers: config.servers || [
      { url: 'http://localhost:3000/api', description: 'Development' },
      { url: 'https://api.example.com', description: 'Production' }
    ],
    paths: {},
    components: {
      schemas: {},
      responses: getStandardErrorResponses()
    }
  }

  // Add security schemes if requested
  if (config.includeAuth) {
    spec.components.securitySchemes = getSecuritySchemes(config.authType || 'bearer')
    spec.security = getSecurityRequirements(config.authType || 'bearer')
  }

  // Generate schemas for each model
  for (const model of models) {
    generateModelSchemas(model, spec.components.schemas)
    generateModelPaths(model, spec.paths, config.includeAuth)
  }

  return spec
}

/**
 * Generate schemas (DTOs) for a model
 */
function generateModelSchemas(model: ParsedModel, schemas: Record<string, any>): void {
  const modelName = model.name

  // Create DTO
  schemas[`${modelName}CreateDTO`] = {
    type: 'object',
    required: model.createFields.filter(f => !f.hasDefaultValue && f.isRequired).map(f => f.name),
    properties: Object.fromEntries(
      model.createFields.map(f => [f.name, fieldToOpenAPIProperty(f)])
    ),
    example: generateExampleData(model.createFields, 'create')
  }

  // Update DTO
  schemas[`${modelName}UpdateDTO`] = {
    type: 'object',
    properties: Object.fromEntries(
      model.updateFields.map(f => [f.name, fieldToOpenAPIProperty(f)])
    ),
    example: generateExampleData(model.updateFields, 'update')
  }

  // Read DTO (response)
  schemas[`${modelName}ReadDTO`] = {
    type: 'object',
    required: model.readFields.filter(f => f.isRequired).map(f => f.name),
    properties: Object.fromEntries(
      model.readFields.map(f => [f.name, fieldToOpenAPIProperty(f)])
    ),
    example: generateExampleData(model.readFields, 'read')
  }

  // List response
  schemas[`${modelName}ListResponse`] = {
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: {
        type: 'array',
        items: { $ref: `#/components/schemas/${modelName}ReadDTO` }
      },
      meta: {
        type: 'object',
        required: ['total', 'skip', 'take', 'hasMore'],
        properties: {
          total: { type: 'integer', example: 42 },
          skip: { type: 'integer', example: 0 },
          take: { type: 'integer', example: 20 },
          hasMore: { type: 'boolean', example: true }
        }
      }
    }
  }

  // Query parameters
  schemas[`${modelName}QueryParams`] = {
    type: 'object',
    properties: {
      skip: { type: 'integer', minimum: 0, default: 0, description: 'Number of records to skip' },
      take: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Number of records to return' },
      orderBy: { type: 'object', description: 'Sort order' },
      where: { type: 'object', description: 'Filter conditions' },
      include: { type: 'object', description: 'Relations to include' },
      select: { type: 'object', description: 'Fields to select' }
    }
  }
}

/**
 * Convert Prisma field to OpenAPI property
 */
function fieldToOpenAPIProperty(field: ParsedField): any {
  const property: any = {}

  // Base type mapping
  switch (field.type) {
    case 'String':
      property.type = 'string'
      if (field.name.includes('email') || field.name.includes('Email')) {
        property.format = 'email'
      } else if (field.name.includes('url') || field.name.includes('Url')) {
        property.format = 'uri'
      }
      break
    case 'Int':
    case 'BigInt':
      property.type = 'integer'
      property.format = field.type === 'BigInt' ? 'int64' : 'int32'
      break
    case 'Float':
    case 'Decimal':
      property.type = 'number'
      property.format = field.type === 'Decimal' ? 'double' : 'float'
      break
    case 'Boolean':
      property.type = 'boolean'
      break
    case 'DateTime':
      property.type = 'string'
      property.format = 'date-time'
      break
    case 'Json':
      property.type = 'object'
      break
    default:
      if (field.kind === 'enum') {
        property.type = 'string'
        // In real implementation, you'd fetch enum values from DMMF
        property.enum = [`${field.type}_VALUE_1`, `${field.type}_VALUE_2`]
      } else {
        property.type = 'string'
      }
  }

  // Handle arrays
  if (field.isList) {
    return {
      type: 'array',
      items: property
    }
  }

  // Nullable
  if (!field.isRequired) {
    property.nullable = true
  }

  // Description
  property.description = field.documentation || `${field.name} field`

  return property
}

/**
 * Generate example data for a model
 */
function generateExampleData(fields: ParsedField[], context: 'create' | 'update' | 'read'): any {
  const example: any = {}

  for (const field of fields) {
    // Skip auto-generated fields in examples
    if (context === 'create' && (field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt')) {
      continue
    }

    example[field.name] = getExampleValue(field)
  }

  // Add ID and timestamps for read context
  if (context === 'read') {
    if (!example.id) example.id = 'clx123abc'
    if (!example.createdAt) example.createdAt = '2025-01-15T10:30:00Z'
    if (!example.updatedAt) example.updatedAt = '2025-01-15T10:30:00Z'
  }

  return example
}

/**
 * Get example value for a field
 */
function getExampleValue(field: ParsedField): any {
  if (field.isList) {
    return [getScalarExample(field)]
  }
  return getScalarExample(field)
}

/**
 * Get example scalar value
 */
function getScalarExample(field: ParsedField): any {
  const name = field.name.toLowerCase()

  // Smart examples based on field name
  if (name.includes('email')) return 'user@example.com'
  if (name.includes('name')) return field.name.includes('first') ? 'John' : field.name.includes('last') ? 'Doe' : 'Example Name'
  if (name.includes('title')) return 'Example Title'
  if (name.includes('description')) return 'Example description'
  if (name.includes('url')) return 'https://example.com'
  if (name.includes('slug')) return 'example-slug'
  if (name.includes('phone')) return '+1234567890'
  if (name.includes('price')) return 29.99
  if (name.includes('quantity') || name.includes('count')) return 10
  if (name.includes('active') || name.includes('enabled') || name.includes('published')) return true

  // Type-based defaults
  switch (field.type) {
    case 'String': return 'example'
    case 'Int': return 42
    case 'BigInt': return 9007199254740991
    case 'Float': return 3.14
    case 'Decimal': return 99.99
    case 'Boolean': return true
    case 'DateTime': return '2025-01-15T10:30:00Z'
    case 'Json': return { key: 'value' }
    default:
      if (field.kind === 'enum') return `${field.type}_VALUE`
      return null
  }
}

/**
 * Generate CRUD paths for a model
 */
function generateModelPaths(model: ParsedModel, paths: Record<string, any>, includeAuth?: boolean): void {
  const modelName = model.name
  const modelKebab = toKebabCase(modelName)
  const pluralPath = `/${modelKebab}s`
  const singlePath = `/${modelKebab}s/{id}`
  const idType = model.idField?.type === 'String' ? 'string' : 'integer'

  const securityArray = includeAuth ? [{ BearerAuth: [] }] : undefined

  // List endpoint
  paths[pluralPath] = {
    get: {
      tags: [modelName],
      operationId: `list${modelName}s`,
      summary: `List ${modelName} records`,
      description: `Retrieve a paginated list of ${modelName} records with optional filtering and sorting`,
      security: securityArray,
      parameters: [
        { name: 'skip', in: 'query', schema: { type: 'integer', minimum: 0, default: 0 } },
        { name: 'take', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        { name: 'orderBy', in: 'query', schema: { type: 'string' }, description: 'Sort order (e.g., "createdAt:desc")' }
      ],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${modelName}ListResponse` }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '500': { $ref: '#/components/responses/InternalError' }
      }
    },
    post: {
      tags: [modelName],
      operationId: `create${modelName}`,
      summary: `Create ${modelName}`,
      description: `Create a new ${modelName} record`,
      security: securityArray,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${modelName}CreateDTO` }
          }
        }
      },
      responses: {
        '201': {
          description: 'Created',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${modelName}ReadDTO` }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '409': { $ref: '#/components/responses/Conflict' },
        '500': { $ref: '#/components/responses/InternalError' }
      }
    }
  }

  // Single resource endpoints
  paths[singlePath] = {
    get: {
      tags: [modelName],
      operationId: `get${modelName}`,
      summary: `Get ${modelName} by ID`,
      description: `Retrieve a single ${modelName} record by its ID`,
      security: securityArray,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: idType } }
      ],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${modelName}ReadDTO` }
            }
          }
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
        '500': { $ref: '#/components/responses/InternalError' }
      }
    },
    patch: {
      tags: [modelName],
      operationId: `update${modelName}`,
      summary: `Update ${modelName}`,
      description: `Update an existing ${modelName} record`,
      security: securityArray,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: idType } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${modelName}UpdateDTO` }
          }
        }
      },
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${modelName}ReadDTO` }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
        '500': { $ref: '#/components/responses/InternalError' }
      }
    },
    delete: {
      tags: [modelName],
      operationId: `delete${modelName}`,
      summary: `Delete ${modelName}`,
      description: `Delete a ${modelName} record`,
      security: securityArray,
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: idType } }
      ],
      responses: {
        '204': {
          description: 'Successfully deleted'
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
        '500': { $ref: '#/components/responses/InternalError' }
      }
    }
  }
}

/**
 * Standard error response schemas
 */
function getStandardErrorResponses(): Record<string, any> {
  return {
    BadRequest: {
      description: 'Bad Request - Invalid input',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['error'],
            properties: {
              error: { type: 'string', example: 'Validation Error' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    Unauthorized: {
      description: 'Unauthorized - Authentication required',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['error'],
            properties: {
              error: { type: 'string', example: 'Unauthorized' }
            }
          }
        }
      }
    },
    Forbidden: {
      description: 'Forbidden - Insufficient permissions',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['error'],
            properties: {
              error: { type: 'string', example: 'Forbidden' }
            }
          }
        }
      }
    },
    NotFound: {
      description: 'Not Found - Resource does not exist',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['error'],
            properties: {
              error: { type: 'string', example: 'Not Found' }
            }
          }
        }
      }
    },
    Conflict: {
      description: 'Conflict - Resource already exists',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['error'],
            properties: {
              error: { type: 'string', example: 'Resource already exists' },
              field: { type: 'string' }
            }
          }
        }
      }
    },
    InternalError: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['error'],
            properties: {
              error: { type: 'string', example: 'Internal Server Error' },
              stack: { type: 'string', description: 'Available in development mode' }
            }
          }
        }
      }
    }
  }
}

/**
 * Security schemes based on auth type
 */
function getSecuritySchemes(authType: 'bearer' | 'apiKey' | 'oauth2'): Record<string, any> {
  const schemes: Record<string, any> = {}

  switch (authType) {
    case 'bearer':
      schemes.BearerAuth = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication'
      }
      break
    case 'apiKey':
      schemes.ApiKeyAuth = {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key authentication'
      }
      break
    case 'oauth2':
      schemes.OAuth2 = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              read: 'Read access',
              write: 'Write access',
              admin: 'Admin access'
            }
          }
        }
      }
      break
  }

  return schemes
}

/**
 * Security requirements array
 */
function getSecurityRequirements(authType: 'bearer' | 'apiKey' | 'oauth2'): Array<Record<string, string[]>> {
  switch (authType) {
    case 'bearer':
      return [{ BearerAuth: [] }]
    case 'apiKey':
      return [{ ApiKeyAuth: [] }]
    case 'oauth2':
      return [{ OAuth2: ['read', 'write'] }]
  }
}

