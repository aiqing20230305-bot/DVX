import { Router, Request, Response } from 'express'
import { topicRepo } from '../db/repositories/topic.repo.js'
import { generateTopicsStream } from '../services/topic.service.js'

const router = Router()

router.post('/generate', async (req: Request, res: Response) => {
  const { projectId, insightIds = [] } = req.body as { projectId: string; insightIds?: string[] }
  if (!projectId) {
    res.status(400).json({ error: '缺少 projectId' })
    return
  }
  await generateTopicsStream(projectId, insightIds, res)
})

// Batch routes must come BEFORE parameterized routes to avoid /:id matching /batch
router.patch('/batch', (req: Request, res: Response) => {
  try {
    const { ids, selected } = req.body as { ids: string[]; selected?: boolean }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '缺少有效的 ids 数组' })
      return
    }
    topicRepo.updateBatch(ids, { selected })
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.delete('/batch', (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '缺少有效的 ids 数组' })
      return
    }
    topicRepo.deleteMany(ids)
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.patch('/batch-priority', (req: Request, res: Response) => {
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
    topicRepo.updatePriorityBatch(ids, priority)
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.get('/:projectId', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const topics = topicRepo.findByProject(projectId)
    const parsed = topics.map(t => ({
      ...t,
      insight_ref: JSON.parse(t.insight_ref) as string[],
      selected: t.selected === 1
    }))
    res.json({ topics: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.patch('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { selected, priority } = req.body as { selected?: boolean; priority?: number }
    topicRepo.update(id, { selected, priority })
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as topicRouter }
