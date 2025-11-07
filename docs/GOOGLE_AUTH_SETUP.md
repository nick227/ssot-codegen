# 🔐 Google OAuth Authentication Setup Guide

Complete guide to setting up Google OAuth credentials for testing the SSOT Codegen Google Auth plugin.

---

## 📋 Quick Summary

**What you need:**
- Google Cloud Console account
- 5-10 minutes for setup
- No credit card required for testing

**What you'll get:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- Full OAuth 2.0 authentication flow

---

## 🚀 Step-by-Step Setup

### Step 1: Access Google Cloud Console

1. Visit: **https://console.cloud.google.com/**
2. Sign in with your Google account

### Step 2: Create a New Project

1. Click **"Select a project"** (top bar)
2. Click **"New Project"**
3. Fill in:
   - **Project name:** `SSOT Codegen Dev`
   - **Organization:** (leave default)
4. Click **"Create"**
5. Wait for project creation (usually 10-30 seconds)
6. Select your new project from the dropdown

### Step 3: Enable Required APIs

1. In the left sidebar, navigate to:
   - **"APIs & Services"** → **"Library"**

2. Search and enable these APIs:
   
   **Google+ API:**
   - Search: `Google+ API`
   - Click on it
   - Click **"Enable"**
   
   **People API:**
   - Search: `Google People API`
   - Click on it
   - Click **"Enable"**

### Step 4: Configure OAuth Consent Screen

⚠️ **This step is required before creating credentials**

1. Navigate to:
   - **"APIs & Services"** → **"OAuth consent screen"**

2. **Choose User Type:**
   - Select **"External"** (allows testing with any Google account)
   - Click **"Create"**

3. **Fill in App Information:**

```
App name: SSOT Codegen Dev
User support email: [select your email from dropdown]
App logo: [skip for now - optional]
```

```
App domain (optional for testing):
  Application home page: http://localhost:3000
  Application privacy policy: [leave empty]
  Application terms of service: [leave empty]
```

```
Authorized domains: [leave empty for localhost testing]
```

```
Developer contact information:
  Email addresses: [your-email@gmail.com]
```

4. Click **"Save and Continue"**

5. **Configure Scopes:**
   - Click **"Add or Remove Scopes"**
   - Find and select these scopes:
     - ✅ `.../auth/userinfo.email` - See your email address
     - ✅ `.../auth/userinfo.profile` - See your personal info
     - ✅ `openid` - Authenticate using OpenID Connect
   - Click **"Update"**
   - Click **"Save and Continue"**

6. **Add Test Users:** (Required for External apps)
   - Click **"+ Add Users"**
   - Enter your Gmail address: `your.email@gmail.com`
   - Click **"Add"**
   - Click **"Save and Continue"**

7. **Review Summary:**
   - Click **"Back to Dashboard"**

### Step 5: Create OAuth 2.0 Client ID

1. Navigate to:
   - **"APIs & Services"** → **"Credentials"**

2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth client ID"**

4. **Configure OAuth Client:**

```
Application type: Web application
```

```
Name: SSOT Dev Server
```

```
Authorized JavaScript origins:
  http://localhost:3000
  http://localhost:3001
  http://localhost:5173
```

```
Authorized redirect URIs:
  http://localhost:3000/auth/google/callback
  http://localhost:3001/auth/google/callback
  http://localhost:5173/auth/google/callback
```

5. Click **"Create"**

### Step 6: Copy Your Credentials

A popup will appear with your credentials:

```
Client ID: 
  123456789-abcdefghijklmnop.apps.googleusercontent.com

Client Secret:
  GOCSPX-abc123def456ghi789jkl
```

**⚠️ IMPORTANT:**
- Copy both values immediately
- Store them securely
- You can always retrieve them later from the Credentials page

---

## 📝 Add Credentials to Your `.env`

### Option 1: Edit Existing `.env`

Open your workspace root `.env` file and add:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456ghi789jkl"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# JWT Configuration
JWT_SECRET="your-secure-random-jwt-secret-min-32-chars-recommended"
JWT_EXPIRES_IN="7d"
```

### Option 2: Copy from Template

```bash
# If you don't have a .env yet
cp env.development.template .env

# Then edit .env and fill in your Google credentials
```

### Generate Secure JWT Secret

```bash
# Quick way to generate a secure random secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 Test the Integration

### 1. Generate a Project with Google Auth

The `ai-chat-example` includes Google OAuth. Generate it:

```bash
pnpm ssot generate ai-chat-example
```

### 2. Check Generated Files

Look for these auth-related files in `generated/ai-chat-example-[n]/`:

```
src/
  auth/
    ├── strategies/google.strategy.ts   ← OAuth strategy
    ├── routes/auth.routes.ts           ← Auth endpoints
    ├── services/auth.service.ts        ← User management
    ├── middleware/auth.middleware.ts   ← Protected routes
    └── utils/jwt.util.ts               ← Token generation
```

### 3. Install Dependencies

```bash
cd generated/ai-chat-example-[n]
pnpm install
```

### 4. Set Up Database

The Google auth plugin requires a User model with these fields:

```prisma
model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique
  googleId String? @unique
  name     String?
  avatar   String?
  // ... other fields
}
```

Run migrations:

```bash
npx prisma migrate dev
```

### 5. Start the Server

```bash
pnpm dev
```

### 6. Test OAuth Flow

**Using the Interactive Checklist:**

1. Open: http://localhost:3000/checklist.html
2. Scroll to **"Google Authentication"** section
3. Click **"Sign in with Google"** button
4. Complete OAuth flow in popup
5. Verify successful login

**Manual Testing:**

```bash
# Initiate OAuth flow
curl http://localhost:3000/auth/google
# This will redirect to Google login

# After login, check current user
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/auth/me
```

---

## 🎯 What Happens During OAuth Flow

### User Perspective

```
1. User clicks "Sign in with Google"
   ↓
2. Redirected to Google login page
   ↓
3. User logs in with Google credentials
   ↓
4. Google asks for permission (email, profile)
   ↓
5. User grants permission
   ↓
6. Redirected back to your app
   ↓
7. JWT token generated (or session created)
   ↓
8. User is now authenticated!
```

### Technical Flow

```
GET /auth/google
  ↓
Redirect to: https://accounts.google.com/o/oauth2/v2/auth
  ↓
User authenticates and grants permission
  ↓
Google redirects to: /auth/google/callback?code=XXXXX
  ↓
Exchange code for access token
  ↓
Fetch user profile from Google
  ↓
Find or create user in database
  ↓
Generate JWT token (or create session)
  ↓
Return token to client
```

---

## 🔒 Security Best Practices

### Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a long, random string
- [ ] Use HTTPS (required for production OAuth)
- [ ] Update authorized origins to your production domain
- [ ] Update redirect URIs to your production URLs
- [ ] Switch OAuth consent screen to "Production" mode
- [ ] Review and minimize OAuth scopes
- [ ] Enable token rotation
- [ ] Implement CSRF protection
- [ ] Add rate limiting to auth endpoints (included in plugin)

### Environment Variables Security

```bash
# ❌ NEVER commit real credentials
.env

# ✅ Safe to commit (no real credentials)
.env.example
env.development.template
```

---

## 🐛 Troubleshooting

### "Redirect URI mismatch" Error

**Problem:** OAuth callback fails with redirect URI error

**Solution:**
1. Check your `GOOGLE_CALLBACK_URL` in `.env`
2. Verify it matches EXACTLY one of the URIs in Google Console
3. Check for:
   - Protocol mismatch (`http` vs `https`)
   - Port mismatch (`:3000` vs `:3001`)
   - Trailing slashes (shouldn't have one)
   - Path mismatch (`/callback` vs `/auth/callback`)

**Example Fix:**
```bash
# In .env
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# In Google Console → Credentials → OAuth 2.0 Client IDs → Edit
# Authorized redirect URIs should have:
http://localhost:3000/auth/google/callback
```

### "Access Blocked" Error

**Problem:** "This app is blocked. This app tried to access sensitive info..."

**Solution:**
1. Go to OAuth consent screen
2. Add your test user email to "Test users"
3. Or publish your app (for production)

### "Client ID not found" Error

**Problem:** Invalid client ID in environment variables

**Solution:**
```bash
# Verify format is correct (should look like this):
GOOGLE_CLIENT_ID="123456789-abc123def456.apps.googleusercontent.com"

# NOT like this:
GOOGLE_CLIENT_ID=123456789  # ❌ Missing full ID
GOOGLE_CLIENT_ID="your-client-id-here"  # ❌ Placeholder
```

### Database Errors

**Problem:** User model missing required fields

**Solution:**
```prisma
// Ensure your schema has:
model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique    // ← Required
  googleId String? @unique    // ← Required
  name     String?
  avatar   String?
}

// Then run:
npx prisma migrate dev --name add-google-auth
```

### JWT Token Errors

**Problem:** "Invalid or expired token" errors

**Solution:**
```bash
# Ensure JWT_SECRET is set and consistent
JWT_SECRET="your-long-random-secret-string-here"

# Generate a secure secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📚 Additional Resources

### Official Documentation
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

### Plugin Documentation
- See generated `src/auth/` files for inline documentation
- Check `src/checklist/checklist.html` for interactive testing

### Common OAuth Scopes
- `openid` - OpenID Connect authentication
- `profile` - Basic profile info (name, photo)
- `email` - Email address

---

## 🎉 Success!

If everything is set up correctly:

✅ Google OAuth flow completes successfully  
✅ User is created/updated in database  
✅ JWT token is generated  
✅ Protected routes are accessible  
✅ Logout works correctly  

**Next Steps:**
- Test with different Google accounts
- Customize user profile handling
- Add role-based access control
- Implement refresh tokens
- Test other auth plugins (JWT, API Keys)

---

**Need help?** Check the generated code in `src/auth/` for implementation details and inline documentation.

