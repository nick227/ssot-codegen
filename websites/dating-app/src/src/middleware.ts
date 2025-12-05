import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

interface ErrorWithStatusCode extends Error {
  statusCode?: number
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err)

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors,
    })
  }

  const statusCode = (err as ErrorWithStatusCode).statusCode || 500
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  })
}

