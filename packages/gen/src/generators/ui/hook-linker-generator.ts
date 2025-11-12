/**
 * Hook Linker Generator
 * 
 * Generates lightweight adapters that connect UI components to hooks.
 * Provides consistent, DX-friendly linking strategy.
 */

import type { ParsedModel, ParsedSchema } from '../../dmmf-parser.js'
import { generateHookAdapter } from '../../utils/hook-adapter.js'

/**
 * Generate hook adapters for all models
 */
export function generateHookLinkers(
  schema: ParsedSchema,
  outputDir: string = 'ui/hooks'
): Map<string, string> {
  const files = new Map<string, string>()
  
  // Generate adapter for each model
  for (const model of schema.models) {
    const adapter = generateHookAdapter(model)
    const modelLower = model.name.toLowerCase()
    files.set(`${outputDir}/${modelLower}-adapter.ts`, adapter)
  }
  
  // Generate index file
  files.set(`${outputDir}/index.ts`, generateHookLinkersIndex(schema.models))
  
  // Generate hook registry
  files.set(`${outputDir}/registry.ts`, generateHookRegistry(schema.models))
  
  return files
}

/**
 * Generate hook linkers index
 */
function generateHookLinkersIndex(models: readonly ParsedModel[]): string {
  const imports = models.map(m => {
    const modelLower = m.name.toLowerCase()
    return `export { use${m.name}Model, ${modelLower}Hooks, ${modelLower}Adapter } from './${modelLower}-adapter.js'`
  }).join('\n')
  
  return `/**
 * Hook Adapters - Unified linking strategy for components
 * 
 * Provides consistent, DX-friendly way to connect components to hooks.
 * 
 * @example
 * import { useConversationModel } from './hooks'
 * 
 * function MyComponent() {
 *   const { data, isLoading } = useConversationModel({ take: 20 })
 *   return <div>{data?.map(...)}</div>
 * }
 */

${imports}
`
}

/**
 * Generate hook registry
 */
function generateHookRegistry(models: readonly ParsedModel[]): string {
  const imports = models.map(m => {
    const modelLower = m.name.toLowerCase()
    return `import { use${m.name}, use${m.name}s, useCreate${m.name}, useUpdate${m.name}, useDelete${m.name} } from '../../sdk/react/models/use-${modelLower}'`
  }).join('\n')
  
  const registryEntries = models.map(m => {
    const modelLower = m.name.toLowerCase()
    return `  use${m.name},
  use${m.name}s,
  useCreate${m.name},
  useUpdate${m.name},
  useDelete${m.name},`
  }).join('\n')
  
  return `/**
 * Hook Registry
 * 
 * Centralized registry of all generated hooks.
 * Used by hook adapters for automatic resolution.
 */

${imports}

/**
 * Hook registry - maps model names to their hooks
 */
export const hookRegistry = {
${registryEntries}
}

/**
 * Create hook adapter registry
 */
import { createHookRegistry } from '@ssot-codegen/gen/utils/hook-adapter'

export const hooks = createHookRegistry(hookRegistry)
`
}

