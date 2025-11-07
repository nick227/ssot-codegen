/**
 * Phase 8: Generate OpenAPI
 * 
 * Generates OpenAPI specification for the API
 */

import path from 'node:path'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { writeFile } from '../phase-utilities.js'

export class GenerateOpenAPIPhase extends GenerationPhase {
  readonly name = 'generateOpenAPI'
  readonly order = 8
  
  getDescription(): string {
    return 'Generating OpenAPI specification'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schema, pathsConfig: cfg } = context
    
    if (!schema || !cfg) {
      throw new Error('Schema or paths config not found in context')
    }
    
    const spec = {
      openapi: '3.1.0',
      info: {
        title: 'Generated API',
        version: '1.0.0',
        description: 'Auto-generated from Prisma schema'
      },
      servers: [
        { url: 'http://localhost:3000/api', description: 'Development' }
      ],
      paths: Object.fromEntries(
        schema.models.map((m: any) => [
          `/${m.name.toLowerCase()}s`,
          {
            get: {
              operationId: `list${m.name}s`,
              summary: `List all ${m.name} records`,
              responses: { '200': { description: 'Success' } }
            },
            post: {
              operationId: `create${m.name}`,
              summary: `Create a ${m.name}`,
              responses: { '201': { description: 'Created' } }
            }
          }
        ])
      )
    }
    
    const specPath = path.join(cfg.rootDir, 'openapi.json')
    await writeFile(specPath, JSON.stringify(spec, null, 2))
    
    return {
      success: true,
      filesGenerated: 1 // Single file always
    }
  }
}

