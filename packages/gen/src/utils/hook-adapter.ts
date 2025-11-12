/**
 * Hook Adapter - Unified Strategy for Linking Components to Hooks
 * 
 * Provides a consistent, DX-friendly way to connect UI components to generated hooks.
 * 
 * Key Principles:
 * 1. Lightweight - Minimal boilerplate, zero overhead
 * 2. Flexible - Works with any component pattern
 * 3. Consistent - Same API everywhere
 * 4. DX-Friendly - Intuitive, type-safe, auto-complete
 */

import type { ParsedModel } from '../dmmf-parser.js'

/**
 * Hook adapter configuration
 * 
 * Supports multiple patterns:
 * - Model name string: 'conversation' → auto-resolves hooks
 * - Direct hook: useConversations → uses directly
 * - Custom adapter: (model) => hook → custom resolution
 */
export type HookAdapter<T = any> =
  | string  // Model name: 'conversation' → useConversations
  | ((params?: any) => T)  // Direct hook: useConversations
  | { model: string; adapter?: (model: string) => (params?: any) => T }  // Custom adapter

/**
 * Resolve hook from adapter configuration
 * 
 * @example
 * // Model name pattern
 * const hook = resolveHook('conversation', hooks)
 * // Returns: hooks.useConversations
 * 
 * // Direct hook pattern
 * const hook = resolveHook(useConversations, hooks)
 * // Returns: useConversations
 * 
 * // Custom adapter pattern
 * const hook = resolveHook({ model: 'conversation', adapter: (m) => hooks[`use${capitalize(m)}s`] }, hooks)
 */
export function resolveHook<T = any>(
  adapter: HookAdapter<T>,
  hooks?: Record<string, any>
): ((params?: any) => T) | null {
  // Direct hook function
  if (typeof adapter === 'function') {
    return adapter
  }
  
  // Model name string
  if (typeof adapter === 'string') {
    if (!hooks) {
      throw new Error(`Hook registry not provided. Cannot resolve hook for model: ${adapter}`)
    }
    
    // Try common hook name patterns
    const modelName = adapter
    const patterns = [
      `use${capitalize(modelName)}s`,  // useConversations
      `use${capitalize(modelName)}`,   // useConversation
      `use${modelName}s`,              // useconversations
      `use${modelName}`                // useconversation
    ]
    
    for (const pattern of patterns) {
      if (hooks[pattern]) {
        return hooks[pattern]
      }
    }
    
    console.warn(`Hook not found for model: ${modelName}. Tried: ${patterns.join(', ')}`)
    return null
  }
  
  // Custom adapter object
  if (adapter.adapter && adapter.model) {
    return adapter.adapter(adapter.model)
  }
  
  // Fallback to model name resolution
  if (adapter.model && hooks) {
    return resolveHook(adapter.model, hooks)
  }
  
  return null
}

/**
 * Create a hook adapter registry from generated hooks
 * 
 * Automatically collects all hooks from a hooks module and creates a registry.
 * 
 * @example
 * import * as hooks from '@/gen/sdk/react'
 * const registry = createHookRegistry(hooks)
 * 
 * // Now you can use model names
 * const data = useModel('conversation', registry)
 */
export function createHookRegistry(hooksModule: Record<string, any>): Record<string, any> {
  const registry: Record<string, any> = {}
  
  // Collect all hook functions (functions starting with 'use')
  for (const [key, value] of Object.entries(hooksModule)) {
    if (typeof value === 'function' && key.startsWith('use')) {
      registry[key] = value
    }
  }
  
  return registry
}

/**
 * Universal hook adapter hook
 * 
 * Provides a consistent API for using hooks in components.
 * Supports multiple patterns and automatically handles common cases.
 * 
 * @example
 * // Pattern 1: Model name (auto-resolves hook)
 * const { data, isLoading } = useModel('conversation', { take: 20 })
 * 
 * // Pattern 2: Direct hook
 * const { data, isLoading } = useModel(useConversations, { take: 20 })
 * 
 * // Pattern 3: With custom registry
 * const registry = createHookRegistry(hooks)
 * const { data, isLoading } = useModel('conversation', { take: 20 }, registry)
 */
export function useModel<T = any>(
  adapter: HookAdapter<T>,
  params?: any,
  hooksRegistry?: Record<string, any>
): {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const hook = resolveHook(adapter, hooksRegistry)
  
  if (!hook) {
    console.error(`Hook not found for adapter:`, adapter)
    return {
      data: null,
      isLoading: false,
      error: new Error(`Hook not found`),
      refetch: () => {}
    }
  }
  
  // Call the hook with params
  const result = hook(params)
  
  // Normalize different hook return formats
  if (result && typeof result === 'object') {
    const resultObj = result as Record<string, any>
    
    // React Query format
    if ('data' in resultObj && 'isPending' in resultObj) {
      return {
        data: (resultObj.data ?? null) as T | null,
        isLoading: Boolean(resultObj.isPending ?? false),
        error: (resultObj.error ?? null) as Error | null,
        refetch: (resultObj.refetch ?? (() => {})) as () => void
      }
    }
    
    // Custom format with isLoading
    if ('data' in resultObj && 'isLoading' in resultObj) {
      return {
        data: (resultObj.data ?? null) as T | null,
        isLoading: Boolean(resultObj.isLoading ?? false),
        error: (resultObj.error ?? null) as Error | null,
        refetch: (resultObj.refetch ?? (() => {})) as () => void
      }
    }
    
    // Assume data is the result
    return {
      data: result as T,
      isLoading: false,
      error: null,
      refetch: () => {}
    }
  }
  
  return {
    data: result as T,
    isLoading: false,
    error: null,
    refetch: () => {}
  }
}

/**
 * Create a model-specific hook adapter
 * 
 * Pre-configures a hook adapter for a specific model, making it even easier to use.
 * 
 * @example
 * const useConversationAdapter = createModelAdapter('conversation', hooks)
 * 
 * // Now use it anywhere
 * const { data, isLoading } = useConversationAdapter({ take: 20 })
 */
export function createModelAdapter<T = any>(
  modelName: string,
  hooksRegistry: Record<string, any>
): (params?: any) => ReturnType<typeof useModel<T>> {
  return (params?: any) => useModel<T>(modelName, params, hooksRegistry)
}

/**
 * Generate hook adapter code for a model
 * 
 * Creates a lightweight adapter that connects components to hooks.
 */
export function generateHookAdapter(model: ParsedModel): string {
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  const modelPlural = modelLower + 's'
  
  return `/**
 * Hook Adapter for ${modelName}
 * 
 * Lightweight adapter that connects components to hooks.
 * Provides consistent API regardless of hook implementation.
 */

import { useModel, type HookAdapter } from '@/utils/hook-adapter'
import { use${modelName}, use${modelName}s, useCreate${modelName}, useUpdate${modelName}, useDelete${modelName} } from '@/gen/sdk/react/models/use-${modelLower}'

/**
 * Use ${modelName} model with consistent API
 * 
 * @example
 * const { data, isLoading } = use${modelName}Model({ take: 20 })
 */
export function use${modelName}Model(params?: any) {
  return useModel('${modelLower}', params, {
    use${modelName},
    use${modelName}s,
    useCreate${modelName},
    useUpdate${modelName},
    useDelete${modelName}
  })
}

/**
 * Direct hook access (for advanced use cases)
 */
export const ${modelLower}Hooks = {
  get: use${modelName},
  list: use${modelName}s,
  create: useCreate${modelName},
  update: useUpdate${modelName},
  delete: useDelete${modelName}
}

/**
 * Hook adapter for component props
 * 
 * @example
 * <DataTable hook={${modelLower}Adapter} />
 */
export const ${modelLower}Adapter: HookAdapter = '${modelLower}'
`
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

