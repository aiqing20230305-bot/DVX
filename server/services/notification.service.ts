// v2.23.0 Phase 1: @提及功能 - 邮件通知服务

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

interface MentionNotificationData {
  mentionedUserEmail: string
  mentionedUserName: string
  authorName: string
  commentContent: string
  targetType: 'insight' | 'topic' | 'script' | 'report'
  targetId: string
  projectId: string
  projectName?: string
}

class NotificationService {
  private transporter: Transporter | null = null
  private isConfigured: boolean = false

  constructor() {
    this.initializeTransporter()
  }

  /**
   * 初始化邮件发送器（从环境变量读取SMTP配置）
   */
  private initializeTransporter() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM
    } = process.env

    // 检查必需配置
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.warn('[NotificationService] SMTP configuration incomplete. Email notifications disabled.')
      console.warn('Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env')
      this.isConfigured = false
      return
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465, // 465端口使用SSL，587端口使用TLS
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      })

      this.isConfigured = true
      console.log('[NotificationService] SMTP transporter initialized successfully')
    } catch (error) {
      console.error('[NotificationService] Failed to initialize transporter:', error)
      this.isConfigured = false
    }
  }

  /**
   * 发送@提及通知邮件
   */
  async sendMentionNotification(data: MentionNotificationData): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('[NotificationService] Email notifications not configured, skipping...')
      return false
    }

    try {
      const {
        mentionedUserEmail,
        mentionedUserName,
        authorName,
        commentContent,
        targetType,
        projectName
      } = data

      // 目标类型中文映射
      const targetTypeMap = {
        insight: '洞察',
        topic: '选题',
        script: '脚本',
        report: '报告'
      }
      const targetTypeCN = targetTypeMap[targetType]

      // 构建邮件主题
      const subject = `${authorName} 在评论中提到了你 - 超级洞察`

      // 构建邮件HTML内容
      const html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>评论提及通知</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #5E6AD2 0%, #06B6D4 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">超级洞察</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">AI 内容策略平台</p>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin: 0 0 20px 0;">
              你好，<strong>${mentionedUserName}</strong>！
            </p>

            <p style="font-size: 14px; color: #666; margin: 0 0 20px 0;">
              <strong>${authorName}</strong> 在 ${projectName ? `项目「${projectName}」的` : ''}${targetTypeCN}的评论中提到了你：
            </p>

            <div style="background: white; border-left: 4px solid #5E6AD2; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap;">${this.escapeHtml(commentContent)}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.getAppUrl()}?highlight=${data.targetId}"
                 style="display: inline-block; background: #5E6AD2; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                查看评论
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
              你收到此邮件是因为有人在超级洞察平台的评论中提到了你<br>
              <a href="${this.getAppUrl()}/settings/notifications" style="color: #5E6AD2; text-decoration: none;">管理通知设置</a>
            </p>
          </div>
        </body>
        </html>
      `

      // 纯文本备份（用于不支持HTML的邮件客户端）
      const text = `
你好，${mentionedUserName}！

${authorName} 在 ${projectName ? `项目「${projectName}」的` : ''}${targetTypeCN}的评论中提到了你：

"${commentContent}"

点击链接查看评论：${this.getAppUrl()}?highlight=${data.targetId}

---
你收到此邮件是因为有人在超级洞察平台的评论中提到了你。
      `.trim()

      // 发送邮件
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: mentionedUserEmail,
        subject,
        text,
        html
      })

      console.log('[NotificationService] Mention notification sent:', {
        messageId: info.messageId,
        to: mentionedUserEmail,
        author: authorName
      })

      return true
    } catch (error) {
      console.error('[NotificationService] Failed to send mention notification:', error)
      return false
    }
  }

  /**
   * 批量发送@提及通知（支持一次提及多个用户）
   */
  async sendBatchMentionNotifications(
    mentionedUsers: Array<{ email: string; name: string; userId: string }>,
    data: Omit<MentionNotificationData, 'mentionedUserEmail' | 'mentionedUserName'>
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      mentionedUsers.map(user =>
        this.sendMentionNotification({
          ...data,
          mentionedUserEmail: user.email,
          mentionedUserName: user.name
        })
      )
    )

    const success = results.filter(r => r.status === 'fulfilled' && r.value === true).length
    const failed = results.length - success

    console.log(`[NotificationService] Batch mention notifications: ${success} sent, ${failed} failed`)

    return { success, failed }
  }

  /**
   * 转义HTML特殊字符（防止XSS）
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  /**
   * 获取应用URL（从环境变量或默认值）
   */
  private getAppUrl(): string {
    return process.env.APP_URL || 'http://localhost:3000'
  }

  /**
   * 验证SMTP配置（用于健康检查）
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false
    }

    try {
      await this.transporter.verify()
      console.log('[NotificationService] SMTP connection verified')
      return true
    } catch (error) {
      console.error('[NotificationService] SMTP verification failed:', error)
      return false
    }
  }
}

// 导出单例
export const notificationService = new NotificationService()
