# Plugin Configuration Guide

Complete guide to configuring feature plugins in SSOT Codegen.

---

## Overview

SSOT Codegen supports **20+ feature plugins** for authentication, AI, storage, payments, email, and more. Plugins are **opt-in** and can be configured through:

1. **Config file** (recommended) - `ssot.config.ts/js/json`
2. **Environment variables** - `SSOT_PLUGIN_*` or legacy `ENABLE_*`
3. **Programmatic API** - Pass config to generator

---

## Quick Start

### 1. Create Config File

Create `ssot.config.ts` in your project root:

```typescript
export default {
  features: {
    openai: {
      enabled: true,
      defaultModel: 'gpt-4-turbo'
    },
    stripe: {
      enabled: true
    },
    sendgrid: {
      enabled: true,
      fromEmail: 'noreply@example.com'
    }
  }
}
```

### 2. Generate Code

```bash
pnpm ssot generate my-schema.prisma
```

The generator automatically:
- ✅ Loads `ssot.config.ts`
- ✅ Merges with environment variables
- ✅ Generates enabled plugin code
- ✅ Adds dependencies to `package.json`
- ✅ Adds env vars to `.env.example`

---

## Configuration Sources

### Priority Order (highest to lowest)

1. **Explicit config** - Passed directly to `generateFromSchema()`
2. **Config file** - `ssot.config.ts/js/json` or `package.json`
3. **Environment variables** - `SSOT_PLUGIN_*` format

---

## Config File Formats

### TypeScript (Recommended)

**File:** `ssot.config.ts`

```typescript
import type { PluginFeatureConfig } from '@ssot-codegen/gen'

const config: { features: PluginFeatureConfig } = {
  features: {
    openai: {
      enabled: true,
      defaultModel: 'gpt-4-turbo'
    }
  }
}

export default config
```

### JavaScript

**File:** `ssot.config.js`

```javascript
export default {
  features: {
    openai: {
      enabled: true,
      defaultModel: 'gpt-4-turbo'
    }
  }
}
```

### JSON

**File:** `ssot.config.json`

```json
{
  "features": {
    "openai": {
      "enabled": true,
      "defaultModel": "gpt-4-turbo"
    }
  }
}
```

### Package.json

**File:** `package.json`

```json
{
  "name": "my-project",
  "ssot": {
    "features": {
      "openai": {
        "enabled": true
      }
    }
  }
}
```

---

## Environment Variables

### New Format (Recommended)

```bash
# AI Providers
SSOT_PLUGIN_OPENAI_ENABLED=true
SSOT_PLUGIN_OPENAI_DEFAULT_MODEL=gpt-4-turbo

SSOT_PLUGIN_CLAUDE_ENABLED=true
SSOT_PLUGIN_CLAUDE_DEFAULT_MODEL=claude-3-sonnet-20240229

# Storage
SSOT_PLUGIN_S3_ENABLED=true
SSOT_PLUGIN_S3_REGION=us-east-1
SSOT_PLUGIN_S3_BUCKET=my-bucket

# Payments
SSOT_PLUGIN_STRIPE_ENABLED=true

# Email
SSOT_PLUGIN_SENDGRID_ENABLED=true
SSOT_PLUGIN_SENDGRID_FROM_EMAIL=noreply@example.com
```

### Legacy Format (Backward Compatible)

```bash
# Google Auth (still supported)
ENABLE_GOOGLE_AUTH=true
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
AUTH_STRATEGY=jwt
AUTH_USER_MODEL=User
```

---

## Available Plugins

### Authentication (4 plugins)

#### Google OAuth
```typescript
googleAuth: {
  enabled: true,
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_SECRET',
  callbackURL: 'http://localhost:3000/auth/google/callback',
  strategy: 'jwt',  // 'jwt' | 'session'
  userModel: 'User'
}
```

#### JWT Service
```typescript
jwtService: {
  enabled: true
}
```

#### API Key Manager
```typescript
apiKeyManager: {
  enabled: true
}
```

### AI Providers (7 plugins)

#### OpenAI
```typescript
openai: {
  enabled: true,
  defaultModel: 'gpt-4-turbo'  // or 'gpt-4', 'gpt-3.5-turbo'
}
```

#### Claude (Anthropic)
```typescript
claude: {
  enabled: true,
  defaultModel: 'claude-3-sonnet-20240229'
}
```

#### Google Gemini
```typescript
gemini: {
  enabled: true,
  defaultModel: 'gemini-pro'
}
```

#### xAI Grok
```typescript
grok: {
  enabled: true
}
```

#### OpenRouter (Unified Gateway)
```typescript
openrouter: {
  enabled: true,
  defaultModel: 'anthropic/claude-3-opus'
}
```

#### LM Studio (Local)
```typescript
lmstudio: {
  enabled: true,
  endpoint: 'http://localhost:1234/v1'
}
```

#### Ollama (Local)
```typescript
ollama: {
  enabled: true,
  endpoint: 'http://localhost:11434',
  models: ['llama2', 'mistral', 'codellama']
}
```

### Voice AI (2 plugins)

#### Deepgram (Speech-to-Text)
```typescript
deepgram: {
  enabled: true,
  defaultModel: 'nova-2'
}
```

#### ElevenLabs (Text-to-Speech)
```typescript
elevenlabs: {
  enabled: true,
  defaultVoice: 'rachel'
}
```

### Storage (3 plugins)

#### AWS S3
```typescript
s3: {
  enabled: true,
  region: 'us-east-1',
  bucket: 'my-bucket'
}
```

#### Cloudflare R2
```typescript
r2: {
  enabled: true,
  accountId: 'YOUR_ACCOUNT_ID',
  bucket: 'my-r2-bucket'
}
```

#### Cloudinary
```typescript
cloudinary: {
  enabled: true,
  cloudName: 'my-cloud'
}
```

### Payments (2 plugins)

#### Stripe
```typescript
stripe: {
  enabled: true
}
```

#### PayPal
```typescript
paypal: {
  enabled: true,
  mode: 'sandbox'  // or 'live'
}
```

### Email (2 plugins)

#### SendGrid
```typescript
sendgrid: {
  enabled: true,
  fromEmail: 'noreply@example.com'
}
```

#### Mailgun
```typescript
mailgun: {
  enabled: true,
  domain: 'mg.example.com'
}
```

### Monitoring (1 plugin)

#### Usage Tracker
```typescript
usageTracker: {
  enabled: true
}
```

---

## Usage Examples

### Minimal AI Setup

```typescript
// ssot.config.ts
export default {
  features: {
    openai: { enabled: true }
  }
}
```

### Multi-Provider AI

```typescript
// ssot.config.ts
export default {
  features: {
    openai: { enabled: true, defaultModel: 'gpt-4-turbo' },
    claude: { enabled: true, defaultModel: 'claude-3-opus' },
    gemini: { enabled: true }
  }
}
```

### Full-Stack SaaS

```typescript
// ssot.config.ts
export default {
  features: {
    // Auth
    googleAuth: { enabled: true, strategy: 'jwt' },
    jwtService: { enabled: true },
    
    // AI
    openai: { enabled: true },
    claude: { enabled: true },
    
    // Payments
    stripe: { enabled: true },
    
    // Email
    sendgrid: { enabled: true, fromEmail: 'noreply@myapp.com' },
    
    // Storage
    r2: { enabled: true, bucket: 'myapp-uploads' },
    
    // Monitoring
    usageTracker: { enabled: true }
  }
}
```

---

## Programmatic API

```typescript
import { generateFromSchema } from '@ssot-codegen/gen'

await generateFromSchema({
  schemaPath: './schema.prisma',
  framework: 'express',
  features: {
    openai: { enabled: true, defaultModel: 'gpt-4' },
    stripe: { enabled: true }
  }
})
```

---

## Plugin vs Service

### Plugins
- **Toggle-based infrastructure** (OpenAI, Stripe, S3...)
- Configured via `ssot.config.ts` or env vars
- Generate reusable service modules
- Independent of Prisma schema

### Services
- **Schema-driven workflows** (custom business logic)
- Declared via `/// @service` annotations in Prisma schema
- Generate controllers/routes/SDK around your implementation
- Model-specific

**Example:**
```prisma
/// @service chat-assistant
/// @methods sendMessage, listHistory
/// @provider openai
model Conversation {
  id Int @id @default(autoincrement())
  userId Int
  messages Json
}
```

Generates controller/routes that call **your** service implementation, which can use the `openai` **plugin** underneath.

---

## Best Practices

### 1. Use Config File for Team Projects
✅ **Do:** Create `ssot.config.ts` and commit it
❌ **Don't:** Rely on env vars for team-shared config

### 2. Use Env Vars for Secrets
✅ **Do:** `clientId: process.env.GOOGLE_CLIENT_ID`
❌ **Don't:** Hardcode secrets in config file

### 3. Enable Only What You Need
✅ **Do:** Enable 2-3 plugins you actually use
❌ **Don't:** Enable all 20 plugins "just in case"

### 4. Document Your Choices
✅ **Do:** Add comments explaining why plugins are enabled
❌ **Don't:** Leave teammates guessing

---

## Troubleshooting

### Config Not Loading

**Problem:** Plugins not generating despite config file

**Solutions:**
1. Check file name: `ssot.config.ts` (not `ssot-config.ts`)
2. Check location: Must be in project root
3. Check syntax: Run `tsc ssot.config.ts` to validate
4. Check exports: Must `export default { features: {...} }`

### Plugin Validation Errors

**Problem:** `❌ Plugin 'openai' validation failed`

**Solutions:**
1. Check required env vars are set
2. Check required Prisma models exist (e.g., `User` for auth)
3. Review validation warnings in console

### Conflicting Configuration

**Problem:** Env vars override config file

**Remember priority:**
1. Explicit config (highest)
2. Config file
3. Env vars (lowest)

To force config file: Don't set `SSOT_PLUGIN_*` env vars

---

## Migration from Env-Only

### Before (env only)
```bash
ENABLE_GOOGLE_AUTH=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### After (config file)
```typescript
// ssot.config.ts
export default {
  features: {
    googleAuth: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  }
}
```

`.env` still holds secrets, but config declares intent.

---

## Next Steps

- See [`ssot.config.example.ts`](../ssot.config.example.ts) for full example
- See [`PROVIDER_PLUGINS_INDEX.md`](./PROVIDER_PLUGINS_INDEX.md) for plugin catalog
- See [`CLI_USAGE.md`](./CLI_USAGE.md) for CLI options

---

**Config file + env vars = declarative, version-controlled plugin management!** 🚀

