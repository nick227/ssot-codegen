/**
 * Generate .env file
 */

import type { ProjectConfig } from '../prompts.js'

export function generateEnvFile(config: ProjectConfig): string {
  let dbUrl: string

  switch (config.database) {
    case 'postgresql':
      dbUrl = 'postgresql://user:password@localhost:5432/mydb?schema=public'
      break
    case 'mysql':
      dbUrl = 'mysql://user:password@localhost:3306/mydb'
      break
    case 'sqlite':
      dbUrl = 'file:./dev.db'
      break
    default:
      dbUrl = 'postgresql://user:password@localhost:5432/mydb'
  }

  return `# Database
DATABASE_URL="${dbUrl}"

# Server
PORT=3000
NODE_ENV=development

# Add your environment variables here
`
}

