import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'
import config from './config.js'
import { errorHandler, notFoundHandler } from './middleware.js'
import { httpLogger, logger } from './logger.js'
import { userRouter } from '@gen/routes/user/index.js'
import { postRouter } from '@gen/routes/post/index.js'

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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
  logger.info({ config: { port: config.port, env: config.nodeEnv } }, 'App configuration loaded')

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // API Routes
  app.use(`${config.api.prefix}/users`, userRouter)
  app.use(`${config.api.prefix}/posts`, postRouter)

  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
