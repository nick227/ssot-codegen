/**
 * @ssot-ui/runtime
 * 
 * JSON-first runtime renderer for SSOT UI templates.
 * 
 * ZERO CODE GENERATION!
 * 
 * Usage:
 *   <TemplateRuntime config={jsonConfig} adapters={adapters} />
 * 
 * That's it! Entire application from JSON.
 */

export { TemplateRuntime, type RuntimeConfig, type TemplateRuntimeProps } from './runtime.js'
export { ErrorBoundary } from './components/error-boundary.js'
export { LoadingFallback } from './components/loading-fallback.js'

// Re-export types for convenience
export type {
  DataAdapter,
  UIAdapter,
  AuthAdapter,
  RouterAdapter,
  FormatAdapter,
  Result,
  ErrorModel
} from '@ssot-ui/adapters'

