/**
 * Code Formatter Utility
 * 
 * Optional Prettier integration for generated code
 * Can be enabled/disabled via SSOT_FORMAT_CODE environment variable
 */

import prettier from 'prettier'

/**
 * Check if formatting is enabled
 * Default: false (to avoid performance overhead)
 * Set SSOT_FORMAT_CODE=true to enable
 */
const FORMATTING_ENABLED = process.env.SSOT_FORMAT_CODE === 'true'

/**
 * Default Prettier configuration for generated TypeScript/JavaScript
 */
const DEFAULT_PRETTIER_CONFIG: prettier.Options = {
  parser: 'typescript',
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
}

/**
 * Format TypeScript/JavaScript code with Prettier
 * 
 * @param code - Raw code string to format
 * @param filepath - Optional filepath for parser detection
 * @returns Formatted code or original if formatting is disabled/fails
 */
export async function formatCode(code: string, filepath?: string): Promise<string> {
  // Skip formatting if disabled
  if (!FORMATTING_ENABLED) {
    return code
  }
  
  try {
    // Detect parser from filepath if provided
    const parser = filepath?.endsWith('.json') 
      ? 'json' 
      : filepath?.endsWith('.md')
      ? 'markdown'
      : 'typescript'
    
    const formatted = await prettier.format(code, {
      ...DEFAULT_PRETTIER_CONFIG,
      parser,
    })
    
    return formatted
  } catch (error) {
    // Silently fail and return original code
    // Formatting errors shouldn't break generation
    console.warn(`[formatter] Failed to format ${filepath || 'code'}:`, (error as Error).message)
    return code
  }
}

/**
 * Format code synchronously (for backwards compatibility)
 * Note: Prettier v3+ is async-only, so this wraps formatCode
 * 
 * @deprecated Use formatCode (async) instead
 */
export function formatCodeSync(code: string, filepath?: string): string {
  // Prettier v3+ is async-only, cannot be called synchronously
  // Return original code - caller should use async formatCode instead
  console.warn('[formatter] formatCodeSync is deprecated - use formatCode (async) instead')
  return code
}

/**
 * Check if formatting is enabled
 */
export function isFormattingEnabled(): boolean {
  return FORMATTING_ENABLED
}

