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
  
  // Specific AWS patterns (check before generic patterns)
  if (lower.includes('access_key_id')) return 'your_aws_access_key_id_here'
  if (lower.includes('secret_access_key')) return 'your_aws_secret_key_here'
  
  // Specific client patterns
  if (lower.includes('client_id')) return 'your_client_id_here'
  if (lower.includes('client_secret')) return 'your_client_secret_here'
  
  // API keys and secrets (generic)
  if (lower.includes('api_key')) return `your_${lower}_here`
  if (lower.includes('secret')) return `your_${lower}_here`
  
  // URLs and endpoints
  if (lower.includes('callback') && lower.includes('url')) return 'http://localhost:3000/auth/callback'
  if (lower.includes('url')) return 'https://your-url-here.com'
  if (lower.includes('endpoint')) return 'http://localhost:8080'
  
  // Email and domain
  if (lower.includes('email')) return 'noreply@yourdomain.com'
  if (lower.includes('domain')) return 'yourdomain.com'
  
  // Cloud infrastructure
  if (lower.includes('region')) return 'us-east-1'
  if (lower.includes('bucket')) return 'your-bucket-name'
  if (lower.includes('cloud_name')) return 'your-cloud-name'
  if (lower.includes('account_id')) return 'your_account_id_here'
  
  // Generic ID (last resort)
  if (lower.includes('_id')) return `your_${lower}_here`
  
  return `your_${lower}_here`
}

