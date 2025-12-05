/**
 * Documentation sanitization for safe JSDoc generation
 */

/**
 * Sanitize documentation strings for safe code generation in JSDoc comments
 * 
 * Preserves code examples and markdown while preventing comment injection.
 * Handles triple and single backticks correctly with proper state tracking.
 * 
 * @param doc - Documentation string to sanitize
 * @returns Sanitized string safe for JSDoc, or undefined if empty
 */
export function sanitizeDocumentation(doc: string | undefined): string | undefined {
  if (!doc) return undefined
  
  // Normalize line endings first
  let sanitized = doc.replace(/\r\n/g, '\n')
  
  // Track code blocks properly (triple backticks have priority over single)
  let result = ''
  let i = 0
  let inTripleBacktick = false
  let inSingleBacktick = false
  
  while (i < sanitized.length) {
    const char = sanitized[i]
    const next = sanitized[i + 1]
    const next2 = sanitized[i + 2]
    
    // Check for triple backtick (code block) - MUST check before single backtick
    // Triple backticks override single backtick state
    if (char === '`' && next === '`' && next2 === '`') {
      inTripleBacktick = !inTripleBacktick
      // When entering/exiting triple backtick, reset single backtick state
      if (inSingleBacktick && inTripleBacktick) {
        inSingleBacktick = false
      }
      result += '```'
      i += 3
      continue
    }
    
    // Check for single backtick (inline code) - only if not in triple backtick
    if (!inTripleBacktick && char === '`') {
      inSingleBacktick = !inSingleBacktick
      result += char
      i++
      continue
    }
    
    // Escape comment-closing sequences outside of ALL code blocks
    if (!inTripleBacktick && !inSingleBacktick) {
      if (char === '*' && next === '/') {
        result += '*\\/'
        i += 2
        continue
      }
      if (char === '/' && next === '*') {
        result += '/\\*'
        i += 2
        continue
      }
    }
    
    // Regular character
    result += char
    i++
  }
  
  // Handle unterminated backticks (normalize by removing unbalanced markers)
  // If we ended with an open backtick state, strip trailing backticks to avoid malformed JSDoc
  if (inSingleBacktick) {
    // Remove last single backtick to balance
    const lastBacktick = result.lastIndexOf('`')
    if (lastBacktick >= 0) {
      result = result.substring(0, lastBacktick) + result.substring(lastBacktick + 1)
    }
  }
  if (inTripleBacktick) {
    // Remove last triple backtick to balance
    const lastTriple = result.lastIndexOf('```')
    if (lastTriple >= 0) {
      result = result.substring(0, lastTriple) + result.substring(lastTriple + 3)
    }
  }
  
  // Convert to single line for JSDoc and collapse spaces
  // Note: This may reduce markdown readability but is necessary for JSDoc format
  // JSDoc rendering will handle some markdown formatting even in single-line format
  return result
    .replace(/\n/g, ' ')        // Convert to single line for JSDoc
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim()
}







