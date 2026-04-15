import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { topicRepo } from './topic.repo.js'
import { genId } from '../../utils/id.js'
import * as fs from 'fs'
import * as path from 'path'

// 测试数据库文件
const TEST_DB_PATH = path.join(process.cwd(), 'test-topic-repo.db')

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

describe('topicRepo', () => {
  describe('create()', () => {
    it('应该创建新选题（使用新格式）', () => {
      // Given: 选题输入数据（新格式）
      const projectId = genId()
      const data = {
        name: '产品卖点挖掘',
        direction: '突出产品独特价值',
        targetPersona: '25-35岁职场人士',
        core: '专业高效',
        platform: 'douyin' as const,
        estimatedDuration: 30,
        rank: 5
      }

      // When: 调用create()
      const topic = topicRepo.create(projectId, data)

      // Then: 返回选题对象
      expect(topic).toBeDefined()
      expect(topic.id).toBeDefined()
      expect(topic.project_id).toBe(projectId)
      expect(topic.title).toBe('产品卖点挖掘')
      expect(topic.angle).toContain('突出产品独特价值')
      expect(topic.persona).toBe('25-35岁职场人士')
      expect(topic.platform).toBe('douyin')
      expect(topic.estimated_duration).toBe(30)
      expect(topic.priority).toBe(5)
      expect(topic.selected).toBe(0) // 默认未选中
      expect(topic.created_at).toBeDefined()
      expect(topic.updated_at).toBeDefined()
    })

    it('应该创建新选题（使用旧格式）', () => {
      // Given: 选题输入数据（旧格式）
      const projectId = genId()
      const data = {
        title: '品牌故事讲述',
        angle: '情感化叙事',
        persona: '年轻女性',
        platform: 'xiaohongshu' as const,
        estimatedDuration: 45
      }

      // When: 调用create()
      const topic = topicRepo.create(projectId, data)

      // Then: 返回选题对象
      expect(topic).toBeDefined()
      expect(topic.title).toBe('品牌故事讲述')
      expect(topic.angle).toBe('情感化叙事')
      expect(topic.persona).toBe('年轻女性')
      expect(topic.platform).toBe('xiaohongshu')
      expect(topic.estimated_duration).toBe(45)
    })

    it('应该处理默认值', () => {
      // Given: 最小输入数据
      const projectId = genId()
      const data = {
        name: '最小选题'
      }

      // When: 调用create()
      const topic = topicRepo.create(projectId, data)

      // Then: 应用默认值
      expect(topic.platform).toBe('douyin') // 默认平台
      expect(topic.estimated_duration).toBe(30) // 默认时长
      expect(topic.priority).toBe(3) // 默认优先级
      expect(topic.selected).toBe(0) // 默认未选中
    })
  })

  describe('findById()', () => {
    it('应该根据ID查找选题', () => {
      // Given: 已存在的选题
      const projectId = genId()
      const created = topicRepo.create(projectId, {
        name: '测试选题',
        direction: '测试方向'
      })

      // When: 调用findById()
      const found = topicRepo.findById(created.id)

      // Then: 返回正确的选题
      expect(found).toBeDefined()
      expect(found!.id).toBe(created.id)
      expect(found!.title).toBe('测试选题')
    })

    it('应该返回undefined（当选题不存在时）', () => {
      // Given: 不存在的选题ID
      const nonExistentId = genId()

      // When: 调用findById()
      const found = topicRepo.findById(nonExistentId)

      // Then: 返回undefined
      expect(found).toBeUndefined()
    })
  })

  describe('findByProject()', () => {
    it('应该查找项目的所有选题', () => {
      // Given: 项目有多个选题
      const projectId = genId()
      topicRepo.create(projectId, {
        name: '选题1',
        rank: 5
      })
      topicRepo.create(projectId, {
        name: '选题2',
        rank: 3
      })
      topicRepo.create(projectId, {
        name: '选题3',
        rank: 4
      })

      // When: 调用findByProject()
      const topics = topicRepo.findByProject(projectId)

      // Then: 返回所有选题，按优先级排序
      expect(topics).toHaveLength(3)
      expect(topics[0].title).toBe('选题1') // priority=5最高
      expect(topics[1].title).toBe('选题3') // priority=4
      expect(topics[2].title).toBe('选题2') // priority=3最低
    })

    it('应该返回空数组（当项目无选题时）', () => {
      // Given: 新项目（无选题）
      const projectId = genId()

      // When: 调用findByProject()
      const topics = topicRepo.findByProject(projectId)

      // Then: 返回空数组
      expect(topics).toHaveLength(0)
    })
  })

  describe('update()', () => {
    it('应该更新选题的选中状态', () => {
      // Given: 已存在的选题
      const projectId = genId()
      const topic = topicRepo.create(projectId, {
        name: '测试选题'
      })

      // When: 更新选中状态
      topicRepo.update(topic.id, {
        selected: true
      })

      // Then: 选中状态已更新
      const updated = topicRepo.findById(topic.id)
      expect(updated!.selected).toBe(1) // SQLite中true存储为1
    })

    it('应该更新选题的优先级', () => {
      // Given: 已存在的选题
      const projectId = genId()
      const topic = topicRepo.create(projectId, {
        name: '测试选题',
        rank: 3
      })

      // When: 更新优先级
      topicRepo.update(topic.id, {
        priority: 5
      })

      // Then: 优先级已更新
      const updated = topicRepo.findById(topic.id)
      expect(updated!.priority).toBe(5)
    })

    it('应该保持未更新的字段不变', () => {
      // Given: 已存在的选题
      const projectId = genId()
      const topic = topicRepo.create(projectId, {
        name: '测试选题',
        rank: 3
      })
      const originalPriority = topic.priority

      // When: 仅更新selected
      topicRepo.update(topic.id, {
        selected: true
      })

      // Then: priority保持不变
      const updated = topicRepo.findById(topic.id)
      expect(updated!.priority).toBe(originalPriority)
      expect(updated!.selected).toBe(1)
    })
  })

  describe('deleteMany()', () => {
    it('应该批量删除选题', () => {
      // Given: 项目有多个选题
      const projectId = genId()
      const topic1 = topicRepo.create(projectId, { name: '选题1' })
      const topic2 = topicRepo.create(projectId, { name: '选题2' })
      const topic3 = topicRepo.create(projectId, { name: '选题3' })

      // When: 批量删除2个选题
      topicRepo.deleteMany([topic1.id, topic2.id])

      // Then: 2个选题已删除，1个保留
      expect(topicRepo.findById(topic1.id)).toBeUndefined()
      expect(topicRepo.findById(topic2.id)).toBeUndefined()
      expect(topicRepo.findById(topic3.id)).toBeDefined()
    })
  })

  describe('createBatch()', () => {
    it('应该批量创建选题（事务）', () => {
      // Given: 多个选题数据
      const projectId = genId()
      const dataList = [
        { name: '批量选题1', rank: 5 },
        { name: '批量选题2', rank: 4 },
        { name: '批量选题3', rank: 3 }
      ]

      // When: 调用createBatch()
      const topics = topicRepo.createBatch(projectId, dataList)

      // Then: 所有选题已创建
      expect(topics).toHaveLength(3)
      expect(topics[0].title).toBe('批量选题1')
      expect(topics[1].title).toBe('批量选题2')
      expect(topics[2].title).toBe('批量选题3')

      // 验证数据库中确实存在
      const allTopics = topicRepo.findByProject(projectId)
      expect(allTopics).toHaveLength(3)
    })
  })
})
