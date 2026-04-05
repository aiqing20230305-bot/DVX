import { Router, Request, Response } from 'express'
import { generateHTMLReport } from '../services/report.service.js'
import { logRepo } from '../db/repositories/log.repo.js'

const router = Router()

router.post('/generate', (req: Request, res: Response) => {
  try {
    const { projectId } = req.body as { projectId: string }
    if (!projectId) {
      res.status(400).json({ error: '缺少 projectId' })
      return
    }
    const html = generateHTMLReport(projectId)

    // Log report generation
    logRepo.create(projectId, 'report', '生成战略报告')

    res.json({ html })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.get('/:projectId/export', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const html = generateHTMLReport(projectId)

    // Log report export
    logRepo.create(projectId, 'report', '导出战略报告')

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="report.html"')
    res.send(html)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as reportRouter }
