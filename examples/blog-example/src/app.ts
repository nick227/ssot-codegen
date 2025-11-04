import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'
import config from './config.js'
import { errorHandler, notFoundHandler } from './middleware.js'
import { httpLogger, logger } from './logger.js'
import { authRouter } from './auth/routes.js'
import { protectedPostRouter } from './routes/post.protected.routes.js'
import { protectedCommentRouter } from './routes/comment.protected.routes.js'
// Import remaining generated routes (for models without auth requirements)
import { authorRouter } from '@gen/routes/author'
import { categoryRouter } from '@gen/routes/category'
import { tagRouter } from '@gen/routes/tag'
import { authenticate } from './auth/jwt.js'
import { requireRole } from './auth/authorization.js'

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

export const createApp = () => {
  const app = express()

  // Logging
  app.use(httpLogger)

  // Security & parsing
  app.use(helmet())
  app.use(cors({ origin: config.cors.origin }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  
  // Apply rate limiting to API routes
  app.use('/api', limiter)
  
  // Log startup
  logger.info({ config: { port: config.port, env: config.nodeEnv } }, 'App configuration loaded')

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // API Routes
  // Public auth routes
  app.use(`${config.api.prefix}/auth`, authRouter)
  
  // Protected routes with authorization
  app.use(`${config.api.prefix}/posts`, protectedPostRouter)  // Posts with ownership & role checks
  app.use(`${config.api.prefix}/comments`, protectedCommentRouter)  // Comments with moderation
  
  // Admin-only routes (authors, categories, tags)
  app.use(`${config.api.prefix}/authors`, authenticate, requireRole('ADMIN'), authorRouter)
  app.use(`${config.api.prefix}/categories`, authenticate, requireRole('ADMIN', 'EDITOR'), categoryRouter)
  app.use(`${config.api.prefix}/tags`, authenticate, requireRole('ADMIN', 'EDITOR'), tagRouter)

  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
