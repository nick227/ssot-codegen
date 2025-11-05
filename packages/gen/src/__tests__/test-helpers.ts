/**
 * Core Test Helpers
 * Utilities for testing generator functionality
 */

import type { GeneratedFile } from '../types.js'

/**
 * Assert that content includes all expected strings
 */
export function assertIncludes(content: string, expected: string[]): void {
  const missing = expected.filter(exp => !content.includes(exp))
  if (missing.length > 0) {
    throw new Error(`Content missing: ${missing.join(', ')}`)
  }
}

/**
 * Assert that content excludes all forbidden strings
 */
export function assertExcludes(content: string, forbidden: string[]): void {
  const found = forbidden.filter(exp => content.includes(exp))
  if (found.length > 0) {
    throw new Error(`Content contains forbidden: ${found.join(', ')}`)
  }
}

/**
 * Assert generated file structure
 */
export function assertGeneratedFile(file: GeneratedFile): void {
  if (!file.filename) {
    throw new Error('Generated file must have filename')
  }
  if (!file.content) {
    throw new Error('Generated file must have content')
  }
  if (!file.layer) {
    throw new Error('Generated file must have layer')
  }
  if (!file.modelName) {
    throw new Error('Generated file must have modelName')
  }
}

/**
 * Assert valid TypeScript syntax (basic checks)
 */
export function assertValidTypeScript(content: string): void {
  // Check for balanced braces
  const openBraces = (content.match(/{/g) || []).length
  const closeBraces = (content.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    throw new Error(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`)
  }

  // Check for balanced parentheses
  const openParens = (content.match(/\(/g) || []).length
  const closeParens = (content.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    throw new Error(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`)
  }

  // Check for common syntax errors
  if (content.includes('import {') && !content.includes("} from '")) {
    throw new Error('Malformed import statement')
  }
}

/**
 * Extract imports from generated code
 */
export function extractImports(content: string): string[] {
  const importRegex = /import\s+(?:type\s+)?.*?from\s+['"](.+?)['"]/g
  const imports: string[] = []
  let match: RegExpExecArray | null

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1])
  }

  return imports
}

/**
 * Extract exports from generated code
 */
export function extractExports(content: string): string[] {
  const exportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g
  const exports: string[] = []
  let match: RegExpExecArray | null

  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1])
  }

  return exports
}

/**
 * Count lines of code (excluding comments and blank lines)
 */
export function countLOC(content: string): number {
  return content
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      return trimmed.length > 0 && !trimmed.startsWith('//')
    })
    .length
}

/**
 * Assert code complexity is reasonable
 */
export function assertReasonableComplexity(content: string, maxLOC = 300): void {
  const loc = countLOC(content)
  if (loc > maxLOC) {
    throw new Error(`File too complex: ${loc} LOC (max: ${maxLOC})`)
  }
}

/**
 * Mock console methods for testing
 */
export function mockConsole() {
  const logs: string[] = []
  const errors: string[] = []
  const warns: string[] = []

  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  console.log = (...args: unknown[]) => logs.push(args.join(' '))
  console.error = (...args: unknown[]) => errors.push(args.join(' '))
  console.warn = (...args: unknown[]) => warns.push(args.join(' '))

  return {
    logs,
    errors,
    warns,
    restore: () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }
}

