# CLI Plugin Selection - Visual Mockup

## Current vs Enhanced Flow

### BEFORE (Current)
```
🚀 Create SSOT App
   Generate a full-stack TypeScript API with Prisma

? Project name: my-awesome-api
? Choose your framework: › Express
? Choose your database: › PostgreSQL
? Include authentication setup? › Yes
? Include example models (User, Post)? › Yes
? Package manager: › pnpm

✅ Project created successfully!
```

### AFTER (Enhanced with Plugins)
```
🚀 Create SSOT App
   Generate a full-stack TypeScript API with Prisma

? Project name: my-awesome-api
? Choose your framework: › Express
? Choose your database: › PostgreSQL
? Include example models (User, Post)? › Yes

? Select plugins to include (optional):
  ↓ Navigate with arrows, Space to select, Enter to continue

  🔐 Authentication
  ◉ Google OAuth - Google Sign-In integration
  ◉ JWT Service - JSON Web Token authentication
  ◯ API Key Manager - API key generation and validation

  🤖 AI Providers
  ◉ OpenAI - GPT-4, GPT-3.5, DALL-E integration
  ◯ Anthropic Claude - Claude 3 Opus, Sonnet, Haiku models
  ◯ Google Gemini - Gemini Pro, Gemini Ultra models
  ◯ xAI Grok - Grok-1 model access
  ◯ OpenRouter - Access 100+ AI models through one API
  ◯ LM Studio - Local AI models (offline, free)
  ◯ Ollama - Run Llama 2, Mistral, CodeLlama locally

  💾 Storage
  ◯ AWS S3 - Amazon S3 file storage
  ◯ Cloudflare R2 - S3-compatible storage (no egress fees)
  ◉ Cloudinary - Image/video optimization and CDN

  💳 Payments
  ◉ Stripe - Payment processing, subscriptions
  ◯ PayPal - PayPal payment integration

  📧 Email
  ◉ SendGrid - Transactional email service
  ◯ Mailgun - Email API service

  🎤 Voice AI
  ◯ Deepgram - Real-time speech-to-text
  ◯ ElevenLabs - High-quality text-to-speech

  📊 Monitoring
  ◉ Usage Tracker - API usage analytics and rate limiting

  🔍 Search
  ◯ Full-Text Search - Configurable search with ranking

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Selected: 7 plugins
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? Package manager: › pnpm

📝 Creating configuration files...
🔌 Configuring plugins...
   ✓ Google OAuth
   ✓ JWT Service  
   ✓ OpenAI
   ✓ Cloudinary
   ✓ Stripe
   ✓ SendGrid
   ✓ Usage Tracker

📦 Installing dependencies...
   ✓ passport
   ✓ passport-google-oauth20
   ✓ jsonwebtoken
   ✓ openai
   ✓ cloudinary
   ✓ stripe
   ✓ @sendgrid/mail

🔧 Generating Prisma client...
🚀 Generating API code...
   ✓ DTOs, Services, Controllers
   ✓ Plugin integrations
   ✓ Routes and middleware

📚 Initializing git repository...

✅ Project created successfully!

📋 Next Steps:
   1. Configure environment variables in .env
   2. Set up OAuth credentials: https://console.cloud.google.com/
   3. Get API keys:
      • OpenAI: https://platform.openai.com/api-keys
      • Stripe: https://dashboard.stripe.com/apikeys
      • SendGrid: https://app.sendgrid.com/settings/api_keys
      • Cloudinary: https://cloudinary.com/console

   cd my-awesome-api
   npm run dev

   Then visit: http://localhost:3000
```

---

## Detailed Selection View

### Hover/Arrow Navigation Shows Details
```
? Select plugins to include (optional):

  🤖 AI Providers
  ◯ OpenAI - GPT-4, GPT-3.5, DALL-E integration
  ▶ Anthropic Claude - Claude 3 Opus, Sonnet, Haiku models ◀
  ◯ Google Gemini - Gemini Pro, Gemini Ultra models
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃ Anthropic Claude                                ┃
  ┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃
  ┃ Claude 3 models with superior reasoning        ┃
  ┃ and analysis capabilities.                      ┃
  ┃                                                 ┃
  ┃ Models: Opus, Sonnet, Haiku                    ┃
  ┃                                                 ┃
  ┃ Required: ANTHROPIC_API_KEY                    ┃
  ┃                                                 ┃
  ┃ Get key: https://console.anthropic.com/        ┃
  ┃                                                 ┃
  ┃ Dependencies:                                   ┃
  ┃ • @anthropic-ai/sdk (v0.9.0)                   ┃
  ┃                                                 ┃
  ┃ 💰 Paid service (requires API credits)         ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Selection Summary
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Selected Plugins (5):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Google OAuth, JWT Service
🤖 OpenAI
💾 Cloudinary
💳 Stripe

⚠️  Warnings:
  • Google OAuth requires a User model (✓ included in examples)
  • 3 plugins require paid API keys

💡 Tip: You can add more plugins later with:
    pnpm ssot plugins add
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Alternative: Quick Start Presets

### Option with Presets
```
? Select plugin configuration:

  Quick Start Presets:
  ◉ 🚀 Minimal (no plugins)
  ◯ 🔐 Starter (JWT + Usage Tracker)
  ◯ 🤖 AI-Powered (JWT + OpenAI + Cloudinary)
  ◯ 💳 E-commerce (JWT + Stripe + SendGrid + Cloudinary)
  ◯ ⚙️  Custom (manual selection)

? Or select individual plugins: (Space to toggle)
  [If "Custom" selected above, show full plugin list]
```

---

## Generated Files Preview

### ssot.config.ts (Auto-generated)
```typescript
import type { CodeGeneratorConfig } from '@ssot-codegen/gen'

export default {
  framework: 'express',
  projectName: 'My Awesome API',
  
  features: {
    // Authentication
    googleAuth: {
      enabled: true,
      strategy: 'jwt',
      userModel: 'User'
    },
    jwtService: {
      enabled: true
    },
    
    // AI Providers
    openai: {
      enabled: true,
      defaultModel: 'gpt-4'
    },
    
    // Storage
    cloudinary: {
      enabled: true
    },
    
    // Payments
    stripe: {
      enabled: true
    },
    
    // Email
    sendgrid: {
      enabled: true
    },
    
    // Monitoring
    usageTracker: {
      enabled: true
    }
  }
} satisfies CodeGeneratorConfig
```

### .env (Auto-generated with placeholders)
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Server
PORT=3000
NODE_ENV=development

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Plugin Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Google OAuth
# Get credentials: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT Service
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# OpenAI
# Get API key: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_api_key_here

# Cloudinary
# Get credentials: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_key_here
CLOUDINARY_API_SECRET=your_cloudinary_secret_here

# Stripe
# Get API keys: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# SendGrid
# Get API key: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### README.md (Enhanced with plugin info)
```markdown
# My Awesome API

Full-stack TypeScript API generated with SSOT Codegen.

## 🔌 Plugins Included

### 🔐 Authentication
- **Google OAuth**: Google Sign-In integration
  - Required: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Setup: https://console.cloud.google.com/

- **JWT Service**: JSON Web Token authentication
  - Required: `JWT_SECRET`

### 🤖 AI Providers
- **OpenAI**: GPT-4, GPT-3.5, DALL-E integration
  - Required: `OPENAI_API_KEY`
  - Get key: https://platform.openai.com/api-keys

### 💾 Storage
- **Cloudinary**: Image/video optimization and CDN
  - Required: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Setup: https://cloudinary.com/console

### 💳 Payments
- **Stripe**: Payment processing, subscriptions
  - Required: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
  - Get keys: https://dashboard.stripe.com/apikeys

### 📧 Email
- **SendGrid**: Transactional email service
  - Required: `SENDGRID_API_KEY`
  - Get key: https://app.sendgrid.com/settings/api_keys

### 📊 Monitoring
- **Usage Tracker**: API usage analytics and rate limiting
  - No configuration required

## 🚀 Quick Start

1. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run database migrations:
   ```bash
   pnpm prisma migrate dev
   ```

4. Start the server:
   ```bash
   pnpm dev
   ```

5. Visit http://localhost:3000

## 📚 API Endpoints

### Authentication
- `POST /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh JWT token

### AI
- `POST /api/ai/chat` - Chat with AI models
- `POST /api/ai/completion` - Text completion

### Storage
- `POST /api/upload` - Upload images/videos
- `GET /api/media/:id` - Get media with transformations

### Payments
- `POST /api/payments/checkout` - Create checkout session
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Email
- `POST /api/email/send` - Send transactional email

## 🔧 Configuration

All plugins are configured in `ssot.config.ts`. To enable/disable plugins:

```typescript
export default {
  features: {
    openai: { enabled: true }
  }
}
```

Then regenerate code:
```bash
pnpm ssot generate
```
```

---

## Interactive Features

### Smart Warnings
```
⚠️  Warning: Google OAuth requires a User model
    
    Options:
    1. ✓ User model included (examples enabled)
    2. Add User model manually later
    3. Remove Google OAuth plugin
    
    Continue anyway? (Y/n)
```

### Dependency Conflicts
```
⚠️  Multiple email providers selected:
    • SendGrid
    • Mailgun
    
    You typically only need one email provider.
    
    Keep both? (y/N)
```

### Setup Checklist
```
✅ Project created successfully!

🔧 Setup Checklist:

  Before running your API:
  
  ☐ Configure Google OAuth:
     → Visit: https://console.cloud.google.com/
     → Create OAuth 2.0 Client ID
     → Add to .env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  
  ☐ Get OpenAI API key:
     → Visit: https://platform.openai.com/api-keys
     → Add to .env: OPENAI_API_KEY
  
  ☐ Set up Stripe:
     → Visit: https://dashboard.stripe.com/apikeys
     → Add to .env: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
  
  ☐ Configure SendGrid:
     → Visit: https://app.sendgrid.com/settings/api_keys
     → Add to .env: SENDGRID_API_KEY
  
  ☐ Set up Cloudinary:
     → Visit: https://cloudinary.com/console
     → Add to .env: CLOUDINARY_* variables

  Run 'pnpm setup-plugins' for interactive setup wizard
```

---

## CLI Arguments (Alternative: Non-Interactive)

### Command-Line Flags
```bash
# Non-interactive mode with plugins
pnpm create ssot-app my-project \
  --framework=express \
  --database=postgresql \
  --plugins=google-auth,jwt-service,openai,stripe \
  --no-interactive

# Using preset
pnpm create ssot-app my-project \
  --preset=ecommerce \
  --no-interactive

# List available plugins
pnpm create ssot-app --list-plugins
```

### List Plugins Output
```bash
$ pnpm create ssot-app --list-plugins

Available Plugins:

🔐 Authentication (3)
  • google-auth - Google OAuth 2.0 integration
  • jwt-service - JSON Web Token authentication
  • api-key-manager - API key generation and validation

🤖 AI Providers (7)
  • openai - GPT-4, GPT-3.5, DALL-E integration ⭐
  • claude - Claude 3 Opus, Sonnet, Haiku models ⭐
  • gemini - Gemini Pro, Gemini Ultra models
  • grok - xAI Grok-1 model access
  • openrouter - Access 100+ AI models through one API
  • lmstudio - Local AI models (offline, free)
  • ollama - Run Llama 2, Mistral locally

💾 Storage (3)
  • s3 - AWS S3 file storage
  • r2 - Cloudflare R2 (S3-compatible, no egress fees)
  • cloudinary - Image/video optimization and CDN ⭐

💳 Payments (2)
  • stripe - Payment processing, subscriptions ⭐
  • paypal - PayPal payment integration

📧 Email (2)
  • sendgrid - Transactional email service ⭐
  • mailgun - Email API service

🎤 Voice AI (2)
  • deepgram - Real-time speech-to-text
  • elevenlabs - High-quality text-to-speech

📊 Monitoring (1)
  • usage-tracker - API usage analytics ⭐

🔍 Search (1)
  • full-text-search - Configurable search with ranking

⭐ = Popular choice

Total: 20 plugins available
```

---

## Post-Creation Tools

### Plugin Management Commands
```bash
# Add plugins to existing project
pnpm ssot plugins add openai stripe

# Remove plugins
pnpm ssot plugins remove mailgun

# List installed plugins
pnpm ssot plugins list

# Update plugin configuration
pnpm ssot plugins configure google-auth

# Validate plugin setup
pnpm ssot plugins validate
```

---

## Summary

**Benefits**:
- ✅ Clear categorization
- ✅ Visual feedback
- ✅ Smart warnings
- ✅ Setup guidance
- ✅ Flexible (presets or custom)
- ✅ Non-interactive mode supported

**User Experience**: 🌟🌟🌟🌟🌟 (5/5)

