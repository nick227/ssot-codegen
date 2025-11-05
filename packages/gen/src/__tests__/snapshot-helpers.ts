/**
 * Snapshot Helpers
 * Utilities for snapshot testing generated code
 */

/**
 * Normalize generated code for snapshot comparison
 * Removes timestamps, hashes, and other dynamic content
 */
export function normalizeGenerated(content: string): string {
  return content
    // Remove generated timestamps
    .replace(/Generated at: .+/g, 'Generated at: [TIMESTAMP]')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]')
    
    // Remove schema hashes
    .replace(/Schema hash: [a-f0-9]+/g, 'Schema hash: [HASH]')
    .replace(/schemaHash: ['"][a-f0-9]+['"]/g, 'schemaHash: "[HASH]"')
    
    // Remove tool version if it appears
    .replace(/Tool version: [\d.]+/g, 'Tool version: [VERSION]')
    .replace(/toolVersion: ['"][\d.]+['"]/g, 'toolVersion: "[VERSION]"')
    
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    
    // Remove trailing whitespace
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim()
}

/**
 * Extract code blocks for focused snapshot testing
 */
export function extractCodeBlock(content: string, pattern: string | RegExp): string | null {
  const regex = typeof pattern === 'string' 
    ? new RegExp(`${pattern}[\\s\\S]*?(?=\\nexport|\\nconst|\\nfunction|\\nclass|$)`)
    : pattern
  
  const match = content.match(regex)
  return match ? match[0].trim() : null
}

/**
 * Create a minimal snapshot of key elements
 */
export function minimalSnapshot(content: string): {
  imports: string[]
  exports: string[]
  types: string[]
  functions: string[]
} {
  const imports = extractImportStatements(content)
  const exports = extractExportNames(content)
  const types = extractTypeNames(content)
  const functions = extractFunctionNames(content)

  return { imports, exports, types, functions }
}

function extractImportStatements(content: string): string[] {
  const regex = /import\s+.*?from\s+['"](.+?)['"]/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1])
  }

  return matches.sort()
}

function extractExportNames(content: string): string[] {
  const regex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1])
  }

  return matches.sort()
}

function extractTypeNames(content: string): string[] {
  const regex = /(?:interface|type)\s+(\w+)/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1])
  }

  return matches.sort()
}

function extractFunctionNames(content: string): string[] {
  const regex = /(?:function|const)\s+(\w+)\s*[=:]/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1])
  }

  return matches.sort()
}

/**
 * Compare two code snippets structurally
 */
export function structurallyEqual(
  actual: string,
  expected: string,
  options: { ignoreWhitespace?: boolean; ignoreComments?: boolean } = {}
): { equal: boolean; diff?: string } {
  let a = actual
  let e = expected

  if (options.ignoreComments) {
    a = removeComments(a)
    e = removeComments(e)
  }

  if (options.ignoreWhitespace) {
    a = normalizeWhitespace(a)
    e = normalizeWhitespace(e)
  }

  const equal = a === e

  if (!equal) {
    return {
      equal: false,
      diff: `Expected:\n${e}\n\nActual:\n${a}`
    }
  }

  return { equal: true }
}

function removeComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .trim()
}

function normalizeWhitespace(content: string): string {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

