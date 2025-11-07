/**
 * Typed Context System - Compile-Time Safety Tests
 * 
 * These tests demonstrate that the typed context system catches errors at COMPILE TIME,
 * not runtime. Uncomment the commented-out code to see TypeScript errors.
 */

import { describe, it, expect } from 'vitest'
import type {
  BaseContext,
  ContextAfterPhase0,
  ContextAfterPhase1,
  SetupOutputDirOutput,
  ParseSchemaOutput
} from '../typed-context.js'
import type { GeneratorConfig } from '../types.js'
import type { CLILogger } from '@/utils/cli-logger.js'

describe('Typed Context System', () => {
  describe('BaseContext', () => {
    it('requires config and logger', () => {
      const mockLogger = {
        logProgress: () => {},
        debug: () => {}
      } as unknown as CLILogger
      
      const mockConfig: GeneratorConfig = {
        schemaPath: './schema.prisma'
      }
      
      // ✅ VALID: Has required fields
      const validContext: BaseContext = {
        config: mockConfig,
        logger: mockLogger
      }
      
      expect(validContext).toBeDefined()
      
      // ❌ COMPILE ERROR: Missing logger
      // Uncomment to see TypeScript error:
      // const invalidContext1: BaseContext = {
      //   config: mockConfig
      // }
      
      // ❌ COMPILE ERROR: Missing config
      // Uncomment to see TypeScript error:
      // const invalidContext2: BaseContext = {
      //   logger: mockLogger
      // }
    })
  })
  
  describe('ContextAfterPhase0', () => {
    it('requires BaseContext + outputDir', () => {
      const mockLogger = {} as CLILogger
      const mockConfig = {} as GeneratorConfig
      
      // ✅ VALID: Has all required fields
      const validContext: ContextAfterPhase0 = {
        config: mockConfig,
        logger: mockLogger,
        outputDir: '/output/path'
      }
      
      expect(validContext.outputDir).toBe('/output/path')
      
      // ❌ COMPILE ERROR: Missing outputDir
      // Uncomment to see TypeScript error:
      // const invalidContext: ContextAfterPhase0 = {
      //   config: mockConfig,
      //   logger: mockLogger
      // }
    })
    
    it('cannot access fields from later phases', () => {
      const context: ContextAfterPhase0 = {
        config: {} as GeneratorConfig,
        logger: {} as CLILogger,
        outputDir: '/path'
      }
      
      // ✅ VALID: Can access Phase 0 fields
      expect(context.outputDir).toBeDefined()
      
      // ❌ COMPILE ERROR: schema not available yet (comes from Phase 1)
      // Uncomment to see TypeScript error:
      // const schema = context.schema
      
      // ❌ COMPILE ERROR: generatedFiles not available yet (comes from Phase 4)
      // Uncomment to see TypeScript error:
      // const files = context.generatedFiles
    })
  })
  
  describe('ContextAfterPhase1', () => {
    it('requires Phase 0 + schema data', () => {
      // ✅ VALID: Has all required fields through Phase 1
      const validContext: ContextAfterPhase1 = {
        config: {} as GeneratorConfig,
        logger: {} as CLILogger,
        outputDir: '/path',
        schema: { models: [], enums: [] } as any,
        schemaContent: 'model User { }',
        modelNames: ['User']
      }
      
      expect(validContext.schema).toBeDefined()
      expect(validContext.modelNames).toEqual(['User'])
      
      // ❌ COMPILE ERROR: Missing schema
      // Uncomment to see TypeScript error:
      // const invalid: ContextAfterPhase1 = {
      //   config: {} as GeneratorConfig,
      //   logger: {} as CLILogger,
      //   outputDir: '/path',
      //   schemaContent: 'content',
      //   modelNames: []
      // }
    })
    
    it('can access all previous phase outputs', () => {
      const context: ContextAfterPhase1 = {
        config: {} as GeneratorConfig,
        logger: {} as CLILogger,
        outputDir: '/path',
        schema: {} as any,
        schemaContent: 'content',
        modelNames: ['User']
      }
      
      // ✅ Can access Phase 0 output
      expect(context.outputDir).toBe('/path')
      
      // ✅ Can access Phase 1 output
      expect(context.schema).toBeDefined()
      expect(context.schemaContent).toBe('content')
      expect(context.modelNames).toEqual(['User'])
      
      // ❌ COMPILE ERROR: Cannot access Phase 4 output yet
      // Uncomment to see TypeScript error:
      // const files = context.generatedFiles
    })
  })
  
  describe('Phase Output Types', () => {
    it('SetupOutputDirOutput has exact shape', () => {
      // ✅ VALID: Exact shape
      const validOutput: SetupOutputDirOutput = {
        outputDir: '/path'
      }
      
      expect(validOutput.outputDir).toBe('/path')
      
      // ❌ COMPILE ERROR: Extra property
      // Uncomment to see TypeScript error:
      // const invalid1: SetupOutputDirOutput = {
      //   outputDir: '/path',
      //   extraField: 'oops'
      // }
      
      // ❌ COMPILE ERROR: Wrong type
      // Uncomment to see TypeScript error:
      // const invalid2: SetupOutputDirOutput = {
      //   outputDir: 123
      // }
    })
    
    it('ParseSchemaOutput has exact shape', () => {
      // ✅ VALID: Exact shape
      const validOutput: ParseSchemaOutput = {
        schema: {} as any,
        schemaContent: 'content',
        modelNames: ['User']
      }
      
      expect(validOutput.modelNames).toEqual(['User'])
      
      // ❌ COMPILE ERROR: Missing field
      // Uncomment to see TypeScript error:
      // const invalid: ParseSchemaOutput = {
      //   schema: {} as any,
      //   schemaContent: 'content'
      // }
    })
  })
  
  describe('Type Evolution', () => {
    it('demonstrates context type evolution', () => {
      // Phase 0: Only config + logger
      const after0: ContextAfterPhase0 = {
        config: {} as GeneratorConfig,
        logger: {} as CLILogger,
        outputDir: '/path'
      }
      
      // ✅ Can access Phase 0 output
      expect(after0.outputDir).toBe('/path')
      
      // Phase 1: Previous + schema data
      const after1: ContextAfterPhase1 = {
        ...after0,
        schema: {} as any,
        schemaContent: 'content',
        modelNames: ['User']
      }
      
      // ✅ Can access Phase 0 output
      expect(after1.outputDir).toBe('/path')
      
      // ✅ Can access Phase 1 output
      expect(after1.schema).toBeDefined()
      expect(after1.modelNames).toEqual(['User'])
      
      // This demonstrates type-safe evolution!
    })
  })
})

describe('Compile-Time Safety Examples', () => {
  it('prevents accessing undefined data', () => {
    const context0: ContextAfterPhase0 = {
      config: {} as GeneratorConfig,
      logger: {} as CLILogger,
      outputDir: '/path'
    }
    
    // ✅ TypeScript ALLOWS accessing outputDir (it exists)
    const dir = context0.outputDir
    expect(dir).toBe('/path')
    
    // ❌ TypeScript PREVENTS accessing schema (doesn't exist yet)
    // This would be a compile error:
    // const schema = context0.schema
    //                          ^^^^^^ Property 'schema' does not exist
    
    // In the old system, this would be a RUNTIME error:
    // const oldContext: PhaseContext = { config, logger, outputDir: '/path' }
    // const schema = oldContext.schema  // undefined! Runtime bug!
  })
  
  it('enforces phase dependencies', () => {
    // ✅ Phase 1 CAN use ContextAfterPhase0 (has all requirements)
    function phase1(context: ContextAfterPhase0) {
      return context.outputDir  // TypeScript knows this exists
    }
    
    const validContext: ContextAfterPhase0 = {
      config: {} as GeneratorConfig,
      logger: {} as CLILogger,
      outputDir: '/path'
    }
    
    expect(phase1(validContext)).toBe('/path')
    
    // ❌ Phase 1 CANNOT use BaseContext (missing outputDir)
    // This would be a compile error:
    // const baseContext: BaseContext = { config: {}, logger: {} }
    // phase1(baseContext)
    //        ^^^^^^^^^^^ Type 'BaseContext' is not assignable to 'ContextAfterPhase0'
    //                    Property 'outputDir' is missing
  })
})

