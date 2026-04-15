import getDb from '../index.js'
import { genId } from '../../utils/id.js'

export interface UserNotificationSettings {
  id: string
  user_id: string

  // 通知类型开关
  email_enabled: boolean
  inapp_enabled: boolean

  // 细分通知类型
  mention_email: boolean
  mention_inapp: boolean
  reply_email: boolean
  reply_inapp: boolean
  approval_email: boolean
  approval_inapp: boolean
  system_email: boolean
  system_inapp: boolean

  // 通知频率
  frequency: 'realtime' | 'daily' | 'weekly'

  created_at: number
  updated_at: number
}

export interface UpdateUserNotificationSettingsInput {
  email_enabled?: boolean
  inapp_enabled?: boolean
  mention_email?: boolean
  mention_inapp?: boolean
  reply_email?: boolean
  reply_inapp?: boolean
  approval_email?: boolean
  approval_inapp?: boolean
  system_email?: boolean
  system_inapp?: boolean
  frequency?: 'realtime' | 'daily' | 'weekly'
}

export const notificationSettingsRepo = {
  /**
   * 获取用户通知设置（如不存在则创建默认设置）
   */
  getOrCreate(userId: string): UserNotificationSettings {
    const db = getDb()

    // 先尝试查询
    const stmt = db.prepare('SELECT * FROM user_notification_settings WHERE user_id = ?')
    let row = stmt.get(userId) as any

    // 如果不存在，创建默认设置
    if (!row) {
      const id = genId()
      const now = Date.now()

      const insertStmt = db.prepare(`
        INSERT INTO user_notification_settings (
          id, user_id,
          email_enabled, inapp_enabled,
          mention_email, mention_inapp,
          reply_email, reply_inapp,
          approval_email, approval_inapp,
          system_email, system_inapp,
          frequency,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      insertStmt.run(
        id, userId,
        1, 1, // email_enabled, inapp_enabled
        1, 1, // mention_email, mention_inapp
        0, 1, // reply_email (默认关闭), reply_inapp
        1, 1, // approval_email, approval_inapp
        0, 1, // system_email (默认关闭), system_inapp
        'realtime',
        now, now
      )

      // 重新查询获取完整数据
      row = stmt.get(userId) as any
    }

    return {
      id: row.id,
      user_id: row.user_id,
      email_enabled: Boolean(row.email_enabled),
      inapp_enabled: Boolean(row.inapp_enabled),
      mention_email: Boolean(row.mention_email),
      mention_inapp: Boolean(row.mention_inapp),
      reply_email: Boolean(row.reply_email),
      reply_inapp: Boolean(row.reply_inapp),
      approval_email: Boolean(row.approval_email),
      approval_inapp: Boolean(row.approval_inapp),
      system_email: Boolean(row.system_email),
      system_inapp: Boolean(row.system_inapp),
      frequency: row.frequency,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  },

  /**
   * 更新用户通知设置
   */
  update(userId: string, input: UpdateUserNotificationSettingsInput): boolean {
    const db = getDb()

    // 确保设置存在
    this.getOrCreate(userId)

    // 构建更新语句
    const updates: string[] = []
    const params: any[] = []

    if (input.email_enabled !== undefined) {
      updates.push('email_enabled = ?')
      params.push(input.email_enabled ? 1 : 0)
    }

    if (input.inapp_enabled !== undefined) {
      updates.push('inapp_enabled = ?')
      params.push(input.inapp_enabled ? 1 : 0)
    }

    if (input.mention_email !== undefined) {
      updates.push('mention_email = ?')
      params.push(input.mention_email ? 1 : 0)
    }

    if (input.mention_inapp !== undefined) {
      updates.push('mention_inapp = ?')
      params.push(input.mention_inapp ? 1 : 0)
    }

    if (input.reply_email !== undefined) {
      updates.push('reply_email = ?')
      params.push(input.reply_email ? 1 : 0)
    }

    if (input.reply_inapp !== undefined) {
      updates.push('reply_inapp = ?')
      params.push(input.reply_inapp ? 1 : 0)
    }

    if (input.approval_email !== undefined) {
      updates.push('approval_email = ?')
      params.push(input.approval_email ? 1 : 0)
    }

    if (input.approval_inapp !== undefined) {
      updates.push('approval_inapp = ?')
      params.push(input.approval_inapp ? 1 : 0)
    }

    if (input.system_email !== undefined) {
      updates.push('system_email = ?')
      params.push(input.system_email ? 1 : 0)
    }

    if (input.system_inapp !== undefined) {
      updates.push('system_inapp = ?')
      params.push(input.system_inapp ? 1 : 0)
    }

    if (input.frequency !== undefined) {
      updates.push('frequency = ?')
      params.push(input.frequency)
    }

    // 更新 updated_at
    updates.push('updated_at = ?')
    params.push(Date.now())

    // 添加 WHERE user_id
    params.push(userId)

    const stmt = db.prepare(`
      UPDATE user_notification_settings
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `)

    const result = stmt.run(...params)
    return result.changes > 0
  },

  /**
   * 检查用户是否应该接收某种类型的通知
   * @param userId 用户ID
   * @param notificationType 通知类型：'mention' | 'reply' | 'approval' | 'system'
   * @param channel 通知渠道：'email' | 'inapp'
   * @returns 是否应该发送通知
   */
  shouldSendNotification(
    userId: string,
    notificationType: 'mention' | 'reply' | 'approval' | 'system',
    channel: 'email' | 'inapp'
  ): boolean {
    const settings = this.getOrCreate(userId)

    // 检查总开关
    if (channel === 'email' && !settings.email_enabled) {
      return false
    }
    if (channel === 'inapp' && !settings.inapp_enabled) {
      return false
    }

    // 检查具体类型开关
    const key = `${notificationType}_${channel}` as keyof UserNotificationSettings
    return Boolean(settings[key])
  }
}
