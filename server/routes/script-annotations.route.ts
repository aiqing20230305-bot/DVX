import { Router, Response } from 'express'
import { scriptAnnotationRepo } from '../db/repositories/script-annotation.repo.js'
import { userRepo } from '../db/repositories/user.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { AuthRequest } from '../middleware/permission.middleware.js'

const router = Router()

/**
 * GET /api/scripts/:scriptId/annotations - 获取标注列表
 * 权限: auth
 *
 * Query参数:
 * - version1_id: 对比版本1的history_id (必需)
 * - version2_id: 对比版本2的history_id (必需)
 * - include_private: 是否包含私有标注 (可选，默认false)
 */
router.get('/api/scripts/:scriptId/annotations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const scriptId = req.params.scriptId as string
    const userId = req.userId!
    const { version1_id, version2_id, include_private } = req.query

    if (!version1_id || !version2_id) {
      return res.status(400).json({
        error: '参数错误',
        message: 'version1_id和version2_id是必需参数'
      })
    }

    const includePrivate = include_private === 'true'

    // 查询标注列表
    const annotations = scriptAnnotationRepo.findByVersionComparison(
      scriptId,
      version1_id as string,
      version2_id as string,
      {
        include_private: includePrivate,
        user_id: includePrivate ? userId : undefined
      }
    )

    // v2.24.0: 添加用户信息（标注作者）
    const annotationsWithUser = annotations.map(annotation => {
      const user = userRepo.findById(annotation.user_id)
      if (user) {
        return {
          ...annotation,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        }
      }
      return annotation
    })

    res.json({ annotations: annotationsWithUser, total: annotationsWithUser.length })
  } catch (error) {
    console.error('获取标注列表失败:', error)
    res.status(500).json({ error: '服务器错误', message: '获取标注列表失败' })
  }
})

/**
 * POST /api/scripts/:scriptId/annotations - 创建标注
 * 权限: auth
 *
 * Body:
 * {
 *   version1_id: string,
 *   version2_id: string,
 *   segment_key: string,
 *   annotation_type: 'warning' | 'confirmed' | 'needs_fix' | 'discussing',
 *   note?: string,
 *   is_public?: boolean
 * }
 */
router.post('/api/scripts/:scriptId/annotations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const scriptId = req.params.scriptId as string
    const userId = req.userId!
    const { version1_id, version2_id, segment_key, annotation_type, note, is_public } = req.body

    // 参数验证
    if (!version1_id || !version2_id || !segment_key || !annotation_type) {
      return res.status(400).json({
        error: '参数错误',
        message: 'version1_id, version2_id, segment_key, annotation_type是必需参数'
      })
    }

    // 验证annotation_type
    const validTypes = ['warning', 'confirmed', 'needs_fix', 'discussing']
    if (!validTypes.includes(annotation_type)) {
      return res.status(400).json({
        error: '参数错误',
        message: 'annotation_type必须是: warning, confirmed, needs_fix, discussing之一'
      })
    }

    // 创建标注
    const annotation = scriptAnnotationRepo.create({
      script_id: scriptId,
      version1_id,
      version2_id,
      segment_key,
      annotation_type,
      note,
      user_id: userId,
      is_public: is_public !== undefined ? is_public : true
    })

    // 添加用户信息
    const user = userRepo.findById(userId)
    const annotationWithUser = user ? {
      ...annotation,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    } : annotation

    res.status(201).json(annotationWithUser)
  } catch (error) {
    console.error('创建标注失败:', error)

    if (error instanceof Error && error.message === '标注备注最多200个字符') {
      return res.status(400).json({ error: '参数错误', message: error.message })
    }

    res.status(500).json({ error: '服务器错误', message: '创建标注失败' })
  }
})

/**
 * PUT /api/annotations/:id - 更新标注
 * 权限: auth（本人或管理员）
 *
 * Body:
 * {
 *   annotation_type?: 'warning' | 'confirmed' | 'needs_fix' | 'discussing',
 *   note?: string,
 *   is_public?: boolean
 * }
 */
router.put('/api/annotations/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const annotationId = req.params.id as string
    const userId = req.userId!
    const { annotation_type, note, is_public } = req.body

    // 查找标注
    const annotation = scriptAnnotationRepo.findById(annotationId)

    if (!annotation) {
      return res.status(404).json({ error: '标注不存在' })
    }

    // 权限验证：只有标注作者可以修改
    if (annotation.user_id !== userId) {
      return res.status(403).json({ error: '权限不足', message: '只能修改自己的标注' })
    }

    // 验证annotation_type
    if (annotation_type !== undefined) {
      const validTypes = ['warning', 'confirmed', 'needs_fix', 'discussing']
      if (!validTypes.includes(annotation_type)) {
        return res.status(400).json({
          error: '参数错误',
          message: 'annotation_type必须是: warning, confirmed, needs_fix, discussing之一'
        })
      }
    }

    // 更新标注
    const success = scriptAnnotationRepo.update(annotationId, {
      annotation_type,
      note,
      is_public
    })

    if (!success) {
      return res.status(500).json({ error: '更新失败' })
    }

    // 返回更新后的标注
    const updatedAnnotation = scriptAnnotationRepo.findById(annotationId)
    res.json(updatedAnnotation)
  } catch (error) {
    console.error('更新标注失败:', error)

    if (error instanceof Error && error.message === '标注备注最多200个字符') {
      return res.status(400).json({ error: '参数错误', message: error.message })
    }

    res.status(500).json({ error: '服务器错误', message: '更新标注失败' })
  }
})

/**
 * DELETE /api/annotations/:id - 删除标注
 * 权限: auth（本人或管理员）
 */
router.delete('/api/annotations/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const annotationId = req.params.id as string
    const userId = req.userId!

    // 查找标注
    const annotation = scriptAnnotationRepo.findById(annotationId)

    if (!annotation) {
      return res.status(404).json({ error: '标注不存在' })
    }

    // 权限验证：只有标注作者可以删除
    if (annotation.user_id !== userId) {
      return res.status(403).json({ error: '权限不足', message: '只能删除自己的标注' })
    }

    // 删除标注
    const success = scriptAnnotationRepo.delete(annotationId)

    if (!success) {
      return res.status(500).json({ error: '删除失败' })
    }

    res.json({ message: '标注已删除' })
  } catch (error) {
    console.error('删除标注失败:', error)
    res.status(500).json({ error: '服务器错误', message: '删除标注失败' })
  }
})

/**
 * GET /api/annotations/my - 获取我的标注列表
 * 权限: auth
 *
 * Query参数:
 * - limit: 返回数量限制 (可选，默认50)
 * - offset: 偏移量 (可选，默认0)
 */
router.get('/api/annotations/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    // 获取用户所有标注
    const allAnnotations = scriptAnnotationRepo.findByUser(userId)

    // 分页
    const annotations = allAnnotations.slice(offset, offset + limit)

    // 添加用户信息
    const user = userRepo.findById(userId)
    const annotationsWithUser = annotations.map(annotation => {
      if (user) {
        return {
          ...annotation,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        }
      }
      return annotation
    })

    res.json({
      annotations: annotationsWithUser,
      total: allAnnotations.length,
      limit,
      offset
    })
  } catch (error) {
    console.error('获取我的标注列表失败:', error)
    res.status(500).json({ error: '服务器错误', message: '获取我的标注列表失败' })
  }
})

export default router
