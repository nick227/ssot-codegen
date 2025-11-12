# AI Chat SPA Schema

Single-page application schema for an AI-powered chat interface with real-time streaming via WebSocket.

## Overview

This schema defines a complete AI chat application with:
- **User authentication** (JWT-based)
- **Conversation management** (multiple chat sessions)
- **Message history** (with streaming support)
- **AI provider integration** (OpenAI, Claude, Gemini)
- **Token usage tracking** (for cost estimation)
- **User preferences** (chat settings)

## Models

### User
- Authentication and user profile
- Links to conversations and messages
- Optional chat settings

### Conversation
- Chat session container
- AI provider configuration (OpenAI, Claude, etc.)
- Model settings (temperature, max tokens)
- Usage tracking (message count, tokens, cost)

### Message
- Individual chat messages (user/assistant/system)
- Token usage per message
- Streaming support (chunks stored as JSON)
- Cost estimation per message
- Markdown/HTML rendering support

### ChatSettings
- User preferences for chat interface
- Default AI provider/model settings
- UI customization (theme, font size)
- Feature toggles (streaming, markdown, code highlight)

## Features

### Real-time Streaming
- WebSocket connection for live message updates
- Stream chunks stored in `streamChunks` JSON field
- `isStreaming` flag for UI state management

### Token Tracking
- Per-message token counts (prompt, completion, total)
- Conversation-level token aggregation
- Cost estimation based on model pricing

### Multi-Provider Support
- OpenAI (GPT-4, GPT-3.5)
- Claude (Anthropic)
- Gemini (Google)
- Configurable per conversation

## Usage

### Generate Project

```bash
# Generate this specific project
npx ssot-gen bulk --config websites/config/bulk-generate.json

# Or generate all projects
npx ssot-gen bulk
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_chat"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_ORG_ID="org-..." # Optional

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
```

### Plugin Configuration

The `ssot.config.ts` file enables:
- OpenAI plugin (GPT-4 Turbo)
- WebSocket support
- JWT authentication

## UI Components Generated

- `ChatMessage` - Individual message display
- `ChatInput` - Message input with send button
- `ChatConversationList` - Sidebar with conversation history
- `ChatSettingsForm` - Settings page form
- `TokenCounter` - Token usage display
- `CostEstimate` - Cost estimation display
- `ModelSelector` - AI model selection dropdown
- `ProviderSelector` - AI provider selection

## WebSocket Events

- `message.created` - New message received
- `message.updated` - Message updated (streaming chunks)
- `message.streaming` - Real-time streaming update
- `conversation.created` - New conversation started
- `conversation.updated` - Conversation metadata updated

## Next Steps

1. Review the generated schema and UI config
2. Customize theme colors and layout
3. Add additional AI providers if needed
4. Configure WebSocket endpoints
5. Test streaming functionality

