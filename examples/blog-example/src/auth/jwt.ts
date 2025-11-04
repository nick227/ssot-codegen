import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

export interface JWTPayload {
  userId: string | number
  email: string
  role?: string
  [key: string]: any
}

export interface AuthRequest extends Request {
  user?: JWTPayload
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string,
    issuer: 'ssot-api',
    audience: 'api-users',
  } as jwt.SignOptions)
}

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(
    { userId: payload.userId },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN as string,
      issuer: 'ssot-api',
      audience: 'api-users',
    } as jwt.SignOptions
  )
}

/**
 * Generate both tokens
 */
export const generateTokens = (payload: JWTPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: JWT_EXPIRES_IN,
  }
}

/**
 * Verify and decode token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ssot-api',
      audience: 'api-users',
    }) as JWTPayload
    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    throw new Error('Token verification failed')
  }
}

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Authentication middleware
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      })
    }

    // Check Bearer format
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Use: Bearer <token>',
      })
    }

    const token = parts[1]

    // Verify token
    const payload = verifyToken(token)

    // Attach user to request
    req.user = payload

    next()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    return res.status(401).json({
      error: 'Unauthorized',
      message,
    })
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return next()
    }

    const parts = authHeader.split(' ')
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1]
      const payload = verifyToken(token)
      req.user = payload
    }

    next()
  } catch {
    // Silent fail - continue without user
    next()
  }
}

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    if (allowedRoles.length === 0) {
      return next()
    }

    const userRole = req.user.role || 'user'
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Requires one of roles: ${allowedRoles.join(', ')}`,
      })
    }

    next()
  }
}

/**
 * Ownership verification middleware
 */
export const requireOwnership = (userIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField]
    if (!resourceUserId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `${userIdField} not found in request`,
      })
    }

    // Convert to string for comparison
    if (String(req.user.userId) !== String(resourceUserId)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own resources',
      })
    }

    next()
  }
}

