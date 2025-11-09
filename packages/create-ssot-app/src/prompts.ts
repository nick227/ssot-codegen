/**
 * Interactive prompts for project configuration
 */

import prompts from 'prompts'
import pc from 'picocolors'
import path from 'node:path'
import fs from 'node:fs'

export interface ProjectConfig {
  projectName: string
  framework: 'express' | 'fastify'
  database: 'postgresql' | 'mysql' | 'sqlite'
  includeAuth: boolean
  includeExamples: boolean
  packageManager: 'npm' | 'pnpm' | 'yarn'
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
        name: 'includeAuth',
        message: 'Include authentication setup?',
        initial: true
      },
      {
        type: 'confirm',
        name: 'includeExamples',
        message: 'Include example models (User, Post)?',
        initial: true
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

  return response as ProjectConfig
}

