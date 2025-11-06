/**
 * Development Script Generator
 * Generates auto-start development scripts with checklist integration
 */

export interface DevScriptConfig {
  projectName: string
  port: number
  autoOpenChecklist: boolean
}

/**
 * Generate development script that auto-starts server and opens checklist
 */
export function generateDevScript(config: DevScriptConfig): string {
  return `#!/usr/bin/env node
/**
 * Development script - Auto-starts server with optional checklist
 * 
 * Usage:
 *   npm run dev:checklist  - Start server and open checklist
 *   npm run dev            - Start server only
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const checklistPath = join(__dirname, '../public/checklist.html')
const PORT = process.env.PORT || ${config.port}

console.log('\\n🚀 Starting ${config.projectName} development server...\\n')
console.log(\`   Port: \${PORT}\`)
console.log(\`   Environment: development\`)
console.log(\`   Mode: Watch mode (auto-reload)\\n\`)

// Start the server
const server = spawn('tsx', ['watch', 'src/server.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: PORT.toString() }
})

${config.autoOpenChecklist ? `
// Auto-open checklist after server starts
setTimeout(() => {
  console.log('\\n📊 System Checklist available at:\\n')
  console.log(\`   Standalone: file://\${checklistPath}\`)
  console.log(\`   Live: http://localhost:\${PORT}/checklist\\n\`)
  
  // Auto-open in browser
  import('open').then(({ default: open }) => {
    open(\`http://localhost:\${PORT}/checklist\`)
      .then(() => console.log('✅ Checklist opened in browser!\\n'))
      .catch(() => console.log('⚠️  Could not auto-open. Use link above.\\n'))
  }).catch(() => {
    console.log('💡 Tip: Install "open" package for auto-open: npm i -D open\\n')
  })
}, 3000)
` : `
// Checklist available (not auto-opening)
setTimeout(() => {
  console.log('\\n📊 System Checklist available at:\\n')
  console.log(\`   Standalone: file://\${checklistPath}\`)
  console.log(\`   Live: http://localhost:\${PORT}/checklist\\n\`)
  console.log('💡 Tip: Use "npm run dev:checklist" to auto-open\\n')
}, 2000)
`}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n\\n👋 Shutting down development server...')
  server.kill('SIGINT')
  setTimeout(() => {
    console.log('✅ Server stopped cleanly\\n')
    process.exit(0)
  }, 500)
})

process.on('SIGTERM', () => {
  server.kill('SIGTERM')
  process.exit(0)
})
`
}

/**
 * Generate package.json scripts for checklist integration
 */
export function generateChecklistScripts(autoOpen: boolean): Record<string, string> {
  return {
    "dev": "tsx watch src/server.ts",
    "dev:checklist": "node scripts/dev.js",
    "checklist": autoOpen 
      ? "node scripts/dev.js"
      : process.platform === 'win32' 
        ? "start public/checklist.html"
        : "open public/checklist.html || xdg-open public/checklist.html"
  }
}

