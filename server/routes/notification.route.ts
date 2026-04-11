import { Router, Response } from 'express'
import { notificationRepo } from '../db/repositories/notification.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { AuthRequest } from '../middleware/permission.middleware.js'

const router = Router()

/**
 * GET /api/notifications - 获取通知列表
 * 权限: auth
 */
router.get('/api/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const { read, type, limit, offset } = req.query

    const filters: any = {}

    if (read !== undefined) {
      filters.read = read === 'true'
    }

    if (type) {
      filters.type = type
    }

    if (limit) {
      filters.limit = parseInt(limit as string, 10)
    }

    if (offset) {
      filters.offset = parseInt(offset as string, 10)
    }

    const notifications = notificationRepo.findByUser(userId, filters)

    res.json({ notifications, total: notifications.length })
  } catch (error) {
    console.error('获取通知列表失败:', error)
    res.status(500).json({ error: '服务器错误', message: '获取通知列表失败' })
  }
})

/**
 * GET /api/notifications/unread-count - 获取未读数量
 * 权限: auth
 */
router.get('/api/notifications/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!

    const count = notificationRepo.getUnreadCount(userId)

    res.json({ count })
  } catch (error) {
    console.error('获取未读数量失败:', error)
    res.status(500).json({ error: '服务器错误', message: '获取未读数量失败' })
  }
})

/**
 * PUT /api/notifications/:id/read - 标记为已读
 * 权限: auth（本人）
 */
router.put('/api/notifications/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId!

    // 查找通知
    const notifications = notificationRepo.findByUser(userId)
    const notification = notifications.find(n => n.id === id)

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' })
    }

    // 检查权限（只能标记自己的通知）
    if (notification.user_id !== userId) {
      return res.status(403).json({ error: '权限不足' })
    }

    // 标记为已读
    const success = notificationRepo.markAsRead(id)

    if (!success) {
      return res.status(500).json({ error: '标记失败' })
    }

    res.json({ message: '已标记为已读' })
  } catch (error) {
    console.error('标记已读失败:', error)
    res.status(500).json({ error: '服务器错误', message: '标记已读失败' })
  }
})

/**
 * PUT /api/notifications/read-all - 全部标记为已读
 * 权限: auth
 */
router.put('/api/notifications/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!

    const success = notificationRepo.markAllAsRead(userId)

    if (!success) {
      return res.status(500).json({ error: '标记失败' })
    }

    res.json({ message: '已全部标记为已读' })
  } catch (error) {
    console.error('全部标记已读失败:', error)
    res.status(500).json({ error: '服务器错误', message: '全部标记已读失败' })
  }
})

/**
 * POST /api/notifications/read-batch - 批量标记为已读
 * 权限: auth
 */
router.post('/api/notifications/read-batch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body
    const userId = req.userId!

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '参数错误', message: 'ids必须是非空数组' })
    }

    // 验证所有通知都属于当前用户
    const notifications = notificationRepo.findByUser(userId)
    const validIds = ids.filter(id => notifications.some(n => n.id === id))

    if (validIds.length === 0) {
      return res.status(400).json({ error: '参数错误', message: '没有有效的通知ID' })
    }

    const success = notificationRepo.markBatchAsRead(validIds)

    if (!success) {
      return res.status(500).json({ error: '标记失败' })
    }

    res.json({ message: `已标记 ${validIds.length} 条通知为已读` })
  } catch (error) {
    console.error('批量标记已读失败:', error)
    res.status(500).json({ error: '服务器错误', message: '批量标记已读失败' })
  }
})

/**
 * DELETE /api/notifications/:id - 删除通知
 * 权限: auth（本人）
 */
router.delete('/api/notifications/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId!

    // 查找通知
    const notifications = notificationRepo.findByUser(userId)
    const notification = notifications.find(n => n.id === id)

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' })
    }

    // 检查权限（只能删除自己的通知）
    if (notification.user_id !== userId) {
      return res.status(403).json({ error: '权限不足' })
    }

    // 删除
    const success = notificationRepo.delete(id)

    if (!success) {
      return res.status(500).json({ error: '删除失败' })
    }

    res.json({ message: '通知已删除' })
  } catch (error) {
    console.error('删除通知失败:', error)
    res.status(500).json({ error: '服务器错误', message: '删除通知失败' })
  }
})

/**
 * DELETE /api/notifications - 删除全部通知
 * 权限: auth
 */
router.delete('/api/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!

    const success = notificationRepo.deleteAllByUser(userId)

    if (!success) {
      return res.status(500).json({ error: '删除失败' })
    }

    res.json({ message: '已删除全部通知' })
  } catch (error) {
    console.error('删除全部通知失败:', error)
    res.status(500).json({ error: '服务器错误', message: '删除全部通知失败' })
  }
})

/**
 * POST /api/notifications/delete-batch - 批量删除通知
 * 权限: auth
 */
router.post('/api/notifications/delete-batch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body
    const userId = req.userId!

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '参数错误', message: 'ids必须是非空数组' })
    }

    // 验证所有通知都属于当前用户
    const notifications = notificationRepo.findByUser(userId)
    const validIds = ids.filter(id => notifications.some(n => n.id === id))

    if (validIds.length === 0) {
      return res.status(400).json({ error: '参数错误', message: '没有有效的通知ID' })
    }

    const success = notificationRepo.deleteBatch(validIds)

    if (!success) {
      return res.status(500).json({ error: '删除失败' })
    }

    res.json({ message: `已删除 ${validIds.length} 条通知` })
  } catch (error) {
    console.error('批量删除通知失败:', error)
    res.status(500).json({ error: '服务器错误', message: '批量删除通知失败' })
  }
})

export default router
