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
 * Uses Prettier's getFileInfo to auto-detect parser for better compatibility
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
    let parser = 'typescript'  // Default
    
    // Use Prettier's file info API for better parser detection
    if (filepath) {
      try {
        const fileInfo = await prettier.getFileInfo(filepath)
        parser = fileInfo.inferredParser || parser
      } catch {
        // Fall back to extension-based detection
        if (filepath.endsWith('.json')) parser = 'json'
        else if (filepath.endsWith('.md')) parser = 'markdown'
        else if (filepath.endsWith('.yaml') || filepath.endsWith('.yml')) parser = 'yaml'
        else if (filepath.endsWith('.html')) parser = 'html'
        else if (filepath.endsWith('.css')) parser = 'css'
        else if (filepath.endsWith('.scss')) parser = 'scss'
      }
    }
    
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

// REMOVED: formatCodeSync is deprecated and has been removed
// Prettier v3+ is async-only
// Use formatCode (async) instead

/**
 * Check if formatting is enabled
 */
export function isFormattingEnabled(): boolean {
  return FORMATTING_ENABLED
}

