import { v4 as uuid } from 'uuid'
import { getDb } from '../index.js'

// ==================== Interfaces ====================

export interface Notification {
  id: string
  user_id: string  // 接收者
  type: 'approval_request' | 'approval_approved' | 'approval_rejected' | 'approval_next_step' | 'mention' | 'reply'  // v2.24.0: 添加评论通知类型
  title?: string  // v2.24.0: 改为可选（评论通知不需要title）
  content: string
  link?: string  // 点击跳转链接
  // v2.24.0: 评论通知相关字段
  target_type?: 'insight' | 'topic' | 'script' | 'report'  // 评论目标类型
  target_id?: string  // 评论目标ID
  comment_id?: string  // 评论ID
  author_id?: string  // 评论作者ID
  read?: boolean  // 已弃用，使用is_read
  is_read: boolean  // v2.24.0: 标准化的已读字段
  created_at: number
}

export interface NotificationWithSender extends Notification {
  sender?: {
    id: string
    email: string
    name: string
  }
}

export interface CreateNotificationInput {
  user_id: string
  type: Notification['type']
  title?: string  // v2.24.0: 改为可选
  content: string
  link?: string
  // v2.24.0: 评论通知相关字段
  target_type?: 'insight' | 'topic' | 'script' | 'report'
  target_id?: string
  comment_id?: string
  author_id?: string
}

// ==================== Notification Repository ====================

export const notificationRepo = {
  /**
   * 创建通知（v2.24.0: 支持评论通知）
   */
  create(input: CreateNotificationInput): Notification {
    const db = getDb()
    const now = Date.now()

    const notification: Notification = {
      id: uuid(),
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      content: input.content,
      link: input.link,
      target_type: input.target_type,
      target_id: input.target_id,
      comment_id: input.comment_id,
      author_id: input.author_id,
      is_read: false,
      created_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, content, link,
        target_type, target_id, comment_id, author_id,
        is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      notification.id,
      notification.user_id,
      notification.type,
      notification.title || null,
      notification.content,
      notification.link || null,
      notification.target_type || null,
      notification.target_id || null,
      notification.comment_id || null,
      notification.author_id || null,
      notification.is_read ? 1 : 0,
      notification.created_at
    )

    return notification
  },

  /**
   * 批量创建通知（v2.24.0: 支持评论通知）
   */
  createBatch(inputs: CreateNotificationInput[]): Notification[] {
    const db = getDb()
    const now = Date.now()

    const notifications: Notification[] = []

    const stmt = db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, content, link,
        target_type, target_id, comment_id, author_id,
        is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((items: CreateNotificationInput[]) => {
      for (const input of items) {
        const notification: Notification = {
          id: uuid(),
          user_id: input.user_id,
          type: input.type,
          title: input.title,
          content: input.content,
          link: input.link,
          target_type: input.target_type,
          target_id: input.target_id,
          comment_id: input.comment_id,
          author_id: input.author_id,
          is_read: false,
          created_at: now
        }

        stmt.run(
          notification.id,
          notification.user_id,
          notification.type,
          notification.title || null,
          notification.content,
          notification.link || null,
          notification.target_type || null,
          notification.target_id || null,
          notification.comment_id || null,
          notification.author_id || null,
          notification.is_read ? 1 : 0,
          notification.created_at
        )

        notifications.push(notification)
      }
    })

    insertMany(inputs)

    return notifications
  },

  /**
   * 查找用户的所有通知（v2.24.0: 支持is_read字段）
   */
  findByUser(userId: string, filters?: {
    read?: boolean
    type?: Notification['type']
    limit?: number
    offset?: number
  }): Notification[] {
    const db = getDb()

    let query = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `
    const params: any[] = [userId]

    if (filters?.read !== undefined) {
      query += ` AND is_read = ?`
      params.push(filters.read ? 1 : 0)
    }

    if (filters?.type) {
      query += ` AND type = ?`
      params.push(filters.type)
    }

    query += ` ORDER BY created_at DESC`

    if (filters?.limit) {
      query += ` LIMIT ?`
      params.push(filters.limit)

      if (filters?.offset) {
        query += ` OFFSET ?`
        params.push(filters.offset)
      }
    }

    const stmt = db.prepare(query)
    const rows = stmt.all(...params) as any[]

    return rows.map(row => ({
      ...row,
      is_read: Boolean(row.is_read),
      read: Boolean(row.read || row.is_read)  // 兼容旧字段
    }))
  },

  /**
   * 获取未读通知数量（v2.24.0: 使用is_read字段）
   */
  getUnreadCount(userId: string): number {
    const db = getDb()

    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `)

    const result = stmt.get(userId) as { count: number }
    return result.count
  },

  /**
   * 标记单个通知为已读（v2.24.0: 更新is_read字段）
   */
  markAsRead(id: string): boolean {
    const db = getDb()

    const stmt = db.prepare(`
      UPDATE notifications
      SET is_read = 1, read = 1
      WHERE id = ?
    `)

    const result = stmt.run(id)
    return result.changes > 0
  },

  /**
   * 标记用户所有通知为已读（v2.24.0: 更新is_read字段）
   */
  markAllAsRead(userId: string): boolean {
    const db = getDb()

    const stmt = db.prepare(`
      UPDATE notifications
      SET is_read = 1, read = 1
      WHERE user_id = ? AND is_read = 0
    `)

    const result = stmt.run(userId)
    return result.changes > 0
  },

  /**
   * 批量标记通知为已读（v2.24.0: 更新is_read字段）
   */
  markBatchAsRead(ids: string[]): boolean {
    const db = getDb()

    if (ids.length === 0) return false

    const placeholders = ids.map(() => '?').join(',')

    const stmt = db.prepare(`
      UPDATE notifications
      SET is_read = 1, read = 1
      WHERE id IN (${placeholders})
    `)

    const result = stmt.run(...ids)
    return result.changes > 0
  },

  /**
   * 删除通知
   */
  delete(id: string): boolean {
    const db = getDb()

    const stmt = db.prepare(`
      DELETE FROM notifications WHERE id = ?
    `)

    const result = stmt.run(id)
    return result.changes > 0
  },

  /**
   * 批量删除通知
   */
  deleteBatch(ids: string[]): boolean {
    const db = getDb()

    if (ids.length === 0) return false

    const placeholders = ids.map(() => '?').join(',')

    const stmt = db.prepare(`
      DELETE FROM notifications WHERE id IN (${placeholders})
    `)

    const result = stmt.run(...ids)
    return result.changes > 0
  },

  /**
   * 删除用户所有通知
   */
  deleteAllByUser(userId: string): boolean {
    const db = getDb()

    const stmt = db.prepare(`
      DELETE FROM notifications WHERE user_id = ?
    `)

    const result = stmt.run(userId)
    return result.changes > 0
  }
}
