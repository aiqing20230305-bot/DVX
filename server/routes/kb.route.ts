import { Router, Request, Response } from 'express'
import { kbRepo, KBItem } from '../db/repositories/kb.repo.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  try {
    const projectId = req.query['projectId'] as string | undefined
    const type = req.query['type'] as string | undefined
    const q = req.query['q'] as string | undefined
    let items: KBItem[]

    if (!projectId) {
      res.status(400).json({ error: '缺少必填参数：projectId' })
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

router.post('/', (req: Request, res: Response) => {
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

    const item = kbRepo.create({ type, title, content, tags: JSON.stringify(tags), project_id: projectId ?? null })
    res.status(201).json({ item: { ...item, tags } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    kbRepo.delete(id)
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as kbRouter }
