import { Router, Response } from 'express'
import { notificationSettingsRepo } from '../db/repositories/notification-settings.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { AuthRequest } from '../middleware/permission.middleware.js'

const router = Router()

/**
 * GET /api/users/me/notification-settings
 * 获取当前用户的通知设置
 */
router.get(
  '/api/users/me/notification-settings',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!

      // 获取或创建用户设置
      const settings = notificationSettingsRepo.getOrCreate(userId)

      res.json(settings)
    } catch (error) {
      console.error('[Get Notification Settings] Error:', error)
      res.status(500).json({
        error: '获取通知设置失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

/**
 * PUT /api/users/me/notification-settings
 * 更新当前用户的通知设置
 */
router.put(
  '/api/users/me/notification-settings',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!
      const {
        email_enabled,
        inapp_enabled,
        mention_email,
        mention_inapp,
        reply_email,
        reply_inapp,
        approval_email,
        approval_inapp,
        system_email,
        system_inapp,
        frequency
      } = req.body

      // 验证 frequency 参数
      if (frequency && !['realtime', 'daily', 'weekly'].includes(frequency)) {
        return res.status(400).json({
          error: '参数错误',
          message: 'frequency 必须是 realtime, daily 或 weekly'
        })
      }

      // 更新设置
      const success = notificationSettingsRepo.update(userId, {
        email_enabled,
        inapp_enabled,
        mention_email,
        mention_inapp,
        reply_email,
        reply_inapp,
        approval_email,
        approval_inapp,
        system_email,
        system_inapp,
        frequency
      })

      if (!success) {
        return res.status(500).json({
          error: '更新失败',
          message: '数据库操作失败'
        })
      }

      // 重新获取更新后的设置
      const settings = notificationSettingsRepo.getOrCreate(userId)

      res.json({
        message: '通知设置更新成功',
        settings
      })
    } catch (error) {
      console.error('[Update Notification Settings] Error:', error)
      res.status(500).json({
        error: '更新通知设置失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
)

export default router
