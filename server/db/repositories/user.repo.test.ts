import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { userRepo } from './user.repo.js'
import { genId } from '../../utils/id.js'
import * as fs from 'fs'
import * as path from 'path'

// 测试数据库文件
const TEST_DB_PATH = path.join(process.cwd(), 'test-user-repo.db')

// Mock getDb函数
let testDb: Database.Database

// 在测试前设置测试数据库
beforeEach(() => {
  // 删除旧的测试数据库（如果存在）
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }

  // 创建新的测试数据库
  testDb = new Database(TEST_DB_PATH)

  // 创建必要的表结构
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      email_verified INTEGER NOT NULL DEFAULT 0,
      last_login_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // Mock getDb to return test database
  ;(global as any).__TEST_DB__ = testDb
})

afterEach(() => {
  // 关闭数据库连接
  if (testDb) {
    testDb.close()
  }

  // 删除测试数据库文件
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }

  // Clean up mock
  delete (global as any).__TEST_DB__
})

describe('userRepo', () => {
  describe('create()', () => {
    it('应该创建新用户', () => {
      // Given: 用户输入数据
      const input = {
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      }

      // When: 调用create()
      const user = userRepo.create(input)

      // Then: 返回用户对象，包含生成的ID和时间戳
      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(user.password_hash).toBe('hashed_password')
      expect(user.role).toBe('user')  // 默认角色
      expect(user.status).toBe('active')  // 默认状态
      expect(user.email_verified).toBe(0)  // 默认未验证
      expect(user.created_at).toBeDefined()
      expect(user.updated_at).toBeDefined()
    })

    it('应该创建管理员用户', () => {
      // Given: 管理员用户输入
      const input = {
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        name: 'Admin User',
        role: 'admin' as const
      }

      // When: 调用create()
      const user = userRepo.create(input)

      // Then: 角色为admin
      expect(user.role).toBe('admin')
    })

    it('应该处理可选的avatar字段', () => {
      // Given: 包含avatar的用户输入
      const input = {
        email: 'user@example.com',
        password_hash: 'hashed_password',
        name: 'User with Avatar',
        avatar: 'https://example.com/avatar.jpg'
      }

      // When: 调用create()
      const user = userRepo.create(input)

      // Then: avatar被正确存储
      expect(user.avatar).toBe('https://example.com/avatar.jpg')
    })
  })

  describe('findByEmail()', () => {
    it('应该根据邮箱查找用户', () => {
      // Given: 创建测试用户
      const user = userRepo.create({
        email: 'find@example.com',
        password_hash: 'hashed_password',
        name: 'Find User'
      })

      // When: 根据邮箱查找
      const found = userRepo.findByEmail('find@example.com')

      // Then: 返回正确的用户
      expect(found).toBeDefined()
      expect(found?.id).toBe(user.id)
      expect(found?.email).toBe('find@example.com')
    })

    it('应该在用户不存在时返回null', () => {
      // When: 查找不存在的邮箱
      const found = userRepo.findByEmail('nonexistent@example.com')

      // Then: 返回null
      expect(found).toBeNull()
    })
  })

  describe('findById()', () => {
    it('应该根据ID查找用户', () => {
      // Given: 创建测试用户
      const user = userRepo.create({
        email: 'findbyid@example.com',
        password_hash: 'hashed_password',
        name: 'Find By ID User'
      })

      // When: 根据ID查找
      const found = userRepo.findById(user.id)

      // Then: 返回正确的用户
      expect(found).toBeDefined()
      expect(found?.id).toBe(user.id)
      expect(found?.email).toBe('findbyid@example.com')
    })

    it('应该在用户不存在时返回null', () => {
      // When: 查找不存在的ID
      const found = userRepo.findById('nonexistent-id')

      // Then: 返回null
      expect(found).toBeNull()
    })
  })

  describe('findAll()', () => {
    it('应该查找所有用户', async () => {
      // Given: 创建多个用户（确保时间戳不同）
      const now = Date.now()
      testDb.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), 'user1@example.com', 'hashed_password', 'User 1', 'user', 'active', 0, now, now)

      testDb.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), 'user2@example.com', 'hashed_password', 'User 2', 'user', 'active', 0, now + 1, now + 1)

      testDb.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), 'user3@example.com', 'hashed_password', 'User 3', 'user', 'active', 0, now + 2, now + 2)

      // When: 调用findAll()
      const users = userRepo.findAll()

      // Then: 返回所有用户（按创建时间倒序）
      expect(users).toHaveLength(3)
      expect(users[0].name).toBe('User 3')  // 最新创建的
      expect(users[2].name).toBe('User 1')  // 最早创建的
    })

    it('应该根据状态过滤用户', () => {
      // Given: 创建不同状态的用户
      const user1 = userRepo.create({
        email: 'active@example.com',
        password_hash: 'hashed_password',
        name: 'Active User'
      })
      const user2 = userRepo.create({
        email: 'inactive@example.com',
        password_hash: 'hashed_password',
        name: 'Inactive User'
      })

      // 更新user2为inactive状态
      userRepo.update(user2.id, { status: 'inactive' })

      // When: 查找active用户
      const activeUsers = userRepo.findAll({ status: 'active' })

      // Then: 仅返回active用户
      expect(activeUsers).toHaveLength(1)
      expect(activeUsers[0].email).toBe('active@example.com')
    })
  })

  describe('update()', () => {
    it('应该更新用户信息', () => {
      // Given: 创建测试用户（使用明确的时间戳）
      const now = Date.now() - 1000  // 1秒前
      const userId = genId()
      testDb.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'update@example.com', 'hashed_password', 'Old Name', 'user', 'active', 0, now, now)

      // When: 更新用户名（确保时间戳不同）
      const updated = userRepo.update(userId, { name: 'New Name' })

      // Then: 用户名被更新
      expect(updated).toBeDefined()
      expect(updated?.name).toBe('New Name')
      expect(updated?.email).toBe('update@example.com')  // 邮箱不变
      expect(updated?.updated_at).toBeGreaterThan(now)  // 应该大于1秒前
    })

    it('应该更新用户头像', () => {
      // Given: 创建无头像用户
      const user = userRepo.create({
        email: 'avatar@example.com',
        password_hash: 'hashed_password',
        name: 'User'
      })

      // When: 更新头像
      const updated = userRepo.update(user.id, {
        avatar: 'https://example.com/new-avatar.jpg'
      })

      // Then: 头像被更新
      expect(updated?.avatar).toBe('https://example.com/new-avatar.jpg')
    })

    it('应该验证用户邮箱', () => {
      // Given: 创建未验证用户
      const user = userRepo.create({
        email: 'verify@example.com',
        password_hash: 'hashed_password',
        name: 'User'
      })

      // When: 验证邮箱
      const updated = userRepo.update(user.id, { email_verified: 1 })

      // Then: 邮箱已验证
      expect(updated?.email_verified).toBe(1)
    })

    it('应该更新用户状态', () => {
      // Given: 创建active用户
      const user = userRepo.create({
        email: 'status@example.com',
        password_hash: 'hashed_password',
        name: 'User'
      })

      // When: 暂停用户
      const updated = userRepo.update(user.id, { status: 'suspended' })

      // Then: 状态变为suspended
      expect(updated?.status).toBe('suspended')
    })

    it('应该更新最后登录时间', () => {
      // Given: 创建用户
      const user = userRepo.create({
        email: 'login@example.com',
        password_hash: 'hashed_password',
        name: 'User'
      })

      const loginTime = Date.now()

      // When: 更新最后登录时间
      const updated = userRepo.update(user.id, { last_login_at: loginTime })

      // Then: 最后登录时间被更新
      expect(updated?.last_login_at).toBe(loginTime)
    })

    it('应该在用户不存在时返回null', () => {
      // When: 更新不存在的用户
      const updated = userRepo.update('nonexistent-id', { name: 'New Name' })

      // Then: 返回null
      expect(updated).toBeNull()
    })
  })

  describe('updatePassword()', () => {
    it('应该更新用户密码', () => {
      // Given: 创建测试用户
      const user = userRepo.create({
        email: 'password@example.com',
        password_hash: 'old_hash',
        name: 'User'
      })

      // When: 更新密码
      const success = userRepo.updatePassword(user.id, 'new_hash')

      // Then: 更新成功
      expect(success).toBe(true)

      // 验证密码已更新
      const updated = userRepo.findById(user.id)
      expect(updated?.password_hash).toBe('new_hash')
    })

    it('应该在用户不存在时返回false', () => {
      // When: 更新不存在用户的密码
      const success = userRepo.updatePassword('nonexistent-id', 'new_hash')

      // Then: 返回false
      expect(success).toBe(false)
    })
  })

  describe('delete()', () => {
    it('应该删除用户', () => {
      // Given: 创建测试用户
      const user = userRepo.create({
        email: 'delete@example.com',
        password_hash: 'hashed_password',
        name: 'Delete User'
      })

      // When: 删除用户
      const success = userRepo.delete(user.id)

      // Then: 删除成功
      expect(success).toBe(true)

      // 验证用户已删除
      const found = userRepo.findById(user.id)
      expect(found).toBeNull()
    })

    it('应该在用户不存在时返回false', () => {
      // When: 删除不存在的用户
      const success = userRepo.delete('nonexistent-id')

      // Then: 返回false
      expect(success).toBe(false)
    })
  })

  describe('边界测试', () => {
    it('应该在邮箱重复时抛出错误', () => {
      // Given: 创建用户
      userRepo.create({
        email: 'duplicate@example.com',
        password_hash: 'hashed_password',
        name: 'User 1'
      })

      // When/Then: 创建相同邮箱的用户应抛出错误
      expect(() => {
        userRepo.create({
          email: 'duplicate@example.com',
          password_hash: 'hashed_password',
          name: 'User 2'
        })
      }).toThrow()
    })

    it('应该统计用户数量', () => {
      // Given: 创建5个用户
      for (let i = 0; i < 5; i++) {
        userRepo.create({
          email: `user${i}@example.com`,
          password_hash: 'hashed_password',
          name: `User ${i}`
        })
      }

      // When: 查找所有用户
      const users = userRepo.findAll()

      // Then: 返回5个用户
      expect(users).toHaveLength(5)
    })
  })

  describe('toPublicUser()', () => {
    it('应该移除password_hash字段', () => {
      // Given: 创建用户
      const user = userRepo.create({
        email: 'public@example.com',
        password_hash: 'hashed_password',
        name: 'Public User'
      })

      // When: 转换为公开用户对象
      const publicUser = userRepo.toPublicUser(user)

      // Then: password_hash字段不存在
      expect(publicUser).toBeDefined()
      expect(publicUser.email).toBe('public@example.com')
      expect(publicUser.name).toBe('Public User')
      expect((publicUser as any).password_hash).toBeUndefined()
    })
  })
})
