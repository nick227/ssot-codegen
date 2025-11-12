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

// Expression Context Provider (NEW)
export {
  ExpressionContextProvider,
  useExpressionContext,
  useHasExpressionContext,
  type ExpressionContextProviderProps
} from './context/expression-context.js'

// Expression hooks (NEW - v2 with context provider)
export {
  useExpression,
  useConditionalVisibility,
  useConditionalEnabled,
  type UseExpressionOptions
} from './hooks/use-expression.js'

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

// Re-export expression types
export type {
  Expression,
  ExpressionContext,
  LiteralExpression,
  FieldAccessExpression,
  OperationExpression,
  ConditionExpression,
  PermissionExpression
} from '@ssot-ui/expressions'

