/**
 * Annotation Parser
 * Extracts and parses @@annotations from Prisma model documentation
 */

import type { ModelAnnotation, ServiceAnnotation, AuthAnnotation, PolicyAnnotation, RealtimeAnnotation, SearchAnnotation } from './types.js'

/**
 * Parse annotations from model documentation
 * 
 * Prisma doesn't expose annotations directly, so we parse them from documentation.
 * Format: `@@annotationName(arg1, arg2, key: value)`
 */
export function parseAnnotations(documentation: string | undefined): ModelAnnotation[] {
  if (!documentation) return []
  
  const annotations: ModelAnnotation[] = []
  const lines = documentation.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Match @@annotation(...) pattern
    const match = trimmed.match(/^@@(\w+)\((.*)\)$/)
    if (!match) continue
    
    const [, annotationType, argsString] = match
    
    try {
      const annotation = parseAnnotationType(annotationType, argsString)
      if (annotation) {
        annotations.push(annotation)
      }
    } catch (error) {
      console.warn(`[SSOT] Failed to parse annotation: ${trimmed}`, error)
    }
  }
  
  return annotations
}

/**
 * Parse specific annotation type
 */
function parseAnnotationType(type: string, argsString: string): ModelAnnotation | null {
  const args = parseArgs(argsString)
  
  switch (type) {
    case 'service':
      return parseServiceAnnotation(args)
    case 'auth':
      return parseAuthAnnotation(args)
    case 'policy':
      return parsePolicyAnnotation(args)
    case 'realtime':
      return parseRealtimeAnnotation(args)
    case 'search':
      return parseSearchAnnotation(args)
    default:
      console.warn(`[SSOT] Unknown annotation type: ${type}`)
      return null
  }
}

/**
 * Parse service annotation
 */
function parseServiceAnnotation(args: Record<string, unknown>): ServiceAnnotation {
  const provider = args._positional?.[0] as string
  if (!provider) {
    throw new Error('@@service requires provider name as first argument')
  }
  
  const { _positional, ...config } = args
  
  return {
    type: 'service',
    provider,
    config: Object.keys(config).length > 0 ? config : undefined
  }
}

/**
 * Parse auth annotation
 */
function parseAuthAnnotation(args: Record<string, unknown>): AuthAnnotation {
  const strategy = args._positional?.[0] as string
  if (!strategy) {
    throw new Error('@@auth requires strategy name as first argument')
  }
  
  const { _positional, ...config } = args
  
  return {
    type: 'auth',
    strategy,
    config: Object.keys(config).length > 0 ? config : undefined
  }
}

/**
 * Parse policy annotation
 */
function parsePolicyAnnotation(args: Record<string, unknown>): PolicyAnnotation {
  const operation = args._positional?.[0] as string
  if (!operation || !['read', 'write', 'delete', '*'].includes(operation)) {
    throw new Error('@@policy requires operation (read/write/delete/*) as first argument')
  }
  
  const rule = args.rule as string
  if (!rule) {
    throw new Error('@@policy requires rule parameter')
  }
  
  const fields = args.fields as string[] | undefined
  
  return {
    type: 'policy',
    operation: operation as 'read' | 'write' | 'delete' | '*',
    rule,
    fields
  }
}

/**
 * Parse realtime annotation
 */
function parseRealtimeAnnotation(args: Record<string, unknown>): RealtimeAnnotation {
  const subscribe = args.subscribe as string[] | undefined
  const broadcast = args.broadcast as string[] | undefined
  const permissions = args.permissions as Record<string, string> | undefined
  
  if (!subscribe && !broadcast) {
    throw new Error('@@realtime requires at least subscribe or broadcast parameter')
  }
  
  return {
    type: 'realtime',
    subscribe: subscribe as Array<'list' | 'item'> | undefined,
    broadcast: broadcast as Array<'created' | 'updated' | 'deleted'> | undefined,
    permissions
  }
}

/**
 * Parse search annotation
 */
function parseSearchAnnotation(args: Record<string, unknown>): SearchAnnotation {
  const fields = args.fields as string[]
  if (!fields || !Array.isArray(fields)) {
    throw new Error('@@search requires fields parameter as array')
  }
  
  const weights = args.weights as number[] | undefined
  const engine = args.engine as 'native' | 'elasticsearch' | 'typesense' | undefined
  
  return {
    type: 'search',
    fields,
    weights,
    engine
  }
}

/**
 * Parse annotation arguments
 * 
 * Format: `"value1", "value2", key: "value", array: ["a", "b"]`
 * 
 * Returns: `{ _positional: ["value1", "value2"], key: "value", array: ["a", "b"] }`
 */
function parseArgs(argsString: string): Record<string, unknown> {
  const result: Record<string, unknown> = { _positional: [] }
  
  // Remove outer whitespace
  const trimmed = argsString.trim()
  if (!trimmed) return result
  
  // Simple parser (handles strings, arrays, objects)
  // This is a simplified version - production would use a proper parser
  
  const tokens = tokenizeArgs(trimmed)
  const positional: unknown[] = []
  
  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]
    
    // Check if next token is ':'
    if (i + 1 < tokens.length && tokens[i + 1] === ':') {
      // Named argument
      const key = token
      const value = tokens[i + 2]
      result[key] = parseValue(value)
      i += 3
      
      // Skip comma
      if (i < tokens.length && tokens[i] === ',') i++
    } else {
      // Positional argument
      positional.push(parseValue(token))
      i++
      
      // Skip comma
      if (i < tokens.length && tokens[i] === ',') i++
    }
  }
  
  if (positional.length > 0) {
    result._positional = positional
  }
  
  return result
}

/**
 * Tokenize annotation arguments
 */
function tokenizeArgs(str: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inString = false
  let inArray = false
  let inObject = false
  let depth = 0
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    
    if (char === '"' && str[i - 1] !== '\\') {
      inString = !inString
      current += char
    } else if (!inString) {
      if (char === '[') {
        inArray = true
        depth++
        current += char
      } else if (char === ']') {
        depth--
        if (depth === 0) inArray = false
        current += char
      } else if (char === '{') {
        inObject = true
        depth++
        current += char
      } else if (char === '}') {
        depth--
        if (depth === 0) inObject = false
        current += char
      } else if ((char === ',' || char === ':') && !inArray && !inObject) {
        if (current.trim()) {
          tokens.push(current.trim())
          current = ''
        }
        if (char === ':') {
          tokens.push(':')
        }
      } else {
        current += char
      }
    } else {
      current += char
    }
  }
  
  if (current.trim()) {
    tokens.push(current.trim())
  }
  
  return tokens
}

/**
 * Parse value (string, number, boolean, array)
 */
function parseValue(value: string): unknown {
  const trimmed = value.trim()
  
  // String
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1)
  }
  
  // Array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1)
    return inner.split(',').map(v => parseValue(v.trim()))
  }
  
  // Boolean
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  
  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }
  
  // Default: string without quotes
  return trimmed
}

