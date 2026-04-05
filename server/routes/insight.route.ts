import { Router, Request, Response } from 'express'
import { insightRepo } from '../db/repositories/insight.repo.js'
import { generateInsightsStream } from '../services/insight.service.js'

const router = Router()

router.post('/generate', async (req: Request, res: Response) => {
  const { projectId } = req.body as { projectId: string }
  if (!projectId) {
    res.status(400).json({ error: '缺少 projectId' })
    return
  }
  await generateInsightsStream(projectId, res)
})

router.get('/:projectId', (req: Request, res: Response) => {
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

router.patch('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { selected, title, summary } = req.body as { selected?: boolean; title?: string; summary?: string }
    insightRepo.update(id, { selected, title, summary })
    res.json({ success: true })
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
    insightRepo.deleteMany(ids)
    res.json({ success: true, count: ids.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as insightRouter }
