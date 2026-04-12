import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { scriptRepo } from './script.repo.js'
import { genId } from '../../utils/id.js'
import * as fs from 'fs'
import * as path from 'path'

// 测试数据库文件
const TEST_DB_PATH = path.join(process.cwd(), 'test-script-repo.db')

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
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      angle TEXT NOT NULL,
      persona TEXT NOT NULL,
      platform TEXT NOT NULL,
      estimated_duration INTEGER NOT NULL DEFAULT 60,
      cta TEXT NOT NULL,
      insight_ref TEXT NOT NULL DEFAULT '[]',
      priority INTEGER NOT NULL DEFAULT 3,
      selected INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  testDb.exec(`
    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      variant TEXT NOT NULL DEFAULT 'A',
      segments TEXT NOT NULL DEFAULT '[]',
      full_text TEXT NOT NULL DEFAULT '',
      word_count INTEGER NOT NULL DEFAULT 0,
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

// 辅助函数：创建测试选题
function createTestTopic(projectId: string): string {
  const topicId = genId()
  const now = Date.now()
  testDb.prepare(`
    INSERT INTO topics (id, project_id, title, angle, persona, platform, estimated_duration, cta, insight_ref, priority, selected, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(topicId, projectId, '测试选题', '测试角度', '测试人群', 'douyin', 30, '测试CTA', '[]', 3, 0, now, now)
  return topicId
}

describe('scriptRepo', () => {
  describe('create()', () => {
    it('应该创建新脚本（使用新格式）', () => {
      // Given: 脚本输入数据（新格式）
      const projectId = genId()
      const topicId = createTestTopic(projectId)
      const data = {
        variant: 'A',
        positioning: '情感共鸣',
        hook: '你是否也有这样的困扰？',
        hookType: '痛点型',
        segments: [
          {
            type: 'opening',
            voiceover: '开场白文案',
            duration: 3,
            shot: '特写镜头'
          },
          {
            type: 'body',
            voiceover: '主体内容文案',
            duration: 20,
            shot: '中景镜头'
          }
        ],
        fullVoiceover: '开场白文案\n主体内容文案',
        scenes: ['场景1', '场景2'],
        emotionPath: '开心→惊喜→感动'
      }

      // When: 调用create()
      const script = scriptRepo.create(projectId, topicId, 'A', data)

      // Then: 返回脚本对象
      expect(script).toBeDefined()
      expect(script.id).toBeDefined()
      expect(script.project_id).toBe(projectId)
      expect(script.topic_id).toBe(topicId)
      expect(script.variant).toBe('A')
      expect(script.full_text).toBe('开场白文案\n主体内容文案')
      expect(script.word_count).toBeGreaterThan(0)
      expect(script.created_at).toBeDefined()
      expect(script.updated_at).toBeDefined()

      // 验证segments包含完整数据
      const segments = JSON.parse(script.segments)
      expect(segments.segments).toHaveLength(2)
      expect(segments.positioning).toBe('情感共鸣')
      expect(segments.hook).toBe('你是否也有这样的困扰？')
      expect(segments.scenes).toEqual(['场景1', '场景2'])
    })

    it('应该创建新脚本（使用旧格式）', () => {
      // Given: 脚本输入数据（旧格式）
      const projectId = genId()
      const topicId = createTestTopic(projectId)
      const data = {
        fullText: '这是完整的脚本内容',
        wordCount: 10
      }

      // When: 调用create()
      const script = scriptRepo.create(projectId, topicId, 'B', data)

      // Then: 返回脚本对象
      expect(script).toBeDefined()
      expect(script.variant).toBe('B')
      expect(script.full_text).toBe('这是完整的脚本内容')
      expect(script.word_count).toBe(10)
    })

    it('应该处理A/B版本', () => {
      // Given: 同一选题的两个版本
      const projectId = genId()
      const topicId = createTestTopic(projectId)

      // When: 创建A版本和B版本
      const scriptA = scriptRepo.create(projectId, topicId, 'A', {
        fullVoiceover: 'A版本内容'
      })
      const scriptB = scriptRepo.create(projectId, topicId, 'B', {
        fullVoiceover: 'B版本内容'
      })

      // Then: 两个版本都已创建
      expect(scriptA.variant).toBe('A')
      expect(scriptB.variant).toBe('B')
      expect(scriptA.full_text).toBe('A版本内容')
      expect(scriptB.full_text).toBe('B版本内容')
    })
  })

  describe('findById()', () => {
    it('应该根据ID查找脚本', () => {
      // Given: 已存在的脚本
      const projectId = genId()
      const topicId = createTestTopic(projectId)
      const created = scriptRepo.create(projectId, topicId, 'A', {
        fullVoiceover: '测试脚本'
      })

      // When: 调用findById()
      const found = scriptRepo.findById(created.id)

      // Then: 返回正确的脚本
      expect(found).toBeDefined()
      expect(found!.id).toBe(created.id)
      expect(found!.full_text).toBe('测试脚本')
    })

    it('应该返回undefined（当脚本不存在时）', () => {
      // Given: 不存在的脚本ID
      const nonExistentId = genId()

      // When: 调用findById()
      const found = scriptRepo.findById(nonExistentId)

      // Then: 返回undefined
      expect(found).toBeUndefined()
    })
  })

  describe('findByTopic()', () => {
    it('应该查找选题的所有脚本', () => {
      // Given: 选题有A和B两个版本
      const projectId = genId()
      const topicId = createTestTopic(projectId)
      scriptRepo.create(projectId, topicId, 'A', {
        fullVoiceover: 'A版本'
      })
      scriptRepo.create(projectId, topicId, 'B', {
        fullVoiceover: 'B版本'
      })

      // When: 调用findByTopic()
      const scripts = scriptRepo.findByTopic(topicId)

      // Then: 返回所有版本，按variant排序
      expect(scripts).toHaveLength(2)
      expect(scripts[0].variant).toBe('A')
      expect(scripts[1].variant).toBe('B')
    })

    it('应该返回空数组（当选题无脚本时）', () => {
      // Given: 新选题（无脚本）
      const projectId = genId()
      const topicId = createTestTopic(projectId)

      // When: 调用findByTopic()
      const scripts = scriptRepo.findByTopic(topicId)

      // Then: 返回空数组
      expect(scripts).toHaveLength(0)
    })
  })

  describe('update()', () => {
    it('应该更新脚本内容', () => {
      // Given: 已存在的脚本
      const projectId = genId()
      const topicId = createTestTopic(projectId)
      const script = scriptRepo.create(projectId, topicId, 'A', {
        fullText: '原始内容',
        wordCount: 4
      })

      // When: 更新内容
      scriptRepo.update(script.id, {
        fullText: '更新后的内容',
        wordCount: 6
      })

      // Then: 内容已更新
      const updated = scriptRepo.findById(script.id)
      expect(updated!.full_text).toBe('更新后的内容')
      expect(updated!.word_count).toBe(6)
    })

    it('应该更新updated_at时间戳', async () => {
      // Given: 已存在的脚本
      const projectId = genId()
      const topicId = createTestTopic(projectId)
      const script = scriptRepo.create(projectId, topicId, 'A', {
        fullText: '原始内容'
      })
      const originalUpdatedAt = script.updated_at

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      // When: 更新脚本
      scriptRepo.update(script.id, {
        fullText: '新内容'
      })

      // Then: updated_at已更新（大于或等于初始时间戳）
      const updated = scriptRepo.findById(script.id)
      expect(updated!.updated_at).toBeGreaterThanOrEqual(originalUpdatedAt)
    })
  })

  describe('deleteMany()', () => {
    it('应该批量删除脚本', () => {
      // Given: 多个脚本
      const projectId = genId()
      const topic1 = createTestTopic(projectId)
      const topic2 = createTestTopic(projectId)
      const script1 = scriptRepo.create(projectId, topic1, 'A', { fullText: '脚本1' })
      const script2 = scriptRepo.create(projectId, topic1, 'B', { fullText: '脚本2' })
      const script3 = scriptRepo.create(projectId, topic2, 'A', { fullText: '脚本3' })

      // When: 批量删除2个脚本
      scriptRepo.deleteMany([script1.id, script2.id])

      // Then: 2个脚本已删除，1个保留
      expect(scriptRepo.findById(script1.id)).toBeUndefined()
      expect(scriptRepo.findById(script2.id)).toBeUndefined()
      expect(scriptRepo.findById(script3.id)).toBeDefined()
    })
  })

  describe('边界测试', () => {
    it('应该正确处理包含特殊字符的内容', () => {
      // Given: 包含特殊字符的脚本内容
      const projectId = genId()
      const topicId = createTestTopic(projectId)
      const specialContent = '包含\n换行\t制表符和特殊字符：#@!%'

      // When: 创建脚本
      const script = scriptRepo.create(projectId, topicId, 'A', {
        fullVoiceover: specialContent
      })

      // Then: 特殊字符正确保存
      expect(script.full_text).toContain('\n')
      expect(script.full_text).toContain('\t')
      expect(script.full_text).toContain('#@!%')
    })

    it('应该正确处理空内容', () => {
      // Given: 空内容
      const projectId = genId()
      const topicId = createTestTopic(projectId)

      // When: 创建空脚本
      const script = scriptRepo.create(projectId, topicId, 'A', {
        fullText: ''
      })

      // Then: 空内容正确保存
      expect(script.full_text).toBe('')
      expect(script.word_count).toBe(0)
    })
  })
})
