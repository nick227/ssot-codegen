/**
 * Unit Tests: UnifiedPipelineAdapter
 * 
 * Tests adapter that wraps CodeGenerationPipeline for PhaseRunner compatibility.
 * CRITICAL: Ensures backward compatibility during migration from PhaseRunner.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UnifiedPipelineAdapter, createUnifiedPipeline } from '../unified-pipeline-adapter.js'
import { PhaseHookRegistry } from '../hooks/phase-hooks.js'
import type { GeneratorConfig } from '../types.js'
import type { CLILogger } from '../../utils/cli-logger.js'

// Mock dependencies
vi.mock('../../dmmf-parser.js', () => ({
  parseDMMF: vi.fn((dmmf) => ({
    models: [
      {
        name: 'User',
        nameLower: 'user',
        fields: [],
        uniqueFields: [],
        uniqueIndexes: [],
        primaryKey: null
      }
    ],
    enums: []
  }))
}))

vi.mock('@prisma/internals', () => ({
  getDMMF: vi.fn(async () => ({
    datamodel: { models: [], enums: [] }
  }))
}))

vi.mock('../code-generation-pipeline.js', () => ({
  CodeGenerationPipeline: vi.fn().mockImplementation(() => ({
    execute: vi.fn(async () => ({
      contracts: new Map([
        ['User', new Map([
          ['user.create.dto.ts', '// create'],
          ['user.update.dto.ts', '// update']
        ])]
      ]),
      validators: new Map([
        ['User', new Map([
          ['user.create.zod.ts', '// validator']
        ])]
      ]),
      services: new Map([['user.service.ts', '// service']]),
      controllers: new Map([['user.controller.ts', '// controller']]),
      routes: new Map([['user.routes.ts', '// routes']]),
      sdk: new Map([['models/user.client.ts', '// sdk']]),
      hooks: { core: new Map([['useUser.ts', '// hook']]) }
    })),
    getContext: vi.fn(() => ({
      schema: {
        models: [{ name: 'User', fields: [] }]
      }
    }))
  }))
}))

// Mock logger
const createMockLogger = (): CLILogger => ({
  startGeneration: vi.fn(),
  completeGeneration: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  startPhase: vi.fn(),
  endPhase: vi.fn()
} as any)

describe('UnifiedPipelineAdapter', () => {
  let logger: CLILogger
  
  beforeEach(() => {
    logger = createMockLogger()
    vi.clearAllMocks()
  })
  
  describe('Construction', () => {
    it('should create adapter with config and logger', () => {
      const config: GeneratorConfig = {
        schemaText: 'model User { id String @id }',
        framework: 'express'
      }
      
      expect(() => {
        new UnifiedPipelineAdapter(config, logger)
      }).not.toThrow()
    })
    
    it('should accept optional hook registry', () => {
      const config: GeneratorConfig = {
        schemaText: 'model User { id String @id }',
        framework: 'express'
      }
      
      const hooks = new PhaseHookRegistry()
      
      expect(() => {
        new UnifiedPipelineAdapter(config, logger, hooks)
      }).not.toThrow()
    })
  })
  
  describe('run()', () => {
    const validSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id String @id @default(cuid())
}
`
    
    it('should execute pipeline and return GeneratorResult', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express',
        output: '/tmp/output'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      const result = await adapter.run()
      
      expect(result).toBeDefined()
      expect(result.models).toBeDefined()
      expect(result.files).toBeGreaterThan(0)
      expect(result.relationships).toBeDefined()
      expect(result.breakdown).toBeDefined()
    })
    
    it('should call logger.startGeneration', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      await adapter.run()
      
      expect(logger.startGeneration).toHaveBeenCalled()
    })
    
    it('should call logger.completeGeneration with file count', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      await adapter.run()
      
      expect(logger.completeGeneration).toHaveBeenCalledWith(
        expect.any(Number)
      )
    })
  })
  
  describe('Config conversion', () => {
    const validSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
model User { id String @id @default(cuid()) }
`
    
    it('should convert GeneratorConfig to CodeGeneratorConfig', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'fastify',
        projectName: 'Test Project',
        features: {
          generateOpenAPI: true
        }
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      await adapter.run()
      
      // Should have created CodeGenerationPipeline with converted config
      const { CodeGenerationPipeline } = await import('../code-generation-pipeline.js')
      expect(CodeGenerationPipeline).toHaveBeenCalledWith(
        expect.anything(),  // schema
        expect.objectContaining({
          framework: 'fastify',
          projectName: 'Test Project',
          useEnhancedGenerators: true,
          usePipeline: true
        }),
        expect.anything()  // hookRegistry
      )
    })
    
    it('should use express as default framework', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      await adapter.run()
      
      const { CodeGenerationPipeline } = await import('../code-generation-pipeline.js')
      expect(CodeGenerationPipeline).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          framework: 'express'
        }),
        expect.anything()
      )
    })
  })
  
  describe('Schema parsing', () => {
    const validSchema = `datasource db { provider = "postgresql" url = env("DATABASE_URL") }
model User { id String @id @default(cuid()) }`
    
    it('should parse schemaText', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      await adapter.run()
      
      const { getDMMF } = await import('@prisma/internals')
      expect(getDMMF).toHaveBeenCalledWith({
        datamodel: validSchema
      })
    })
    
    it('should throw if neither schemaText nor schemaPath provided', async () => {
      const config: GeneratorConfig = {
        framework: 'express'
      } as any
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      
      await expect(adapter.run()).rejects.toThrow('Must provide either')
    })
  })
  
  describe('Result conversion', () => {
    const validSchema = `datasource db { provider = "postgresql" url = env("DATABASE_URL") }
model User { id String @id @default(cuid()) }`
    
    it('should extract model names from contracts', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      const result = await adapter.run()
      
      expect(result.models).toContain('User')
    })
    
    it('should count all generated files', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      const result = await adapter.run()
      
      // Should count DTOs (2) + validators (1) + service (1) + controller (1) + routes (1) + sdk (1) + hooks (1)
      expect(result.files).toBeGreaterThan(0)
    })
    
    it('should provide breakdown by layer', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      const result = await adapter.run()
      
      expect(result.breakdown).toBeDefined()
      expect(Array.isArray(result.breakdown)).toBe(true)
      expect(result.breakdown.length).toBeGreaterThan(0)
      
      // Should have contracts layer
      const contractsLayer = result.breakdown.find(b => b.layer === 'contracts')
      expect(contractsLayer).toBeDefined()
    })
    
    it('should include outputDir when configured', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express',
        output: '/output/path'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      const result = await adapter.run()
      
      expect(result.outputDir).toBe('/output/path')
    })
  })
  
  describe('Hook registry', () => {
    const validSchema = `datasource db { provider = "postgresql" url = env("DATABASE_URL") }
model User { id String @id @default(cuid()) }`
    
    it('should provide access to hook registry', () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      const hooks = adapter.getHookRegistry()
      
      expect(hooks).toBeInstanceOf(PhaseHookRegistry)
    })
    
    it('should use provided hook registry', () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const customHooks = new PhaseHookRegistry()
      const adapter = new UnifiedPipelineAdapter(config, logger, customHooks)
      
      expect(adapter.getHookRegistry()).toBe(customHooks)
    })
  })
  
  describe('getPipeline()', () => {
    const validSchema = `datasource db { provider = "postgresql" url = env("DATABASE_URL") }
model User { id String @id @default(cuid()) }`
    
    it('should return undefined before run', () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      
      expect(adapter.getPipeline()).toBeUndefined()
    })
    
    it('should return pipeline after run', async () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      await adapter.run()
      
      expect(adapter.getPipeline()).toBeDefined()
    })
  })
  
  describe('createUnifiedPipeline convenience function', () => {
    const validSchema = `datasource db { provider = "postgresql" url = env("DATABASE_URL") }
model User { id String @id @default(cuid()) }`
    
    it('should create adapter instance', () => {
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = createUnifiedPipeline(config, logger)
      
      expect(adapter).toBeInstanceOf(UnifiedPipelineAdapter)
    })
    
    it('should accept optional hook registry', () => {
      const config: GeneratorConfig = {
        schemaText: 'model User { id String @id }',
        framework: 'express'
      }
      
      const hooks = new PhaseHookRegistry()
      const adapter = createUnifiedPipeline(config, logger, hooks)
      
      expect(adapter.getHookRegistry()).toBe(hooks)
    })
  })
  
  describe('Error handling', () => {
    const validSchema = `datasource db { provider = "postgresql" url = env("DATABASE_URL") }
model User { id String @id @default(cuid()) }`
    
    it('should propagate errors from pipeline', async () => {
      // Mock pipeline to throw
      const { CodeGenerationPipeline } = await import('../code-generation-pipeline.js')
      vi.mocked(CodeGenerationPipeline).mockImplementation(() => ({
        execute: vi.fn(async () => {
          throw new Error('Pipeline failed')
        })
      }) as any)
      
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      
      await expect(adapter.run()).rejects.toThrow()
    })
    
    it('should call logger.error on failure', async () => {
      const { CodeGenerationPipeline } = await import('../code-generation-pipeline.js')
      vi.mocked(CodeGenerationPipeline).mockImplementation(() => ({
        execute: vi.fn(async () => {
          throw new Error('Test error')
        })
      }) as any)
      
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express'
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      
      try {
        await adapter.run()
      } catch (error) {
        // Expected
      }
      
      expect(logger.error).toHaveBeenCalled()
    })
  })
  
  describe('Standalone project handling', () => {
    const validSchema = `datasource db { provider = "postgresql" url = env("DATABASE_URL") }
model User { id String @id @default(cuid()) }`
    
    it('should not log next steps when standalone=false', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      const config: GeneratorConfig = {
        schemaText: validSchema,
        framework: 'express',
        standalone: false
      }
      
      const adapter = new UnifiedPipelineAdapter(config, logger)
      await adapter.run()
      
      // Should not log standalone instructions
      const nextStepsLogs = consoleSpy.mock.calls.filter(call =>
        call[0]?.includes('Next steps')
      )
      expect(nextStepsLogs).toHaveLength(0)
      
      consoleSpy.mockRestore()
    })
  })
})

