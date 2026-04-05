import { Router, Request, Response } from 'express'
import { testSessionRepo } from '../db/repositories/testSession.repo.js'
import { generateTestingReportExcel } from '../services/report.service.js'

const router = Router()

// Create new test session
router.post('/session', (req: Request, res: Response) => {
  try {
    const { user_name, user_role, user_email, scenario } = req.body as {
      user_name: string
      user_role: string
      user_email?: string
      scenario: string
    }

    if (!user_name || !user_role || !scenario) {
      res.status(400).json({ error: '缺少必要字段' })
      return
    }

    const session = testSessionRepo.createSession({
      user_name,
      user_role,
      user_email,
      scenario
    })

    res.status(201).json({ session })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Get all sessions
router.get('/session', (_req: Request, res: Response) => {
  try {
    const sessions = testSessionRepo.findAll()
    res.json({ sessions })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Get session by ID
router.get('/session/:id', (req: Request, res: Response) => {
  try {
    const session = testSessionRepo.findById(req.params.id as string)
    if (!session) {
      res.status(404).json({ error: '会话不存在' })
      return
    }
    res.json({ session })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Update session
router.patch('/session/:id', (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body as {
      status?: 'active' | 'completed' | 'abandoned'
      notes?: string
    }

    testSessionRepo.updateSession(req.params.id as string, {
      status,
      notes,
      end_time: status === 'completed' || status === 'abandoned' ? Date.now() : undefined
    })

    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Complete session
router.post('/session/:id/complete', (req: Request, res: Response) => {
  try {
    const { notes } = req.body as { notes?: string }
    testSessionRepo.completeSession(req.params.id as string, notes)
    res.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Record user action
router.post('/action', (req: Request, res: Response) => {
  try {
    const { session_id, action_type, page, target, details } = req.body as {
      session_id: string
      action_type: 'click' | 'navigate' | 'input' | 'scroll' | 'error' | 'success' | 'confusion'
      page: string
      target?: string
      details?: string
    }

    if (!session_id || !action_type || !page) {
      res.status(400).json({ error: '缺少必要字段' })
      return
    }

    const action = testSessionRepo.createAction({
      session_id,
      action_type,
      page,
      target,
      details
    })

    res.status(201).json({ action })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Get actions for session
router.get('/action/:sessionId', (req: Request, res: Response) => {
  try {
    const actions = testSessionRepo.findActionsBySession(req.params.sessionId as string)
    res.json({ actions })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Submit feedback
router.post('/feedback', (req: Request, res: Response) => {
  try {
    const { session_id, question_id, question_text, answer } = req.body as {
      session_id: string
      question_id: string
      question_text: string
      answer: string
    }

    if (!session_id || !question_id || !question_text || !answer) {
      res.status(400).json({ error: '缺少必要字段' })
      return
    }

    const feedback = testSessionRepo.createFeedback({
      session_id,
      question_id,
      question_text,
      answer
    })

    res.status(201).json({ feedback })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Batch submit feedback
router.post('/feedback/batch', (req: Request, res: Response) => {
  try {
    const { session_id, responses } = req.body as {
      session_id: string
      responses: Array<{
        question_id: string
        question_text: string
        answer: string
      }>
    }

    if (!session_id || !responses || !Array.isArray(responses)) {
      res.status(400).json({ error: '缺少必要字段' })
      return
    }

    const feedbacks = responses.map(r =>
      testSessionRepo.createFeedback({
        session_id,
        question_id: r.question_id,
        question_text: r.question_text,
        answer: r.answer
      })
    )

    res.status(201).json({ feedbacks, count: feedbacks.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Get feedback for session
router.get('/feedback/:sessionId', (req: Request, res: Response) => {
  try {
    const feedback = testSessionRepo.findFeedbackBySession(req.params.sessionId as string)
    res.json({ feedback })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Get session statistics
router.get('/stats/:sessionId', (req: Request, res: Response) => {
  try {
    const stats = testSessionRepo.getSessionStats(req.params.sessionId as string)
    res.json({ stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Get overall statistics
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = testSessionRepo.getOverallStats()
    res.json({ stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Get testing report data
router.get('/report', (req: Request, res: Response) => {
  try {
    const start = req.query.start ? parseInt(req.query.start as string) : undefined
    const end = req.query.end ? parseInt(req.query.end as string) : undefined

    const report = testSessionRepo.getTestingReport({ start, end })
    res.json({ report })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Export testing report as Excel
router.get('/export/excel', (req: Request, res: Response) => {
  try {
    const start = req.query.start ? parseInt(req.query.start as string) : undefined
    const end = req.query.end ? parseInt(req.query.end as string) : undefined

    const report = testSessionRepo.getTestingReport({ start, end })
    const buffer = generateTestingReportExcel(report)

    const filename = `测试报告_${new Date().toISOString().split('T')[0]}.xlsx`

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send(buffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as testingRouter }
