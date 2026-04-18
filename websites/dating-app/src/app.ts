import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'
import config from './config.js'
import { errorHandler, notFoundHandler } from './middleware.js'
import { httpLogger, logger } from './logger.js'

// CORS configuration with environment-aware defaults
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' 
    ? true  // Allow all origins in development (Express accepts boolean)
    : process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Current-Page']
}
import { userRouter } from './routes/user/index.js'
import { profileRouter } from './routes/profile/index.js'
import { photoRouter } from './routes/photo/index.js'
import { messageRouter } from './routes/message/index.js'
import { quizRouter } from './routes/quiz/index.js'
import { quizQuestionRouter } from './routes/quiz-question/index.js'
import { quizAnswerRouter } from './routes/quiz-answer/index.js'
import { quizResultRouter } from './routes/quiz-result/index.js'
import { behaviorEventRouter } from './routes/behavior-event/index.js'
import { behaviorEventArchiveRouter } from './routes/behavior-event-archive/index.js'
import { personalityDimensionRouter } from './routes/personality-dimension/index.js'
import { userDimensionScoreRouter } from './routes/user-dimension-score/index.js'
import { compatibilityScoreRouter } from './routes/compatibility-score/index.js'
import { eventWeightConfigRouter } from './routes/event-weight-config/index.js'
import { adminConfigServiceRouter } from './routes/admin-config-service/index.js'

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
  app.use(cors(corsOptions))
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

  // API Routes (CRUD)
  app.use(`${config.api.prefix}/users`, userRouter)
  app.use(`${config.api.prefix}/profiles`, profileRouter)
  app.use(`${config.api.prefix}/photos`, photoRouter)
  app.use(`${config.api.prefix}/messages`, messageRouter)
  app.use(`${config.api.prefix}/quizes`, quizRouter)
  app.use(`${config.api.prefix}/quiz-questions`, quizQuestionRouter)
  app.use(`${config.api.prefix}/quiz-answers`, quizAnswerRouter)
  app.use(`${config.api.prefix}/quiz-results`, quizResultRouter)
  app.use(`${config.api.prefix}/behavior-events`, behaviorEventRouter)
  app.use(`${config.api.prefix}/behavior-event-archives`, behaviorEventArchiveRouter)
  app.use(`${config.api.prefix}/personality-dimensions`, personalityDimensionRouter)
  app.use(`${config.api.prefix}/user-dimension-scores`, userDimensionScoreRouter)
  app.use(`${config.api.prefix}/compatibility-scores`, compatibilityScoreRouter)
  app.use(`${config.api.prefix}/event-weight-configs`, eventWeightConfigRouter)

  // Service Routes
  app.use(`${config.api.prefix}/admin-config-service`, adminConfigServiceRouter)


  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
