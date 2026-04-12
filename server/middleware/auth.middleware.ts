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
    // v2.20.0 Phase 3.1: Development environment auth bypass for automated testing
    if (process.env.NODE_ENV === 'development') {
      const devAuth = req.headers['x-dev-auth'] as string
      if (devAuth === process.env.DEV_AUTH_TOKEN || devAuth === 'test-bypass') {
        const mockTestUser: JWTPayload = {
          userId: 'dev-user-mock',
          email: 'dev@test.local',
          name: '自动化测试用户',
          role: 'admin'
        }
        req.user = mockTestUser
        req.userId = mockTestUser.userId
        logger.info(`[DEV] Auth bypassed for automated test: ${req.method} ${req.path}`)
        next()
        return
      }
    }

    // Try to get token from cookie or Authorization header
    let accessToken = req.cookies?.accessToken

    // If no cookie token, check Authorization header (Bearer token)
    if (!accessToken) {
      const authHeader = req.headers['authorization']
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7) // Remove 'Bearer ' prefix
      }
    }

    // Development mode: use mock user if no valid token found (but not in test mode)
    if (process.env.NODE_ENV === 'development' && !accessToken) {
      const mockUser: JWTPayload = {
        userId: 'dev-user-mock',
        email: 'dev@example.com',
        name: '开发测试用户',
        role: 'admin'
      }
      req.user = mockUser
      req.userId = mockUser.userId
      console.log('[Auth] Development mode - using mock user')
      next()
      return
    }

    // Require valid token (production or development with token)
    if (!accessToken) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录'
      })
      return
    }

    // Verify token
    const payload = authService.verifyToken(accessToken)

    // Log in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auth] Development mode - using real user ${payload.userId}`)
    }

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
