import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { userRepo, type User, type CreateUserInput } from '../db/repositories/user.repo.js'
import { sessionRepo } from '../db/repositories/session.repo.js'

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-please-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
const BCRYPT_SALT_ROUNDS = 12

// JWT Payload interfaces
export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: 'admin' | 'user'
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  sessionId: string
  iat?: number
  exp?: number
}

// Auth Service
export const authService = {
  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
  },

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  },

  /**
   * Generate JWT access token
   */
  generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  },

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string, sessionId: string): string {
    const payload: RefreshTokenPayload = {
      userId,
      sessionId
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
  },

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  },

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as RefreshTokenPayload
    } catch (error) {
      throw new Error('Invalid or expired refresh token')
    }
  },

  /**
   * Hash token for storage (SHA256)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  },

  /**
   * Calculate token expiration timestamp
   */
  getTokenExpiration(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) {
      throw new Error('Invalid expiresIn format')
    }

    const value = parseInt(match[1])
    const unit = match[2]

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    }

    return Date.now() + value * multipliers[unit]
  },

  /**
   * Register new user
   */
  async register(input: {
    email: string
    password: string
    name: string
  }): Promise<{ user: User; error?: string }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.email)) {
      return { user: null as any, error: '邮箱格式不正确' }
    }

    // Validate password strength
    if (input.password.length < 8) {
      return { user: null as any, error: '密码至少需要8个字符' }
    }

    // Check if email already exists
    const existing = userRepo.findByEmail(input.email)
    if (existing) {
      return { user: null as any, error: '该邮箱已被注册' }
    }

    // Hash password
    const password_hash = await this.hashPassword(input.password)

    // Create user
    const user = userRepo.create({
      email: input.email,
      password_hash,
      name: input.name
    })

    return { user }
  },

  /**
   * Login user
   */
  async login(input: {
    email: string
    password: string
    ip_address?: string
    user_agent?: string
  }): Promise<{
    user?: User
    accessToken?: string
    refreshToken?: string
    error?: string
  }> {
    // Find user by email
    const user = userRepo.findByEmail(input.email)
    if (!user) {
      return { error: '邮箱或密码错误' }
    }

    // Check if user is active
    if (user.status !== 'active') {
      return { error: '账号已被禁用，请联系管理员' }
    }

    // Verify password
    const isValid = await this.verifyPassword(input.password, user.password_hash)
    if (!isValid) {
      return { error: '邮箱或密码错误' }
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user)
    const sessionId = crypto.randomUUID()
    const refreshToken = this.generateRefreshToken(user.id, sessionId)

    // Store session
    const accessTokenExpiration = this.getTokenExpiration(JWT_EXPIRES_IN)
    const refreshTokenExpiration = this.getTokenExpiration(REFRESH_TOKEN_EXPIRES_IN)

    sessionRepo.create({
      user_id: user.id,
      token_hash: this.hashToken(accessToken),
      refresh_token_hash: this.hashToken(refreshToken),
      ip_address: input.ip_address,
      user_agent: input.user_agent,
      expires_at: refreshTokenExpiration // Use refresh token expiration for session
    })

    // Update last login time
    userRepo.update(user.id, { last_login_at: Date.now() })

    return { user, accessToken, refreshToken }
  },

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken?: string
    error?: string
  }> {
    try {
      // Verify refresh token
      const payload = this.verifyRefreshToken(refreshToken)

      // Find session
      const session = sessionRepo.findByRefreshTokenHash(this.hashToken(refreshToken))
      if (!session) {
        return { error: 'Invalid session' }
      }

      // Check if session is still valid
      if (!sessionRepo.isValid(session)) {
        sessionRepo.delete(session.id)
        return { error: 'Session expired' }
      }

      // Find user
      const user = userRepo.findById(payload.userId)
      if (!user || user.status !== 'active') {
        return { error: 'User not found or inactive' }
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user)

      // Update session with new token hash
      const newExpiration = this.getTokenExpiration(JWT_EXPIRES_IN)
      sessionRepo.updateTokenHash(session.id, this.hashToken(accessToken), newExpiration)

      return { accessToken }
    } catch (error) {
      return { error: 'Invalid refresh token' }
    }
  },

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = this.verifyRefreshToken(refreshToken)
      const session = sessionRepo.findByRefreshTokenHash(this.hashToken(refreshToken))

      if (session) {
        sessionRepo.delete(session.id)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Invalid refresh token' }
    }
  },

  /**
   * Cleanup expired sessions (should be run periodically)
   */
  cleanupExpiredSessions(): number {
    return sessionRepo.deleteExpired()
  }
}
