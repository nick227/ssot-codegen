/**
 * Shared Plugin Testing Utilities
 * 
 * Provides reusable test helpers for all plugins:
 * - Mock plugin context generation
 * - Environment variable mocking
 * - Generated code validation
 * - API mock servers
 */

import type { PluginContext, FeaturePlugin, PluginOutput, ValidationResult } from '../plugin.interface.js'
import type { ParsedSchema } from '../../dmmf-parser.js'

/**
 * Create a mock plugin context for testing
 */
export function createMockPluginContext(overrides?: Partial<PluginContext>): PluginContext {
  const defaultSchema: ParsedSchema = {
    models: [],
    enums: [],
    datasources: [],
    generators: []
  }

  return {
    schema: defaultSchema,
    projectName: 'test-project',
    framework: 'express',
    outputDir: '/tmp/test-output',
    config: {},
    ...overrides
  }
}

/**
 * Create a mock schema with specific models
 */
export function createMockSchema(models: Array<{ name: string; fields?: any[] }>): ParsedSchema {
  return {
    models: models.map(m => ({
      name: m.name,
      dbName: m.name.toLowerCase(),
      scalarFields: m.fields || [],
      relationFields: [],
      uniqueFields: [],
      primaryKey: null,
      documentation: undefined
    })),
    enums: [],
    datasources: [{
      name: 'db',
      provider: 'postgresql',
      url: { value: 'postgresql://localhost:5432/test' }
    }],
    generators: []
  }
}

/**
 * Mock environment variables for testing
 */
export class EnvMocker {
  private original: Record<string, string | undefined> = {}
  
  /**
   * Set environment variables and save originals
   */
  set(vars: Record<string, string>): void {
    for (const [key, value] of Object.entries(vars)) {
      this.original[key] = process.env[key]
      process.env[key] = value
    }
  }
  
  /**
   * Clear specific environment variables
   */
  clear(keys: string[]): void {
    for (const key of keys) {
      this.original[key] = process.env[key]
      delete process.env[key]
    }
  }
  
  /**
   * Restore original environment variables
   */
  restore(): void {
    for (const [key, value] of Object.entries(this.original)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
    this.original = {}
  }
}

/**
 * Test suite for plugin validation
 */
export function testPluginValidation(plugin: FeaturePlugin) {
  return {
    /**
     * Test that plugin validates successfully with all requirements met
     */
    testValidWithRequirements: (context: PluginContext): ValidationResult => {
      return plugin.validate(context)
    },
    
    /**
     * Test validation fails when required models are missing
     */
    testMissingRequiredModels: (context: PluginContext): ValidationResult => {
      const emptyContext = createMockPluginContext({
        ...context,
        schema: createMockSchema([]) // No models
      })
      return plugin.validate(emptyContext)
    },
    
    /**
     * Test validation with partial requirements
     */
    testPartialRequirements: (context: PluginContext, missingModels: string[]): ValidationResult => {
      const existingModels = context.schema.models.filter(
        m => !missingModels.includes(m.name)
      )
      const partialContext = createMockPluginContext({
        ...context,
        schema: { ...context.schema, models: existingModels }
      })
      return plugin.validate(partialContext)
    }
  }
}

/**
 * Test suite for plugin code generation
 */
export function testPluginGeneration(plugin: FeaturePlugin) {
  return {
    /**
     * Test that plugin generates expected files
     */
    testGeneratesFiles: (context: PluginContext): { output: PluginOutput; fileCount: number } => {
      const output = plugin.generate(context)
      return {
        output,
        fileCount: output.files.size
      }
    },
    
    /**
     * Test generated file contains specific content
     */
    testFileContains: (output: PluginOutput, filename: string, expectedContent: string | RegExp): boolean => {
      const content = output.files.get(filename)
      if (!content) return false
      
      if (typeof expectedContent === 'string') {
        return content.includes(expectedContent)
      }
      return expectedContent.test(content)
    },
    
    /**
     * Test that generated files are valid TypeScript
     */
    testValidTypeScript: (output: PluginOutput): { valid: boolean; errors: string[] } => {
      const errors: string[] = []
      
      for (const [filename, content] of output.files) {
        if (!filename.endsWith('.ts')) continue
        
        // Basic syntax checks
        if (!content.includes('export')) {
          errors.push(`${filename}: Missing exports`)
        }
        
        // Check for common syntax errors
        const openBraces = (content.match(/{/g) || []).length
        const closeBraces = (content.match(/}/g) || []).length
        if (openBraces !== closeBraces) {
          errors.push(`${filename}: Mismatched braces`)
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      }
    },
    
    /**
     * Test that plugin exports environment variables
     */
    testExportsEnvVars: (output: PluginOutput, requiredKeys: string[]): { valid: boolean; missing: string[] } => {
      const missing = requiredKeys.filter(key => !(key in output.envVars))
      return {
        valid: missing.length === 0,
        missing
      }
    },
    
    /**
     * Test that plugin exports dependencies
     */
    testExportsDependencies: (output: PluginOutput, requiredDeps: string[]): { valid: boolean; missing: string[] } => {
      const deps = output.packageJson?.dependencies || {}
      const missing = requiredDeps.filter(dep => !(dep in deps))
      return {
        valid: missing.length === 0,
        missing
      }
    }
  }
}

/**
 * Mock API responses for testing without real API calls
 */
export class MockAPIServer {
  private responses: Map<string, any> = new Map()
  private calls: Array<{ endpoint: string; method: string; body?: any }> = []
  
  /**
   * Register a mock response
   */
  mock(endpoint: string, response: any): void {
    this.responses.set(endpoint, response)
  }
  
  /**
   * Simulate an API call
   */
  call(endpoint: string, method: string = 'GET', body?: any): any {
    this.calls.push({ endpoint, method, body })
    
    const response = this.responses.get(endpoint)
    if (!response) {
      throw new Error(`No mock response registered for ${method} ${endpoint}`)
    }
    
    return typeof response === 'function' ? response(body) : response
  }
  
  /**
   * Get all recorded calls
   */
  getCalls(): Array<{ endpoint: string; method: string; body?: any }> {
    return [...this.calls]
  }
  
  /**
   * Reset all mocks
   */
  reset(): void {
    this.responses.clear()
    this.calls = []
  }
}

/**
 * Test environment variable validation
 */
export function testEnvVarValidation(plugin: FeaturePlugin) {
  return {
    /**
     * Test that plugin identifies missing required env vars
     */
    testMissingRequiredEnvVars: (envMocker: EnvMocker): { missing: string[] } => {
      const required = plugin.requirements.envVars.required
      
      // Clear all required env vars
      envMocker.clear(required)
      
      return { missing: required }
    },
    
    /**
     * Test that plugin handles undefined env vars gracefully
     */
    testUndefinedEnvVars: (context: PluginContext, envMocker: EnvMocker): ValidationResult => {
      // Clear required env vars
      envMocker.clear(plugin.requirements.envVars.required)
      
      // Validation should still work (generation may fail, but validation should pass)
      return plugin.validate(context)
    },
    
    /**
     * Test that plugin works with all env vars set
     */
    testWithAllEnvVars: (
      context: PluginContext, 
      envMocker: EnvMocker, 
      envValues: Record<string, string>
    ): ValidationResult => {
      envMocker.set(envValues)
      return plugin.validate(context)
    }
  }
}

/**
 * Snapshot testing helper
 */
export function snapshotPluginOutput(output: PluginOutput): {
  fileNames: string[]
  fileSizes: Record<string, number>
  envVarKeys: string[]
  dependencyKeys: string[]
  routeCount: number
  middlewareCount: number
} {
  return {
    fileNames: Array.from(output.files.keys()).sort(),
    fileSizes: Object.fromEntries(
      Array.from(output.files.entries()).map(([name, content]) => [name, content.length])
    ),
    envVarKeys: Object.keys(output.envVars).sort(),
    dependencyKeys: Object.keys(output.packageJson?.dependencies || {}).sort(),
    routeCount: output.routes.length,
    middlewareCount: output.middleware.length
  }
}

/**
 * Test that generated code doesn't have common issues
 */
export function validateGeneratedCode(output: PluginOutput): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  
  for (const [filename, content] of output.files) {
    // Check for TODO/FIXME comments
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push(`${filename}: Contains TODO/FIXME comments`)
    }
    
    // Check for console.log (should use proper logger)
    if (content.includes('console.log')) {
      issues.push(`${filename}: Contains console.log (use logger instead)`)
    }
    
    // Check for hardcoded credentials
    const credentialPatterns = [
      /sk-[a-zA-Z0-9]{20,}/,  // API keys
      /AIza[a-zA-Z0-9_-]{35}/,  // Google API keys
      /password\s*=\s*['"][^'"]+['"]/i,  // Hardcoded passwords
    ]
    
    for (const pattern of credentialPatterns) {
      if (pattern.test(content)) {
        issues.push(`${filename}: Contains hardcoded credentials`)
        break
      }
    }
    
    // Check for missing error handling in async functions
    if (content.includes('async') && !content.includes('try') && !content.includes('catch')) {
      issues.push(`${filename}: Async function without try-catch`)
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Performance testing helper
 */
export function measureGenerationPerformance(plugin: FeaturePlugin, context: PluginContext): {
  validationTime: number
  generationTime: number
  totalTime: number
  fileCount: number
} {
  const start = performance.now()
  
  const validationStart = performance.now()
  plugin.validate(context)
  const validationTime = performance.now() - validationStart
  
  const generationStart = performance.now()
  const output = plugin.generate(context)
  const generationTime = performance.now() - generationStart
  
  const totalTime = performance.now() - start
  
  return {
    validationTime,
    generationTime,
    totalTime,
    fileCount: output.files.size
  }
}

