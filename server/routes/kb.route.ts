import { Router, Request, Response } from 'express'
import { kbRepo, KBItem } from '../db/repositories/kb.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { queryKnowledgeBase } from '../services/kb-ai.service.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const projectId = req.query['projectId'] as string | undefined
    const type = req.query['type'] as string | undefined
    const q = req.query['q'] as string | undefined
    let items: KBItem[]

    if (!projectId) {
      res.status(400).json({ error: '缺少必填参数：projectId' })
      return
    }

    // Permission check
    const userId = (req as any).userId
    if (!userId) {
      res.status(401).json({ error: '未登录' })
      return
    }

    const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
    const hasPermission = projectMemberRepo.hasRole(projectId, userId, 'viewer')
    if (!hasPermission) {
      res.status(403).json({ error: '权限不足，需要viewer权限' })
      return
    }

    if (q) {
      items = kbRepo.searchByProject(projectId, q)
    } else {
      items = kbRepo.findByProject(projectId, type)
    }

    const parsed = items.map(i => ({ ...i, tags: JSON.parse(i.tags) as string[] }))
    res.json({ items: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, title, content, tags = [], projectId } = req.body as {
      type: KBItem['type']
      title: string
      content: string
      tags?: string[]
      projectId?: string
    }

    if (!type || !title || !content) {
      res.status(400).json({ error: '缺少必填字段：type、title、content' })
      return
    }

    // Permission check if project-specific KB item
    if (projectId) {
      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(projectId, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    const item = kbRepo.create({ type, title, content, tags: JSON.stringify(tags), project_id: projectId ?? null })
    res.status(201).json({ item: { ...item, tags } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.post('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { query, projectId, limit = 10 } = req.body as {
      query: string
      projectId?: string
      limit?: number
    }

    if (!query || !query.trim()) {
      res.status(400).json({ error: '搜索关键词不能为空' })
      return
    }

    // Permission check if project-specific search
    if (projectId) {
      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(projectId, userId, 'viewer')

      // Backward compatibility: allow if project has no members
      if (!hasPermission) {
        const allMembers = projectMemberRepo.getMembersByProject(projectId)
        if (allMembers.length > 0) {
          res.status(403).json({ error: '权限不足，需要viewer权限' })
          return
        }
      }
    }

    const result = queryKnowledgeBase(query, projectId, limit)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string

    // Get KB item to check project_id for permission
    const item = kbRepo.findById(id)
    if (!item) {
      res.status(404).json({ error: '知识库条目不存在' })
      return
    }

    // Permission check if project-specific KB item
    if (item.project_id) {
      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({ error: '未登录' })
        return
      }

      const { projectMemberRepo } = await import('../db/repositories/project-member.repo.js')
      const hasPermission = projectMemberRepo.hasRole(item.project_id, userId, 'editor')
      if (!hasPermission) {
        res.status(403).json({ error: '权限不足，需要editor权限' })
        return
      }
    }

    kbRepo.delete(id)
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as kbRouter }
