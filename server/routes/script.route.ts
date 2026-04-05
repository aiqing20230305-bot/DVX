import { Router, Request, Response } from 'express'
import { scriptRepo, ScriptData } from '../db/repositories/script.repo.js'
import { generateScriptsStream } from '../services/script.service.js'

const router = Router()

router.post('/generate', async (req: Request, res: Response) => {
  const { projectId, topicId } = req.body as { projectId: string; topicId: string }
  if (!projectId || !topicId) {
    res.status(400).json({ error: '缺少 projectId 或 topicId' })
    return
  }
  await generateScriptsStream(projectId, topicId, res)
})

router.get('/:projectId', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const scripts = scriptRepo.findByProject(projectId)
    const parsed = scripts.map(s => ({
      ...s,
      segments: JSON.parse(s.segments)
    }))
    res.json({ scripts: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.get('/topic/:topicId', (req: Request, res: Response) => {
  try {
    const topicId = req.params.topicId as string
    const scripts = scriptRepo.findByTopic(topicId)
    const parsed = scripts.map(s => ({
      ...s,
      segments: JSON.parse(s.segments)
    }))
    res.json({ scripts: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const data = req.body as Partial<ScriptData>
    scriptRepo.update(id, data)
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as scriptRouter }
