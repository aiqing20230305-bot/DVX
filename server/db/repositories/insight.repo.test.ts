import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { insightRepo, type InsightData } from './insight.repo.js'
import { genId } from '../../utils/id.js'
import * as fs from 'fs'
import * as path from 'path'

// 测试数据库文件
const TEST_DB_PATH = path.join(process.cwd(), 'test-insight-repo.db')

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
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  testDb.exec(`
    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      evidence TEXT NOT NULL,
      metric TEXT,
      confidence TEXT NOT NULL,
      actionable INTEGER NOT NULL DEFAULT 0,
      selected INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
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

// 辅助函数：创建测试项目
function createTestProject(): string {
  const id = genId()
  const now = Date.now()
  testDb.prepare(`
    INSERT INTO projects (id, name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, 'Test Project', 'Test Description', now, now)
  return id
}

describe('insightRepo', () => {
  describe('create()', () => {
    it('应该创建新洞察', () => {
      // Given: 项目ID和洞察数据
      const projectId = createTestProject()
      const insightData: InsightData = {
        type: 'trend',
        title: '市场趋势洞察',
        summary: '当前市场呈现上升趋势',
        evidence: ['证据1', '证据2', '证据3'],
        metric: { label: '增长率', value: '25%', trend: 'up' },
        confidence: 'high',
        actionable: true
      }

      // When: 调用create()
      const insight = insightRepo.create(projectId, insightData)

      // Then: 返回洞察对象
      expect(insight).toBeDefined()
      expect(insight.id).toBeDefined()
      expect(insight.project_id).toBe(projectId)
      expect(insight.type).toBe('trend')
      expect(insight.title).toBe('市场趋势洞察')
      expect(insight.summary).toBe('当前市场呈现上升趋势')
      expect(insight.confidence).toBe('high')
      expect(insight.actionable).toBe(1)  // true转为1
      expect(insight.selected).toBe(0)  // 默认未选择
      expect(insight.created_at).toBeDefined()
      expect(insight.updated_at).toBeDefined()
    })

    it('应该处理可选的metric字段', () => {
      // Given: 无metric的洞察数据
      const projectId = createTestProject()
      const insightData: InsightData = {
        type: 'gap',
        title: '市场空白洞察',
        summary: '发现市场空白',
        evidence: ['证据1'],
        confidence: 'medium',
        actionable: false
      }

      // When: 调用create()
      const insight = insightRepo.create(projectId, insightData)

      // Then: metric为null
      expect(insight.metric).toBeNull()
      expect(insight.actionable).toBe(0)  // false转为0
    })
  })

  describe('findById()', () => {
    it('应该根据ID查找洞察', () => {
      // Given: 创建测试洞察
      const projectId = createTestProject()
      const created = insightRepo.create(projectId, {
        type: 'competitor',
        title: '竞品分析洞察',
        summary: '竞品分析结果',
        evidence: ['证据1'],
        confidence: 'high',
        actionable: true
      })

      // When: 根据ID查找
      const found = insightRepo.findById(created.id)

      // Then: 返回正确的洞察
      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.title).toBe('竞品分析洞察')
    })

    it('应该在洞察不存在时返回undefined', () => {
      // When: 查找不存在的ID
      const found = insightRepo.findById('nonexistent-id')

      // Then: 返回undefined
      expect(found).toBeUndefined()
    })
  })

  describe('findByProject()', () => {
    it('应该根据项目查找所有洞察', () => {
      // Given: 创建项目和多个洞察（确保时间戳不同）
      const projectId = createTestProject()
      const now = Date.now()

      testDb.prepare(`
        INSERT INTO insights (id, project_id, type, title, summary, evidence, confidence, actionable, selected, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), projectId, 'trend', '洞察1', '摘要1', JSON.stringify(['证据1']), 'high', 1, 0, now, now)

      testDb.prepare(`
        INSERT INTO insights (id, project_id, type, title, summary, evidence, confidence, actionable, selected, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), projectId, 'gap', '洞察2', '摘要2', JSON.stringify(['证据2']), 'medium', 0, 0, now + 1, now + 1)

      testDb.prepare(`
        INSERT INTO insights (id, project_id, type, title, summary, evidence, confidence, actionable, selected, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), projectId, 'anomaly', '洞察3', '摘要3', JSON.stringify(['证据3']), 'low', 1, 0, now + 2, now + 2)

      // When: 查找项目的所有洞察
      const insights = insightRepo.findByProject(projectId)

      // Then: 返回所有洞察（按创建时间倒序）
      expect(insights).toHaveLength(3)
      expect(insights[0].title).toBe('洞察3')  // 最新创建的
      expect(insights[2].title).toBe('洞察1')  // 最早创建的
    })

    it('应该返回空数组（无洞察时）', () => {
      // Given: 创建空项目
      const projectId = createTestProject()

      // When: 查找洞察
      const insights = insightRepo.findByProject(projectId)

      // Then: 返回空数组
      expect(insights).toEqual([])
    })
  })

  describe('findSelectedByProject()', () => {
    it('应该查找已选择的洞察', () => {
      // Given: 创建项目和洞察
      const projectId = createTestProject()

      const insight1 = insightRepo.create(projectId, {
        type: 'trend',
        title: '洞察1',
        summary: '摘要1',
        evidence: ['证据1'],
        confidence: 'high',
        actionable: true
      })

      const insight2 = insightRepo.create(projectId, {
        type: 'gap',
        title: '洞察2',
        summary: '摘要2',
        evidence: ['证据2'],
        confidence: 'medium',
        actionable: false
      })

      const insight3 = insightRepo.create(projectId, {
        type: 'anomaly',
        title: '洞察3',
        summary: '摘要3',
        evidence: ['证据3'],
        confidence: 'low',
        actionable: true
      })

      // 选择insight1和insight3
      insightRepo.update(insight1.id, { selected: true })
      insightRepo.update(insight3.id, { selected: true })

      // When: 查找已选择的洞察
      const selectedInsights = insightRepo.findSelectedByProject(projectId)

      // Then: 仅返回已选择的洞察
      expect(selectedInsights).toHaveLength(2)
      expect(selectedInsights.some(i => i.id === insight1.id)).toBe(true)
      expect(selectedInsights.some(i => i.id === insight3.id)).toBe(true)
      expect(selectedInsights.some(i => i.id === insight2.id)).toBe(false)
    })
  })

  describe('update()', () => {
    it('应该更新洞察的selected状态', () => {
      // Given: 创建测试洞察（使用过去的时间戳）
      const projectId = createTestProject()
      const now = Date.now() - 1000  // 1秒前
      const insightId = genId()

      testDb.prepare(`
        INSERT INTO insights (id, project_id, type, title, summary, evidence, confidence, actionable, selected, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(insightId, projectId, 'trend', '洞察', '摘要', JSON.stringify(['证据']), 'high', 1, 0, now, now)

      // When: 更新selected状态
      insightRepo.update(insightId, { selected: true })

      // Then: selected被更新
      const updated = insightRepo.findById(insightId)
      expect(updated?.selected).toBe(1)
      expect(updated?.updated_at).toBeGreaterThan(now)
    })

    it('应该更新洞察的标题和摘要', () => {
      // Given: 创建测试洞察
      const projectId = createTestProject()
      const insight = insightRepo.create(projectId, {
        type: 'trend',
        title: '旧标题',
        summary: '旧摘要',
        evidence: ['证据'],
        confidence: 'high',
        actionable: true
      })

      // When: 更新标题和摘要
      insightRepo.update(insight.id, {
        title: '新标题',
        summary: '新摘要'
      })

      // Then: 标题和摘要被更新
      const updated = insightRepo.findById(insight.id)
      expect(updated?.title).toBe('新标题')
      expect(updated?.summary).toBe('新摘要')
    })

    it('应该在洞察不存在时无操作', () => {
      // When: 更新不存在的洞察
      insightRepo.update('nonexistent-id', { selected: true })

      // Then: 无错误抛出（graceful handling）
      const found = insightRepo.findById('nonexistent-id')
      expect(found).toBeUndefined()
    })
  })

  describe('deleteByProject()', () => {
    it('应该删除项目的所有洞察', () => {
      // Given: 创建项目和多个洞察
      const projectId = createTestProject()

      insightRepo.create(projectId, {
        type: 'trend',
        title: '洞察1',
        summary: '摘要1',
        evidence: ['证据1'],
        confidence: 'high',
        actionable: true
      })

      insightRepo.create(projectId, {
        type: 'gap',
        title: '洞察2',
        summary: '摘要2',
        evidence: ['证据2'],
        confidence: 'medium',
        actionable: false
      })

      // When: 删除项目的所有洞察
      insightRepo.deleteByProject(projectId)

      // Then: 所有洞察被删除
      const insights = insightRepo.findByProject(projectId)
      expect(insights).toEqual([])
    })
  })

  describe('deleteMany()', () => {
    it('应该批量删除指定的洞察', () => {
      // Given: 创建项目和多个洞察
      const projectId = createTestProject()

      const insight1 = insightRepo.create(projectId, {
        type: 'trend',
        title: '洞察1',
        summary: '摘要1',
        evidence: ['证据1'],
        confidence: 'high',
        actionable: true
      })

      const insight2 = insightRepo.create(projectId, {
        type: 'gap',
        title: '洞察2',
        summary: '摘要2',
        evidence: ['证据2'],
        confidence: 'medium',
        actionable: false
      })

      const insight3 = insightRepo.create(projectId, {
        type: 'anomaly',
        title: '洞察3',
        summary: '摘要3',
        evidence: ['证据3'],
        confidence: 'low',
        actionable: true
      })

      // When: 批量删除insight1和insight3
      insightRepo.deleteMany([insight1.id, insight3.id])

      // Then: 指定的洞察被删除，insight2保留
      const insights = insightRepo.findByProject(projectId)
      expect(insights).toHaveLength(1)
      expect(insights[0].id).toBe(insight2.id)
    })
  })

  describe('createBatch()', () => {
    it('应该批量创建洞察（事务）', () => {
      // Given: 项目ID和多个洞察数据
      const projectId = createTestProject()
      const insightsData: InsightData[] = [
        {
          type: 'trend',
          title: '批量洞察1',
          summary: '摘要1',
          evidence: ['证据1'],
          confidence: 'high',
          actionable: true
        },
        {
          type: 'gap',
          title: '批量洞察2',
          summary: '摘要2',
          evidence: ['证据2'],
          confidence: 'medium',
          actionable: false
        },
        {
          type: 'anomaly',
          title: '批量洞察3',
          summary: '摘要3',
          evidence: ['证据3'],
          confidence: 'low',
          actionable: true
        }
      ]

      // When: 批量创建
      const created = insightRepo.createBatch(projectId, insightsData)

      // Then: 所有洞察被创建
      expect(created).toHaveLength(3)
      expect(created[0].title).toBe('批量洞察1')
      expect(created[1].title).toBe('批量洞察2')
      expect(created[2].title).toBe('批量洞察3')

      // 验证数据库中的洞察
      const insights = insightRepo.findByProject(projectId)
      expect(insights).toHaveLength(3)
    })

    it('应该在事务中全部成功或全部失败', () => {
      // Given: 项目ID和洞察数据
      const projectId = createTestProject()
      const validInsights: InsightData[] = [
        {
          type: 'trend',
          title: '洞察1',
          summary: '摘要1',
          evidence: ['证据1'],
          confidence: 'high',
          actionable: true
        },
        {
          type: 'gap',
          title: '洞察2',
          summary: '摘要2',
          evidence: ['证据2'],
          confidence: 'medium',
          actionable: false
        }
      ]

      // When: 批量创建
      const created = insightRepo.createBatch(projectId, validInsights)

      // Then: 所有洞察被创建（事务成功）
      expect(created).toHaveLength(2)

      const insights = insightRepo.findByProject(projectId)
      expect(insights).toHaveLength(2)
    })
  })

  describe('边界测试', () => {
    it('应该正确处理evidence的JSON序列化/反序列化', () => {
      // Given: 包含多个证据的洞察
      const projectId = createTestProject()
      const evidence = ['证据1', '证据2', '证据3', '特殊@符号']

      // When: 创建洞察
      const insight = insightRepo.create(projectId, {
        type: 'trend',
        title: 'Evidence Test',
        summary: 'Summary',
        evidence,
        confidence: 'high',
        actionable: true
      })

      // Then: evidence被正确序列化
      const parsed = JSON.parse(insight.evidence)
      expect(parsed).toEqual(evidence)
    })

    it('应该统计洞察数量', () => {
      // Given: 创建项目和5个洞察
      const projectId = createTestProject()

      for (let i = 0; i < 5; i++) {
        insightRepo.create(projectId, {
          type: 'trend',
          title: `洞察${i}`,
          summary: `摘要${i}`,
          evidence: [`证据${i}`],
          confidence: 'high',
          actionable: true
        })
      }

      // When: 查找洞察
      const insights = insightRepo.findByProject(projectId)

      // Then: 返回5个洞察
      expect(insights).toHaveLength(5)
    })
  })
})
