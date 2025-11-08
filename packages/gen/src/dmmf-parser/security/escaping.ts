/**
 * Escaping utilities for safe code generation
 */

/**
 * Escape string for safe embedding in generated TypeScript code
 * Handles backslashes, quotes, control chars, script tags, and backticks
 * 
 * Note: Includes backtick escaping for potential template literal usage.
 * Currently only used for double-quoted strings, but future-proofed.
 */
export function escapeForCodeGen(str: string): string {
  return str
    .replace(/\\/g, '\\\\')           // Backslash (MUST be first)
    .replace(/"/g, '\\"')             // Double quote
    .replace(/'/g, "\\'")             // Single quote
    .replace(/`/g, '\\`')             // Backtick (for template literals)
    .replace(/\n/g, '\\n')            // Newline
    .replace(/\r/g, '\\r')            // Carriage return
    .replace(/\t/g, '\\t')            // Tab
    .replace(/\f/g, '\\f')            // Form feed
    .replace(/\v/g, '\\v')            // Vertical tab
    .replace(/\u2028/g, '\\u2028')    // Line separator
    .replace(/\u2029/g, '\\u2029')    // Paragraph separator
    .replace(/<\/script>/gi, '<\\/script>') // Script tag
    .replace(/<\/style>/gi, '<\\/style>')   // Style tag
}

