import { v4 as uuid } from 'uuid'
import { getDb } from '../index.js'

// ==================== Interfaces ====================

export interface Notification {
  id: string
  user_id: string  // 接收者
  type: 'approval_request' | 'approval_approved' | 'approval_rejected' | 'approval_next_step'
  title: string
  content: string
  link?: string  // 点击跳转链接
  read: boolean
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
  title: string
  content: string
  link?: string
}

// ==================== Notification Repository ====================

export const notificationRepo = {
  /**
   * 创建通知
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
      read: false,
      created_at: now
    }

    const stmt = db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, content, link, read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      notification.id,
      notification.user_id,
      notification.type,
      notification.title,
      notification.content,
      notification.link || null,
      notification.read ? 1 : 0,
      notification.created_at
    )

    return notification
  },

  /**
   * 批量创建通知（用于通知多个用户）
   */
  createBatch(inputs: CreateNotificationInput[]): Notification[] {
    const db = getDb()
    const now = Date.now()

    const notifications: Notification[] = []

    const stmt = db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, content, link, read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
          read: false,
          created_at: now
        }

        stmt.run(
          notification.id,
          notification.user_id,
          notification.type,
          notification.title,
          notification.content,
          notification.link || null,
          notification.read ? 1 : 0,
          notification.created_at
        )

        notifications.push(notification)
      }
    })

    insertMany(inputs)

    return notifications
  },

  /**
   * 查找用户的所有通知
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
      query += ` AND read = ?`
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
      read: Boolean(row.read)
    }))
  },

  /**
   * 获取未读通知数量
   */
  getUnreadCount(userId: string): number {
    const db = getDb()

    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND read = 0
    `)

    const result = stmt.get(userId) as { count: number }
    return result.count
  },

  /**
   * 标记单个通知为已读
   */
  markAsRead(id: string): boolean {
    const db = getDb()

    const stmt = db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE id = ?
    `)

    const result = stmt.run(id)
    return result.changes > 0
  },

  /**
   * 标记用户所有通知为已读
   */
  markAllAsRead(userId: string): boolean {
    const db = getDb()

    const stmt = db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE user_id = ? AND read = 0
    `)

    const result = stmt.run(userId)
    return result.changes > 0
  },

  /**
   * 批量标记通知为已读
   */
  markBatchAsRead(ids: string[]): boolean {
    const db = getDb()

    if (ids.length === 0) return false

    const placeholders = ids.map(() => '?').join(',')

    const stmt = db.prepare(`
      UPDATE notifications
      SET read = 1
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
