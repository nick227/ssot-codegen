/**
 * Logger utilities for DMMF Parser
 */

import type { DMMFParserLogger } from '../types.js'

/**
 * Create default logger instance (per-parse to avoid global mutable state)
 */
export function createDefaultLogger(): DMMFParserLogger {
  return {
    warn: (msg) => console.warn(msg),
    error: (msg) => console.error(msg)
  }
}





