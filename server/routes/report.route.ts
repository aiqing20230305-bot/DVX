import { Router, Request, Response } from 'express'
import { generateHTMLReport } from '../services/report.service.js'
import { generateProjectPPT } from '../services/report/ppt-generator.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { reportRepo } from '../db/repositories/report.repo.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember } from '../middleware/permission.middleware.js'

const router = Router()

// Get existing report
router.get('/:projectId', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const report = reportRepo.findByProject(projectId)

    if (!report) {
      res.json({ html: null })
      return
    }

    res.json({ html: report.html_content })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Generate new report
router.post('/generate', authMiddleware, requireProjectMember('editor'), (req: Request, res: Response) => {
  try {
    const { projectId } = req.body as { projectId: string }
    if (!projectId) {
      res.status(400).json({ error: '缺少 projectId' })
      return
    }
    const html = generateHTMLReport(projectId)

    // Save report to database
    reportRepo.createOrUpdate(projectId, html)

    // Log report generation
    logRepo.create(projectId, 'report', '生成战略报告')

    res.json({ html })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

router.get('/:projectId/export', authMiddleware, requireProjectMember('viewer'), (req: Request, res: Response) => {
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

// Export PPT report
router.post('/:projectId/export-ppt', authMiddleware, requireProjectMember('viewer'), async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string
    const { templateId = 'default', charts } = req.body

    // Generate PPT
    const pptBuffer = await generateProjectPPT({ projectId, templateId, charts })

    // Log PPT export
    const hasCharts = charts && (charts.insightChart || charts.topicChart || charts.timelineChart)
    logRepo.create(projectId, 'report', `导出PPT报告（${templateId}模板${hasCharts ? '，含图表' : ''}）`)

    // Send PPT file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
    res.setHeader('Content-Disposition', `attachment; filename="report-${projectId}.pptx"`)
    res.send(pptBuffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as reportRouter }
