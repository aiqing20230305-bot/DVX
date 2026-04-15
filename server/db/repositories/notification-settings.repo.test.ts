import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { notificationSettingsRepo } from './notification-settings.repo.js'
import { genId } from '../../utils/id.js'
import * as fs from 'fs'
import * as path from 'path'

// 测试数据库文件
const TEST_DB_PATH = path.join(process.cwd(), 'test-notification-settings-repo.db')

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
    CREATE TABLE IF NOT EXISTS user_notification_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,

      -- 通知类型开关
      email_enabled INTEGER NOT NULL DEFAULT 1,
      inapp_enabled INTEGER NOT NULL DEFAULT 1,

      -- 细分通知类型
      mention_email INTEGER NOT NULL DEFAULT 1,
      mention_inapp INTEGER NOT NULL DEFAULT 1,
      reply_email INTEGER NOT NULL DEFAULT 0,
      reply_inapp INTEGER NOT NULL DEFAULT 1,
      approval_email INTEGER NOT NULL DEFAULT 1,
      approval_inapp INTEGER NOT NULL DEFAULT 1,
      system_email INTEGER NOT NULL DEFAULT 0,
      system_inapp INTEGER NOT NULL DEFAULT 1,

      -- 通知频率
      frequency TEXT NOT NULL DEFAULT 'realtime' CHECK (frequency IN ('realtime', 'daily', 'weekly')),

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

describe('notificationSettingsRepo', () => {
  describe('getOrCreate()', () => {
    it('应该创建默认通知设置（当用户设置不存在时）', () => {
      // Given: 新用户ID
      const userId = genId()

      // When: 调用getOrCreate()
      const settings = notificationSettingsRepo.getOrCreate(userId)

      // Then: 返回默认设置
      expect(settings).toBeDefined()
      expect(settings.id).toBeDefined()
      expect(settings.user_id).toBe(userId)
      expect(settings.email_enabled).toBe(true) // 默认开启
      expect(settings.inapp_enabled).toBe(true) // 默认开启
      expect(settings.mention_email).toBe(true) // 默认开启
      expect(settings.mention_inapp).toBe(true) // 默认开启
      expect(settings.reply_email).toBe(false) // 默认关闭
      expect(settings.reply_inapp).toBe(true) // 默认开启
      expect(settings.approval_email).toBe(true) // 默认开启
      expect(settings.approval_inapp).toBe(true) // 默认开启
      expect(settings.system_email).toBe(false) // 默认关闭
      expect(settings.system_inapp).toBe(true) // 默认开启
      expect(settings.frequency).toBe('realtime') // 默认实时
      expect(settings.created_at).toBeDefined()
      expect(settings.updated_at).toBeDefined()
    })

    it('应该返回已存在的设置（当用户设置已存在时）', () => {
      // Given: 已存在的用户设置
      const userId = genId()
      const firstSettings = notificationSettingsRepo.getOrCreate(userId)

      // When: 再次调用getOrCreate()
      const secondSettings = notificationSettingsRepo.getOrCreate(userId)

      // Then: 返回相同的设置（同一个ID）
      expect(secondSettings.id).toBe(firstSettings.id)
      expect(secondSettings.user_id).toBe(userId)
      expect(secondSettings.created_at).toBe(firstSettings.created_at)
    })
  })

  describe('update()', () => {
    it('应该更新通知设置', () => {
      // Given: 已存在的用户设置
      const userId = genId()
      notificationSettingsRepo.getOrCreate(userId)

      // When: 更新设置
      const success = notificationSettingsRepo.update(userId, {
        email_enabled: false,
        mention_email: false,
        frequency: 'daily'
      })

      // Then: 更新成功，设置已变更
      expect(success).toBe(true)
      const updatedSettings = notificationSettingsRepo.getOrCreate(userId)
      expect(updatedSettings.email_enabled).toBe(false)
      expect(updatedSettings.mention_email).toBe(false)
      expect(updatedSettings.frequency).toBe('daily')
      // 未更新的字段保持不变
      expect(updatedSettings.inapp_enabled).toBe(true)
      expect(updatedSettings.mention_inapp).toBe(true)
    })

    it('应该自动创建设置（如果不存在）', () => {
      // Given: 新用户ID（无设置）
      const userId = genId()

      // When: 直接调用update()
      const success = notificationSettingsRepo.update(userId, {
        email_enabled: false
      })

      // Then: 更新成功，设置已创建并更新
      expect(success).toBe(true)
      const settings = notificationSettingsRepo.getOrCreate(userId)
      expect(settings.email_enabled).toBe(false)
    })

    it('应该更新updated_at时间戳', async () => {
      // Given: 已存在的用户设置
      const userId = genId()
      const initialSettings = notificationSettingsRepo.getOrCreate(userId)
      const initialUpdatedAt = initialSettings.updated_at

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      // When: 更新设置
      notificationSettingsRepo.update(userId, {
        email_enabled: false
      })

      // Then: updated_at已更新（大于或等于初始时间戳）
      const updatedSettings = notificationSettingsRepo.getOrCreate(userId)
      expect(updatedSettings.updated_at).toBeGreaterThanOrEqual(initialUpdatedAt)
    })
  })

  describe('shouldSendNotification()', () => {
    it('应该返回true（当对应开关开启时）', () => {
      // Given: 用户设置（mention_email开启）
      const userId = genId()
      notificationSettingsRepo.getOrCreate(userId)

      // When: 检查是否应该发送mention类型的email通知
      const should = notificationSettingsRepo.shouldSendNotification(userId, 'mention', 'email')

      // Then: 返回true
      expect(should).toBe(true)
    })

    it('应该返回false（当总开关关闭时）', () => {
      // Given: 用户设置（email_enabled关闭）
      const userId = genId()
      notificationSettingsRepo.getOrCreate(userId)
      notificationSettingsRepo.update(userId, {
        email_enabled: false
      })

      // When: 检查是否应该发送mention类型的email通知
      const should = notificationSettingsRepo.shouldSendNotification(userId, 'mention', 'email')

      // Then: 返回false（总开关关闭）
      expect(should).toBe(false)
    })

    it('应该返回false（当具体类型开关关闭时）', () => {
      // Given: 用户设置（reply_email关闭）
      const userId = genId()
      notificationSettingsRepo.getOrCreate(userId)

      // When: 检查是否应该发送reply类型的email通知
      const should = notificationSettingsRepo.shouldSendNotification(userId, 'reply', 'email')

      // Then: 返回false（reply_email默认关闭）
      expect(should).toBe(false)
    })
  })
})
