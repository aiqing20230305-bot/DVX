import { Router, Request, Response } from 'express'
import { authService } from '../services/auth.service.js'
import { userRepo } from '../db/repositories/user.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { logger } from '../utils/logger.js'

const router = Router()

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({
        error: '缺少必填字段',
        message: '请提供邮箱、密码和姓名'
      })
      return
    }

    // Register user
    const { user, error } = await authService.register({ email, password, name })

    if (error) {
      res.status(400).json({ error })
      return
    }

    logger.info('User registered:', { userId: user.id, email: user.email })

    // Return public user info (no password_hash)
    res.status(201).json({
      user: userRepo.toPublicUser(user),
      message: '注册成功'
    })
  } catch (err) {
    logger.error('Register error:', err)
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: '缺少必填字段',
        message: '请提供邮箱和密码'
      })
      return
    }

    // Get client info
    const ip_address = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip
    const user_agent = req.headers['user-agent']

    // Login
    const result = await authService.login({
      email,
      password,
      ip_address,
      user_agent
    })

    if (result.error) {
      res.status(401).json({ error: result.error })
      return
    }

    logger.info('User logged in:', { userId: result.user!.id, email: result.user!.email })

    // Set tokens in httpOnly cookies
    const isProduction = process.env.NODE_ENV === 'production'

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Return public user info
    res.json({
      user: userRepo.toPublicUser(result.user!),
      message: '登录成功'
    })
  } catch (err) {
    logger.error('Login error:', err)
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (refreshToken) {
      await authService.logout(refreshToken)
    }

    // Clear cookies
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    logger.info('User logged out')

    res.json({ message: '登出成功' })
  } catch (err) {
    logger.error('Logout error:', err)
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '未找到刷新令牌'
      })
      return
    }

    // Refresh access token
    const result = await authService.refreshAccessToken(refreshToken)

    if (result.error) {
      res.status(401).json({ error: result.error })
      return
    }

    // Set new access token in cookie
    const isProduction = process.env.NODE_ENV === 'production'

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    })

    logger.info('Access token refreshed')

    res.json({ message: 'Token刷新成功' })
  } catch (err) {
    logger.error('Refresh error:', err)
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    // Development mode: return mock user directly
    if (process.env.NODE_ENV !== 'production' && req.user!.userId === 'dev-user-mock') {
      res.json({
        user: {
          id: 'dev-user-mock',
          email: 'dev@example.com',
          name: '开发测试用户',
          role: 'admin',
          created_at: Date.now(),
          updated_at: Date.now()
        }
      })
      return
    }

    const userId = req.user!.userId
    const user = userRepo.findById(userId)

    if (!user) {
      res.status(404).json({ error: '用户不存在' })
      return
    }

    res.json({ user: userRepo.toPublicUser(user) })
  } catch (err) {
    logger.error('Get me error:', err)
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as authRouter }
