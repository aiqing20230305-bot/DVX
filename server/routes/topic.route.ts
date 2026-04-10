import { Router, Request, Response } from 'express'
import { topicRepo } from '../db/repositories/topic.repo.js'
import { generateTopicsStream } from '../services/topic.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember } from '../middleware/permission.middleware.js'

const router = Router()

/**
 * Remove control characters that cause JSON parsing issues
 * Keeps newline, tab, and carriage return as they're safe in JSON strings
 */
function cleanControlChars(str: string): string {
  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
}

router.post('/generate', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  const { projectId, insightIds = [] } = req.body as { projectId: string; insightIds?: string[] }
  if (!projectId) {
    res.status(400).json({ error: '缺少 projectId' })
    return
  }
  await generateTopicsStream(projectId, insightIds, res)
})

// Batch routes must come BEFORE parameterized routes to avoid /:id matching /batch
router.patch('/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { ids, selected } = req.body as { ids: string[]; selected?: boolean }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '缺少有效的 ids 数组' })
      return
    }

    // Check permission for first topic
    if (ids.length > 0) {
      const firstTopic = topicRepo.findById(ids[0])
      if (!firstTopic) {
        res.status(404).json({ error: '选题不存在' })
        return
      }

      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(firstTopic.project_id, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    topicRepo.updateBatch(ids, { selected })
    res.json({ success: true, count: ids.length })
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

    // Check permission for first topic
    if (ids.length > 0) {
      const firstTopic = topicRepo.findById(ids[0])
      if (!firstTopic) {
        res.status(404).json({ error: '选题不存在' })
        return
      }

      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(firstTopic.project_id, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    topicRepo.deleteMany(ids)
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.patch('/batch-priority', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { ids, priority } = req.body as { ids: string[]; priority: number }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '缺少有效的 ids 数组' })
      return
    }
    if (typeof priority !== 'number' || priority < 0 || priority > 5) {
      res.status(400).json({ error: '优先级必须是 0-5 的数字' })
      return
    }

    // Check permission for first topic
    if (ids.length > 0) {
      const firstTopic = topicRepo.findById(ids[0])
      if (!firstTopic) {
        res.status(404).json({ error: '选题不存在' })
        return
      }

      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(firstTopic.project_id, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    topicRepo.updatePriorityBatch(ids, priority)
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.get('/:projectId', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const topics = topicRepo.findByProject(projectId)
    const parsed = topics.map(t => ({
      ...t,
      // Clean control characters from string fields to prevent JSON parsing issues
      title: cleanControlChars(t.title),
      angle: cleanControlChars(t.angle),
      persona: cleanControlChars(t.persona),
      platform: cleanControlChars(t.platform),
      cta: cleanControlChars(t.cta),
      insight_ref: JSON.parse(t.insight_ref) as string[],
      selected: t.selected === 1
    }))
    res.json({ topics: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { selected, priority } = req.body as { selected?: boolean; priority?: number }

    // Get topic to check project_id for permission
    const topic = topicRepo.findById(id)
    if (!topic) {
      res.status(404).json({ error: '选题不存在' })
      return
    }

    const userId = (req as any).userId
    if (!userId) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
    const hasPermission = projectMemberRepo.hasRole(topic.project_id, userId, 'editor')
    if (!hasPermission) {
      res.status(403).json({ error: '权限不足，需要editor权限' })
      return
    }

    topicRepo.update(id, { selected, priority })
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as topicRouter }
