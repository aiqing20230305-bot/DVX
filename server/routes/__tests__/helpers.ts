import { genId } from '../../utils/id.js'
import getDb from '../../db/index.js'

/**
 * 创建测试用户
 */
export function createTestUser(overrides: {
  email?: string
  name?: string
  password_hash?: string
} = {}) {
  const db = getDb()
  const id = genId()
  const email = overrides.email || `test-${id}@example.com`
  const name = overrides.name || 'Test User'
  const password_hash = overrides.password_hash || 'hashed_password_123'
  const now = Date.now()

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, status, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, password_hash, name, 'user', 'active', 0, now, now)

  return { id, email, name, password_hash }
}

/**
 * 创建测试项目
 */
export function createTestProject(userId: string, overrides: {
  name?: string
  description?: string
} = {}) {
  const db = getDb()
  const id = genId()
  const name = overrides.name || `Test Project ${id.slice(0, 6)}`
  const description = overrides.description || 'Test project description'
  const now = Date.now()

  db.prepare(`
    INSERT INTO projects (id, name, description, brand, category, target_audience, campaign, start_date, end_date, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description, 'Test Brand', 'fmcg', 'Test Audience', 'Test Campaign', now, now + 86400000, '[]', now, now)

  return { id, name, description, userId }
}

/**
 * 创建测试评论
 *
 * 注意：使用commentRepo.create()而不是手动插入，以确保FTS5同步
 */
export async function createTestComment(input: {
  projectId: string
  userId: string
  content: string
  targetType: 'insight' | 'topic' | 'script' | 'report'
  targetId: string
}) {
  const { commentRepo } = await import('../../db/repositories/comment.repo.js')

  const comment = commentRepo.create({
    project_id: input.projectId,
    user_id: input.userId,
    target_type: input.targetType,
    target_id: input.targetId,
    content: input.content,
    mentions: []
  })

  return comment
}

/**
 * 清理测试数据
 *
 * 按照外键依赖顺序删除测试相关数据
 * 仅清理最关键的表，避免过度清理导致性能问题
 */
export function cleanupTestData() {
  const db = getDb()

  // 删除测试数据（按照外键依赖顺序 - 从依赖表到主表）
  // 1. 删除评论（依赖users）
  db.prepare('DELETE FROM comments_fts').run()
  db.prepare('DELETE FROM comments').run()

  // 2. 删除搜索历史（依赖users）- v2.30.0 新增，修复搜索历史测试干扰
  db.prepare('DELETE FROM search_history').run()

  // 3. 删除项目成员关系（依赖projects和users）
  db.prepare('DELETE FROM project_members').run()

  // 4. 删除项目（可能依赖users）
  db.prepare('DELETE FROM projects').run()

  // 5. 最后删除用户
  db.prepare('DELETE FROM users').run()
}
