/**
 * Phase 14: Validate TypeScript Compilation
 * 
 * Validates that generated code compiles without TypeScript errors.
 * This catches breaking issues early in the generation pipeline.
 * 
 * Runs after all files are written but before generation completes.
 */

import { execSync } from 'node:child_process'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'

export class ValidateTypeScriptPhase extends GenerationPhase {
  readonly name = 'validateTypeScript'
  readonly order = 14  // After all files are written
  
  shouldRun(context: PhaseContext): boolean {
    // Only run for standalone projects (they have tsconfig.json)
    return context.config.standalone ?? true
  }
  
  getDescription(): string {
    return 'Validating TypeScript compilation'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { outputDir } = context
    
    if (!outputDir) {
      throw new Error('Output directory not found')
    }
    
    const tsconfigPath = path.join(outputDir, 'tsconfig.json')
    const packageJsonPath = path.join(outputDir, 'package.json')
    const nodeModulesPath = path.join(outputDir, 'node_modules')
    
    // Check if tsconfig.json exists
    if (!existsSync(tsconfigPath)) {
      throw new Error(`tsconfig.json not found at ${tsconfigPath}`)
    }
    
    // Check if package.json exists (needed for dependencies)
    if (!existsSync(packageJsonPath)) {
      throw new Error(`package.json not found at ${packageJsonPath}`)
    }
    
    // Check if node_modules exists - if not, dependencies haven't been installed yet
    // In this case, we can't validate TypeScript compilation
    if (!existsSync(nodeModulesPath)) {
      context.logger?.warn('Skipping TypeScript validation: node_modules not found. Dependencies must be installed first.')
      return {
        success: true,
        filesGenerated: 0,
        data: { message: 'TypeScript validation skipped (dependencies not installed)' }
      }
    }
    
    try {
      // Run TypeScript compiler in noEmit mode (type-check only, no output)
      // This catches type errors without generating files
      execSync('npx tsc --noEmit', {
        cwd: outputDir,
        stdio: 'pipe',
        encoding: 'utf-8',
        env: {
          ...process.env,
          // Disable color output for cleaner error messages
          FORCE_COLOR: '0'
        }
      })
      
      return {
        success: true,
        filesGenerated: 0,
        data: { message: 'TypeScript compilation successful' }
      }
    } catch (error: any) {
      // Extract TypeScript errors from stderr
      const errorOutput = error.stderr?.toString() || error.stdout?.toString() || error.message || 'Unknown TypeScript error'
      
      // Parse error count if available
      const errorMatch = errorOutput.match(/(\d+) error\(s\)/i)
      const errorCount = errorMatch ? parseInt(errorMatch[1], 10) : 0
      
      // Throw error with detailed message - the phase runner will catch and format it
      const errorMessage = `TypeScript compilation failed with ${errorCount || 'unknown number of'} error(s). This indicates generated code has type errors that must be fixed.\n\n${errorOutput.slice(0, 2000)}`
      throw new Error(errorMessage)
    }
  }
}

