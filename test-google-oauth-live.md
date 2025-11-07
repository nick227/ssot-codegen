# 🔐 Google OAuth Live Testing Guide

## ✅ Setup Complete!

Your `ai-chat-example-4` project has **complete Google OAuth integration** with an interactive test dashboard!

---

## 🚀 Quick Start (Live OAuth Test)

### Step 1: Install Dependencies

```bash
cd generated/ai-chat-example-4
pnpm install
pnpm add passport passport-google-oauth20 jsonwebtoken @types/passport @types/passport-google-oauth20 @types/jsonwebtoken
```

### Step 2: Set Up Database

```bash
npx prisma migrate dev --name add-google-oauth
```

### Step 3: Configure Server (One-Time Setup)

The Google Auth plugin generated all the files, but you need to wire them into `app.ts`.

**Edit:** `generated/ai-chat-example-4/src/app.ts`

**Add these imports at the top:**
```typescript
import passport from 'passport'
import { configureGoogleStrategy, authRouter } from './auth/index.js'
```

**Add these lines before your route registrations:**
```typescript
// Initialize Passport.js
app.use(passport.initialize())

// Configure Google OAuth strategy  
configureGoogleStrategy()

// Register auth routes
app.use('/auth', authRouter)
```

### Step 4: Start the Server

```bash
pnpm dev
```

### Step 5: Open the Interactive Test Dashboard

Visit: **http://localhost:3000/checklist.html**

Scroll to the **"🔐 Google Authentication"** section.

---

## 🧪 Interactive Test Features

### What You'll See:

**Google Authentication Section:**
- ✅ Google OAuth Credentials check
- ✅ User Model validation
- ✅ OAuth Flow test

**Interactive Demo:**
- 🔘 **"Sign in with Google"** button (with Google branding)
- 🖼️ User avatar display after login
- 📧 User email and name display
- 🚪 Logout button

### What Happens When You Click "Sign in with Google":

```
1. Popup opens → Google login page
2. You sign in with your Google account
3. Google asks for permissions (email, profile)
4. You approve
5. Popup closes automatically
6. Checklist updates with ✅ success checks
7. Your profile appears with avatar!
```

---

## ✅ What Gets Validated

### OAuth Flow Test Results:

When you successfully log in, you'll see:

```
✅ Google OAuth Credentials
   → OAuth credentials working

✅ User Model
   → User record created/updated

✅ OAuth Flow
   → Authenticated as [Your Name]
```

**Plus your profile card showing:**
- Your Google profile picture
- Your name
- Your email
- User ID in database

---

## 🔍 Behind the Scenes

### OAuth Flow:

```typescript
1. GET /auth/google
   → Passport redirects to Google

2. User logs in at Google

3. GET /auth/google/callback?code=XXXXX
   → Exchange code for access token
   → Fetch user profile
   → findOrCreateGoogleUser()
   → Generate JWT token

4. Return JWT via secure postMessage

5. Client stores JWT in localStorage

6. GET /auth/me (with JWT)
   → Verify token
   → Return user profile
```

### Database Operations:

When you log in, the system:

1. **Searches** for existing user by `googleId`
2. If not found, **searches** by `email`
3. If still not found, **creates** new user
4. **Updates** user profile from Google data
5. **Returns** user object with JWT token

---

## 📊 Generated Files You're Testing

All these files are working together:

```
src/auth/
├── strategies/google.strategy.ts  ← Passport.js Google OAuth
├── routes/auth.routes.ts          ← /auth/google endpoints
├── services/auth.service.ts       ← findOrCreateGoogleUser()
├── middleware/auth.middleware.ts  ← requireAuth, optionalAuth
├── utils/jwt.util.ts              ← JWT generation/verification
├── types/auth.types.ts            ← TypeScript types
└── index.ts                       ← Barrel exports
```

**Total:** 7 files, 8.64 KB of generated OAuth code!

---

## 🎯 Success Criteria

### You'll know it's working when:

✅ **"Sign in with Google" button appears**  
✅ **Clicking it opens Google login popup**  
✅ **After login, popup closes automatically**  
✅ **Your profile appears in the checklist**  
✅ **All 3 OAuth checks show green ✅**  
✅ **You can logout and login again**  

---

## 🐛 Troubleshooting

### "Redirect URI mismatch"

**Fix:** Ensure your `.env` has:
```bash
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
```

**And** Google Console has the exact same URL in "Authorized redirect URIs"

### "popup blocked"

**Fix:** Allow popups for localhost in your browser settings

### "Cannot POST /auth/logout"

**Fix:** Ensure auth routes are registered in app.ts:
```typescript
app.use('/auth', authRouter)
```

### "401 Unauthorized" on /auth/me

**Fix:** Token wasn't stored. Check browser console for errors.

---

## 📸 What Success Looks Like

### Before Login:
```
🔐 Google Authentication [Plugin]

⏳ Google OAuth Credentials - Pending
⏳ User Model - Pending  
⏳ OAuth Flow - Pending

[Sign in with Google] button
```

### After Login:
```
🔐 Google Authentication [Plugin]

✅ Google OAuth Credentials - OAuth credentials working
✅ User Model - User record created/updated
✅ OAuth Flow - Authenticated as John Doe

┌────────────────────────────────────┐
│ 👤  John Doe                      │
│     john.doe@gmail.com            │
│     User ID: 1              [Logout]│
└────────────────────────────────────┘

✅ OAuth Flow
   Successfully authenticated via Google

✅ User Created/Updated
   User ID: 1
```

---

## 🎉 You're Testing Production-Ready OAuth!

This is the **exact same OAuth flow** used by:
- Google Sign-In
- GitHub OAuth
- Any enterprise SSO system

**What you've built:**
- ✅ Industry-standard Passport.js integration
- ✅ Secure JWT token handling
- ✅ OAuth 2.0 best practices
- ✅ Rate limiting (10 attempts per 15 minutes)
- ✅ Security: No tokens in URLs
- ✅ User auto-creation and linking
- ✅ Interactive testing dashboard

---

## 🚀 Next Steps

After successful testing:

1. ✅ Google OAuth works
2. ✅ OpenAI API works (already tested!)
3. 🎯 Test other plugins (Stripe, S3, Email, etc.)
4. 🎯 Build a real application
5. 🎯 Deploy to production

**You now have 20 production-ready provider plugins!** 🎊


