import { v4 as uuid } from 'uuid'
import { getDb } from '../index.js'

// ==================== Interfaces ====================

export interface Feedback {
  id: string
  type: 'bug' | 'feature' | 'question' | 'praise' | 'other'
  description: string
  page: string
  user_agent: string
  created_at: number
}

export interface CreateFeedbackInput {
  type: Feedback['type']
  description: string
  page: string
  user_agent: string
}

// ==================== Feedback Repository ====================

export const feedbackRepo = {
  /**
   * 创建用户反馈
   */
  create(input: CreateFeedbackInput): Feedback {
    const db = getDb()
    const now = Date.now()

    const feedback: Feedback = {
      id: uuid(),
      type: input.type,
      description: input.description,
      page: input.page,
      user_agent: input.user_agent,
      created_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO feedback (
        id, type, description, page, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      feedback.id,
      feedback.type,
      feedback.description,
      feedback.page,
      feedback.user_agent,
      feedback.created_at
    )

    return feedback
  },

  /**
   * 获取所有反馈（用于管理）
   */
  findAll(filters?: {
    type?: Feedback['type']
    limit?: number
    offset?: number
  }): Feedback[] {
    const db = getDb()

    let sql = 'SELECT * FROM feedback'
    const conditions: string[] = []
    const params: any[] = []

    if (filters?.type) {
      conditions.push('type = ?')
      params.push(filters.type)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      sql += ' LIMIT ?'
      params.push(filters.limit)
    }

    if (filters?.offset) {
      sql += ' OFFSET ?'
      params.push(filters.offset)
    }

    const stmt = db.prepare(sql)
    const rows = stmt.all(...params)

    return rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      description: row.description,
      page: row.page,
      user_agent: row.user_agent,
      created_at: row.created_at
    }))
  },

  /**
   * 根据ID获取反馈
   */
  findById(id: string): Feedback | null {
    const db = getDb()

    const stmt = db.prepare('SELECT * FROM feedback WHERE id = ?')
    const row = stmt.get(id) as any

    if (!row) return null

    return {
      id: row.id,
      type: row.type,
      description: row.description,
      page: row.page,
      user_agent: row.user_agent,
      created_at: row.created_at
    }
  },

  /**
   * 获取反馈总数
   */
  count(type?: Feedback['type']): number {
    const db = getDb()

    let sql = 'SELECT COUNT(*) as count FROM feedback'
    const params: any[] = []

    if (type) {
      sql += ' WHERE type = ?'
      params.push(type)
    }

    const stmt = db.prepare(sql)
    const result = stmt.get(...params) as any

    return result.count
  },

  /**
   * 按类型统计反馈数量
   */
  getStatsByType(): { type: string; count: number }[] {
    const db = getDb()

    const stmt = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM feedback
      GROUP BY type
      ORDER BY count DESC
    `)

    const rows = stmt.all() as any[]

    return rows.map(row => ({
      type: row.type,
      count: row.count
    }))
  }
}
