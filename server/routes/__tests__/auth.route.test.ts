import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'
import { createTestUser, cleanupTestData } from './helpers.js'
import getDb from '../../db/index.js'
import { setupTestDatabase } from './test-db-setup.js'

/**
 * 认证API集成测试
 *
 * 测试范围：
 * - 用户登录验证
 * - 用户注册验证
 */
describe('认证API', () => {
  // Setup isolated test database
  setupTestDatabase()

  afterEach(() => {
    cleanupTestData()
  })

  describe('POST /api/auth/login - 用户登录', () => {
    it('应该成功登录并返回token', async () => {
      // Given: 创建测试用户（使用明确的密码hash）
      // 注意：createTestUser创建的用户密码hash是'hashed_password_123'
      // 我们需要实际加密一个密码来测试
      const email = 'login-test@example.com'
      const password = 'Test123456!'

      // 先注册用户（使用真实的密码加密）
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password,
          name: '测试用户'
        })
        .expect(201)

      expect(registerResponse.body.message).toBe('注册成功')
      expect(registerResponse.body.user.email).toBe(email)

      // When: 使用正确的邮箱和密码登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password
        })
        .expect(200)

      // Then: 返回用户信息和token
      expect(loginResponse.body.message).toBe('登录成功')
      expect(loginResponse.body.user).toBeDefined()
      expect(loginResponse.body.user.email).toBe(email)
      expect(loginResponse.body.token).toBeDefined() // 应该有accessToken
      expect(typeof loginResponse.body.token).toBe('string')
      expect(loginResponse.body.token.length).toBeGreaterThan(0)

      // 验证cookie中也设置了token
      const cookies = loginResponse.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies.some((c: string) => c.includes('accessToken'))).toBe(true)
      expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true)
    })

    it('应该拒绝错误的密码', async () => {
      // Given: 创建测试用户
      const email = 'wrong-pwd-test@example.com'
      const correctPassword = 'Test123456!'
      const wrongPassword = 'WrongPassword!'

      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: correctPassword,
          name: '测试用户'
        })
        .expect(201)

      // When: 使用错误的密码登录
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: wrongPassword
        })
        .expect(401)

      // Then: 返回401错误
      expect(response.body.error).toBeDefined()
    })

    it('应该拒绝不存在的用户', async () => {
      // When: 使用不存在的邮箱登录
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!'
        })
        .expect(401)

      // Then: 返回401错误
      expect(response.body.error).toBeDefined()
    })

    it('应该验证必填字段', async () => {
      // When: 缺少password字段
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400)

      // Then: 返回400错误
      expect(response1.body.error).toBe('缺少必填字段')
      expect(response1.body.message).toContain('请提供邮箱和密码')

      // When: 缺少email字段
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Test123456!'
        })
        .expect(400)

      // Then: 返回400错误
      expect(response2.body.error).toBe('缺少必填字段')
    })
  })

  describe('POST /api/auth/register - 用户注册', () => {
    it('应该成功注册新用户', async () => {
      // When: 注册新用户
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Test123456!',
          name: '新用户'
        })
        .expect(201)

      // Then: 返回用户信息（不包含密码）
      expect(response.body.message).toBe('注册成功')
      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe('newuser@example.com')
      expect(response.body.user.name).toBe('新用户')
      expect(response.body.user.password_hash).toBeUndefined() // 不应该返回密码hash
      expect(response.body.user.id).toBeDefined()
      expect(response.body.user.created_at).toBeDefined()

      // 验证用户已存储到数据库
      const db = getDb()
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get('newuser@example.com') as any
      expect(user).toBeDefined()
      expect(user.email).toBe('newuser@example.com')
      expect(user.password_hash).toBeDefined() // 数据库中应该有密码hash
    })

    it('应该拒绝重复的邮箱', async () => {
      // Given: 已注册的用户
      const email = 'duplicate@example.com'
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test123456!',
          name: '第一个用户'
        })
        .expect(201)

      // When: 尝试用相同邮箱注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'AnotherPassword123!',
          name: '第二个用户'
        })
        .expect(400)

      // Then: 返回错误
      expect(response.body.error).toBeDefined()
    })

    it('应该验证必填字段', async () => {
      // When: 缺少name字段
      const response1 = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123456!'
        })
        .expect(400)

      // Then: 返回400错误
      expect(response1.body.error).toBe('缺少必填字段')
      expect(response1.body.message).toContain('请提供邮箱、密码和姓名')

      // When: 缺少password字段
      const response2 = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: '测试用户'
        })
        .expect(400)

      // Then: 返回400错误
      expect(response2.body.error).toBe('缺少必填字段')

      // When: 缺少email字段
      const response3 = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'Test123456!',
          name: '测试用户'
        })
        .expect(400)

      // Then: 返回400错误
      expect(response3.body.error).toBe('缺少必填字段')
    })

    it('应该验证邮箱格式', async () => {
      // When: 使用无效的邮箱格式
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email', // 无效格式
          password: 'Test123456!',
          name: '测试用户'
        })
        .expect(400)

      // Then: 返回错误（authService应该验证邮箱格式）
      expect(response.body.error).toBeDefined()
    })

    it('应该验证密码强度', async () => {
      // When: 使用弱密码（太短）
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak-pwd@example.com',
          password: '123', // 太短
          name: '测试用户'
        })
        .expect(400)

      // Then: 返回错误（authService应该验证密码强度）
      expect(response.body.error).toBeDefined()
    })
  })

  describe('GET /api/auth/me - 获取当前用户', () => {
    it('应该返回已登录用户的信息', async () => {
      // Given: 注册并登录用户
      const email = 'me-test@example.com'
      const password = 'Test123456!'

      await request(app)
        .post('/api/auth/register')
        .send({ email, password, name: '当前用户' })
        .expect(201)

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200)

      const token = loginResponse.body.token

      // When: 使用token获取用户信息
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Then: 返回用户信息
      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe(email)
      expect(response.body.user.name).toBe('当前用户')
    })

    it('应该拒绝未认证的请求', async () => {
      // When: 不带token请求
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      // Then: 返回401错误
      expect(response.body.error).toBeDefined()
    })
  })
})
