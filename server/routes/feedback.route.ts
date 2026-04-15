import { Router, Request, Response } from 'express'
import { feedbackRepo } from '../db/repositories/feedback.repo.js'

const router = Router()

/**
 * POST /api/feedback - 提交用户反馈
 * 权限: public（无需认证）
 */
router.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    const { type, description, page, userAgent } = req.body

    // 参数验证
    if (!type || !description) {
      return res.status(400).json({
        error: '参数缺失',
        message: '反馈类型和描述不能为空'
      })
    }

    // 类型验证
    const validTypes = ['bug', 'feature', 'question', 'praise', 'other']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: '参数错误',
        message: '无效的反馈类型'
      })
    }

    // 描述长度验证
    if (description.length > 2000) {
      return res.status(400).json({
        error: '参数错误',
        message: '反馈描述不能超过2000字符'
      })
    }

    // 创建反馈
    const feedback = feedbackRepo.create({
      type,
      description,
      page: page || 'unknown',
      user_agent: userAgent || req.headers['user-agent'] || 'unknown'
    })

    res.status(201).json({
      success: true,
      feedback: {
        id: feedback.id,
        type: feedback.type,
        created_at: feedback.created_at
      }
    })
  } catch (error) {
    console.error('提交反馈失败:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '提交反馈失败'
    })
  }
})

/**
 * GET /api/feedback - 获取反馈列表（管理功能）
 * 权限: public（后续可添加管理员认证）
 */
router.get('/api/feedback', async (req: Request, res: Response) => {
  try {
    const { type, limit, offset } = req.query

    const filters: any = {}

    if (type && typeof type === 'string') {
      filters.type = type
    }

    if (limit) {
      filters.limit = parseInt(limit as string, 10)
    }

    if (offset) {
      filters.offset = parseInt(offset as string, 10)
    }

    const feedbackList = feedbackRepo.findAll(filters)
    const typeFilter = typeof type === 'string' ? type as any : undefined
    const total = feedbackRepo.count(typeFilter)

    res.json({
      feedback: feedbackList,
      total,
      limit: filters.limit || total,
      offset: filters.offset || 0
    })
  } catch (error) {
    console.error('获取反馈列表失败:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取反馈列表失败'
    })
  }
})

/**
 * GET /api/feedback/stats - 获取反馈统计
 * 权限: public（后续可添加管理员认证）
 */
router.get('/api/feedback/stats', async (req: Request, res: Response) => {
  try {
    const stats = feedbackRepo.getStatsByType()
    const total = feedbackRepo.count()

    res.json({
      stats,
      total
    })
  } catch (error) {
    console.error('获取反馈统计失败:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取反馈统计失败'
    })
  }
})

/**
 * GET /api/feedback/:id - 获取单个反馈详情
 * 权限: public（后续可添加管理员认证）
 */
router.get('/api/feedback/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    const feedback = feedbackRepo.findById(id)

    if (!feedback) {
      return res.status(404).json({
        error: '反馈不存在',
        message: `ID为 ${id} 的反馈不存在`
      })
    }

    res.json({ feedback })
  } catch (error) {
    console.error('获取反馈详情失败:', error)
    res.status(500).json({
      error: '服务器错误',
      message: '获取反馈详情失败'
    })
  }
})

export default router
