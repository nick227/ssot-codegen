/**
 * Generate README.md
 */

import type { ProjectConfig } from '../prompts.js'
import { getPluginById, groupPluginsByCategory, CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_ORDER, type CLIPluginInfo } from '../plugin-catalog.js'

export function generateReadme(config: ProjectConfig): string {
  const pm = config.packageManager
  const runCmd = pm === 'npm' ? 'npm run' : pm

  return `# ${config.projectName}

Full-stack TypeScript API built with **SSOT CodeGen**.

## 🚀 Stack

- **Framework**: ${config.framework === 'express' ? 'Express' : 'Fastify'}
- **Database**: ${config.database.charAt(0).toUpperCase() + config.database.slice(1)}
- **ORM**: Prisma
- **Language**: TypeScript

## 🔌 Plugins Included

${generatePluginSection(config)}

## 📦 What's Included

- ✅ Complete REST API with CRUD operations
- ✅ Auto-generated DTOs and validators
- ✅ Type-safe database client
- ✅ Type-safe SDK for frontend
- ✅ React hooks (optional)
- ✅ OpenAPI documentation
- ✅ Error handling
- ✅ Request validation

## 🛠️ Development

\`\`\`bash
# Start dev server with hot reload
${runCmd} dev

# Push database schema (for prototyping)
${runCmd} db:push

# Create migration (for production)
${runCmd} db:migrate

# Open Prisma Studio (database GUI)
${runCmd} db:studio
\`\`\`

## 📝 Edit Your Schema

1. Edit \`prisma/schema.prisma\`
2. Run \`${runCmd} generate\` to regenerate API code
3. Run \`${runCmd} db:push\` to update database

## 🏗️ Build for Production

\`\`\`bash
# Build TypeScript
${runCmd} build

# Start production server
${runCmd} start
\`\`\`

## 📚 API Endpoints

After generation, check \`generated/CHECKLIST.md\` for:
- All available endpoints
- Request/response examples
- SDK usage examples

## 🔧 Configuration

Edit \`ssot.config.ts\` to customize:
- Output directory
- Hook frameworks (React, Vue, etc.)
- Plugin settings
- Error handling

## 📖 Learn More

- [SSOT CodeGen Docs](https://github.com/yourusername/ssot-codegen)
- [Prisma Docs](https://www.prisma.io/docs)
- [${config.framework === 'express' ? 'Express' : 'Fastify'} Docs](${config.framework === 'express' ? 'https://expressjs.com' : 'https://fastify.dev'})

---

Built with ❤️ using **create-ssot-app**
`
}

/**
 * Generate plugin documentation section
 */
function generatePluginSection(config: ProjectConfig): string {
  if (!config.selectedPlugins || config.selectedPlugins.length === 0) {
    return 'No plugins configured. You can add plugins by editing `ssot.config.ts` and regenerating.'
  }
  
  const plugins = config.selectedPlugins
    .map(id => getPluginById(id))
    .filter((p): p is CLIPluginInfo => p !== undefined)
  
  const grouped = groupPluginsByCategory(plugins)
  let section = ''
  
  for (const category of CATEGORY_ORDER) {
    const categoryPlugins = grouped[category]
    if (!categoryPlugins || categoryPlugins.length === 0) continue
    
    section += `### ${CATEGORY_ICONS[category]} ${CATEGORY_LABELS[category]}\n\n`
    
    for (const plugin of categoryPlugins) {
      section += `- **${plugin.name}**: ${plugin.description}\n`
      
      if (plugin.envVarsRequired.length > 0) {
        section += `  - Required: \`${plugin.envVarsRequired.join('`, `')}\`\n`
      }
      
      if (plugin.setupInstructions) {
        section += `  - Setup: ${plugin.setupInstructions}\n`
      }
      
      section += '\n'
    }
  }
  
  return section
}

