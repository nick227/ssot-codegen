/**
 * Route Generator - Template-Based Version
 * 
 * EXAMPLE: Shows how to use template registry for consistent code generation
 * This is a BEFORE/AFTER example - not production (yet)
 */

import type { ParsedModel } from '../dmmf-parser.js'
import { toCamelCase, toKebabCase } from '@/utils/naming.js'
import { createGeneratedFile } from '@/templates/template-registry.js'

/**
 * Generate routes using template system
 */
export function generateRoutesTemplated(
  model: ParsedModel,
  framework: 'express' | 'fastify' = 'express'
): string {
  const modelKebab = toKebabCase(model.name)
  const modelCamel = toCamelCase(model.name)
  
  if (framework === 'express') {
    return generateExpressRoutesTemplated(model, modelKebab, modelCamel)
  } else {
    return generateFastifyRoutesTemplated(model, modelKebab, modelCamel)
  }
}

/**
 * Generate Express routes using TemplateBuilder
 */
function generateExpressRoutesTemplated(
  model: ParsedModel,
  modelKebab: string,
  modelCamel: string
): string {
  const imports = [
    `import { Router, type Router as RouterType } from 'express'`,
    `import * as ${modelCamel}Controller from '@/controllers/${modelKebab}/index.js'`
  ]
  
  // CRUD routes
  const routes = [
    { comment: `List all ${model.name} records (simple pagination)`, method: 'get', path: '/', handler: `list${model.name}s` },
    { comment: `Search ${model.name} records (complex filtering via POST body)`, method: 'post', path: '/search', handler: `search${model.name}s` },
    { comment: `Get ${model.name} by ID`, method: 'get', path: '/:id', handler: `get${model.name}` },
    { comment: `Create ${model.name}`, method: 'post', path: '/', handler: `create${model.name}` },
    { comment: `Update ${model.name}`, method: 'put', path: '/:id', handler: `update${model.name}` },
    { comment: `Update ${model.name} (partial)`, method: 'patch', path: '/:id', handler: `update${model.name}` },
    { comment: `Delete ${model.name}`, method: 'delete', path: '/:id', handler: `delete${model.name}` },
    { comment: `Count ${model.name} records`, method: 'get', path: '/meta/count', handler: `count${model.name}s` }
  ]
  
  return createGeneratedFile({ imports })
    .emptyLine()
    .line(`export const ${modelCamel}Router: RouterType = Router()`)
    .emptyLine()
    .blocks(...routes.map(r => 
      `// ${r.comment}\n${modelCamel}Router.${r.method}('${r.path}', ${modelCamel}Controller.${r.handler})`
    ))
    .buildWithNewline()
}

/**
 * Generate Fastify routes using TemplateBuilder
 */
function generateFastifyRoutesTemplated(
  model: ParsedModel,
  modelKebab: string,
  modelCamel: string
): string {
  const imports = [
    `import type { FastifyInstance } from 'fastify'`,
    `import * as ${modelCamel}Controller from '@/controllers/${modelKebab}/index.js'`
  ]
  
  const routes = [
    { comment: `List all ${model.name} records`, method: 'get', path: '/', handler: `list${model.name}s` },
    { comment: `Search ${model.name} records`, method: 'post', path: '/search', handler: `search${model.name}s` },
    { comment: `Get ${model.name} by ID`, method: 'get', path: '/:id', handler: `get${model.name}` },
    { comment: `Create ${model.name}`, method: 'post', path: '/', handler: `create${model.name}` },
    { comment: `Update ${model.name}`, method: 'put', path: '/:id', handler: `update${model.name}` },
    { comment: `Update ${model.name} (partial)`, method: 'patch', path: '/:id', handler: `update${model.name}` },
    { comment: `Delete ${model.name}`, method: 'delete', path: '/:id', handler: `delete${model.name}` },
    { comment: `Count ${model.name} records`, method: 'get', path: '/meta/count', handler: `count${model.name}s` }
  ]
  
  const routeLines = routes.map(r => 
    `  // ${r.comment}\n  fastify.${r.method}('${r.path}', ${modelCamel}Controller.${r.handler})`
  ).join('\n\n')
  
  return createGeneratedFile({ imports })
    .emptyLine()
    .line(`export async function ${modelCamel}Routes(fastify: FastifyInstance) {`)
    .line(routeLines)
    .line(`}`)
    .buildWithNewline()
}





