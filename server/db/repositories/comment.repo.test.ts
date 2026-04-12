import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { commentRepo } from './comment.repo.js'
import { userRepo } from './user.repo.js'
import { projectRepo } from './project.repo.js'
import { genId } from '../../utils/id.js'
import * as fs from 'fs'
import * as path from 'path'

// 测试数据库文件
const TEST_DB_PATH = path.join(process.cwd(), 'test-comment-repo.db')

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
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  testDb.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      template_id TEXT,
      template_name TEXT,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  testDb.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_id TEXT,
      mentions TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    )
  `)

  testDb.exec(`
    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      keyword TEXT NOT NULL,
      search_count INTEGER NOT NULL DEFAULT 1,
      last_search_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  testDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_search_history_user_keyword ON search_history(user_id, keyword)
  `)

  testDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_search_history_user_time ON search_history(user_id, last_search_at DESC)
  `)

  // 创建FTS5虚拟表
  testDb.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS comments_fts USING fts5(
      comment_id UNINDEXED,
      content,
      tokenize='unicode61 remove_diacritics 1'
    )
  `)

  // 创建Trigger同步
  testDb.exec(`
    CREATE TRIGGER IF NOT EXISTS comments_fts_insert AFTER INSERT ON comments
    BEGIN
      INSERT INTO comments_fts(comment_id, content) VALUES (NEW.id, NEW.content);
    END
  `)

  testDb.exec(`
    CREATE TRIGGER IF NOT EXISTS comments_fts_update AFTER UPDATE ON comments
    BEGIN
      UPDATE comments_fts SET content = NEW.content WHERE comment_id = OLD.id;
    END
  `)

  testDb.exec(`
    CREATE TRIGGER IF NOT EXISTS comments_fts_delete AFTER DELETE ON comments
    BEGIN
      DELETE FROM comments_fts WHERE comment_id = OLD.id;
    END
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

describe('commentRepo', () => {
  describe('search()', () => {
    it('应该根据关键词搜索评论（FTS5）', () => {
      // Given: 创建测试用户、项目和评论
      const userId = genId()
      const projectId = genId()
      const now = Date.now()

      testDb.prepare(`
        INSERT INTO users (id, email, password, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'test@example.com', 'password', 'Test User', 'user', 'active', 0, now, now)

      testDb.prepare(`
        INSERT INTO projects (id, name, description, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(projectId, 'Test Project', 'Description', userId, now, now)

      // 创建包含关键词的评论
      const commentId1 = genId()
      const commentId2 = genId()
      const commentId3 = genId()

      testDb.prepare(`
        INSERT INTO comments (id, project_id, target_type, target_id, user_id, content, mentions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(commentId1, projectId, 'insight', 'insight1', userId, '这个产品的卖点很独特', '[]', now, now)

      testDb.prepare(`
        INSERT INTO comments (id, project_id, target_type, target_id, user_id, content, mentions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(commentId2, projectId, 'insight', 'insight1', userId, '需要突出产品优势', '[]', now + 1, now + 1)

      testDb.prepare(`
        INSERT INTO comments (id, project_id, target_type, target_id, user_id, content, mentions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(commentId3, projectId, 'insight', 'insight1', userId, '这个选题不错', '[]', now + 2, now + 2)

      // When: 搜索关键词"产品"
      const { comments, total } = commentRepo.search({ keyword: '产品' })

      // Then: 返回匹配的评论（2条包含"产品"）
      expect(total).toBe(2)
      expect(comments).toHaveLength(2)
      expect(comments.some(c => c.id === commentId1)).toBe(true)
      expect(comments.some(c => c.id === commentId2)).toBe(true)
      expect(comments.some(c => c.id === commentId3)).toBe(false)
    })

    it('应该按时间范围过滤评论', () => {
      // Given: 创建不同时间的评论
      const userId = genId()
      const projectId = genId()
      const baseTime = Date.now()

      testDb.prepare(`
        INSERT INTO users (id, email, password, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'test@example.com', 'password', 'Test User', 'user', 'active', 0, baseTime, baseTime)

      testDb.prepare(`
        INSERT INTO projects (id, name, description, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(projectId, 'Test Project', 'Description', userId, baseTime, baseTime)

      // 创建3条评论，时间相差1天
      const oneDayMs = 24 * 60 * 60 * 1000
      const comment1Time = baseTime
      const comment2Time = baseTime + oneDayMs
      const comment3Time = baseTime + 2 * oneDayMs

      testDb.prepare(`
        INSERT INTO comments (id, project_id, target_type, target_id, user_id, content, mentions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), projectId, 'insight', 'insight1', userId, 'Comment 1', '[]', comment1Time, comment1Time)

      testDb.prepare(`
        INSERT INTO comments (id, project_id, target_type, target_id, user_id, content, mentions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), projectId, 'insight', 'insight1', userId, 'Comment 2', '[]', comment2Time, comment2Time)

      testDb.prepare(`
        INSERT INTO comments (id, project_id, target_type, target_id, user_id, content, mentions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(genId(), projectId, 'insight', 'insight1', userId, 'Comment 3', '[]', comment3Time, comment3Time)

      // When: 搜索指定时间范围（第1天到第2天）
      const { comments, total } = commentRepo.search({
        start_date: comment1Time,
        end_date: comment2Time
      })

      // Then: 返回范围内的评论（2条）
      expect(total).toBe(2)
      expect(comments).toHaveLength(2)
    })

    it('应该支持分页', () => {
      // Given: 创建30条评论
      const userId = genId()
      const projectId = genId()
      const now = Date.now()

      testDb.prepare(`
        INSERT INTO users (id, email, password, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'test@example.com', 'password', 'Test User', 'user', 'active', 0, now, now)

      testDb.prepare(`
        INSERT INTO projects (id, name, description, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(projectId, 'Test Project', 'Description', userId, now, now)

      for (let i = 0; i < 30; i++) {
        testDb.prepare(`
          INSERT INTO comments (id, project_id, target_type, target_id, user_id, content, mentions, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(genId(), projectId, 'insight', 'insight1', userId, `Comment ${i}`, '[]', now + i, now + i)
      }

      // When: 请求limit=10&offset=10
      const { comments, total } = commentRepo.search({
        limit: 10,
        offset: 10
      })

      // Then: 返回第11-20条
      expect(total).toBe(30)
      expect(comments).toHaveLength(10)
    })
  })

  describe('saveSearchHistory()', () => {
    it('应该保存新的搜索历史', () => {
      // Given: 用户首次搜索"产品卖点"
      const userId = genId()
      const keyword = '产品卖点'
      const now = Date.now()

      testDb.prepare(`
        INSERT INTO users (id, email, password, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'test@example.com', 'password', 'Test User', 'user', 'active', 0, now, now)

      // When: 调用saveSearchHistory()
      commentRepo.saveSearchHistory(userId, keyword)

      // Then: 创建新记录，search_count=1
      const record = testDb.prepare('SELECT * FROM search_history WHERE user_id = ? AND keyword = ?').get(userId, keyword) as any

      expect(record).toBeDefined()
      expect(record.keyword).toBe(keyword)
      expect(record.search_count).toBe(1)
    })

    it('应该更新已有搜索历史', () => {
      // Given: 用户已搜索过"产品卖点"
      const userId = genId()
      const keyword = '产品卖点'
      const now = Date.now()

      testDb.prepare(`
        INSERT INTO users (id, email, password, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'test@example.com', 'password', 'Test User', 'user', 'active', 0, now, now)

      // 创建初始记录
      const historyId = genId()
      testDb.prepare(`
        INSERT INTO search_history (id, user_id, keyword, search_count, last_search_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(historyId, userId, keyword, 1, now, now)

      // When: 再次搜索
      commentRepo.saveSearchHistory(userId, keyword)

      // Then: search_count+1, last_search_at更新
      const record = testDb.prepare('SELECT * FROM search_history WHERE user_id = ? AND keyword = ?').get(userId, keyword) as any

      expect(record.search_count).toBe(2)
      expect(record.last_search_at).toBeGreaterThan(now)
    })
  })

  describe('getSearchHistory()', () => {
    it('应该返回最近的搜索历史', () => {
      // Given: 用户有5条搜索历史
      const userId = genId()
      const now = Date.now()

      testDb.prepare(`
        INSERT INTO users (id, email, password, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'test@example.com', 'password', 'Test User', 'user', 'active', 0, now, now)

      const keywords = ['产品卖点', '竞品分析', '市场洞察', '用户画像', '内容策划']
      keywords.forEach((keyword, index) => {
        testDb.prepare(`
          INSERT INTO search_history (id, user_id, keyword, search_count, last_search_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(genId(), userId, keyword, 1, now + index * 1000, now)
      })

      // When: 调用getSearchHistory(limit=3)
      const history = commentRepo.getSearchHistory(userId, 3)

      // Then: 返回最近3条，按时间倒序
      expect(history).toHaveLength(3)
      expect(history[0].keyword).toBe('内容策划')  // 最新
      expect(history[1].keyword).toBe('用户画像')
      expect(history[2].keyword).toBe('市场洞察')
    })
  })

  describe('clearSearchHistory()', () => {
    it('应该清空用户的所有搜索历史', () => {
      // Given: 用户有3条搜索历史
      const userId = genId()
      const now = Date.now()

      testDb.prepare(`
        INSERT INTO users (id, email, password, name, role, status, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'test@example.com', 'password', 'Test User', 'user', 'active', 0, now, now)

      const keywords = ['产品卖点', '竞品分析', '市场洞察']
      keywords.forEach(keyword => {
        testDb.prepare(`
          INSERT INTO search_history (id, user_id, keyword, search_count, last_search_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(genId(), userId, keyword, 1, now, now)
      })

      // When: 调用clearSearchHistory()
      commentRepo.clearSearchHistory(userId)

      // Then: 所有记录被删除
      const count = testDb.prepare('SELECT COUNT(*) as count FROM search_history WHERE user_id = ?').get(userId) as any
      expect(count.count).toBe(0)
    })
  })
})
