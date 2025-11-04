import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'
import config from './config.js'
import { errorHandler, notFoundHandler } from './middleware.js'
import { httpLogger, logger } from './logger.js'
import { authRouter } from './auth/routes.js'

// Configure rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

export const createApp = async (): Promise<express.Application> => {
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
  logger.info({ config: { port: config.port, env: config.nodeEnv, openaiConfigured: !!config.openai.apiKey } }, 'App configuration loaded')

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      openai: !!config.openai.apiKey ? 'configured' : 'missing'
    })
  })

  // API Routes
  // Public auth routes
  app.use(`${config.api.prefix}/auth`, authRouter)
  
  // Import generated routes
  const { authenticate } = await import('./auth/jwt.js')
  
  // Standard CRUD routes
  try {
    const { userRouter } = await import('@gen/routes/user')
    app.use(`${config.api.prefix}/users`, authenticate, userRouter)
  } catch (err) {
    logger.warn('User routes not found')
  }
  
  try {
    const { conversationRouter } = await import('@gen/routes/conversation')
    app.use(`${config.api.prefix}/conversations`, authenticate, conversationRouter)
  } catch (err) {
    logger.warn('Conversation routes not found')
  }
  
  try {
    const { messageRouter } = await import('@gen/routes/message')
    app.use(`${config.api.prefix}/messages`, authenticate, messageRouter)
  } catch (err) {
    logger.warn('Message routes not found')
  }
  
  // Service integration routes (AI agent) ✨
  try {
    const { aiAgentRouter } = await import('@gen/routes/ai-agent')
    app.use(`${config.api.prefix}/ai-agent`, aiAgentRouter)
    logger.info('🤖 AI Agent routes registered (service integration)')
  } catch (err) {
    logger.warn({ error: err.message }, 'AI Agent routes not found - run npm run generate')
  }

  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

