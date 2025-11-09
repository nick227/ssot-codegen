/**
 * Generate .env file
 */

import type { ProjectConfig } from '../prompts.js'
import { getPluginById } from '../plugin-catalog.js'

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

  let env = `# Database
DATABASE_URL="${dbUrl}"

# Server
PORT=3000
NODE_ENV=development

# Add your environment variables here
`

  // Add plugin environment variables
  if (config.selectedPlugins && config.selectedPlugins.length > 0) {
    env += '\n# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    env += '# Plugin Configuration\n'
    env += '# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
    
    for (const pluginId of config.selectedPlugins) {
      const plugin = getPluginById(pluginId)
      if (!plugin) continue
      
      env += `\n# ${plugin.name}\n`
      if (plugin.setupInstructions) {
        env += `# Setup: ${plugin.setupInstructions}\n`
      }
      
      // Required environment variables
      for (const envVar of plugin.envVarsRequired) {
        const placeholder = generatePlaceholder(envVar)
        env += `${envVar}=${placeholder}\n`
      }
      
      // Optional environment variables
      if (plugin.envVarsOptional && plugin.envVarsOptional.length > 0) {
        for (const envVar of plugin.envVarsOptional) {
          const placeholder = generatePlaceholder(envVar)
          env += `# ${envVar}=${placeholder}  # Optional\n`
        }
      }
    }
  }
  
  return env
}

/**
 * Generate appropriate placeholder for environment variable
 */
function generatePlaceholder(envVar: string): string {
  const lower = envVar.toLowerCase()
  
  if (lower.includes('secret') || lower.includes('key')) {
    return 'your_' + envVar.toLowerCase().replace(/_/g, '_') + '_here'
  }
  if (lower.includes('url')) {
    return 'https://your-url-here.com'
  }
  if (lower.includes('endpoint')) {
    return 'http://localhost:8080'
  }
  if (lower.includes('id')) {
    return 'your_client_id_here'
  }
  if (lower.includes('email')) {
    return 'noreply@yourdomain.com'
  }
  if (lower.includes('domain')) {
    return 'yourdomain.com'
  }
  if (lower.includes('region')) {
    return 'us-east-1'
  }
  if (lower.includes('bucket')) {
    return 'your-bucket-name'
  }
  if (lower.includes('cloud_name')) {
    return 'your-cloud-name'
  }
  
  return 'your_value_here'
}

