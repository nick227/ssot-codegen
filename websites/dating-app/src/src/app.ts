import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'
import config from '@/config.js'
import { errorHandler, notFoundHandler } from '@/middleware.js'
import { httpLogger, logger } from '@/logger.js'

// Route imports
import { userRouter } from '@/routes/user/index.js'
import { profileRouter } from '@/routes/profile/index.js'
import { photoRouter } from '@/routes/photo/index.js'
import { messageRouter } from '@/routes/message/index.js'
import { quizRouter } from '@/routes/quiz/index.js'
import { quizQuestionRouter } from '@/routes/quiz-question/index.js'
import { quizAnswerRouter } from '@/routes/quiz-answer/index.js'
import { quizResultRouter } from '@/routes/quiz-result/index.js'
import { behaviorEventRouter } from '@/routes/behavior-event/index.js'
import { behaviorEventArchiveRouter } from '@/routes/behavior-event-archive/index.js'
import { personalityDimensionRouter } from '@/routes/personality-dimension/index.js'
import { userDimensionScoreRouter } from '@/routes/user-dimension-score/index.js'
import { compatibilityScoreRouter } from '@/routes/compatibility-score/index.js'
import { eventWeightConfigRouter } from '@/routes/event-weight-config/index.js'
import { adminConfigServiceRouter } from '@/routes/admin-config-service/index.js'

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
  
  // Log startup
  logger.info({ config: { port: config.port, env: config.nodeEnv } }, 'App configuration loaded')

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Create API router and apply rate limiting
  const apiRouter = express.Router()
  apiRouter.use(limiter as unknown as express.RequestHandler)

  // API Routes (CRUD)
  apiRouter.use('/users', userRouter)
  apiRouter.use('/profiles', profileRouter)
  apiRouter.use('/photos', photoRouter)
  apiRouter.use('/messages', messageRouter)
  apiRouter.use('/quizzes', quizRouter)
  apiRouter.use('/quiz-questions', quizQuestionRouter)
  apiRouter.use('/quiz-answers', quizAnswerRouter)
  apiRouter.use('/quiz-results', quizResultRouter)
  apiRouter.use('/behavior-events', behaviorEventRouter)
  apiRouter.use('/behavior-event-archives', behaviorEventArchiveRouter)
  apiRouter.use('/personality-dimensions', personalityDimensionRouter)
  apiRouter.use('/user-dimension-scores', userDimensionScoreRouter)
  apiRouter.use('/compatibility-scores', compatibilityScoreRouter)
  apiRouter.use('/event-weight-configs', eventWeightConfigRouter)

  // Service Routes
  apiRouter.use('/admin-config-service', adminConfigServiceRouter)

  // Mount API router with prefix
  app.use(config.api.prefix, apiRouter)

  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

