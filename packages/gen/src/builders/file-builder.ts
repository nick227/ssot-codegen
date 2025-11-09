/**
 * Immutable file builder with upfront validation
 * Prevents invalid code from being added to generation output
 */

import { ErrorSeverity, type IGenerationContext, type IFileBuilder } from '../pipeline/generation-types.js'

/**
 * Validates generated TypeScript code for common syntax errors
 */
export function validateGeneratedCode(
  code: string,
  filename: string,
  context: IGenerationContext
): boolean {
  if (!code || code.trim().length === 0) {
    context.addError({
      severity: ErrorSeverity.VALIDATION,
      message: `Generated code is empty for file: ${filename}`,
      phase: 'code-validation',
      blocksGeneration: true
    })
    return false
  }
  
  // Check for unmatched braces
  const openBraces = (code.match(/{/g) || []).length
  const closeBraces = (code.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    context.addError({
      severity: ErrorSeverity.VALIDATION,
      message: `Unmatched braces in ${filename}: ${openBraces} open, ${closeBraces} close`,
      phase: 'code-validation',
      blocksGeneration: true
    })
    return false
  }
  
  // Check for unmatched parentheses
  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    context.addError({
      severity: ErrorSeverity.VALIDATION,
      message: `Unmatched parentheses in ${filename}: ${openParens} open, ${closeParens} close`,
      phase: 'code-validation',
      blocksGeneration: true
    })
    return false
  }
  
  // Check for unmatched brackets
  const openBrackets = (code.match(/\[/g) || []).length
  const closeBrackets = (code.match(/]/g) || []).length
  if (openBrackets !== closeBrackets) {
    context.addError({
      severity: ErrorSeverity.VALIDATION,
      message: `Unmatched brackets in ${filename}: ${openBrackets} open, ${closeBrackets} close`,
      phase: 'code-validation',
      blocksGeneration: true
    })
    return false
  }
  
  return true
}

/**
 * Builder for a collection of files
 * 
 * Features:
 * - Upfront code validation (before adding)
 * - Path deduplication
 * - Immutable output
 * - Clear/restore support for rollback
 */
export class FileBuilder implements IFileBuilder {
  private readonly files = new Map<string, string>()
  private readonly generatedPaths = new Set<string>()
  
  constructor(private readonly context: IGenerationContext) {}
  
  /**
   * Add file with validation
   * Returns true if file was added, false if validation failed or path duplicated
   */
  addFile(path: string, content: string, modelName?: string): boolean {
    // CRITICAL: Validate BEFORE adding (prevents wasted work)
    if (!validateGeneratedCode(content, path, this.context)) {
      return false
    }
    
    // Check for path duplication
    if (!this.isPathAvailable(path, modelName)) {
      return false
    }
    
    this.files.set(path, content)
    this.generatedPaths.add(path)
    return true
  }
  
  /**
   * Check if path is available (not already used)
   */
  private isPathAvailable(path: string, modelName?: string): boolean {
    if (this.generatedPaths.has(path)) {
      this.context.addError({
        severity: ErrorSeverity.WARNING,
        message: `Duplicate file path: ${path}`,
        model: modelName,
        phase: 'path-validation'
      })
      return false
    }
    return true
  }
  
  /**
   * Get file if it exists
   */
  getFile(path: string): string | undefined {
    return this.files.get(path)
  }
  
  /**
   * Check if file exists
   */
  hasFile(path: string): boolean {
    return this.files.has(path)
  }
  
  /**
   * Get all file paths
   */
  getPaths(): ReadonlySet<string> {
    return new Set(this.generatedPaths)
  }
  
  /**
   * Get file count
   */
  getFileCount(): number {
    return this.files.size
  }
  
  /**
   * Build immutable result
   */
  build(): Map<string, string> {
    return new Map(this.files)
  }
  
  /**
   * Clear all files (for rollback)
   */
  clear(): void {
    this.files.clear()
    this.generatedPaths.clear()
  }
  
  /**
   * Restore from snapshot (for rollback)
   */
  restore(snapshot: Map<string, string>): void {
    this.clear()
    for (const [path, content] of snapshot) {
      this.files.set(path, content)
      this.generatedPaths.add(path)
    }
  }
}

