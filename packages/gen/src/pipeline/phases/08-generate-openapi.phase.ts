/**
 * Phase 8: Generate OpenAPI
 * 
 * Generates comprehensive OpenAPI 3.1 specification with:
 * - Complete request/response schemas from DTOs
 * - Security schemes
 * - Error responses
 * - Examples
 * - CRUD operations for all models
 */

import path from 'node:path'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { writeFile } from '../phase-utilities.js'
import { stringifyWithCache } from '../json-cache.js'
import { generateOpenAPISpec, type OpenAPIConfig } from '@/api/openapi-generator.js'

export class GenerateOpenAPIPhase extends GenerationPhase {
  readonly name = 'generateOpenAPI'
  readonly order = 8
  
  getDescription(): string {
    return 'Generating OpenAPI specification'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schema, parsedModels, pathsConfig: cfg, generatorConfig } = context
    
    if (!schema || !cfg || !parsedModels) {
      throw new Error('Schema, parsed models, or paths config not found in context')
    }
    
    // Extract project metadata from config (schema doesn't have datasources in ParsedSchema)
    const projectName = generatorConfig?.projectName || 'Generated API'
    const projectDesc = generatorConfig?.description || 'Auto-generated RESTful API from Prisma schema'
    
    // Determine if authentication should be included (check if features exist and are object type)
    const authFeature = generatorConfig?.features && typeof generatorConfig.features === 'object' 
      ? (generatorConfig.features as any).authentication 
      : undefined
    const includeAuth = authFeature?.enabled ?? true
    const authType = authFeature?.type || 'bearer'
    
    // Configure OpenAPI generation
    const config: OpenAPIConfig = {
      title: projectName,
      version: '1.0.0',
      description: projectDesc,
      servers: [
        { url: 'http://localhost:3000/api', description: 'Development' },
        { url: 'https://api.example.com/api', description: 'Production (update with your domain)' }
      ],
      includeAuth,
      authType: authType as 'bearer' | 'apiKey' | 'oauth2'
    }
    
    // Generate complete OpenAPI spec using parsed models with real enum values
    const spec = generateOpenAPISpec(parsedModels, config, schema)
    
    // Store spec in context for reuse (e.g., manifest, SDK generation)
    context.openApiSpec = spec
    
    // Write OpenAPI spec to file
    const specPath = path.join(cfg.rootDir, 'openapi.json')
    await writeFile(specPath, stringifyWithCache(spec, { indent: 2 }))
    
    // Also generate Swagger UI HTML for easy API exploration
    const swaggerUIPath = path.join(cfg.rootDir, 'api-docs.html')
    await writeFile(swaggerUIPath, generateSwaggerUIHtml())
    
    return {
      success: true,
      filesGenerated: 2 // openapi.json + api-docs.html
    }
  }
}

/**
 * Generate standalone Swagger UI HTML file
 * This allows developers to open api-docs.html directly in a browser
 */
function generateSwaggerUIHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: './openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`
}

