# CLI Plugin Selection - Feasibility Analysis & Implementation Plan

## Executive Summary

**Feasibility**: ✅ **HIGHLY FEASIBLE** - The plugin system is already well-structured with clear metadata.

**Effort Estimate**: ~2-3 hours of development + testing

**Complexity**: Low-Medium - Leverages existing plugin infrastructure

---

## Current Plugin Inventory

### Available Plugins (20 total)

#### 🔐 Authentication (3)
- **google-auth** - Google OAuth 2.0 integration
- **jwt-service** - JWT token management
- **api-key-manager** - API key authentication

#### 🤖 AI Providers (7)
- **openai** - OpenAI GPT integration
- **claude** - Anthropic Claude integration
- **gemini** - Google Gemini integration
- **grok** - xAI Grok integration
- **openrouter** - OpenRouter multi-model access
- **lmstudio** - LM Studio local models
- **ollama** - Ollama local models

#### 🎤 Voice AI (2)
- **deepgram** - Speech-to-text
- **elevenlabs** - Text-to-speech

#### 💾 Storage (3)
- **s3** - AWS S3 integration
- **r2** - Cloudflare R2 integration
- **cloudinary** - Cloudinary media management

#### 💳 Payments (2)
- **stripe** - Stripe payment processing
- **paypal** - PayPal payment processing

#### 📧 Email (2)
- **sendgrid** - SendGrid email service
- **mailgun** - Mailgun email service

#### 📊 Monitoring (1)
- **usage-tracker** - API usage tracking

#### 🔍 Search (1)
- **full-text-search** - Full-text search with ranking

---

## Plugin Metadata Structure

Each plugin already provides:

```typescript
interface FeaturePlugin {
  name: string              // 'google-auth'
  version: string           // '1.0.0'
  description: string       // Human-readable description
  enabled: boolean          // Runtime state
  requirements: {
    envVars: { required[], optional[] }
    dependencies: { runtime, dev }
    models?: { required[], optional[] }
  }
}
```

**✅ Advantage**: All metadata is already available - no new infrastructure needed!

---

## Proposed CLI Flow

### Current Flow
```
1. Project name
2. Framework (Express/Fastify)
3. Database (PostgreSQL/MySQL/SQLite)
4. Include auth? (yes/no)
5. Include examples? (yes/no)
6. Package manager
```

### Enhanced Flow (Option A - Recommended)
```
1. Project name
2. Framework (Express/Fastify)
3. Database (PostgreSQL/MySQL/SQLite)
4. Include examples? (yes/no)
5. ✨ Select plugins: (NEW - multi-select with categories)
   
   🔐 Authentication:
   [ ] Google Auth
   [ ] JWT Service  
   [ ] API Key Manager
   
   🤖 AI Providers:
   [ ] OpenAI
   [ ] Claude
   [ ] Gemini
   [ ] Grok
   [ ] OpenRouter
   [ ] LM Studio (local)
   [ ] Ollama (local)
   
   💾 Storage:
   [ ] AWS S3
   [ ] Cloudflare R2
   [ ] Cloudinary
   
   💳 Payments:
   [ ] Stripe
   [ ] PayPal
   
   📧 Email:
   [ ] SendGrid
   [ ] Mailgun
   
   🎤 Voice AI:
   [ ] Deepgram (STT)
   [ ] ElevenLabs (TTS)
   
   📊 Other:
   [ ] Usage Tracker
   [ ] Full-Text Search
   
   Navigate: ↑/↓  Select: Space  Continue: Enter

6. Package manager
```

### Alternative Flow (Option B - Quick Start)
```
4. Enable plugins? (yes/no) ← New simple toggle
   
   If yes → Show plugin selector
   If no → Skip to package manager
```

---

## Implementation Plan

### Phase 1: Plugin Registry for CLI (30 min)

Create `packages/create-ssot-app/src/plugin-catalog.ts`:

```typescript
export interface CLIPluginInfo {
  id: string
  name: string
  description: string
  category: 'auth' | 'ai' | 'voice' | 'storage' | 'payments' | 'email' | 'monitoring' | 'search'
  envVarsRequired: string[]
  popular?: boolean
  requiresModel?: string // e.g., 'User'
}

export const PLUGIN_CATALOG: CLIPluginInfo[] = [
  {
    id: 'google-auth',
    name: 'Google OAuth',
    description: 'Google Sign-In integration',
    category: 'auth',
    envVarsRequired: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    popular: true,
    requiresModel: 'User'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 integration',
    category: 'ai',
    envVarsRequired: ['OPENAI_API_KEY'],
    popular: true
  },
  // ... 18 more plugins
]

export function groupPluginsByCategory(plugins: CLIPluginInfo[]) {
  return plugins.reduce((acc, plugin) => {
    if (!acc[plugin.category]) acc[plugin.category] = []
    acc[plugin.category].push(plugin)
    return acc
  }, {} as Record<string, CLIPluginInfo[]>)
}

export const CATEGORY_ICONS = {
  auth: '🔐',
  ai: '🤖',
  voice: '🎤',
  storage: '💾',
  payments: '💳',
  email: '📧',
  monitoring: '📊',
  search: '🔍'
}

export const CATEGORY_LABELS = {
  auth: 'Authentication',
  ai: 'AI Providers',
  voice: 'Voice AI',
  storage: 'Storage',
  payments: 'Payments',
  email: 'Email',
  monitoring: 'Monitoring',
  search: 'Search'
}
```

### Phase 2: Update Prompts (30 min)

Update `packages/create-ssot-app/src/prompts.ts`:

```typescript
import { PLUGIN_CATALOG, groupPluginsByCategory, CATEGORY_ICONS, CATEGORY_LABELS } from './plugin-catalog.js'

export interface ProjectConfig {
  projectName: string
  framework: 'express' | 'fastify'
  database: 'postgresql' | 'mysql' | 'sqlite'
  includeExamples: boolean
  selectedPlugins: string[]  // Plugin IDs
  packageManager: 'npm' | 'pnpm' | 'yarn'
}

export async function getProjectConfig(): Promise<ProjectConfig> {
  // ... existing prompts ...
  
  // Add plugin selection prompt
  {
    type: 'multiselect',
    name: 'selectedPlugins',
    message: 'Select plugins to include (optional):',
    choices: createPluginChoices(),
    hint: '- Space to select. Return to submit',
    instructions: false,
    min: 0  // All optional
  }
}

function createPluginChoices() {
  const grouped = groupPluginsByCategory(PLUGIN_CATALOG)
  const choices: any[] = []
  
  for (const [category, plugins] of Object.entries(grouped)) {
    // Add category separator
    choices.push({
      title: `${CATEGORY_ICONS[category]} ${CATEGORY_LABELS[category]}`,
      disabled: true
    })
    
    // Add plugins in category
    for (const plugin of plugins) {
      choices.push({
        title: plugin.name,
        value: plugin.id,
        description: plugin.description,
        selected: plugin.popular // Pre-select popular plugins
      })
    }
  }
  
  return choices
}
```

### Phase 3: Update Config Generation (45 min)

Update `packages/create-ssot-app/src/templates/package-json.ts`:

```typescript
export function generatePackageJson(config: ProjectConfig): string {
  const dependencies = getBaseDependencies(config)
  
  // Add plugin-specific dependencies
  const pluginDeps = getPluginDependencies(config.selectedPlugins)
  Object.assign(dependencies, pluginDeps)
  
  return JSON.stringify({
    name: config.projectName,
    dependencies,
    // ...
  }, null, 2)
}

function getPluginDependencies(pluginIds: string[]): Record<string, string> {
  const deps: Record<string, string> = {}
  
  for (const id of pluginIds) {
    const plugin = PLUGIN_CATALOG.find(p => p.id === id)
    if (!plugin) continue
    
    // Map plugin IDs to npm packages
    switch (id) {
      case 'google-auth':
        deps['passport'] = '^0.7.0'
        deps['passport-google-oauth20'] = '^2.0.0'
        break
      case 'openai':
        deps['openai'] = '^4.0.0'
        break
      case 'stripe':
        deps['stripe'] = '^14.0.0'
        break
      // ... etc
    }
  }
  
  return deps
}
```

Update `packages/create-ssot-app/src/create-project.ts`:

```typescript
// After running ssot-codegen generate, create plugin config
if (config.selectedPlugins.length > 0) {
  console.log(pc.cyan('🔌 Configuring plugins...'))
  
  const pluginConfig = generatePluginConfig(config.selectedPlugins)
  
  fs.writeFileSync(
    path.join(projectPath, 'ssot.config.ts'),
    pluginConfig
  )
}

function generatePluginConfig(pluginIds: string[]): string {
  const features: Record<string, any> = {}
  
  for (const id of pluginIds) {
    features[convertPluginIdToConfigKey(id)] = {
      enabled: true
    }
  }
  
  return `import type { CodeGeneratorConfig } from '@ssot-codegen/gen'

export default {
  framework: 'express',
  features: ${JSON.stringify(features, null, 2)}
} satisfies CodeGeneratorConfig
`
}
```

### Phase 4: Enhanced .env Template (20 min)

Update `packages/create-ssot-app/src/templates/env-file.ts`:

```typescript
export function generateEnvFile(config: ProjectConfig): string {
  let env = getBasicEnv(config)
  
  // Add plugin environment variables
  env += '\n# Plugin Configuration\n'
  
  for (const pluginId of config.selectedPlugins) {
    const plugin = PLUGIN_CATALOG.find(p => p.id === pluginId)
    if (!plugin) continue
    
    env += `\n# ${plugin.name}\n`
    for (const envVar of plugin.envVarsRequired) {
      env += `${envVar}=your_${envVar.toLowerCase()}_here\n`
    }
  }
  
  return env
}
```

### Phase 5: Enhanced README (20 min)

Update `packages/create-ssot-app/src/templates/readme.ts`:

```typescript
export function generateReadme(config: ProjectConfig): string {
  let readme = getBaseReadme(config)
  
  if (config.selectedPlugins.length > 0) {
    readme += '\n## 🔌 Plugins Included\n\n'
    
    const grouped = groupPluginsByCategory(
      PLUGIN_CATALOG.filter(p => config.selectedPlugins.includes(p.id))
    )
    
    for (const [category, plugins] of Object.entries(grouped)) {
      readme += `### ${CATEGORY_ICONS[category]} ${CATEGORY_LABELS[category]}\n\n`
      
      for (const plugin of plugins) {
        readme += `- **${plugin.name}**: ${plugin.description}\n`
        if (plugin.envVarsRequired.length > 0) {
          readme += `  - Required: \`${plugin.envVarsRequired.join('`, `')}\`\n`
        }
      }
      readme += '\n'
    }
  }
  
  return readme
}
```

---

## User Experience Enhancements

### Smart Defaults
```typescript
// Pre-select popular/commonly used plugins
const RECOMMENDED_PLUGINS = [
  'jwt-service',      // Most projects need auth
  'usage-tracker',    // Good to have monitoring
]

// Auto-include related plugins
if (selectedPlugins.includes('google-auth')) {
  if (!selectedPlugins.includes('jwt-service')) {
    // Suggest: "Google Auth works best with JWT Service. Add it?"
  }
}
```

### Validation & Warnings
```typescript
// Warn about missing requirements
if (selectedPlugins.includes('google-auth')) {
  if (!config.includeExamples && !hasUserModel(schema)) {
    console.warn('⚠️  Google Auth requires a User model')
    console.warn('   Consider enabling "Include examples" or add User model manually')
  }
}

// Warn about costs
const PAID_SERVICES = ['openai', 'claude', 'stripe', 'sendgrid']
if (selectedPlugins.some(p => PAID_SERVICES.includes(p))) {
  console.log(pc.yellow('\n💡 Note: Some selected plugins require paid API keys'))
}
```

### Interactive Help
```typescript
// Option to show plugin details
{
  type: 'confirm',
  name: 'showPluginDetails',
  message: 'Want to learn more about available plugins?',
  initial: false
}

if (response.showPluginDetails) {
  displayPluginCatalog()  // Pretty-print catalog with details
}
```

---

## Technical Considerations

### ✅ Advantages

1. **Zero Breaking Changes**: Existing projects unaffected
2. **Opt-In**: Plugins are optional - can select none
3. **Metadata Ready**: All plugin info already exists
4. **Type-Safe**: Leverages existing TypeScript interfaces
5. **Tested**: Plugin system already battle-tested
6. **Extensible**: Easy to add new plugins to catalog

### ⚠️ Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Too many choices overwhelming | Categorize + pre-select popular ones |
| Some plugins need User model | Detect & warn if missing |
| API keys required | Generate .env template with placeholders |
| Dependency bloat | Only install dependencies for selected plugins |
| Config complexity | Auto-generate ssot.config.ts |

### 🔍 Edge Cases

1. **No plugins selected**: Skip plugin config generation entirely
2. **Conflicting plugins**: Warn (e.g., multiple email providers)
3. **Missing models**: Suggest enabling examples if plugin needs User model
4. **Local AI models**: Add setup instructions for Ollama/LM Studio

---

## Testing Plan

### Unit Tests
```typescript
describe('Plugin Selection', () => {
  it('generates correct dependencies for selected plugins', () => {
    const deps = getPluginDependencies(['openai', 'stripe'])
    expect(deps).toHaveProperty('openai')
    expect(deps).toHaveProperty('stripe')
  })
  
  it('creates proper .env template', () => {
    const env = generateEnvFile({ selectedPlugins: ['google-auth'] })
    expect(env).toContain('GOOGLE_CLIENT_ID')
    expect(env).toContain('GOOGLE_CLIENT_SECRET')
  })
})
```

### Integration Tests
```bash
# Test project creation with plugins
pnpm exec create-ssot-app test-project \
  --plugins=google-auth,openai,stripe \
  --no-interactive

# Verify:
# 1. package.json has correct dependencies
# 2. .env has all required variables
# 3. ssot.config.ts enables selected plugins
# 4. README documents plugins
```

---

## Rollout Strategy

### Phase 1: Core Implementation (Week 1)
- [ ] Create plugin-catalog.ts
- [ ] Update prompts.ts with multi-select
- [ ] Generate plugin configs

### Phase 2: Polish & Validation (Week 2)
- [ ] Add smart defaults
- [ ] Implement validation/warnings
- [ ] Enhanced error messages

### Phase 3: Testing & Documentation (Week 3)
- [ ] Write unit tests
- [ ] Integration testing
- [ ] Update CLI documentation
- [ ] Create demo video

### Phase 4: Release (Week 4)
- [ ] Beta release (npm tag: beta)
- [ ] Gather feedback
- [ ] Stable release

---

## Alternative Approaches

### Option B: Two-Phase Setup
```
1. Create minimal project (no plugins)
2. Run `pnpm ssot plugins add` later
```
**Pros**: Simpler initial setup  
**Cons**: Extra step, less cohesive experience

### Option C: Plugin Presets
```
Quick select:
- [ ] Starter (JWT + Usage Tracker)
- [ ] AI-Powered (JWT + OpenAI + Vector Search)
- [ ] E-commerce (JWT + Stripe + Email)
- [ ] Custom (manual selection)
```
**Pros**: Faster for common use cases  
**Cons**: May not fit all needs

---

## Recommended Approach

**Use Option A (Enhanced Flow)** with these features:

1. ✅ Multi-select with categories
2. ✅ Pre-select popular plugins (can deselect)
3. ✅ Show description on hover/arrow keys
4. ✅ Validation & warnings
5. ✅ Auto-generate complete configuration

**Why**: Provides best UX while maintaining flexibility

---

## Metrics for Success

- **Adoption Rate**: % of users selecting at least one plugin
- **Popular Plugins**: Which plugins get selected most
- **User Feedback**: Survey satisfaction with plugin selection
- **Time to Project**: Should add < 30 seconds to setup
- **Support Tickets**: Should not increase plugin-related questions

---

## Next Steps

1. **Decision**: Approve approach (Option A recommended)
2. **Estimate**: Refine time estimates based on team availability
3. **Priority**: Determine sprint placement
4. **Design**: Create mockups for plugin selection UI
5. **Implementation**: Follow phased rollout plan

---

## Conclusion

**Verdict**: ✅ **HIGHLY FEASIBLE & RECOMMENDED**

The plugin selection feature:
- Builds on existing, solid foundation
- Enhances user experience significantly
- Low risk, high value
- Easy to maintain and extend

**Estimated Effort**: 2-3 development days + 1 day testing = ~1 week total

**User Impact**: 🌟🌟🌟🌟🌟 (5/5) - Major improvement to onboarding experience

