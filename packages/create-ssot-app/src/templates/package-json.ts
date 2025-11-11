/**
 * Generate package.json for the new project
 */

import type { ProjectConfig } from '../prompts.js'
import { getPluginDependencies } from '../plugin-catalog.js'
import { getUIDependencies, getUIDevDependencies, getUIScripts } from '../ui-generator.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Check if we're running from a local build (for testing)
function getLocalPackagePath(packageName: string): string | null {
  // This file is in: packages/create-ssot-app/dist/templates/
  // Other packages are in: packages/{packageName}/
  const packagePath = path.resolve(__dirname, `../../../${packageName}`)
  const packageJson = path.join(packagePath, 'package.json')
  
  if (fs.existsSync(packageJson)) {
    return packagePath
  }
  return null
}

function isLocalDevelopment(): boolean {
  return getLocalPackagePath('cli') !== null
}

export function generatePackageJson(config: ProjectConfig): string {
  const deps: Record<string, string> = {
    '@prisma/client': '^6.0.0',
    'dotenv': '^16.4.0'
  }

  // Use local packages for testing, npm packages for production
  const useLocal = isLocalDevelopment()
  
  const devDeps: Record<string, string> = {
    'prisma': '^6.0.0',
    '@ssot-codegen/cli': useLocal 
      ? `file:${getLocalPackagePath('cli')}`
      : '^0.4.0',
    'typescript': '^5.3.3',
    '@types/node': '^20.11.0',
    'tsx': '^4.7.0'
  }

  // Add additional local packages when in dev mode
  if (useLocal) {
    devDeps['@ssot-codegen/gen'] = `file:${getLocalPackagePath('gen')}`
    devDeps['@ssot-codegen/sdk-runtime'] = `file:${getLocalPackagePath('sdk-runtime')}`
    devDeps['@ssot-codegen/templates-default'] = `file:${getLocalPackagePath('templates-default')}`
  }

  // Framework-specific dependencies
  if (config.framework === 'express') {
    deps['express'] = '^4.18.0'
    deps['cors'] = '^2.8.5'
    devDeps['@types/express'] = '^4.17.21'
    devDeps['@types/cors'] = '^2.8.17'
  } else {
    deps['fastify'] = '^4.26.0'
    deps['@fastify/cors'] = '^9.0.1'
  }
  
  // Add plugin dependencies
  if (config.selectedPlugins && config.selectedPlugins.length > 0) {
    const pluginDeps = getPluginDependencies(config.selectedPlugins)
    Object.assign(deps, pluginDeps)
  }
  
  // Add UI dependencies if UI generation is enabled
  if (config.generateUI) {
    if (config.uiMode === 'v3-runtime') {
      // V3: Next.js + React + Runtime + adapters
      const isDev = isLocalDevelopment()
      deps['next'] = '^14.1.0'
      deps['react'] = '^18.2.0'
      deps['react-dom'] = '^18.2.0'
      deps['@ssot-ui/runtime'] = isDev ? 'file:../packages/ui-runtime' : '^3.0.0'
      deps['@ssot-ui/adapter-data-prisma'] = isDev ? 'file:../packages/ui-adapter-data-prisma' : '^3.0.0'
      deps['@ssot-ui/adapter-ui-internal'] = isDev ? 'file:../packages/ui-adapter-ui-internal' : '^3.0.0'
      deps['@ssot-ui/adapter-auth-nextauth'] = isDev ? 'file:../packages/ui-adapter-auth-nextauth' : '^3.0.0'
      deps['@ssot-ui/adapter-router-next'] = isDev ? 'file:../packages/ui-adapter-router-next' : '^3.0.0'
      deps['@ssot-ui/adapter-format-intl'] = isDev ? 'file:../packages/ui-adapter-format-intl' : '^3.0.0'
      devDeps['@ssot-ui/prisma-to-models'] = isDev ? 'file:../packages/prisma-to-models' : '^3.0.0'
      devDeps['@ssot-ui/schemas'] = isDev ? 'file:../packages/ui-schemas' : '^3.0.0'
      devDeps['@types/react'] = '^18.2.0'
      devDeps['@types/react-dom'] = '^18.2.0'
    } else {
      // V2: Generated code dependencies
      const uiDeps = getUIDependencies(config)
      const uiDevDeps = getUIDevDependencies(config)
      Object.assign(deps, uiDeps)
      Object.assign(devDeps, uiDevDeps)
    }
  }

  const scripts: Record<string, string> = {
    dev: 'tsx watch src/server.ts',
    build: 'tsc',
    start: 'node dist/server.js',
    'db:push': 'prisma db push',
    'db:migrate': 'prisma migrate dev',
    'db:studio': 'prisma studio',
    generate: 'prisma generate && ssot-codegen generate',
    'generate:prisma': 'prisma generate',
    'generate:api': 'ssot-codegen generate'
  }
  
  // Add UI scripts if UI generation is enabled
  if (config.generateUI) {
    if (config.uiMode === 'v3-runtime') {
      // V3 scripts
      scripts['gen:models'] = 'prisma-to-models generate ./prisma/schema.prisma --out ./templates/models.json'
      scripts['gen:models:watch'] = 'prisma-to-models watch ./prisma/schema.prisma --out ./templates/models.json'
      scripts['validate:templates'] = 'ssot validate ./templates'
      scripts['plan:templates'] = 'ssot plan ./templates'
    } else {
      // V2 scripts
      const uiScripts = getUIScripts(config)
      Object.assign(scripts, uiScripts)
    }
  }

  const pkg = {
    name: config.projectName,
    version: '0.1.0',
    type: 'module',
    description: `Full-stack TypeScript API built with SSOT CodeGen`,
    scripts,
    dependencies: deps,
    devDependencies: devDeps,
    engines: {
      node: '>=18.0.0'
    }
  }

  return JSON.stringify(pkg, null, 2) + '\n'
}

