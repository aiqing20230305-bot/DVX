import { Request, Response, NextFunction } from 'express'
import { authService, type JWTPayload } from '../services/auth.service.js'
import { logger } from '../utils/logger.js'

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      userId?: string  // For backward compatibility with permission middleware
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token from cookie and attaches user info to request
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get access token from cookie
    const accessToken = req.cookies?.accessToken

    if (!accessToken) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录'
      })
      return
    }

    // Verify token
    const payload = authService.verifyToken(accessToken)

    // Attach user info to request
    req.user = payload
    req.userId = payload.userId  // For backward compatibility with permission middleware

    next()
  } catch (error) {
    logger.warn('Auth middleware error:', error)

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token无效或已过期'
    })
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't block if not
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies?.accessToken

    if (accessToken) {
      const payload = authService.verifyToken(accessToken)
      req.user = payload
    }

    next()
  } catch (error) {
    // Token invalid, but continue without user info
    next()
  }
}

/**
 * Require admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: '请先登录'
    })
    return
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: '需要管理员权限'
    })
    return
  }

  next()
}
