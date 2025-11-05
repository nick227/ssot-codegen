import { Router, type Router as RouterType } from 'express'
import { z } from 'zod'
import type { Response } from 'express'
import { generateTokens, verifyToken, type AuthRequest } from './jwt.js'
import { hashPassword, verifyPassword, validatePasswordStrength } from './password.js'
import prisma from '../db.js'
import { logger } from '../logger.js'

export const authRouter: RouterType = Router()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

/**
 * POST /auth/register
 * Register a new user
 */
authRouter.post('/register', async (req, res: Response) => {
  try {
    // Validate input
    const { email, password, name } = registerSchema.parse(req.body)

    // Validate password strength
    const strengthCheck = validatePasswordStrength(password)
    if (!strengthCheck.valid) {
      return res.status(400).json({
        error: 'Weak Password',
        details: strengthCheck.errors,
      })
    }

    // Check if author already exists
    const existingUser = await prisma.author.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
      })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create author
    const user = await prisma.author.create({
      data: {
        email,
        username: email.split('@')[0], // Use email prefix as username
        displayName: name || email.split('@')[0],
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    })

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: 'user',
    })

    logger.info({ userId: user.id, email: user.email }, 'User registered')

    return res.status(201).json({
      user,
      ...tokens,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      })
    }

    logger.error({ error }, 'Registration failed')
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed',
    })
  }
})

/**
 * POST /auth/login
 * Login with email and password
 */
authRouter.post('/login', async (req, res: Response) => {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body)

    // Find author
    const user = await prisma.author.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        createdAt: true,
      },
    })

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      })
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: 'user',
    })

    logger.info({ userId: user.id, email: user.email }, 'User logged in')

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user

    return res.json({
      user: userWithoutPassword,
      ...tokens,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      })
    }

    logger.error({ error }, 'Login failed')
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed',
    })
  }
})

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
authRouter.post('/refresh', async (req, res: Response) => {
  try {
    // Validate input
    const { refreshToken } = refreshSchema.parse(req.body)

    // Verify refresh token
    const payload = verifyToken(refreshToken)

    // Get author
    const user = await prisma.author.findUnique({
      where: { id: Number(payload.userId) },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    })

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      })
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: 'user',
    })

    return res.json({
      ...tokens,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      })
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired refresh token',
    })
  }
})

/**
 * POST /auth/logout
 * Logout (client should discard tokens)
 */
authRouter.post('/logout', (req, res: Response) => {
  // In a stateless JWT system, logout is client-side
  // Just return success
  // If you implement token blacklisting, add it here
  return res.json({
    message: 'Logged out successfully',
  })
})

/**
 * GET /auth/me
 * Get current user profile (requires authentication)
 */
authRouter.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    const user = await prisma.author.findUnique({
      where: { id: Number(req.user.userId) },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      })
    }

    return res.json({ user })
  } catch (error) {
    logger.error({ error }, 'Failed to fetch user profile')
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user profile',
    })
  }
})

/**
 * POST /auth/change-password
 * Change user password (requires authentication)
 */
authRouter.post('/change-password', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    // Validate input
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

    // Validate new password strength
    const strengthCheck = validatePasswordStrength(newPassword)
    if (!strengthCheck.valid) {
      return res.status(400).json({
        error: 'Weak Password',
        details: strengthCheck.errors,
      })
    }

    // Get author with password hash
    const user = await prisma.author.findUnique({
      where: { id: Number(req.user.userId) },
      select: {
        id: true,
        passwordHash: true,
      },
    })

    if (!user || !user.passwordHash) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      })
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Current password is incorrect',
      })
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await prisma.author.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    logger.info({ userId: user.id }, 'Password changed')

    return res.json({
      message: 'Password changed successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors,
      })
    }

    logger.error({ error }, 'Failed to change password')
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to change password',
    })
  }
})

