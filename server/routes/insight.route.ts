import { Router, Request, Response } from 'express'
import { insightRepo } from '../db/repositories/insight.repo.js'
import { generateInsightsStream, regenerateInsightStream } from '../services/insight.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireProjectMember } from '../middleware/permission.middleware.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { importUploadMiddleware } from '../middleware/upload.middleware.js'
import { parseExcelFile, validateInsightData, generateInsightTemplate } from '../utils/excel-parser.js'

const router = Router()

// Create insight manually (for testing or manual input)
router.post('/', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  try {
    const { projectId, category, content, source } = req.body as {
      projectId: string
      category: string
      content: string
      source: string
    }

    if (!projectId || !category || !content) {
      res.status(400).json({ error: '缺少必填字段：projectId, category, content' })
      return
    }

    // Map simple category to insight type
    const typeMap: Record<string, 'trend' | 'competitor' | 'gap' | 'attribution' | 'anomaly'> = {
      'pain_point': 'gap',
      'trend': 'trend',
      'opportunity': 'gap',
      'competitor': 'competitor',
      'anomaly': 'anomaly'
    }

    const insight = insightRepo.create(projectId, {
      type: typeMap[category] || 'gap',
      title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      summary: content,
      evidence: [source || '手动创建'],
      confidence: 'medium',
      actionable: true
    })

    // Record to timeline
    logRepo.create(projectId, 'insight', JSON.stringify({
      count: 1,
      source: 'manual',
      method: 'single',
      type: typeMap[category] || 'gap'
    }))

    res.json({ insight })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// GET /generate - SSE insight generation (query param version for compatibility)
router.get('/generate', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  const projectId = req.query.projectId as string
  if (!projectId) {
    res.status(400).json({ error: '缺少 projectId' })
    return
  }
  await generateInsightsStream(projectId, res)
})

// POST /generate - SSE insight generation (body param version)
router.post('/generate', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  const { projectId } = req.body as { projectId: string }
  if (!projectId) {
    res.status(400).json({ error: '缺少 projectId' })
    return
  }
  await generateInsightsStream(projectId, res)
})

// Download insight import template (must come before /:projectId route)
router.get('/template', (_req: Request, res: Response) => {
  try {
    const buffer = generateInsightTemplate()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="insight-import-template.xlsx"')
    res.send(buffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
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

// Batch create insights
router.post('/batch', authMiddleware, requireProjectMember('editor'), async (req: Request, res: Response) => {
  try {
    const { projectId, insights } = req.body as {
      projectId: string
      insights: Array<{
        category: string
        content: string
        source?: string
      }>
    }

    if (!projectId) {
      res.status(400).json({ error: '缺少必填字段：projectId' })
      return
    }

    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      res.status(400).json({ error: '缺少有效的 insights 数组' })
      return
    }

    // Validate each insight
    for (let i = 0; i < insights.length; i++) {
      const insight = insights[i]
      if (!insight.category || !insight.content) {
        res.status(400).json({ error: `第${i + 1}个洞察缺少必填字段：category, content` })
        return
      }
    }

    // Map categories to types
    const typeMap: Record<string, 'trend' | 'competitor' | 'gap' | 'attribution' | 'anomaly'> = {
      'pain_point': 'gap',
      'trend': 'trend',
      'opportunity': 'gap',
      'competitor': 'competitor',
      'anomaly': 'anomaly'
    }

    // Convert to InsightData format
    const insightDataList = insights.map(insight => ({
      type: typeMap[insight.category] || 'gap' as 'trend' | 'competitor' | 'gap' | 'attribution' | 'anomaly',
      title: insight.content.slice(0, 50) + (insight.content.length > 50 ? '...' : ''),
      summary: insight.content,
      evidence: [insight.source || '批量创建'],
      confidence: 'medium' as 'high' | 'medium' | 'low',
      actionable: true
    }))

    // Batch create with transaction
    const created = insightRepo.createBatch(projectId, insightDataList)

    // Record to timeline
    logRepo.create(projectId, 'insight', JSON.stringify({
      count: created.length,
      source: 'batch',
      method: 'batch_create',
      categories: insights.map(i => i.category)
    }))

    res.json({ success: true, count: created.length, insights: created })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

// Import insights from Excel/CSV
router.post('/import', authMiddleware, requireProjectMember('editor'), importUploadMiddleware.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file
    const { projectId } = req.body as { projectId: string }

    if (!projectId) {
      res.status(400).json({ error: '缺少必填字段：projectId' })
      return
    }

    if (!file) {
      res.status(400).json({ error: '缺少上传文件' })
      return
    }

    // Parse Excel/CSV file
    const rawData = parseExcelFile(file.buffer)

    if (!rawData || rawData.length === 0) {
      res.status(400).json({ error: 'Excel文件为空或格式不正确' })
      return
    }

    // Validate and transform data
    const { valid, invalid } = validateInsightData(rawData)

    // If there are any valid rows, import them
    let importedCount = 0
    if (valid.length > 0) {
      const typeMap: Record<string, 'trend' | 'competitor' | 'gap' | 'attribution' | 'anomaly'> = {
        'pain_point': 'gap',
        'trend': 'trend',
        'opportunity': 'gap',
        'competitor': 'competitor',
        'anomaly': 'anomaly'
      }

      const insightDataList = valid.map(row => ({
        type: typeMap[row.category] || 'gap' as 'trend' | 'competitor' | 'gap' | 'attribution' | 'anomaly',
        title: row.content.slice(0, 50) + (row.content.length > 50 ? '...' : ''),
        summary: row.content,
        evidence: [row.source || 'Excel导入'],
        confidence: 'medium' as 'high' | 'medium' | 'low',
        actionable: true
      }))

      const created = insightRepo.createBatch(projectId, insightDataList)
      importedCount = created.length

      // Record to timeline
      logRepo.create(projectId, 'insight', JSON.stringify({
        count: importedCount,
        source: 'import',
        method: 'excel_import',
        filename: file.originalname
      }))
    }

    res.json({
      success: true,
      imported: importedCount,
      failed: invalid.length,
      errors: invalid,
      message: `成功导入 ${importedCount} 条洞察${invalid.length > 0 ? `，${invalid.length} 条失败` : ''}`
    })
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

/**
 * v2.34.0: Regenerate a single insight with variant
 * POST /:id/regenerate
 */
router.post('/:id/regenerate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { variant } = req.body as { variant?: 'creative' | 'conservative' | 'data-driven' }

    // Get insight to check permission
    const insight = insightRepo.findById(id)
    if (!insight) {
      res.status(404).json({ error: '洞察不存在' })
      return
    }

    // Check permission
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

    // Stream regeneration
    await regenerateInsightStream(id, variant || 'default', res)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

export { router as insightRouter }
