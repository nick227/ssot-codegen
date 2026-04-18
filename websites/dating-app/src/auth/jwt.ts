import { Request, Response, NextFunction } from 'express'

// Mock authentication middleware
// Generated because standalone generator did not load SSOT config to enable real Auth
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Mock user
  (req as any).user = { userId: 1, role: 'admin' }
  next()
}
