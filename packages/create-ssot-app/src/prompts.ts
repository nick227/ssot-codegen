/**
 * Interactive prompts for project configuration
 */

import prompts from 'prompts'
import pc from 'picocolors'
import path from 'node:path'
import fs from 'node:fs'
import {
  PLUGIN_CATALOG,
  groupPluginsByCategory,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  validatePluginSelection
} from './plugin-catalog.js'

export interface ProjectConfig {
  projectName: string
  framework: 'express' | 'fastify'
  database: 'postgresql' | 'mysql' | 'sqlite'
  includeExamples: boolean
  selectedPlugins: string[]
  packageManager: 'npm' | 'pnpm' | 'yarn'
  generateUI: boolean
  uiTemplate?: 'data-browser' | 'blog' | 'ecommerce' | 'dashboard'
}

export async function getProjectConfig(): Promise<ProjectConfig> {
  const response = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name:',
        initial: 'my-api',
        validate: (value: string) => {
          if (!value) return 'Project name is required'
          if (!/^[a-z0-9-_]+$/i.test(value)) {
            return 'Project name can only contain letters, numbers, dashes, and underscores'
          }
          if (fs.existsSync(path.join(process.cwd(), value))) {
            return `Directory "${value}" already exists`
          }
          return true
        }
      },
      {
        type: 'select',
        name: 'framework',
        message: 'Choose your framework:',
        choices: [
          { title: 'Express', value: 'express', description: 'Popular, battle-tested' },
          { title: 'Fastify', value: 'fastify', description: 'Fast, modern' }
        ],
        initial: 0
      },
      {
        type: 'select',
        name: 'database',
        message: 'Choose your database:',
        choices: [
          { title: 'PostgreSQL', value: 'postgresql', description: 'Recommended for production' },
          { title: 'MySQL', value: 'mysql', description: 'Popular, widely supported' },
          { title: 'SQLite', value: 'sqlite', description: 'Simple, file-based (dev/testing)' }
        ],
        initial: 0
      },
      {
        type: 'confirm',
        name: 'includeExamples',
        message: 'Include example models (User, Post)?',
        initial: true
      },
      {
        type: 'multiselect',
        name: 'selectedPlugins',
        message: 'Select plugins to include (Space to select, Enter to continue):',
        choices: createPluginChoices(),
        hint: '- Space to select. Return to submit',
        instructions: false,
        min: 0
      },
      {
        type: 'select',
        name: 'packageManager',
        message: 'Package manager:',
        choices: [
          { title: 'pnpm', value: 'pnpm', description: 'Fast, efficient' },
          { title: 'npm', value: 'npm', description: 'Default, reliable' },
          { title: 'yarn', value: 'yarn', description: 'Classic alternative' }
        ],
        initial: 0
      },
      {
        type: 'confirm',
        name: 'generateUI',
        message: '🎨 Generate UI components (experimental)?',
        initial: false
      },
      {
        type: (prev) => prev ? 'select' : null,
        name: 'uiTemplate',
        message: 'Choose UI template:',
        choices: [
          { title: '📊 Data Browser', value: 'data-browser', description: 'Read-only admin panel for browsing data' },
          { title: '📝 Blog', value: 'blog', description: 'Full blog with posts, comments, and authors' },
          { title: '🛒 E-commerce', value: 'ecommerce', description: 'Product catalog and cart (coming soon)', disabled: true },
          { title: '📈 Dashboard', value: 'dashboard', description: 'Analytics dashboard (coming soon)', disabled: true }
        ],
        initial: 0
      }
    ],
    {
      onCancel: () => {
        console.log()
        console.log(pc.red('✖ Cancelled'))
        process.exit(0)
      }
    }
  )

  // Validate plugin selection and show warnings
  if (response.selectedPlugins && response.selectedPlugins.length > 0) {
    const validation = validatePluginSelection(response.selectedPlugins, {
      includeExamples: response.includeExamples
    })
    
    if (validation.warnings.length > 0) {
      console.log()
      console.log(pc.yellow('⚠️  Warnings:'))
      validation.warnings.forEach(warning => {
        console.log(pc.yellow(`  • ${warning}`))
      })
      console.log()
      
      const confirmWarnings = await prompts({
        type: 'confirm',
        name: 'continue',
        message: 'Continue with selected plugins?',
        initial: true
      })
      
      if (!confirmWarnings.continue) {
        console.log()
        console.log(pc.red('✖ Cancelled'))
        process.exit(0)
      }
    }
  }

  return response as ProjectConfig
}

/**
 * Create plugin choices grouped by category
 */
function createPluginChoices() {
  const grouped = groupPluginsByCategory(PLUGIN_CATALOG)
  const choices: Array<{
    title: string
    value?: string
    description?: string
    disabled?: boolean
    selected?: boolean
  }> = []
  
  // Iterate categories in defined order
  for (const category of CATEGORY_ORDER) {
    const plugins = grouped[category]
    if (!plugins || plugins.length === 0) continue
    
    // Add category header
    choices.push({
      title: pc.bold(`${CATEGORY_ICONS[category]} ${CATEGORY_LABELS[category]}`),
      disabled: true
    })
    
    // Add plugins in category
    for (const plugin of plugins) {
      const requiresEnv = plugin.envVarsRequired.length > 0
      const description = plugin.description + (requiresEnv ? pc.dim(' (requires API key)') : '')
      
      choices.push({
        title: `  ${plugin.name}`,
        value: plugin.id,
        description,
        selected: plugin.popular // Pre-select popular plugins
      })
    }
  }
  
  return choices
}

