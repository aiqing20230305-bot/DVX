import { Router, Request, Response } from 'express'
import { insightRepo } from '../db/repositories/insight.repo.js'
import { generateInsightsStream } from '../services/insight.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember } from '../middleware/permission.middleware.js'

const router = Router()

router.post('/generate', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  const { projectId } = req.body as { projectId: string }
  if (!projectId) {
    res.status(400).json({ error: '缺少 projectId' })
    return
  }
  await generateInsightsStream(projectId, res)
})

router.get('/:projectId', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const insights = insightRepo.findByProject(projectId)
    const parsed = insights.map(i => ({
      ...i,
      evidence: JSON.parse(i.evidence) as string[],
      metric: i.metric ? JSON.parse(i.metric) : null,
      actionable: i.actionable === 1,
      selected: i.selected === 1
    }))
    res.json({ insights: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { selected, title, summary } = req.body as { selected?: boolean; title?: string; summary?: string }

    // Get insight to check project_id for permission
    const insight = insightRepo.findById(id)
    if (!insight) {
      res.status(404).json({ error: '洞察不存在' })
      return
    }

    // Manual permission check since projectId is not in params/body
    const userId = (req as any).userId
    if (!userId) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
    const hasPermission = projectMemberRepo.hasRole(insight.project_id, userId, 'editor')
    if (!hasPermission) {
      res.status(403).json({ error: '权限不足，需要editor权限' })
      return
    }

    insightRepo.update(id, { selected, title, summary })
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.delete('/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '缺少有效的 ids 数组' })
      return
    }

    // Check permission for first insight (assume all in same project)
    if (ids.length > 0) {
      const firstInsight = insightRepo.findById(ids[0])
      if (!firstInsight) {
        res.status(404).json({ error: '洞察不存在' })
        return
      }

      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(firstInsight.project_id, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    insightRepo.deleteMany(ids)
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as insightRouter }
