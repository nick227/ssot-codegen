/**
 * Plugin Integration Utilities
 * Helpers for integrating plugins into generated projects
 */

import type { PluginOutput } from '../plugin.interface.js'

/**
 * Generate app.ts imports for plugins
 */
export function generatePluginImports(pluginOutputs: Map<string, PluginOutput>): string {
  const imports: string[] = []
  
  for (const [pluginName, output] of pluginOutputs) {
    for (const route of output.routes) {
      const routerName = `${pluginName}Router`
      const importPath = route.handler.replace('.js', '.js')
      imports.push(`import { ${routerName} } from './${importPath}'`)
    }
  }
  
  return imports.join('\n')
}

/**
 * Generate app.ts route registrations for plugins
 */
export function generatePluginRoutes(pluginOutputs: Map<string, PluginOutput>, apiPrefix: string = '/api'): string {
  const routes: string[] = []
  
  for (const [pluginName, output] of pluginOutputs) {
    const routerName = `${pluginName}Router`
    
    if (output.routes.length > 0) {
      // Group routes by base path
      const baseRoutes = output.routes.map(r => r.path.split('/')[1]).filter((v, i, a) => a.indexOf(v) === i)
      
      for (const basePath of baseRoutes) {
        routes.push(`  // ${pluginName} routes`)
        routes.push(`  app.use('/${basePath}', ${routerName})`)
      }
    }
  }
  
  return routes.join('\n')
}

/**
 * Generate middleware registrations for plugins
 */
export function generatePluginMiddleware(pluginOutputs: Map<string, PluginOutput>): string {
  const middleware: string[] = []
  
  for (const [pluginName, output] of pluginOutputs) {
    for (const mw of output.middleware) {
      if (mw.global) {
        middleware.push(`  // ${pluginName} middleware`)
        middleware.push(`  app.use(${mw.name})`)
      }
    }
  }
  
  return middleware.join('\n')
}

/**
 * Merge plugin package.json additions
 */
export function mergePluginPackageJson(
  basePackageJson: any,
  pluginOutputs: Map<string, PluginOutput>
): any {
  const result = { ...basePackageJson }
  
  for (const [pluginName, output] of pluginOutputs) {
    if (output.packageJson) {
      // Merge dependencies
      if (output.packageJson.dependencies) {
        result.dependencies = {
          ...result.dependencies,
          ...output.packageJson.dependencies
        }
      }
      
      // Merge devDependencies
      if (output.packageJson.devDependencies) {
        result.devDependencies = {
          ...result.devDependencies,
          ...output.packageJson.devDependencies
        }
      }
      
      // Merge scripts
      if (output.packageJson.scripts) {
        result.scripts = {
          ...result.scripts,
          ...output.packageJson.scripts
        }
      }
    }
  }
  
  return result
}

/**
 * Merge plugin environment variables
 */
export function mergePluginEnvVars(pluginOutputs: Map<string, PluginOutput>): Record<string, string> {
  const envVars: Record<string, string> = {}
  
  for (const [pluginName, output] of pluginOutputs) {
    Object.assign(envVars, output.envVars)
  }
  
  return envVars
}

/**
 * Generate .env.example with plugin variables
 */
export function generateEnvExample(
  baseEnvVars: Record<string, string>,
  pluginOutputs: Map<string, PluginOutput>
): string {
  const sections: string[] = []
  
  // Base env vars
  sections.push(`# Application
${Object.entries(baseEnvVars).map(([key, value]) => `${key}="${value}"`).join('\n')}`)
  
  // Plugin env vars
  for (const [pluginName, output] of pluginOutputs) {
    if (Object.keys(output.envVars).length > 0) {
      sections.push(`\n# ${pluginName.toUpperCase()} Configuration`)
      sections.push(Object.entries(output.envVars)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n'))
    }
  }
  
  return sections.join('\n')
}

