import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { projectRepo } from './project.repo.js'
import { genId } from '../../utils/id.js'
import * as fs from 'fs'
import * as path from 'path'

// 测试数据库文件
const TEST_DB_PATH = path.join(process.cwd(), 'test-project-repo.db')

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
      brand TEXT,
      category TEXT,
      target_audience TEXT,
      campaign TEXT,
      start_date INTEGER,
      end_date INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      tags TEXT NOT NULL DEFAULT '[]',
      logo_path TEXT,
      company_name TEXT,
      contact_info TEXT,
      brand_primary_color TEXT,
      brand_secondary_color TEXT,
      created_by TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // 创建关联表（用于测试getStats和级联删除）
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `)

  testDb.exec(`
    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT,
      confidence REAL,
      selected INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `)

  testDb.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      platform TEXT NOT NULL,
      priority TEXT,
      description TEXT,
      target_keywords TEXT,
      selected INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `)

  testDb.exec(`
    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      topic_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      duration INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
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

describe('projectRepo', () => {
  describe('create()', () => {
    it('应该创建新项目', () => {
      // Given: 项目输入数据
      const input = {
        name: 'Test Project',
        description: 'Test Description',
        brand: 'Test Brand',
        category: 'FMCG'
      }

      // When: 调用create()
      const project = projectRepo.create(input)

      // Then: 返回项目对象
      expect(project).toBeDefined()
      expect(project.id).toBeDefined()
      expect(project.name).toBe('Test Project')
      expect(project.description).toBe('Test Description')
      expect(project.brand).toBe('Test Brand')
      expect(project.category).toBe('FMCG')
      expect(project.status).toBe('active')  // 默认状态
      expect(project.tags).toEqual([])  // 默认空数组
      expect(project.created_at).toBeDefined()
      expect(project.updated_at).toBeDefined()
    })

    it('应该处理可选字段和tags', () => {
      // Given: 包含完整字段的输入
      const input = {
        name: 'Full Project',
        description: 'Full Description',
        brand: 'Brand',
        category: 'Beauty',
        target_audience: '18-35岁女性',
        campaign: '春季促销',
        start_date: Date.now(),
        end_date: Date.now() + 7 * 24 * 60 * 60 * 1000,
        tags: ['标签1', '标签2', '标签3']
      }

      // When: 调用create()
      const project = projectRepo.create(input)

      // Then: 所有字段被正确存储
      expect(project.target_audience).toBe('18-35岁女性')
      expect(project.campaign).toBe('春季促销')
      expect(project.tags).toEqual(['标签1', '标签2', '标签3'])
    })
  })

  describe('findById()', () => {
    it('应该根据ID查找项目', () => {
      // Given: 创建测试项目
      const project = projectRepo.create({
        name: 'Find Test',
        description: 'Test'
      })

      // When: 根据ID查找
      const found = projectRepo.findById(project.id)

      // Then: 返回正确的项目
      expect(found).toBeDefined()
      expect(found?.id).toBe(project.id)
      expect(found?.name).toBe('Find Test')
    })

    it('应该在项目不存在时返回undefined', () => {
      // When: 查找不存在的ID
      const found = projectRepo.findById('nonexistent-id')

      // Then: 返回undefined
      expect(found).toBeUndefined()
    })
  })

  describe('findAll()', () => {
    it('应该查找所有项目', () => {
      // Given: 创建多个项目（确保时间戳不同）
      const now = Date.now()
      testDb.prepare(`
        INSERT INTO projects (id, name, description, status, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), 'Project 1', '', 'active', '[]', now, now)

      testDb.prepare(`
        INSERT INTO projects (id, name, description, status, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), 'Project 2', '', 'active', '[]', now + 1, now + 1)

      testDb.prepare(`
        INSERT INTO projects (id, name, description, status, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), 'Project 3', '', 'active', '[]', now + 2, now + 2)

      // When: 调用findAll()
      const projects = projectRepo.findAll()

      // Then: 返回所有项目（按更新时间倒序）
      expect(projects).toHaveLength(3)
      expect(projects[0].name).toBe('Project 3')  // 最新更新的
      expect(projects[2].name).toBe('Project 1')  // 最早创建的
    })

    it('应该返回空数组（无项目时）', () => {
      // When: 无项目时调用findAll()
      const projects = projectRepo.findAll()

      // Then: 返回空数组
      expect(projects).toEqual([])
    })
  })

  describe('update()', () => {
    it('应该更新项目信息', () => {
      // Given: 创建测试项目（使用过去的时间戳）
      const now = Date.now() - 1000  // 1秒前
      const projectId = genId()
      testDb.prepare(`
        INSERT INTO projects (id, name, description, status, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(projectId, 'Old Name', 'Old Description', 'active', '[]', now, now)

      // When: 更新项目名称
      const updated = projectRepo.update(projectId, {
        name: 'New Name',
        description: 'New Description'
      })

      // Then: 项目信息被更新
      expect(updated).toBeDefined()
      expect(updated?.name).toBe('New Name')
      expect(updated?.description).toBe('New Description')
      expect(updated?.updated_at).toBeGreaterThan(now)
    })

    it('应该更新项目标签', () => {
      // Given: 创建无标签项目
      const project = projectRepo.create({
        name: 'Project',
        tags: []
      })

      // When: 更新标签
      const updated = projectRepo.update(project.id, {
        tags: ['新标签1', '新标签2']
      })

      // Then: 标签被更新
      expect(updated?.tags).toEqual(['新标签1', '新标签2'])
    })

    it('应该更新项目状态', () => {
      // Given: 创建active项目
      const project = projectRepo.create({
        name: 'Project'
      })

      // When: 归档项目
      const updated = projectRepo.update(project.id, {
        status: 'archived'
      })

      // Then: 状态变为archived
      expect(updated?.status).toBe('archived')
    })

    it('应该更新品牌配置', () => {
      // Given: 创建项目
      const project = projectRepo.create({
        name: 'Project'
      })

      // When: 更新品牌配置
      const updated = projectRepo.update(project.id, {
        logo_path: '/uploads/logo.png',
        company_name: '测试公司',
        contact_info: 'contact@example.com',
        brand_primary_color: '#FF5733',
        brand_secondary_color: '#33C9FF'
      })

      // Then: 品牌配置被更新
      expect(updated?.logo_path).toBe('/uploads/logo.png')
      expect(updated?.company_name).toBe('测试公司')
      expect(updated?.contact_info).toBe('contact@example.com')
      expect(updated?.brand_primary_color).toBe('#FF5733')
      expect(updated?.brand_secondary_color).toBe('#33C9FF')
    })

    it('应该在项目不存在时返回undefined', () => {
      // When: 更新不存在的项目
      const updated = projectRepo.update('nonexistent-id', { name: 'New Name' })

      // Then: 返回undefined
      expect(updated).toBeUndefined()
    })
  })

  describe('getStats()', () => {
    it('应该返回项目统计数据', () => {
      // Given: 创建项目和关联数据
      const project = projectRepo.create({ name: 'Stats Test' })

      // 创建uploads
      testDb.prepare(`
        INSERT INTO uploads (id, project_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), project.id, 'file.xlsx', 'excel', '/uploads/file.xlsx', 1024, Date.now())

      testDb.prepare(`
        INSERT INTO uploads (id, project_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), project.id, 'file2.xlsx', 'excel', '/uploads/file2.xlsx', 2048, Date.now())

      // 创建insights
      testDb.prepare(`
        INSERT INTO insights (id, project_id, type, title, content, selected, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), project.id, 'insight', 'Insight 1', 'Content 1', 1, Date.now())

      testDb.prepare(`
        INSERT INTO insights (id, project_id, type, title, content, selected, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), project.id, 'insight', 'Insight 2', 'Content 2', 0, Date.now())

      // 创建topics
      testDb.prepare(`
        INSERT INTO topics (id, project_id, title, platform, selected, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(genId(), project.id, 'Topic 1', 'douyin', 1, Date.now())

      // 创建scripts
      testDb.prepare(`
        INSERT INTO scripts (id, project_id, title, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(genId(), project.id, 'Script 1', 'Content 1', Date.now())

      // When: 获取统计数据
      const stats = projectRepo.getStats(project.id)

      // Then: 返回正确的统计
      expect(stats).toEqual({
        uploads: 2,
        insights: 2,
        topics: 1,
        scripts: 1,
        selectedInsights: 1,
        selectedTopics: 1
      })
    })

    it('应该返回空统计（无数据时）', () => {
      // Given: 创建空项目
      const project = projectRepo.create({ name: 'Empty Project' })

      // When: 获取统计数据
      const stats = projectRepo.getStats(project.id)

      // Then: 所有统计为0
      expect(stats).toEqual({
        uploads: 0,
        insights: 0,
        topics: 0,
        scripts: 0,
        selectedInsights: 0,
        selectedTopics: 0
      })
    })
  })

  describe('delete()', () => {
    it('应该删除项目', () => {
      // Given: 创建测试项目
      const project = projectRepo.create({ name: 'Delete Test' })

      // When: 删除项目
      projectRepo.delete(project.id)

      // Then: 项目已删除
      const found = projectRepo.findById(project.id)
      expect(found).toBeUndefined()
    })

    it('应该级联删除关联数据', () => {
      // Given: 创建项目和关联数据
      const project = projectRepo.create({ name: 'Cascade Delete Test' })

      // 创建upload
      const uploadId = genId()
      testDb.prepare(`
        INSERT INTO uploads (id, project_id, filename, file_type, file_path, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uploadId, project.id, 'file.xlsx', 'excel', '/uploads/file.xlsx', 1024, Date.now())

      // 创建insight
      const insightId = genId()
      testDb.prepare(`
        INSERT INTO insights (id, project_id, type, title, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(insightId, project.id, 'insight', 'Insight', 'Content', Date.now())

      // When: 删除项目
      projectRepo.delete(project.id)

      // Then: 关联数据也被删除（级联删除）
      const upload = testDb.prepare('SELECT * FROM uploads WHERE id = ?').get(uploadId)
      expect(upload).toBeUndefined()

      const insight = testDb.prepare('SELECT * FROM insights WHERE id = ?').get(insightId)
      expect(insight).toBeUndefined()
    })
  })

  describe('findByIds()', () => {
    it('应该根据ID列表查找项目', () => {
      // Given: 创建多个项目
      const project1 = projectRepo.create({ name: 'Project 1' })
      const project2 = projectRepo.create({ name: 'Project 2' })
      const project3 = projectRepo.create({ name: 'Project 3' })

      // When: 根据ID列表查找
      const projects = projectRepo.findByIds([project1.id, project3.id])

      // Then: 返回指定的项目
      expect(projects).toHaveLength(2)
      expect(projects.some(p => p.id === project1.id)).toBe(true)
      expect(projects.some(p => p.id === project3.id)).toBe(true)
      expect(projects.some(p => p.id === project2.id)).toBe(false)
    })

    it('应该返回空数组（空ID列表）', () => {
      // When: 传入空ID列表
      const projects = projectRepo.findByIds([])

      // Then: 返回空数组
      expect(projects).toEqual([])
    })
  })

  describe('updateCreatedBy()', () => {
    it('应该设置项目创建者', () => {
      // Given: 创建项目
      const project = projectRepo.create({ name: 'Project' })

      // When: 设置创建者
      const success = projectRepo.updateCreatedBy(project.id, 'user-123')

      // Then: 创建者被设置
      expect(success).toBe(true)

      const updated = projectRepo.findById(project.id)
      expect(updated?.created_by).toBe('user-123')
    })

    it('应该在项目不存在时返回false', () => {
      // When: 设置不存在项目的创建者
      const success = projectRepo.updateCreatedBy('nonexistent-id', 'user-123')

      // Then: 返回false
      expect(success).toBe(false)
    })
  })

  describe('边界测试', () => {
    it('应该正确处理tags的JSON序列化/反序列化', () => {
      // Given: 包含特殊字符的标签
      const tags = ['标签1', '标签2', 'tag-3', 'Tag 4', '特殊@符号']

      // When: 创建并查询项目
      const project = projectRepo.create({
        name: 'Tags Test',
        tags
      })

      const found = projectRepo.findById(project.id)

      // Then: 标签被正确序列化和反序列化
      expect(found?.tags).toEqual(tags)
    })

    it('应该统计项目数量', () => {
      // Given: 创建5个项目
      for (let i = 0; i < 5; i++) {
        projectRepo.create({ name: `Project ${i}` })
      }

      // When: 查找所有项目
      const projects = projectRepo.findAll()

      // Then: 返回5个项目
      expect(projects).toHaveLength(5)
    })

    it('应该处理长描述和多字段更新', () => {
      // Given: 创建项目
      const project = projectRepo.create({
        name: 'Complex Update Test',
        description: '初始描述'
      })

      // When: 同时更新多个字段
      const longDescription = '这是一个很长的描述'.repeat(100)
      const updated = projectRepo.update(project.id, {
        name: '新项目名称',
        description: longDescription,
        brand: '品牌名称',
        category: '类目',
        target_audience: '目标受众',
        campaign: '营销活动',
        start_date: Date.now(),
        end_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
        tags: ['标签A', '标签B', '标签C']
      })

      // Then: 所有字段被正确更新
      expect(updated?.name).toBe('新项目名称')
      expect(updated?.description).toBe(longDescription)
      expect(updated?.brand).toBe('品牌名称')
      expect(updated?.tags).toEqual(['标签A', '标签B', '标签C'])
    })
  })
})
