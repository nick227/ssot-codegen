# Authentication Guide

**Status:** ✅ **JWT Authentication Implemented**

---

## 🔐 Overview

Complete JWT-based authentication system with:
- User registration & login
- Password hashing (scrypt)
- Access & refresh tokens
- Role-based authorization
- Password strength validation
- Secure password management

---

## 🚀 Quick Start

### **1. Update Environment**

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_SECRET="your-generated-secret-here"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
```

### **2. Update Database Schema**

```bash
# Run migrations to add User model
npm run db:push
# or
npm run db:migrate
```

### **3. Install Dependencies**

```bash
npm install
# Installs jsonwebtoken + @types/jsonwebtoken
```

---

## 📚 API Endpoints

### **Register User**

```bash
POST /api/auth/register

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"  # optional
}

# Response (201)
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-11-04T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7d"
}
```

### **Login**

```bash
POST /api/auth/login

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response (200)
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-11-04T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7d"
}
```

### **Refresh Token**

```bash
POST /api/auth/refresh

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

# Response (200)
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7d"
}
```

### **Get Current User**

```bash
GET /api/auth/me
Authorization: Bearer <accessToken>

# Response (200)
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-11-04T10:00:00Z",
    "updatedAt": "2025-11-04T10:00:00Z"
  }
}
```

### **Change Password**

```bash
POST /api/auth/change-password
Authorization: Bearer <accessToken>

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}

# Response (200)
{
  "message": "Password changed successfully"
}
```

### **Logout**

```bash
POST /api/auth/logout
Authorization: Bearer <accessToken>

# Response (200)
{
  "message": "Logged out successfully"
}

# Note: Client should discard tokens
```

---

## 🛡️ Protecting Routes

### **Basic Authentication**

```typescript
import { authenticate } from './auth/jwt.js'

// Protect all routes
app.use('/api/todos', authenticate, todoRouter)

// Or protect specific routes
todoRouter.post('/', authenticate, createTodo)
todoRouter.get('/', getTodos) // Public
```

### **Role-Based Authorization**

```typescript
import { authenticate, authorize } from './auth/jwt.js'

// Admin only
app.use('/api/admin', authenticate, authorize('admin'), adminRouter)

// Admin or moderator
app.use('/api/moderation', authenticate, authorize('admin', 'moderator'), moderationRouter)
```

### **Ownership Verification**

```typescript
import { authenticate, requireOwnership } from './auth/jwt.js'

// User can only access their own resources
todoRouter.get('/:id', authenticate, requireOwnership('userId'), getTodo)
```

### **Optional Authentication**

```typescript
import { optionalAuthenticate } from './auth/jwt.js'

// Works with or without token
todoRouter.get('/', optionalAuthenticate, listTodos)

// In your controller:
export const listTodos = async (req: AuthRequest, res: Response) => {
  if (req.user) {
    // Authenticated user - show their todos
    const todos = await prisma.todo.findMany({ 
      where: { userId: req.user.userId }
    })
  } else {
    // Anonymous user - show public todos
    const todos = await prisma.todo.findMany({ 
      where: { public: true }
    })
  }
}
```

---

## 🔒 Password Requirements

### **Validation Rules:**
- Minimum 8 characters
- Maximum 128 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character
- Not a common password

### **Hashing:**
- Algorithm: **scrypt** (more secure than bcrypt)
- Random salt (32 bytes)
- Key length: 64 bytes
- CPU cost: 16384 (2^14)

---

## 📝 Example: Protecting Generated Routes

```typescript
// src/app.ts
import { authenticate } from './auth/jwt.js'
import { todoRouter } from '@gen/routes/todo'

// Option 1: Protect all todo routes
app.use(`${config.api.prefix}/todos`, authenticate, todoRouter)

// Option 2: Per-route protection
import { Router } from 'express'
const todoRoutesWithAuth = Router()

todoRoutesWithAuth.get('/', authenticate, /* handler */)
todoRoutesWithAuth.post('/', authenticate, /* handler */)
todoRoutesWithAuth.get('/:id', authenticate, /* handler */)

app.use(`${config.api.prefix}/todos`, todoRoutesWithAuth)
```

---

## 🧪 Testing Authentication

### **Using curl:**

```bash
# 1. Register
TOKEN=$(curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' \
  | jq -r '.accessToken')

# 2. Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/auth/me

# 3. Create todo (protected)
curl -X POST http://localhost:3000/api/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Todo","completed":false}'
```

### **Using JavaScript/TypeScript:**

```typescript
// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
  }),
})

const { accessToken } = await loginResponse.json()

// Make authenticated request
const todosResponse = await fetch('http://localhost:3000/api/todos', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
})

const todos = await todosResponse.json()
```

---

## 🔐 Security Best Practices

### **Already Implemented:**
- ✅ Secure password hashing (scrypt)
- ✅ Password strength validation
- ✅ JWT with expiration
- ✅ Refresh token rotation
- ✅ Timing-safe password comparison
- ✅ No password in responses
- ✅ Correlation IDs for audit logs

### **Recommended Additions:**

1. **Rate Limiting on Auth Endpoints**
```typescript
import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts',
})

authRouter.post('/login', authLimiter, loginHandler)
authRouter.post('/register', authLimiter, registerHandler)
```

2. **Token Blacklisting (for logout)**
```typescript
// Use Redis to blacklist tokens
import Redis from 'ioredis'
const redis = new Redis()

// On logout
await redis.setex(`blacklist:${token}`, 7 * 24 * 60 * 60, 'true')

// On authentication
const isBlacklisted = await redis.get(`blacklist:${token}`)
if (isBlacklisted) {
  return res.status(401).json({ error: 'Token revoked' })
}
```

3. **Email Verification**
```typescript
// Send verification email on registration
// Require email verification before full access
```

4. **Two-Factor Authentication (2FA)**
```typescript
// Add TOTP-based 2FA
import speakeasy from 'speakeasy'
```

---

## 📊 What's Secured Now

### **Protected by Default:**
- `/api/auth/me` - Get user profile
- `/api/auth/change-password` - Change password

### **Ready to Protect:**
All generated routes can be protected by adding `authenticate` middleware:

```typescript
// Protect all generated CRUD operations
import { authenticate } from './auth/jwt.js'
import { todoRouter } from '@gen/routes/todo'

app.use('/api/todos', authenticate, todoRouter)
```

---

## 🎯 Next Steps

### **Immediate (5 minutes):**
1. Set `JWT_SECRET` in `.env`
2. Run database migrations
3. Test registration/login

### **Optional (1-2 hours):**
1. Add rate limiting to auth endpoints
2. Protect generated routes
3. Add role-based access control
4. Implement token blacklisting

### **Advanced (4-8 hours):**
1. Email verification
2. Password reset flow
3. Two-factor authentication
4. OAuth2 integration

---

## 🐛 Troubleshooting

### **"Invalid token" errors:**
- Check `JWT_SECRET` is set correctly
- Verify token hasn't expired
- Ensure Bearer format: `Authorization: Bearer <token>`

### **"User not found" after registration:**
- Check database connection
- Verify Prisma Client is generated
- Run migrations: `npm run db:push`

### **Password validation fails:**
- Must meet all strength requirements
- At least 8 characters
- Must include uppercase, lowercase, number, special char

---

## 📄 Files Created

- `src/auth/jwt.ts` - JWT token management & middleware
- `src/auth/password.ts` - Secure password hashing
- `src/auth/routes.ts` - Authentication API endpoints
- `prisma/schema.prisma` - Updated with User model
- `AUTH_GUIDE.md` - This guide

---

**Authentication is now fully functional!** 🔐

Update `JWT_SECRET`, run migrations, and start protecting your API routes.

