/**
 * Google OAuth Authentication Plugin
 * 
 * Generates complete Google Sign-In flow:
 * - OAuth2 strategy
 * - Auth routes (/auth/google, /auth/google/callback)
 * - User synchronization
 * - Protected route middleware
 * - Session/JWT management
 */

import type { 
  FeaturePlugin, 
  PluginContext, 
  PluginOutput, 
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface GoogleAuthConfig {
  clientId: string
  clientSecret: string
  callbackURL?: string
  scopes?: string[]
  strategy?: 'jwt' | 'session'
  userModel?: string  // Which model is the User (default: 'User')
  autoCreateUser?: boolean  // Auto-create user on first login
}

export class GoogleAuthPlugin implements FeaturePlugin {
  name = 'google-auth'
  version = '1.0.0'
  description = 'Google OAuth 2.0 authentication with Passport.js'
  enabled = true
  
  private config: GoogleAuthConfig
  
  constructor(config: GoogleAuthConfig) {
    this.config = {
      scopes: ['profile', 'email'],
      strategy: 'jwt',
      userModel: 'User',
      autoCreateUser: true,
      ...config
    }
  }
  
  requirements: PluginRequirements = {
    models: {
      required: ['User'],  // Must have User model
      fields: {
        'User': ['email', 'googleId']  // Required fields
      }
    },
    envVars: {
      required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      optional: ['GOOGLE_CALLBACK_URL', 'JWT_SECRET', 'SESSION_SECRET']
    },
    dependencies: {
      runtime: {
        'passport': '^0.7.0',
        'passport-google-oauth20': '^2.0.0',
        'jsonwebtoken': '^9.0.2',
        'express-rate-limit': '^7.1.5'
      },
      dev: {
        '@types/passport': '^1.0.16',
        '@types/passport-google-oauth20': '^3.0.0',
        '@types/jsonwebtoken': '^9.0.5'
      }
    }
  }
  
  /**
   * Validate plugin can be used with this schema
   */
  validate(context: PluginContext): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // Check User model exists
    const userModel = context.schema.models.find(m => 
      m.name === this.config.userModel ||
      m.name === 'User' ||
      m.name === 'Account'
    )
    
    if (!userModel) {
      errors.push(`User model not found. Google auth requires a User model.`)
      suggestions.push(`Add a User model to your schema:
        
model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique
  googleId String? @unique
  name     String?
  avatar   String?
}`)
      return { valid: false, errors, warnings, suggestions }
    }
    
    // Check required fields
    const hasEmail = userModel.scalarFields?.some(f => f.name === 'email')
    const hasGoogleId = userModel.scalarFields?.some(f => f.name === 'googleId')
    
    if (!hasEmail) {
      errors.push(`User model missing 'email' field`)
      suggestions.push(`Add to User model: email String @unique`)
    }
    
    if (!hasGoogleId) {
      warnings.push(`User model missing 'googleId' field`)
      suggestions.push(`Add to User model: googleId String? @unique`)
      suggestions.push(`Or run: npx prisma migrate dev --name add-google-auth`)
    }
    
    // Check email is unique
    const emailField = userModel.scalarFields?.find(f => f.name === 'email')
    if (emailField && !emailField.isUnique) {
      warnings.push(`User.email should be unique for OAuth`)
    }
    
    // Check environment variables
    if (!this.config.clientId || this.config.clientId === 'YOUR_CLIENT_ID_HERE') {
      warnings.push(`GOOGLE_CLIENT_ID not configured`)
      suggestions.push(`Set GOOGLE_CLIENT_ID in .env or provide at generation time`)
    }
    
    if (!this.config.clientSecret || this.config.clientSecret === 'YOUR_CLIENT_SECRET_HERE') {
      warnings.push(`GOOGLE_CLIENT_SECRET not configured`)
      suggestions.push(`Set GOOGLE_CLIENT_SECRET in .env or provide at generation time`)
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
  
  /**
   * Generate Google OAuth authentication code
   */
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    const userModelLower = this.config.userModel!.toLowerCase()
    
    // Generate OAuth strategy
    files.set('auth/strategies/google.strategy.ts', this.generateGoogleStrategy(userModelLower))
    
    // Generate auth routes
    files.set('auth/routes/auth.routes.ts', this.generateAuthRoutes())
    
    // Generate auth service
    files.set('auth/services/auth.service.ts', this.generateAuthService(userModelLower))
    
    // Generate auth middleware
    files.set('auth/middleware/auth.middleware.ts', this.generateAuthMiddleware())
    
    // Generate JWT utilities (if using JWT)
    if (this.config.strategy === 'jwt') {
      files.set('auth/utils/jwt.util.ts', this.generateJWTUtil())
    }
    
    // Generate session config (if using sessions)
    if (this.config.strategy === 'session') {
      files.set('auth/config/session.config.ts', this.generateSessionConfig())
    }
    
    // Generate types
    files.set('auth/types/auth.types.ts', this.generateAuthTypes())
    
    // Generate barrel export
    files.set('auth/index.ts', this.generateAuthIndex())
    
    return {
      files,
      routes: [
        { path: '/auth/google', method: 'get', handler: 'auth/routes/auth.routes.js' },
        { path: '/auth/google/callback', method: 'get', handler: 'auth/routes/auth.routes.js' },
        { path: '/auth/logout', method: 'post', handler: 'auth/routes/auth.routes.js' },
        { path: '/auth/me', method: 'get', handler: 'auth/routes/auth.routes.js', middleware: ['auth'] }
      ],
      middleware: [
        { name: 'requireAuth', importPath: 'auth/middleware/auth.middleware.js', global: false },
        { name: 'optionalAuth', importPath: 'auth/middleware/auth.middleware.js', global: false }
      ],
      envVars: {
        GOOGLE_CLIENT_ID: this.config.clientId || 'your_google_client_id_here',
        GOOGLE_CLIENT_SECRET: this.config.clientSecret || 'your_google_client_secret_here',
        GOOGLE_CALLBACK_URL: this.config.callbackURL || 'http://localhost:3000/auth/google/callback',
        ...(this.config.strategy === 'jwt' ? {
          JWT_SECRET: 'your_jwt_secret_here_change_in_production',
          JWT_EXPIRES_IN: '7d'
        } : {
          SESSION_SECRET: 'your_session_secret_here_change_in_production',
          SESSION_MAX_AGE: '604800000'  // 7 days
        })
      },
      packageJson: {
        dependencies: this.requirements.dependencies.runtime,
        devDependencies: this.requirements.dependencies.dev,
        scripts: {
          'auth:setup': 'echo "Visit https://console.cloud.google.com to get OAuth credentials"'
        }
      }
    }
  }
  
  /**
   * Generate Passport Google Strategy
   */
  private generateGoogleStrategy(userModelLower: string): string {
    return `// @generated
// Google OAuth 2.0 Strategy using Passport.js

import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { authService } from '../services/auth.service.js'
import type { GoogleProfile } from '../types/auth.types.js'

/**
 * Configure Google OAuth Strategy
 */
export function configureGoogleStrategy() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract profile data
          const googleProfile: GoogleProfile = {
            googleId: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            accessToken,
            refreshToken
          }
          
          // Find or create user
          const user = await authService.findOrCreateGoogleUser(googleProfile)
          
          done(null, user)
        } catch (error) {
          done(error as Error)
        }
      }
    )
  )
  
  ${this.config.strategy === 'session' ? `
  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id)
  })
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await authService.findUserById(id)
      done(null, user)
    } catch (error) {
      done(error as Error)
    }
  })
  ` : '// Using JWT strategy - no serialization needed'}
}
`
  }
  
  /**
   * Generate auth routes
   */
  private generateAuthRoutes(): string {
    return `// @generated
// Authentication routes

import { Router } from 'express'
import passport from 'passport'
import { authService } from '../services/auth.service.js'
import { rateLimit } from 'express-rate-limit'
${this.config.strategy === 'jwt' ? "import { generateToken } from '../utils/jwt.util.js'" : ''}

export const authRouter = Router()

/**
 * Rate limiter for auth routes (prevent brute force)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
authRouter.get('/google',
  authLimiter,
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    ${this.config.strategy === 'session' ? '' : 'session: false'}
  })
)

/**
 * GET /auth/google/callback
 * Google OAuth callback
 */
authRouter.get('/google/callback',
  authLimiter,
  passport.authenticate('google', { 
    ${this.config.strategy === 'session' ? 'failureRedirect: \'/login?error=auth_failed\'' : 'session: false, failureRedirect: \'/login?error=auth_failed\''}
  }),
  async (req, res) => {
    try {
      const user = req.user as any
      
      ${this.config.strategy === 'jwt' ? `
      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        name: user.name
      })
      
      // SECURITY FIX: Return token via secure HTML page with postMessage
      // This prevents token from appearing in URLs (logged, cached, leaked via Referer header)
      res.send(\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Success</title>
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            // Send token to parent window (if opened from popup)
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_SUCCESS', token: '\${token}' }, window.location.origin);
              window.close();
            } else {
              // Store token in secure cookie or localStorage and redirect
              localStorage.setItem('auth_token', '\${token}');
              window.location.href = '/dashboard';
            }
          </script>
          <p>Authenticated successfully! Redirecting...</p>
        </body>
        </html>
      \`)
      ` : `
      // Session-based - user is already in session
      res.redirect('/dashboard')
      `}
    } catch (error) {
      console.error('OAuth callback error:', error)
      res.redirect('/login?error=callback_failed')
    }
  }
)

/**
 * POST /auth/logout
 * Logout user
 */
authRouter.post('/logout', ${this.config.strategy === 'session' ? '' : ''}(req, res) => {
  ${this.config.strategy === 'session' ? `
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' })
    }
    res.json({ message: 'Logged out successfully' })
  })
  ` : `
  // JWT-based - just clear client-side token
  res.json({ message: 'Logged out successfully' })
  `}
})

/**
 * GET /auth/me
 * Get current user
 */
authRouter.get('/me', ${this.config.strategy === 'session' ? 'requireAuth, ' : ''}(req, res) => {
  ${this.config.strategy === 'session' ? `
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  res.json({ user: req.user })
  ` : `
  // JWT - user extracted by middleware
  res.json({ user: req.user })
  `}
})

${this.config.strategy === 'session' ? `
// Session-based auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.status(401).json({ error: 'Authentication required' })
}
` : ''}
`
  }
  
  /**
   * Generate auth service
   */
  private generateAuthService(userModelLower: string): string {
    return `// @generated
// Authentication service

import { prisma } from '../../db.js'
import type { GoogleProfile } from '../types/auth.types.js'

export const authService = {
  /**
   * Find or create user from Google profile
   */
  async findOrCreateGoogleUser(profile: GoogleProfile) {
    // Try to find existing user by googleId
    let user = await prisma.${userModelLower}.findUnique({
      where: { googleId: profile.googleId }
    })
    
    if (user) {
      // Update user data from Google
      user = await prisma.${userModelLower}.update({
        where: { id: user.id },
        data: {
          name: profile.name,
          avatar: profile.avatar,
          email: profile.email
        }
      })
      return user
    }
    
    // Try to find by email
    user = await prisma.${userModelLower}.findUnique({
      where: { email: profile.email }
    })
    
    if (user) {
      // Link Google account to existing user
      user = await prisma.${userModelLower}.update({
        where: { id: user.id },
        data: { googleId: profile.googleId }
      })
      return user
    }
    
    // Create new user
    user = await prisma.${userModelLower}.create({
      data: {
        email: profile.email,
        googleId: profile.googleId,
        name: profile.name,
        avatar: profile.avatar
      }
    })
    
    return user
  },
  
  /**
   * Find user by ID
   */
  async findUserById(id: number) {
    return prisma.${userModelLower}.findUnique({
      where: { id }
    })
  }
}
`
  }
  
  /**
   * Generate auth middleware
   */
  private generateAuthMiddleware(): string {
    if (this.config.strategy === 'jwt') {
      return `// @generated
// JWT-based authentication middleware

import { verifyToken } from '../utils/jwt.util.js'
import { authService } from '../services/auth.service.js'
import type { Request, Response, NextFunction } from 'express'

/**
 * Require authentication (JWT)
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req)
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const payload = verifyToken(token)
    
    // Attach user to request
    const user = await authService.findUserById(payload.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Optional authentication
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req)
    if (token) {
      const payload = verifyToken(token)
      const user = await authService.findUserById(payload.userId)
      req.user = user
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  next()
}

/**
 * Extract JWT token from Authorization header
 */
function extractToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth) return null
  
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}
`
    } else {
      return `// @generated
// Session-based authentication middleware

import type { Request, Response, NextFunction } from 'express'

/**
 * Require authentication (Session)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.status(401).json({ error: 'Authentication required' })
}

/**
 * Optional authentication
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // User available in req.user if authenticated
  next()
}
`
    }
  }
  
  /**
   * Generate JWT utilities
   */
  private generateJWTUtil(): string {
    return `// @generated
// JWT token utilities

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: number
  email: string
  name?: string
  iat?: number
  exp?: number
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch (error) {
    return null
  }
}
`
  }
  
  /**
   * Generate session configuration
   */
  private generateSessionConfig(): string {
    return `// @generated
// Session configuration

import session from 'express-session'
import RedisStore from 'connect-redis'
import { createClient } from 'redis'

// Redis client for session storage (optional)
const redisClient = process.env.REDIS_URL 
  ? createClient({ url: process.env.REDIS_URL })
  : null

if (redisClient) {
  redisClient.connect().catch(console.error)
}

/**
 * Session configuration
 */
export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000')  // 7 days
  },
  ...(redisClient ? {
    store: new RedisStore({ client: redisClient })
  } : {})
}
`
  }
  
  /**
   * Generate auth types
   */
  private generateAuthTypes(): string {
    return `// @generated
// Authentication types

export interface GoogleProfile {
  googleId: string
  email: string
  name?: string
  avatar?: string
  accessToken?: string
  refreshToken?: string
}

export interface AuthUser {
  id: number
  email: string
  googleId?: string
  name?: string
  avatar?: string
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}
`
  }
  
  /**
   * Generate auth barrel export
   */
  private generateAuthIndex(): string {
    return `// @generated
// Authentication module exports

export { configureGoogleStrategy } from './strategies/google.strategy.js'
export { authRouter } from './routes/auth.routes.js'
export { requireAuth, optionalAuth } from './middleware/auth.middleware.js'
export { authService } from './services/auth.service.js'
${this.config.strategy === 'jwt' ? "export { generateToken, verifyToken } from './utils/jwt.util.js'" : ''}
export type { GoogleProfile, AuthUser } from './types/auth.types.js'
`
  }
  
  /**
   * Health check integration with WORKING Google login
   */
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'google-auth',
      title: 'Google Authentication',
      icon: '🔐',
      checks: [
        {
          id: 'google-credentials',
          name: 'Google OAuth Credentials',
          description: 'Client ID and Secret configured',
          endpoint: '/api/checklist/auth/google',
          skipForStatic: true
        },
        {
          id: 'user-model',
          name: 'User Model',
          description: 'User model has required fields',
          testFunction: 'checkUserModel'
        },
        {
          id: 'oauth-flow',
          name: 'OAuth Flow',
          description: 'End-to-end login/logout test',
          skipForStatic: false  // Can test even in static HTML!
        }
      ],
      interactiveDemo: this.generateInteractiveDemo()
    }
  }
  
  /**
   * Generate interactive demo HTML for checklist
   */
  private generateInteractiveDemo(): string {
    return `
    <div class="auth-demo" style="margin-top: 20px; padding: 20px; background: var(--bg-primary); border-radius: 8px;">
      <h3 style="margin-bottom: 15px; font-size: 16px; font-weight: 600;">🧪 Test Google Login</h3>
      
      <!-- Not logged in state -->
      <div id="auth-logged-out" style="display: block;">
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 15px;">
          Click the button below to test the Google OAuth flow:
        </p>
        <button 
          onclick="loginWithGoogle()" 
          style="
            background: white;
            color: #757575;
            border: 1px solid #dadce0;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.2s;
          "
          onmouseover="this.style.background='#f8f9fa'"
          onmouseout="this.style.background='white'"
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          Sign in with Google
        </button>
      </div>
      
      <!-- Logged in state -->
      <div id="auth-logged-in" style="display: none;">
        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: var(--bg-secondary); border-radius: 6px; border-left: 3px solid var(--success);">
          <img id="user-avatar" src="" style="width: 48px; height: 48px; border-radius: 50%;" />
          <div style="flex: 1;">
            <div id="user-name" style="font-weight: 600; font-size: 15px;"></div>
            <div id="user-email" style="color: var(--text-muted); font-size: 13px;"></div>
          </div>
          <button 
            onclick="logoutGoogle()" 
            style="
              background: var(--danger);
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
            "
          >
            Logout
          </button>
        </div>
        
        <div style="margin-top: 15px; display: grid; gap: 8px;">
          <div class="check-item success" style="padding: 12px;">
            <div class="check-left">
              <div class="check-icon">✅</div>
              <div class="check-info">
                <div class="check-name">OAuth Flow</div>
                <div class="check-detail">Successfully authenticated via Google</div>
              </div>
            </div>
          </div>
          
          <div class="check-item success" style="padding: 12px;">
            <div class="check-left">
              <div class="check-icon">✅</div>
              <div class="check-info">
                <div class="check-name">User Created/Updated</div>
                <div class="check-detail" id="user-id-display"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <script>
      // Google login handler
      function loginWithGoogle() {
        // Open OAuth popup
        const width = 500
        const height = 600
        const left = (screen.width - width) / 2
        const top = (screen.height - height) / 2
        
        const popup = window.open(
          '/auth/google',
          'google-login',
          \`width=\${width},height=\${height},left=\${left},top=\${top}\`
        )
        
        // Listen for OAuth callback
        window.addEventListener('message', (event) => {
          if (event.data.type === 'oauth-success') {
            handleLoginSuccess(event.data.user)
          }
        })
      }
      
      // Handle successful login
      function handleLoginSuccess(user) {
        document.getElementById('auth-logged-out').style.display = 'none'
        document.getElementById('auth-logged-in').style.display = 'block'
        
        document.getElementById('user-avatar').src = user.avatar || '/default-avatar.png'
        document.getElementById('user-name').textContent = user.name
        document.getElementById('user-email').textContent = user.email
        document.getElementById('user-id-display').textContent = \`User ID: \${user.id}\`
        
        // Update check status
        setCheckStatus('oauth-flow', 'success', 'Authenticated successfully')
      }
      
      // Logout handler
      async function logoutGoogle() {
        try {
          await fetch('/auth/logout', { method: 'POST' })
          
          document.getElementById('auth-logged-out').style.display = 'block'
          document.getElementById('auth-logged-in').style.display = 'none'
          
          setCheckStatus('oauth-flow', 'pending', 'Not authenticated')
        } catch (error) {
          alert('Logout failed: ' + error.message)
        }
      }
      
      // Check if already logged in on page load
      fetch('/auth/me')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user) {
            handleLoginSuccess(data.user)
          }
        })
        .catch(() => {
          // Not logged in - that's fine
        })
    </script>
    `
  }
}

