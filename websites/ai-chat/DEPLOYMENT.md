# AI Chat SPA - Deployment Guide

Step-by-step guide to build, deploy, and test the AI Chat SPA in your browser.

## Prerequisites

- Node.js 18+ and pnpm installed
- PostgreSQL database running
- OpenAI API key
- Git (for cloning if needed)

---

## Step 1: Generate the Project

Generate the AI Chat SPA from the schema and configuration:

```bash
# From project root
cd C:\wamp64\www\ssot-codegen

# Generate the AI Chat project
npx ssot-gen bulk --config websites/config/bulk-generate.json
```

This will:
- Parse `websites/ai-chat/schema.prisma`
- Load `websites/ai-chat/ui.config.ts`
- Load `websites/ai-chat/ssot.config.ts`
- Generate all backend code (services, controllers, routes)
- Generate all frontend code (React components, hooks, pages)
- Generate WebSocket handlers
- Generate OpenAI integration
- Output to `websites/ai-chat/generated/`

**Expected Output:**
```
📋 Loading bulk config: websites/config/bulk-generate.json
📦 Found 3 projects to generate
📦 Generating project: AI Chat SPA (ai-chat)
✅ Generated 150+ files for AI Chat SPA
```

---

## Step 2: Navigate to Generated Project

```bash
cd websites/ai-chat/generated
```

---

## Step 3: Install Dependencies

```bash
# Install all dependencies
pnpm install

# Or if using npm
npm install
```

**Dependencies include:**
- Express/Fastify server
- Prisma client
- React + React Query
- WebSocket libraries
- OpenAI SDK
- TypeScript

---

## Step 4: Set Up Environment Variables

Create a `.env` file in the generated project:

```bash
# Copy example if available
cp .env.example .env

# Or create manually
```

**Required `.env` variables:**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_chat"

# OpenAI API
OPENAI_API_KEY="sk-your-openai-api-key-here"
OPENAI_ORG_ID="org-your-org-id"  # Optional

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3000
WS_PORT=3001

# WebSocket
WS_PATH="/ws"
WS_RECONNECT=true
WS_MAX_RECONNECT_ATTEMPTS=5

# CORS (for development)
CORS_ORIGIN="http://localhost:3000"
```

**Get OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste into `.env` file

---

## Step 5: Set Up Database

### 5.1 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ai_chat;

# Exit psql
\q
```

### 5.2 Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Or push schema without migrations (dev only)
npx prisma db push
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ Database tables created
```

### 5.3 Verify Database Schema

```bash
# Open Prisma Studio to view database
npx prisma studio
```

This opens http://localhost:5555 - verify tables are created:
- `users`
- `conversations`
- `messages`
- `chat_settings`

---

## Step 6: Build the Project

### 6.1 Build Backend

```bash
# Build TypeScript backend
pnpm build

# Or
npm run build
```

### 6.2 Build Frontend (if separate build step)

```bash
# Build React app
pnpm build:frontend

# Or check package.json for exact command
```

---

## Step 7: Start the Server

### 7.1 Development Mode

```bash
# Start development server
pnpm dev

# Or
npm run dev
```

**Expected Output:**
```
🚀 Server running on http://localhost:3000
🔌 WebSocket server running on ws://localhost:3001
📡 OpenAI plugin enabled
✅ Database connected
```

### 7.2 Production Mode

```bash
# Build first
pnpm build

# Start production server
pnpm start

# Or
npm start
```

---

## Step 8: Open in Browser

1. **Open browser:** Navigate to `http://localhost:3000`

2. **Expected UI:**
   - Dark theme chat interface
   - Message input at bottom
   - Conversation list (sidebar, if configured)
   - Settings page accessible

3. **First-time setup:**
   - May need to create a user account
   - Or use demo/test authentication

---

## Step 9: Test the Chat Interface

### 9.1 Create a Conversation

1. Click "New Conversation" or start typing
2. Type a message: `Hello, how are you?`
3. Press Enter or click Send

### 9.2 Verify Streaming

- Message should appear immediately
- AI response should stream in real-time
- Token counter should update
- Cost estimate should appear

### 9.3 Check WebSocket Connection

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Should see connection to `/ws`
5. Messages should appear in real-time

### 9.4 Test Settings

1. Navigate to `/settings`
2. Change AI model (e.g., `gpt-4-turbo` → `gpt-3.5-turbo`)
3. Adjust temperature
4. Save settings
5. Create new conversation to test

---

## Step 10: Verify Backend Logs

Check server console for:

```
✅ Message created: { id: '...', role: 'user' }
🤖 OpenAI API call: gpt-4-turbo
📊 Tokens used: { prompt: 50, completion: 100 }
💰 Estimated cost: $0.002
✅ Message created: { id: '...', role: 'assistant' }
🔌 WebSocket broadcast: message.created
```

---

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
# Windows: Check Services
# Verify DATABASE_URL in .env
```

### OpenAI API Error

```
Error: Invalid API key
```
**Fix:** Verify `OPENAI_API_KEY` in `.env` is correct

### WebSocket Not Connecting

```
WebSocket connection failed
```
**Fix:** 
- Check `WS_PORT` in `.env`
- Verify CORS settings
- Check firewall/antivirus blocking port

### Port Already in Use

```
Error: Port 3000 already in use
```
**Fix:**
```bash
# Change PORT in .env
PORT=3001
```

### Prisma Client Not Generated

```bash
# Regenerate Prisma Client
npx prisma generate
```

---

## Quick Test Checklist

- [ ] Project generated successfully
- [ ] Dependencies installed
- [ ] `.env` file configured
- [ ] Database created and migrated
- [ ] Server starts without errors
- [ ] Browser opens to `http://localhost:3000`
- [ ] Can send a message
- [ ] AI responds (streaming)
- [ ] WebSocket connection active
- [ ] Token counter updates
- [ ] Settings page works
- [ ] Database stores messages

---

## Next Steps

- Customize theme colors in `ui.config.ts`
- Add more AI providers (Claude, Gemini)
- Implement user authentication
- Add conversation history
- Deploy to production

---

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use secure `JWT_SECRET`
3. Configure production database
4. Set up HTTPS
5. Configure CORS for production domain
6. Use environment-specific configs
7. Set up monitoring/logging
8. Configure rate limiting

---

## Support

If you encounter issues:
1. Check server logs
2. Check browser console (F12)
3. Verify all environment variables
4. Check database connection
5. Verify OpenAI API key is valid

