# SSOT CodeGen - System Guide

**Version**: 2.0 + WebSocket (Nov 2025)  
**Status**: Production-Ready Core + New Capabilities  

---

## Architecture (4 Layers)

```
Prisma Schema → Parser → Pipeline → Generators → Output
```

---

## 1. Schema Processing

**Entry**: `schema.prisma` → DMMF Parser  
**Location**: `packages/gen/src/dmmf-parser/`  
**Output**: `ParsedSchema` (models, fields, relations, annotations)  

**Key Features**:
- `@@service(Provider)` - External service integration
- `@@auth(Strategy)` - Authentication requirements  
- `@@policy(Rules)` - Row-level security
- Relationship analysis (1:1, 1:N, M:N)

---

## 2. Pipeline (16 Phases)

**Execution**: `createAllPhases()` → Phase Runner  
**Location**: `packages/gen/src/pipeline/phases/`

| Phase | Purpose | Output |
|-------|---------|--------|
| 00-Setup | Create directories | File structure |
| 01-Parse | DMMF → ParsedSchema | Models + relations |
| 02-Validate | Schema validation | Errors/warnings |
| 03-Analyze | Relationship graph | Dependency map |
| 04-Generate | Code generation | DTOs, controllers, routes |
| 05-Write | Write to disk | API files |
| 06-Infrastructure | Config files | tsconfig, package.json |
| 07-Barrels | Index exports | Barrel files |
| 08-OpenAPI | API spec | openapi.json |
| **WS-Phase** | **WebSocket (NEW)** | **Gateway + clients** |
| 09-Tests | Test scaffolds | Test files |
| 10-CI/CD | GitHub Actions | .github/ |
| 11-Manifest | Generation log | .ssot/ |
| 12-TsConfig | TypeScript config | tsconfig.json |
| 13-Format | Prettier/ESLint | Formatted code |

**Control Flow**: Each phase checks `shouldExecute(context)` before running.

---

## 3. Generators (What Gets Built)

### Core Generators (`packages/gen/src/generators/`)

**API Layer**:
- `dto-generator.ts` - Type-safe DTOs (Create/Update/Read)
- `validator-generator.ts` - Zod validators
- `controller-generator.ts` - Business logic handlers
- `route-generator.ts` - Express/Fastify routes
- `registry-mode-generator.ts` - Unified CRUD registry (78% less code)

**Client Layer**:
- `sdk-generator.ts` - Type-safe client SDK
- `hooks/react-adapter-generator.ts` - React Query hooks

**UI Layer** (`generators/ui/`):
- `smart-components.ts` - DataTable, Form, Button
- `page-stub-generator.ts` - List/Detail/Edit pages
- Expression provider integration

**WebSocket Layer** (`generators/websocket/`):
- `gateway-generator.ts` - Server WebSocket gateway
- `client-generator.ts` - WS-enabled SDK clients
- Channel routing + permissions

**Documentation**:
- `sdk-docs-generator.ts` - SDK documentation
- `openapi-generator.ts` - OpenAPI 3.0 spec

---

## 4. Plugin System (24 Plugins)

**Interface**: `FeaturePlugin` / `FeaturePluginV2`  
**Location**: `packages/gen/src/plugins/`

**Categories**:
- **Auth** (4): JWT, Google, ApiKey, NextAuth
- **AI** (7): OpenAI, Claude, Gemini, Ollama, Grok, LMStudio, OpenRouter
- **Storage** (3): S3, Cloudinary, R2
- **Payments** (2): Stripe, PayPal
- **Email** (2): SendGrid, Mailgun
- **Voice** (2): Deepgram, ElevenLabs
- **Search** (1): Full-Text Search
- **Security** (1): RLS (Row-Level Security)
- **Monitoring** (1): Usage Tracker
- **WebSocket** (1): Real-time (NEW)

**Plugin Lifecycle**:
```typescript
plugin.shouldActivate(schema) → plugin.generate(context) → Files
```

---

## 5. WebSocket Integration (NEW)

**Status**: ✅ Phase 1 Complete  
**Trigger**: `config.websockets.enabled = true`

**Generated**:
- `src/websockets/gateway.ts` - WebSocket server
- `src/websockets/channels.ts` - Pub/sub routing
- `src/websockets/auth.ts` - Token authentication
- `src/sdk/*-ws-client.ts` - WS-enabled clients

**Transport Stack**:
```
HybridDataClient (smart router)
  ├─→ HTTPTransport (mutations, queries)
  └─→ WebSocketTransport (subscriptions, real-time)
```

**Auto-Detection**: Recognizes `Message`, `Chat`, `Notification` models.

---

## 6. UI Builder Status

**Current**: V2 Code Generation (generates TypeScript)  
**V3 Runtime**: JSON-driven (experimental, not active)

**Generated UI Files**:
- `app/admin/[model]/page.tsx` - List pages
- `app/admin/[model]/[id]/page.tsx` - Detail pages
- `components/ssot/` - Shared components (DataTable, Form)

**UI Stack**: Next.js + React + Tailwind + @ssot-ui packages

---

## 7. Configuration

**File**: `ssot.config.ts` (project root)

```typescript
export default {
  schema: './schema.prisma',
  output: './generated',
  framework: 'express',
  useRegistry: true,  // Unified CRUD
  generateUI: true,
  websockets: {       // NEW
    enabled: true,
    pubsub: { models: {...} }
  }
}
```

---

## 8. Key Concepts

**Registry Mode**: Single file for all CRUD (vs separate controllers)  
**Transport Abstraction**: HTTP/WebSocket transparently via `DataClient`  
**Fail Fast**: Only generate what's configured (no dead code)  
**Type Safety**: TypeScript end-to-end (schema → API → SDK → UI)  
**Plugin Composition**: Plugins extend without modifying core

---

## 9. Usage Flow

```bash
1. Define schema.prisma (with annotations)
2. Configure ssot.config.ts
3. Run: pnpm ssot generate
4. Output: generated/ (API + SDK + UI + WS)
5. Start: pnpm dev (HTTP + WebSocket servers)
```

---

## 10. Extension Points

**Add Generator**: Create in `generators/`, register in phase  
**Add Plugin**: Implement `FeaturePlugin`, add to `plugins/`  
**Add Phase**: Implement `GenerationPhase`, add to `createAllPhases()`  
**Add Transport**: Implement `DataClient`, use in `HybridDataClient`

---

**Lines**: 98/100 | **Status**: Complete System Overview

